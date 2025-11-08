import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, Search, Filter, Plus, Eye, EyeOff, Copy, Mail, User, Download, X, Save,
  Edit2, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, UserPlus, RefreshCw
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

// CODE GENERATION TEMPLATES
const CODE_TEMPLATES = {
  student: { prefix: "HS", digits: 3 },
  homeroom_teacher: { prefix: "GVCN", digits: 3 },
  subject_teacher: { prefix: "GVBM", digits: 3 },
  school_admin: { prefix: "ADM", digits: 3 },
  department_admin: { prefix: "SOADM", digits: 3 },
  counselor: { prefix: "TVVN", digits: 3 },
  parent: { prefix: "PH", digits: 3 }
};

const generateSecretCode = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateUserCode = (template, schoolCode, year, className, sequence) => {
  const parts = [template.prefix];
  if (schoolCode) parts.push(schoolCode);
  if (year) parts.push(year);
  if (className) parts.push(className);
  if (sequence) parts.push(String(sequence).padStart(template.digits, '0'));
  return parts.join('-');
};

function AdminCodeInventoryContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [showSecrets, setShowSecrets] = useState({});
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [currentUser, setCurrentUser] = useState(null);
  const [generateForm, setGenerateForm] = useState({
    role: 'student',
    school_code: 'LAN',
    year: new Date().getFullYear().toString(),
    class_name: '',
    startSequence: '1',
    count: '10',
    batch_name: `Batch ${new Date().toLocaleDateString('vi-VN')}`
  });
  const [editForm, setEditForm] = useState({});
  const [assignForm, setAssignForm] = useState({ email: '' });

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // ✅ Fetch code inventory
  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['codeInventory'],
    queryFn: async () => {
      try {
        const data = await base44.entities.CodeInventory.list('-generated_at', 1000);
        return data || [];
      } catch (error) {
        console.error('Error fetching code inventory:', error);
        toast.error('Không thể tải kho mã');
        return [];
      }
    },
    initialData: [],
    retry: 2,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      try {
        const data = await base44.entities.User.list('-created_date', 1000);
        return data || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    initialData: [],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: async () => {
      try {
        const data = await base44.entities.UserProfile.list('-created_date', 1000);
        return data || [];
      } catch (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }
    },
    initialData: [],
  });

  // ✅ Generate codes mutation
  const generateCodesMutation = useMutation({
    mutationFn: async (data) => {
      const results = [];
      const startSeq = parseInt(data.startSequence);
      const count = parseInt(data.count);
      const template = CODE_TEMPLATES[data.role];

      for (let i = 0; i < count; i++) {
        const seq = (startSeq + i).toString();
        const userCode = generateUserCode(template, data.school_code, data.year, data.class_name, seq);
        const secretCode = generateSecretCode(12);

        // Check if code already exists
        const existing = codes.find(c => c.user_code === userCode);
        if (existing) {
          throw new Error(`Mã ${userCode} đã tồn tại`);
        }

        const created = await base44.entities.CodeInventory.create({
          user_code: userCode,
          secret_code: secretCode,
          role: data.role,
          status: 'available',
          school_code: data.school_code,
          class_name: data.class_name,
          year: data.year,
          batch_name: data.batch_name,
          generated_by: currentUser.id,
          generated_at: new Date().toISOString()
        });

        results.push(created);
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['codeInventory'] });
      toast.success(`Đã tạo ${results.length} mã thành công!`);
      setIsGenerateModalOpen(false);
      downloadCSV(results);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  // ✅ Edit code mutation
  const editCodeMutation = useMutation({
    mutationFn: async ({ codeId, data }) => {
      return await base44.entities.CodeInventory.update(codeId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeInventory'] });
      toast.success('Cập nhật mã thành công!');
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  // ✅ Assign code mutation
  const assignCodeMutation = useMutation({
    mutationFn: async ({ code, email }) => {
      const user = users.find(u => u.email === email);
      if (!user) throw new Error('Không tìm thấy user với email này');

      let profile = profiles.find(p => p.user_id === user.id);

      if (!profile) {
        profile = await base44.entities.UserProfile.create({
          user_id: user.id,
          role: code.role,
          user_code: code.user_code,
          secret_code: code.secret_code,
          status: 'active',
          school_name: code.school_code,
          class_name: code.class_name,
          code_issued_by: currentUser.id,
          code_issued_at: new Date().toISOString()
        });
      } else {
        await base44.entities.UserProfile.update(profile.id, {
          user_code: code.user_code,
          secret_code: code.secret_code,
          role: code.role,
          status: 'active',
          code_issued_by: currentUser.id,
          code_issued_at: new Date().toISOString()
        });
      }

      await base44.entities.CodeInventory.update(code.id, {
        status: 'assigned',
        assigned_to_user_id: user.id,
        assigned_to_email: user.email,
        assigned_to_profile_id: profile.id,
        assigned_at: new Date().toISOString(),
        assigned_by: currentUser.id
      });

      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          from_name: 'Cua So Nghe Nghiep',
          subject: 'Mã truy cập đã được cấp',
          body: `<h2>Chào ${user.full_name || 'bạn'},</h2><p>Mã của bạn: ${code.user_code}</p><p>Mã bí mật: ${code.secret_code}</p>`
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }

      await base44.entities.AuditLog.create({
        user_id: currentUser.id,
        user_email: currentUser.email,
        user_role: currentUser.role,
        action: 'assign_code',
        resource_type: 'code_inventory',
        resource_id: code.id,
        new_value: { code: code.user_code, assigned_to: user.email },
        status: 'success'
      });

      return { code, user, profile };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeInventory'] });
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      toast.success('Cấp mã thành công!');
      setIsAssignModalOpen(false);
      setAssignForm({ email: '' });
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  // ✅ Revoke code mutation
  const revokeCodeMutation = useMutation({
    mutationFn: async ({ codeId, reason }) => {
      const code = codes.find(c => c.id === codeId);
      
      // Update inventory
      await base44.entities.CodeInventory.update(codeId, {
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: currentUser.id,
        revoke_reason: reason
      });

      // Update profile if assigned
      if (code.assigned_to_profile_id) {
        await base44.entities.UserProfile.update(code.assigned_to_profile_id, {
          status: 'suspended',
          user_code: null,
          secret_code: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeInventory'] });
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      toast.success('Đã thu hồi mã');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  // ✅ Delete code mutation
  const deleteCodeMutation = useMutation({
    mutationFn: async (codeId) => {
      await base44.entities.CodeInventory.delete(codeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeInventory'] });
      toast.success('Đã xóa mã');
    }
  });

  // ✅ Reassign code mutation
  const reassignCodeMutation = useMutation({
    mutationFn: async ({ codeId }) => {
      await base44.entities.CodeInventory.update(codeId, {
        status: 'available',
        assigned_to_user_id: null,
        assigned_to_email: null,
        assigned_to_profile_id: null,
        assigned_at: null,
        assigned_by: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeInventory'] });
      toast.success('Đã chuyển mã về khả dụng');
    }
  });

  const filteredCodes = useMemo(() => {
    return codes.filter(code => {
      const matchesSearch = !searchTerm ||
        code.user_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.assigned_to_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || code.status === filterStatus;
      const matchesRole = filterRole === "all" || code.role === filterRole;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [codes, searchTerm, filterStatus, filterRole]);

  const stats = useMemo(() => {
    return {
      total: codes.length,
      available: codes.filter(c => c.status === 'available').length,
      assigned: codes.filter(c => c.status === 'assigned').length,
      revoked: codes.filter(c => c.status === 'revoked').length,
      expired: codes.filter(c => c.status === 'expired').length
    };
  }, [codes]);

  const downloadCSV = (codesToDownload) => {
    const csv = [
      ['Mã', 'Mã bí mật', 'Vai trò', 'Trạng thái', 'Lớp', 'Năm', 'Batch'].join(','),
      ...codesToDownload.map(c => [
        c.user_code,
        c.secret_code,
        c.role,
        c.status,
        c.class_name || '',
        c.year || '',
        c.batch_name || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `codes_${new Date().toISOString()}.csv`;
    link.click();
  };

  const roleLabels = {
    student: 'Học sinh',
    homeroom_teacher: 'GV Chủ nhiệm',
    subject_teacher: 'GV Bộ môn',
    school_admin: 'Admin Trường',
    department_admin: 'Admin Sở',
    counselor: 'Tư vấn viên',
    parent: 'Phụ huynh'
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Kho Mã Truy Cập</h1>
              <p className="text-gray-600">{stats.total} mã • {stats.available} khả dụng</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => downloadCSV(filteredCodes)}
                className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Tạo mã mới
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Tổng số mã</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-200">
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              <p className="text-xs text-gray-600">Khả dụng</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
              <p className="text-xs text-gray-600">Đã cấp</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-200">
              <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
              <p className="text-xs text-gray-600">Đã thu hồi</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-200">
              <p className="text-2xl font-bold text-orange-600">{stats.expired}</p>
              <p className="text-xs text-gray-600">Hết hạn</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm mã, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border rounded-xl"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Khả dụng</option>
              <option value="assigned">Đã cấp</option>
              <option value="revoked">Đã thu hồi</option>
              <option value="expired">Hết hạn</option>
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border rounded-xl"
            >
              <option value="all">Tất cả vai trò</option>
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Codes Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Chưa có mã nào trong kho</p>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
            >
              Tạo mã mới
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Mã</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Vai trò</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Thông tin</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Đã cấp cho</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-indigo-600">{code.user_code}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(code.user_code);
                            toast.success('Đã sao chép');
                          }}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {showSecrets[code.id] ? (
                          <>
                            <p className="text-xs font-mono text-gray-600">{code.secret_code}</p>
                            <button
                              onClick={() => setShowSecrets({...showSecrets, [code.id]: false})}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <EyeOff className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-mono text-gray-400">************</p>
                            <button
                              onClick={() => setShowSecrets({...showSecrets, [code.id]: true})}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {roleLabels[code.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {code.class_name && <p className="text-gray-900">Lớp {code.class_name}</p>}
                      {code.year && <p className="text-gray-500">Năm {code.year}</p>}
                      {code.batch_name && <p className="text-gray-500 text-xs">{code.batch_name}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        code.status === 'available' ? 'bg-green-100 text-green-800' :
                        code.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        code.status === 'revoked' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {code.status === 'available' ? 'Khả dụng' :
                         code.status === 'assigned' ? 'Đã cấp' :
                         code.status === 'revoked' ? 'Thu hồi' :
                         code.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {code.assigned_to_email ? (
                        <div className="text-sm">
                          <p className="text-gray-900">{code.assigned_to_email}</p>
                          <p className="text-gray-500 text-xs">
                            {code.assigned_at ? new Date(code.assigned_at).toLocaleDateString('vi-VN') : ''}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {code.status === 'available' && (
                          <button
                            onClick={() => {
                              setSelectedCode(code);
                              setIsAssignModalOpen(true);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Cấp
                          </button>
                        )}
                        
                        {code.status === 'assigned' && (
                          <>
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Thu hồi mã',
                                  message: `Thu hồi mã ${code.user_code}?`,
                                  type: 'danger',
                                  onConfirm: () => {
                                    revokeCodeMutation.mutate({ codeId: code.id, reason: 'Thu hồi bởi admin' });
                                    setConfirmDialog({ isOpen: false });
                                  }
                                });
                              }}
                              className="px-3 py-1 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                            >
                              Thu hồi
                            </button>
                            <button
                              onClick={() => reassignCodeMutation.mutate({ codeId: code.id })}
                              className="px-3 py-1 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 text-sm"
                            >
                              Cấp lại
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setSelectedCode(code);
                            setEditForm(code);
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Xóa mã',
                              message: `Xóa mã ${code.user_code}?`,
                              type: 'danger',
                              onConfirm: () => {
                                deleteCodeMutation.mutate(code.id);
                                setConfirmDialog({ isOpen: false });
                              }
                            });
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Generate Modal */}
        {isGenerateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold mb-4">Tạo mã mới</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Vai trò</label>
                  <select
                    value={generateForm.role}
                    onChange={(e) => setGenerateForm({...generateForm, role: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Mã trường</label>
                    <input
                      type="text"
                      value={generateForm.school_code}
                      onChange={(e) => setGenerateForm({...generateForm, school_code: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="LAN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Năm</label>
                    <input
                      type="text"
                      value={generateForm.year}
                      onChange={(e) => setGenerateForm({...generateForm, year: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Lớp</label>
                    <input
                      type="text"
                      value={generateForm.class_name}
                      onChange={(e) => setGenerateForm({...generateForm, class_name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="10A1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bắt đầu từ số</label>
                    <input
                      type="number"
                      value={generateForm.startSequence}
                      onChange={(e) => setGenerateForm({...generateForm, startSequence: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Số lượng</label>
                    <input
                      type="number"
                      value={generateForm.count}
                      onChange={(e) => setGenerateForm({...generateForm, count: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tên batch</label>
                  <input
                    type="text"
                    value={generateForm.batch_name}
                    onChange={(e) => setGenerateForm({...generateForm, batch_name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="flex-1 border py-2 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={() => generateCodesMutation.mutate(generateForm)}
                  disabled={generateCodesMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generateCodesMutation.isPending ? 'Đang tạo...' : 'Tạo mã'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold mb-4">Chỉnh sửa mã</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Trạng thái</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="available">Khả dụng</option>
                    <option value="assigned">Đã cấp</option>
                    <option value="revoked">Thu hồi</option>
                    <option value="expired">Hết hạn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ghi chú</label>
                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 border py-2 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={() => editCodeMutation.mutate({ codeId: selectedCode.id, data: editForm })}
                  disabled={editCodeMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editCodeMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Assign Modal */}
        {isAssignModalOpen && selectedCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold mb-4">Cấp mã {selectedCode.user_code}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email người dùng</label>
                  <input
                    type="email"
                    value={assignForm.email}
                    onChange={(e) => setAssignForm({email: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="user@example.com"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 border py-2 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={() => assignCodeMutation.mutate({ code: selectedCode, email: assignForm.email })}
                  disabled={assignCodeMutation.isPending}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {assignCodeMutation.isPending ? 'Đang cấp...' : 'Cấp mã'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog({ isOpen: false })}
        />
      </div>
    </AdminLayout>
  );
}

export default function AdminCodeInventory() {
  return (
    <ToastProvider>
      <AdminCodeInventoryContent />
    </ToastProvider>
  );
}