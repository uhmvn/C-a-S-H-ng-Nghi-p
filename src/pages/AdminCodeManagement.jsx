
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, Search, Filter, Plus, ChevronDown, ChevronRight, Loader2, CheckSquare, Square, Download, RefreshCw, AlertCircle,
  Eye, XCircle, Edit2, Users, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

const CODE_TEMPLATES = {
  student: { prefix: "HS", digits: 3 },
  homeroom_teacher: { prefix: "GVCN", digits: 3 },
  subject_teacher: { prefix: "GVBM", digits: 3 },
  school_admin: { prefix: "ADM", digits: 3 },
  department_admin: { prefix: "SOADM", digits: 3 },
  counselor: { prefix: "TVVN", digits: 3 },
  parent: { prefix: "PH", digits: 3 }
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

const generateSecretCode = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function AdminCodeManagementContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [groupBy, setGroupBy] = useState("none");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkAssignForm, setBulkAssignForm] = useState({
    school_code: 'LAN',
    year: new Date().getFullYear().toString(),
    class_name: '',
    grade_level: '10',
    role: 'student'
  });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ NEW: State for single operations
  const [isSingleAssignOpen, setIsSingleAssignOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [singleAssignForm, setSingleAssignForm] = useState({
    school_code: 'LAN',
    year: new Date().getFullYear().toString(),
    class_name: '',
    grade_level: '10',
    role: 'student'
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // ✅ REMOVED: Auto-create logic - let Layout handle it
        // Just set the user, don't try to create profile here
      } catch (error) {
        console.error('Error fetching user:', error);
        // Don't throw - just log it
      }
    };
    fetchUser();
  }, [queryClient]);

  const { data: profiles = [], isLoading, refetch: refetchProfiles, error: profilesError } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: async () => {
      try {
        const data = await base44.entities.UserProfile.list('-created_date', 1000);
        console.log('Fetched profiles:', data);
        return data || [];
      } catch (error) {
        console.error('Error fetching profiles:', error);
        // Return empty array instead of throwing to prevent UI from breaking
        return [];
      }
    },
    initialData: [],
    retry: 2, // Retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    // ✅ FIX: Enable auto-refetch
    staleTime: 0, // Data considered stale immediately
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      try {
        const data = await base44.entities.User.list('-created_date', 1000);
        console.log('Fetched users:', data);
        return data || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    initialData: [],
    retry: 2,
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      try {
        return await base44.entities.School.list() || [];
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      try {
        return await base44.entities.Grade.list('order') || [];
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ profileIds, assignData }) => {
      const results = [];
      const errors = [];
      
      for (const profileId of profileIds) {
        try {
          const profile = profiles.find(p => p.id === profileId);
          if (!profile) continue;

          const template = CODE_TEMPLATES[assignData.role];
          const existingCodes = profiles.map(p => p.user_code).filter(Boolean);
          
          const maxSeq = existingCodes
            .filter(c => c.startsWith(template.prefix))
            .map(c => {
              const match = c.match(/\d+$/);
              return match ? parseInt(match[0]) : 0;
            })
            .reduce((max, val) => Math.max(max, val), 0);
          
          const nextSeq = maxSeq + results.length + 1;
          const userCode = `${template.prefix}-${assignData.school_code}-${assignData.year}-${assignData.class_name}-${String(nextSeq).padStart(template.digits, '0')}`;
          const secretCode = generateSecretCode(12);

          await base44.entities.UserProfile.update(profileId, {
            user_code: userCode,
            secret_code: secretCode,
            role: assignData.role,
            status: 'active',
            school_name: assignData.school_code,
            class_name: assignData.class_name,
            grade_level: assignData.grade_level,
            code_issued_by: currentUser?.id,
            code_issued_at: new Date().toISOString()
          });

          const user = users.find(u => u.id === profile.user_id);
          await base44.entities.CodeInventory.create({
            user_code: userCode,
            secret_code: secretCode,
            role: assignData.role,
            status: 'assigned',
            school_code: assignData.school_code,
            class_name: assignData.class_name,
            year: assignData.year,
            batch_name: `Bulk Assignment ${new Date().toLocaleDateString('vi-VN')}`,
            assigned_to_user_id: profile.user_id,
            assigned_to_email: user?.email,
            assigned_to_profile_id: profileId,
            assigned_at: new Date().toISOString(),
            assigned_by: currentUser?.id,
            generated_by: currentUser?.id,
            generated_at: new Date().toISOString()
          });

          results.push({ profileId, userCode, secretCode });
        } catch (error) {
          errors.push({ profileId, error: error.message });
        }
      }

      return { results, errors };
    },
    onSuccess: ({ results, errors }) => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      toast.success(`Đã cấp ${results.length} mã thành công${errors.length > 0 ? `, ${errors.length} lỗi` : ''}`);
      setSelectedProfiles([]);
      setIsBulkAssignOpen(false);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const bulkRevokeMutation = useMutation({
    mutationFn: async (profileIds) => {
      for (const profileId of profileIds) {
        await base44.entities.UserProfile.update(profileId, {
          status: 'suspended',
          user_code: null,
          secret_code: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      toast.success(`Đã thu hồi ${selectedProfiles.length} mã`);
      setSelectedProfiles([]);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (profileIds) => {
      for (const profileId of profileIds) {
        await base44.entities.UserProfile.delete(profileId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      toast.success(`Đã xóa ${selectedProfiles.length} profiles`);
      setSelectedProfiles([]);
    }
  });

  // ✅ NEW: Single assign mutation
  const singleAssignMutation = useMutation({
    mutationFn: async ({ profile, assignData }) => {
      const template = CODE_TEMPLATES[assignData.role];
      const existingCodes = profiles.map(p => p.user_code).filter(Boolean);
      
      const maxSeq = existingCodes
        .filter(c => c.startsWith(template.prefix))
        .map(c => {
          const match = c.match(/\d+$/);
          return match ? parseInt(match[0]) : 0;
        })
        .reduce((max, val) => Math.max(max, val), 0);
      
      const nextSeq = maxSeq + 1;
      const userCode = `${template.prefix}-${assignData.school_code}-${assignData.year}-${assignData.class_name}-${String(nextSeq).padStart(template.digits, '0')}`;
      const secretCode = generateSecretCode(12);

      await base44.entities.UserProfile.update(profile.id, {
        user_code: userCode,
        secret_code: secretCode,
        role: assignData.role,
        status: 'active',
        school_name: assignData.school_code,
        class_name: assignData.class_name,
        grade_level: assignData.grade_level,
        code_issued_by: currentUser?.id,
        code_issued_at: new Date().toISOString()
      });

      const user = users.find(u => u.id === profile.user_id);
      await base44.entities.CodeInventory.create({
        user_code: userCode,
        secret_code: secretCode,
        role: assignData.role,
        status: 'assigned',
        school_code: assignData.school_code,
        class_name: assignData.class_name,
        year: assignData.year,
        batch_name: `Single Assignment ${new Date().toLocaleDateString('vi-VN')}`,
        assigned_to_user_id: profile.user_id,
        assigned_to_email: user?.email,
        assigned_to_profile_id: profile.id,
        assigned_at: new Date().toISOString(),
        assigned_by: currentUser?.id,
        generated_by: currentUser?.id,
        generated_at: new Date().toISOString()
      });

      return { userCode, secretCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      toast.success('Cấp mã thành công!');
      setIsSingleAssignOpen(false);
      setSelectedProfile(null);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  // ✅ NEW: Single revoke mutation
  const singleRevokeMutation = useMutation({
    mutationFn: async (profile) => {
      await base44.entities.UserProfile.update(profile.id, {
        status: 'suspended',
        user_code: null,
        secret_code: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      toast.success('Thu hồi mã thành công!');
      setSelectedProfile(null); // Clear selected profile after action
      setIsViewDetailOpen(false); // Close detail view if open
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const user = users.find(u => u.id === profile.user_id);
      
      const matchesSearch = !searchTerm ||
        user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.user_code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || profile.status === filterStatus;
      const matchesRole = filterRole === "all" || profile.role === filterRole;
      const matchesSchool = filterSchool === "all" || profile.school_name === filterSchool;
      const matchesGrade = filterGrade === "all" || profile.grade_level === filterGrade;
      const matchesClass = filterClass === "all" || profile.class_name === filterClass;
      
      return matchesSearch && matchesStatus && matchesRole && matchesSchool && matchesGrade && matchesClass;
    });
  }, [profiles, users, searchTerm, filterStatus, filterRole, filterSchool, filterGrade, filterClass]);

  const groupedProfiles = useMemo(() => {
    if (groupBy === 'none') {
      return { 'all': filteredProfiles };
    }

    const groups = {};
    filteredProfiles.forEach(profile => {
      let key;
      if (groupBy === 'school') {
        key = profile.school_name || 'Chưa có trường';
      } else if (groupBy === 'grade') {
        key = profile.grade_level ? `Khối ${profile.grade_level}` : 'Chưa có khối';
      } else if (groupBy === 'class') {
        key = profile.class_name || 'Chưa có lớp';
      } else if (groupBy === 'role') {
        key = roleLabels[profile.role] || 'Chưa có vai trò';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(profile);
    });

    return groups;
  }, [filteredProfiles, groupBy]);

  const stats = useMemo(() => {
    return {
      total: profiles.length,
      pending: profiles.filter(p => p.status === 'pending').length,
      active: profiles.filter(p => p.status === 'active' && p.user_code).length,
      noCode: profiles.filter(p => !p.user_code).length,
      suspended: profiles.filter(p => p.status === 'suspended').length
    };
  }, [profiles]);

  const handleBulkAction = () => {
    if (selectedProfiles.length === 0) {
      toast.error('Chưa chọn profile nào');
      return;
    }

    if (bulkAction === 'assign') {
      setIsBulkAssignOpen(true);
    } else if (bulkAction === 'revoke') {
      setConfirmDialog({
        isOpen: true,
        title: 'Thu hồi mã hàng loạt',
        message: `Thu hồi mã của ${selectedProfiles.length} profiles?`,
        type: 'danger',
        onConfirm: () => {
          bulkRevokeMutation.mutate(selectedProfiles);
          setConfirmDialog({ isOpen: false });
        }
      });
    } else if (bulkAction === 'delete') {
      setConfirmDialog({
        isOpen: true,
        title: 'Xóa hàng loạt',
        message: `Xóa ${selectedProfiles.length} profiles?`,
        type: 'danger',
        onConfirm: () => {
          bulkDeleteMutation.mutate(selectedProfiles);
          setConfirmDialog({ isOpen: false });
        }
      });
    }
  };

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const toggleSelectProfile = (profileId) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProfiles.length === filteredProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(filteredProfiles.map(p => p.id));
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Email', 'Họ tên', 'Vai trò', 'Mã', 'Trường', 'Lớp', 'Trạng thái'].join(','),
      ...filteredProfiles.map(p => {
        const user = users.find(u => u.id === p.user_id);
        return [
          user?.email || '',
          user?.full_name || '',
          roleLabels[p.role] || '',
          p.user_code || '',
          p.school_name || '',
          p.class_name || '',
          p.status || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `codes_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ✅ NEW: Handle single assign
  const handleSingleAssign = (profile) => {
    setSelectedProfile(profile);
    setSingleAssignForm({
      school_code: profile.school_name || 'LAN', // Default to 'LAN' if not set
      year: new Date().getFullYear().toString(),
      class_name: profile.class_name || '',
      grade_level: profile.grade_level || '10', // Default grade
      role: profile.role || 'student'
    });
    setIsSingleAssignOpen(true);
  };

  // ✅ NEW: Handle view detail
  const handleViewDetail = (profile) => {
    setSelectedProfile(profile);
    setIsViewDetailOpen(true);
  };

  // ✅ NEW: Handle single revoke
  const handleSingleRevoke = (profile) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Thu hồi mã',
      message: `Thu hồi mã của ${users.find(u => u.id === profile.user_id)?.full_name || profile.user_code}?`,
      type: 'danger',
      onConfirm: () => {
        singleRevokeMutation.mutate(profile);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  // ✅ NEW: Show non-intrusive error notification
  React.useEffect(() => {
    if (profilesError && profiles.length === 0) {
      toast.error('Không thể tải profiles. Vui lòng thử lại.');
    }
  }, [profilesError, profiles.length, toast]);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Cấp Mã</h1>
              <p className="text-gray-600">
                {filteredProfiles.length} profiles • {selectedProfiles.length} đã chọn
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  refetchProfiles();
                  queryClient.invalidateQueries({ queryKey: ['allUsers'] });
                  toast.success('Đã refresh dữ liệu!');
                }}
                className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
              <button
                onClick={() => window.location.href = '/AdminCodeInventory'}
                className="flex items-center gap-2 border border-indigo-600 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-50"
              >
                <Key className="w-5 h-5" />
                Kho mã
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Tổng số</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-yellow-200">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-600">Chờ duyệt</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-200">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-600">Đã có mã</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-200">
              <p className="text-2xl font-bold text-red-600">{stats.noCode}</p>
              <p className="text-xs text-gray-600">Chưa có mã</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-200">
              <p className="text-2xl font-bold text-orange-600">{selectedProfiles.length}</p>
              <p className="text-xs text-gray-600">Đã chọn</p>
            </div>
          </div>
        </div>

        {/* ✅ IMPROVED: Better error UI - non-blocking */}
        {profilesError && profiles.length === 0 && !isLoading && (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-xl mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Lỗi kết nối
                </h3>
                <p className="text-sm text-red-700">
                  Không thể tải danh sách profiles. Vui lòng kiểm tra kết nối mạng và thử lại.
                </p>
                <button
                  onClick={() => refetchProfiles()}
                  className="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ INFO: Show when no profiles but no error */}
        {!isLoading && !profilesError && profiles.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-yellow-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  Chưa có UserProfile nào trong hệ thống
                </h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• Khi user đăng ký/đăng nhập lần đầu, system sẽ tự động tạo UserProfile</p>
                  <p>• Hoặc admin có thể thêm user thủ công tại trang <strong>Quản Lý Người Dùng</strong></p>
                  <p>• Sau khi có UserProfile, bạn mới có thể cấp mã cho họ ở đây</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => window.location.href = '/AdminUsers'}
                    className="text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                  >
                    Đi đến Quản Lý Người Dùng
                  </button>
                  <button
                    onClick={() => refetchProfiles()}
                    className="text-sm border border-yellow-600 text-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50"
                  >
                    Refresh lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl"
              />
            </div>
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
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="px-4 py-3 border rounded-xl"
            >
              <option value="all">Tất cả trường</option>
              {schools.map(school => (
                <option key={school.school_code} value={school.school_code}>{school.name}</option>
              ))}
            </select>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="px-4 py-3 border rounded-xl"
            >
              <option value="none">Không nhóm</option>
              <option value="school">Nhóm theo trường</option>
              <option value="grade">Nhóm theo khối</option>
              <option value="class">Nhóm theo lớp</option>
              <option value="role">Nhóm theo vai trò</option>
            </select>
          </div>

          {selectedProfiles.length > 0 && (
            <div className="flex gap-3 items-center border-t pt-4">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                {selectedProfiles.length === filteredProfiles.length ? (
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                Chọn tất cả
              </button>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">Chọn thao tác...</option>
                <option value="assign">Cấp mã hàng loạt</option>
                <option value="revoke">Thu hồi mã</option>
                <option value="delete">Xóa</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Thực hiện ({selectedProfiles.length})
              </button>
              <button
                onClick={() => setSelectedProfiles([])}
                className="border px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Bỏ chọn
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedProfiles).map(([groupKey, groupProfiles]) => (
              <div key={groupKey} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                {groupBy !== 'none' && (
                  <div
                    onClick={() => toggleGroup(groupKey)}
                    className="bg-gray-50 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      {expandedGroups[groupKey] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      <h3 className="font-bold text-gray-900">{groupKey}</h3>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                        {groupProfiles.length} profiles
                      </span>
                    </div>
                    <label className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={groupProfiles.every(p => selectedProfiles.includes(p.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProfiles(prev => [...new Set([...prev, ...groupProfiles.map(p => p.id)])]);
                          } else {
                            setSelectedProfiles(prev => prev.filter(id => !groupProfiles.map(p => p.id).includes(id)));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-600">Chọn tất cả nhóm</span>
                    </label>
                  </div>
                )}

                {(groupBy === 'none' || expandedGroups[groupKey]) && (
                  <div className="divide-y">
                    {groupProfiles.map((profile) => {
                      const user = users.find(u => u.id === profile.user_id);
                      return (
                        <div key={profile.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedProfiles.includes(profile.id)}
                            onChange={() => toggleSelectProfile(profile.id)}
                            className="w-5 h-5"
                          />
                          <div className="flex-1 grid md:grid-cols-6 gap-4 items-center">
                            <div>
                              <p className="font-bold text-gray-900">{user?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{user?.email}</p>
                            </div>
                            <div>
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {roleLabels[profile.role]}
                              </span>
                            </div>
                            <div className="text-sm">
                              <p className="text-gray-600">{profile.school_name || '-'}</p>
                              <p className="text-gray-500">{profile.class_name || '-'}</p>
                            </div>
                            <div>
                              {profile.user_code ? (
                                <p className="font-mono text-indigo-600">{profile.user_code}</p>
                              ) : (
                                <span className="text-gray-400 text-sm">Chưa có mã</span>
                              )}
                            </div>
                            <div>
                              <span className={`px-3 py-1 rounded-full text-xs ${
                                profile.status === 'active' ? 'bg-green-100 text-green-800' :
                                profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {profile.status}
                              </span>
                            </div>
                            {/* ✅ FIXED: Action buttons - no navigation, only modals */}
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleViewDetail(profile)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {!profile.user_code ? (
                                <button
                                  onClick={() => handleSingleAssign(profile)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Cấp mã"
                                >
                                  <Key className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSingleRevoke(profile)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Thu hồi mã"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* ✅ FIXED: Edit button opens modal instead of navigating */}
                              <button
                                onClick={() => handleViewDetail(profile)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Xem/Sửa thông tin"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isBulkAssignOpen && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsBulkAssignOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold mb-4">Cấp mã hàng loạt ({selectedProfiles.length} profiles)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Vai trò</label>
                  <select
                    value={bulkAssignForm.role}
                    onChange={(e) => setBulkAssignForm({...bulkAssignForm, role: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Trường</label>
                    <input
                      type="text"
                      value={bulkAssignForm.school_code}
                      onChange={(e) => setBulkAssignForm({...bulkAssignForm, school_code: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Năm</label>
                    <input
                      type="text"
                      value={bulkAssignForm.year}
                      onChange={(e) => setBulkAssignForm({...bulkAssignForm, year: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Khối</label>
                    <select
                      value={bulkAssignForm.grade_level}
                      onChange={(e) => setBulkAssignForm({...bulkAssignForm, grade_level: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {grades.map(g => (
                        <option key={g.grade_code} value={g.grade_code}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Lớp</label>
                  <input
                    type="text"
                    value={bulkAssignForm.class_name}
                    onChange={(e) => setBulkAssignForm({...bulkAssignForm, class_name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="10A1, 11B2..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsBulkAssignOpen(false)}
                  className="flex-1 border py-2 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={() => bulkAssignMutation.mutate({
                    profileIds: selectedProfiles,
                    assignData: bulkAssignForm
                  })}
                  disabled={bulkAssignMutation.isPending}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {bulkAssignMutation.isPending ? 'Đang cấp...' : `Cấp ${selectedProfiles.length} mã`}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ✅ NEW: Single Assign Modal */}
        {isSingleAssignOpen && selectedProfile && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsSingleAssignOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold mb-4">
                Cấp mã cho {users.find(u => u.id === selectedProfile.user_id)?.full_name || 'người dùng'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Vai trò</label>
                  <select
                    value={singleAssignForm.role}
                    onChange={(e) => setSingleAssignForm({...singleAssignForm, role: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Trường</label>
                    <input
                      type="text"
                      value={singleAssignForm.school_code}
                      onChange={(e) => setSingleAssignForm({...singleAssignForm, school_code: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Năm</label>
                    <input
                      type="text"
                      value={singleAssignForm.year}
                      onChange={(e) => setSingleAssignForm({...singleAssignForm, year: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Khối</label>
                    <select
                      value={singleAssignForm.grade_level}
                      onChange={(e) => setSingleAssignForm({...singleAssignForm, grade_level: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {grades.map(g => (
                        <option key={g.grade_code} value={g.grade_code}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Lớp</label>
                  <input
                    type="text"
                    value={singleAssignForm.class_name}
                    onChange={(e) => setSingleAssignForm({...singleAssignForm, class_name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="10A1, 11B2..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsSingleAssignOpen(false)}
                  className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => singleAssignMutation.mutate({
                    profile: selectedProfile,
                    assignData: singleAssignForm
                  })}
                  disabled={singleAssignMutation.isPending}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {singleAssignMutation.isPending ? 'Đang cấp...' : 'Cấp mã'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ✅ ENHANCED: View Detail Modal with Edit capabilities */}
        {isViewDetailOpen && selectedProfile && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsViewDetailOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Chi tiết Profile</h3>
                <button
                  onClick={() => setIsViewDetailOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">
                      {users.find(u => u.id === selectedProfile.user_id)?.full_name || 'Chưa có tên'}
                    </h4>
                    <p className="text-gray-600">{users.find(u => u.id === selectedProfile.user_id)?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vai trò</p>
                    <p className="font-medium">{roleLabels[selectedProfile.role] || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                      selectedProfile.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedProfile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedProfile.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Trường</p>
                    <p className="font-medium">{selectedProfile.school_name || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lớp</p>
                    <p className="font-medium">{selectedProfile.class_name || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Khối</p>
                    <p className="font-medium">Khối {selectedProfile.grade_level || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">User Code</p>
                    {selectedProfile.user_code ? (
                      <p className="font-mono font-medium text-indigo-600">{selectedProfile.user_code}</p>
                    ) : (
                      <p className="text-gray-400 text-sm">Chưa có mã</p>
                    )}
                  </div>
                </div>

                {selectedProfile.user_code && (
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <h5 className="font-bold text-indigo-900 mb-3">Thông tin mã</h5>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">User Code</p>
                        <p className="font-mono text-sm">{selectedProfile.user_code}</p>
                      </div>
                      {selectedProfile.code_issued_at && (
                        <div>
                          <p className="text-xs text-gray-600">Ngày cấp</p>
                          <p className="text-sm">{new Date(selectedProfile.code_issued_at).toLocaleString('vi-VN')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                {!selectedProfile.user_code ? (
                  <button
                    onClick={() => {
                      setIsViewDetailOpen(false);
                      handleSingleAssign(selectedProfile);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Cấp mã
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsViewDetailOpen(false);
                      handleSingleRevoke(selectedProfile);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Thu hồi mã
                  </button>
                )}
                <button
                  onClick={() => {
                    // Navigate to AdminUsers to edit full profile
                    window.location.href = `/AdminUsers`;
                  }}
                  className="flex-1 border border-indigo-600 text-indigo-600 py-2 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Sửa đầy đủ
                </button>
                <button
                  onClick={() => setIsViewDetailOpen(false)}
                  className="px-6 border py-2 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog({ isOpen: false })} />
      </div>
    </AdminLayout>
  );
}

export default function AdminCodeManagement() {
  return (
    <ToastProvider>
      <AdminCodeManagementContent />
    </ToastProvider>
  );
}
