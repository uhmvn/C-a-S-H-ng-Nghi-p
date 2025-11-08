
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, Plus, Edit2, Trash2, Mail, Key, 
  Shield, UserPlus, Eye, EyeOff, Copy, CheckCircle, XCircle, Clock, Loader2, AlertCircle, Save
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

const roleLabels = {
  student: 'Học sinh',
  homeroom_teacher: 'GV Chủ nhiệm',
  subject_teacher: 'GV Bộ môn',
  school_admin: 'Admin Trường',
  department_admin: 'Admin Sở',
  counselor: 'Tư vấn viên',
  parent: 'Phụ huynh'
};

function AdminUsersContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [editForm, setEditForm] = useState({});
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'user' });
  const [activeTab, setActiveTab] = useState('basic'); // basic, academic, code
  const [selectedCodeId, setSelectedCodeId] = useState('');
  const [showSecretPreview, setShowSecretPreview] = useState(false);

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
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

  // Fetch profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles'],
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

  const isLoading = usersLoading || profilesLoading;

  // NEW: Fetch available codes - FIX: enabled chỉ cần modal open, không cần đợi tab code
  const { data: availableCodes = [] } = useQuery({
    queryKey: ['availableCodes', editForm.profile_role],
    queryFn: async () => {
      try {
        const allCodes = await base44.entities.CodeInventory.list('-generated_at', 500);
        console.log('All codes from inventory:', allCodes);
        console.log('Current profile_role:', editForm.profile_role);
        
        const filtered = allCodes.filter(c => {
          const statusMatch = c.status === 'available';
          const roleMatch = !editForm.profile_role || c.role === editForm.profile_role;
          console.log(`Code ${c.user_code}: status=${c.status} (${statusMatch}), role=${c.role} vs ${editForm.profile_role} (${roleMatch})`);
          return statusMatch && roleMatch;
        });
        
        console.log('Filtered available codes:', filtered);
        return filtered;
      } catch (error) {
        console.error('Error fetching codes:', error);
        return [];
      }
    },
    enabled: isEditModalOpen, // FIX: Fetch ngay khi modal mở, không cần đợi tab code
    initialData: [],
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      return await base44.entities.User.update(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // toast.success('Cập nhật user thành công!'); // Handled by handleSaveEdit
      // setIsEditModalOpen(false); // Handled by handleSaveEdit
    },
    onError: (error) => {
      // toast.error(`Lỗi: ${error.message}`); // Handled by handleSaveEdit
      throw error; // Re-throw to be caught by handleSaveEdit
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ profileId, data }) => {
      return await base44.entities.UserProfile.update(profileId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      // toast.success('Cập nhật profile thành công!'); // Handled by handleSaveEdit
    },
    onError: (error) => {
      // toast.error(`Lỗi: ${error.message}`); // Handled by handleSaveEdit
      throw error; // Re-throw to be caught by handleSaveEdit
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      // Delete profile first
      const profile = profiles.find(p => p.user_id === userId);
      if (profile) {
        await base44.entities.UserProfile.delete(profile.id);
      }
      // Then delete user
      await base44.entities.User.delete(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Xóa user thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  // NEW: Assign code mutation
  const assignCodeMutation = useMutation({
    mutationFn: async ({ codeId, profileId, userId }) => {
      const code = availableCodes.find(c => c.id === codeId);
      if (!code) throw new Error('Không tìm thấy mã');

      // Update profile with code
      await base44.entities.UserProfile.update(profileId, {
        user_code: code.user_code,
        secret_code: code.secret_code,
        status: 'active' // Automatically set to active when code is assigned
      });

      // Update code inventory
      await base44.entities.CodeInventory.update(codeId, {
        status: 'assigned',
        assigned_to_user_id: userId,
        assigned_to_profile_id: profileId,
        assigned_at: new Date().toISOString()
      });

      return { code, profileId, userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['availableCodes'] });
      // toast.success('Cấp mã thành công!'); // Handled by handleSaveEdit
    },
    onError: (error) => {
      // toast.error(`Lỗi cấp mã: ${error.message}`); // Handled by handleSaveEdit
      throw error; // Re-throw to be caught by handleSaveEdit
    }
  });

  // Filtered users with profiles
  const usersWithProfiles = useMemo(() => {
    return users.map(user => {
      const profile = profiles.find(p => p.user_id === user.id);
      return { ...user, profile };
    });
  }, [users, profiles]);

  const filteredUsers = useMemo(() => {
    return usersWithProfiles.filter(user => {
      const matchesSearch = !searchTerm ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === "all" || user.profile?.role === filterRole;
      const matchesStatus = filterStatus === "all" || user.profile?.status === filterStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersWithProfiles, searchTerm, filterRole, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      withCode: profiles.filter(p => p.user_code).length,
      active: profiles.filter(p => p.status === 'active').length,
      pending: profiles.filter(p => p.status === 'pending').length
    };
  }, [users, profiles]);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'user',
      profile_role: user.profile?.role || 'student',
      profile_status: user.profile?.status || 'pending',
      school_name: user.profile?.school_name || '',
      class_name: user.profile?.class_name || '',
      grade_level: user.profile?.grade_level || ''
    });
    // NEW: Reset modal state for tabs and code
    setActiveTab('basic');
    setSelectedCodeId('');
    setShowSecretPreview(false);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      // Update User entity
      await updateUserMutation.mutateAsync({
        userId: selectedUser.id,
        data: {
          full_name: editForm.full_name,
          role: editForm.role
        }
      });

      let currentProfileId = selectedUser.profile?.id;

      // Update or create Profile
      if (selectedUser.profile) {
        await updateProfileMutation.mutateAsync({
          profileId: selectedUser.profile.id,
          data: {
            role: editForm.profile_role,
            status: editForm.profile_status,
            school_name: editForm.school_name,
            class_name: editForm.class_name,
            grade_level: editForm.grade_level
          }
        });
      } else {
        // Create profile if doesn't exist
        const newProfile = await base44.entities.UserProfile.create({
          user_id: selectedUser.id,
          role: editForm.profile_role,
          status: editForm.profile_status,
          school_name: editForm.school_name,
          class_name: editForm.class_name,
          grade_level: editForm.grade_level
        });
        currentProfileId = newProfile.id; // Store new profile ID
        queryClient.invalidateQueries({ queryKey: ['profiles'] }); // Invalidate after creation
      }

      // Assign code if selected and the profile (either existing or new) does not yet have a user_code
      const profileAfterMutations = queryClient.getQueryData(['profiles'])?.find(p => p.id === currentProfileId);
      const hasExistingCode = profileAfterMutations?.user_code; // Check current state after potential profile update
      if (selectedCodeId && currentProfileId && !hasExistingCode) {
          await assignCodeMutation.mutateAsync({
            codeId: selectedCodeId,
            profileId: currentProfileId,
            userId: selectedUser.id
          });
      }

      toast.success('Cập nhật người dùng thành công!');
      setIsEditModalOpen(false); // Close modal only after all operations succeed
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(`Lỗi: ${error.message || 'Có lỗi xảy ra khi lưu.'}`); // Show a single error toast
    }
  };

  const handleDelete = (user) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa người dùng',
      message: `Xóa ${user.full_name || user.email}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: () => {
        deleteUserMutation.mutate(user.id);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const selectedCodeData = useMemo(() => {
    return availableCodes.find(c => c.id === selectedCodeId);
  }, [selectedCodeId, availableCodes]);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Người Dùng</h1>
              <p className="text-gray-600">{filteredUsers.length} người dùng</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/AdminCodeManagement'}
                className="flex items-center gap-2 border border-indigo-600 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-50"
              >
                <Key className="w-5 h-5" />
                Quản lý mã
              </button>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
              >
                <UserPlus className="w-5 h-5" />
                Mời người dùng
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Tổng số</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-200">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-600">Đang hoạt động</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-yellow-200">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-600">Chờ duyệt</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{stats.withCode}</p>
              <p className="text-xs text-gray-600">Đã có mã</p>
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
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tất cả vai trò</option>
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="pending">Chờ duyệt</option>
              <option value="suspended">Tạm khóa</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Người dùng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Vai trò</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Mã</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Thông tin</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{user.full_name || 'Chưa đặt tên'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {roleLabels[user.profile?.role] || 'Chưa có'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.profile?.user_code ? (
                        <p className="font-mono text-indigo-600">{user.profile.user_code}</p>
                      ) : (
                        <span className="text-gray-400 text-sm">Chưa có mã</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.profile?.school_name && <p className="text-gray-900">{user.profile.school_name}</p>}
                      {user.profile?.class_name && <p className="text-gray-500">Lớp {user.profile.class_name}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        user.profile?.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.profile?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.profile?.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Enhanced Edit Modal with Tabs */}
        {isEditModalOpen && selectedUser && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa người dùng</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedUser.email}</p>
              </div>

              {/* Tabs */}
              <div className="border-b">
                <div className="flex px-6">
                  <button
                    onClick={() => setActiveTab('basic')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'basic'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Thông tin cơ bản
                  </button>
                  <button
                    onClick={() => setActiveTab('academic')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'academic'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Thông tin học vụ
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                      activeTab === 'code'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      Cấp mã
                      {availableCodes.length > 0 && !selectedUser.profile?.user_code && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                          {availableCodes.length}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Họ tên</label>
                        <input
                          type="text"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          disabled
                          className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Vai trò hệ thống</label>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Vai trò profile</label>
                        <select
                          value={editForm.profile_role}
                          onChange={(e) => {
                            setEditForm({...editForm, profile_role: e.target.value});
                            setSelectedCodeId(''); // Reset selected code when role changes
                          }}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          {Object.entries(roleLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Trạng thái</label>
                      <select
                        value={editForm.profile_status}
                        onChange={(e) => setEditForm({...editForm, profile_status: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="pending">Chờ duyệt</option>
                        <option value="active">Hoạt động</option>
                        <option value="suspended">Tạm khóa</option>
                        <option value="inactive">Không hoạt động</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'academic' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Trường</label>
                        <input
                          type="text"
                          value={editForm.school_name}
                          onChange={(e) => setEditForm({...editForm, school_name: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="LAN, BRVU..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Lớp</label>
                        <input
                          type="text"
                          value={editForm.class_name}
                          onChange={(e) => setEditForm({...editForm, class_name: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="10A1, 11B2..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Khối</label>
                        <select
                          value={editForm.grade_level}
                          onChange={(e) => setEditForm({...editForm, grade_level: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Chọn khối</option>
                          <option value="6">Khối 6</option>
                          <option value="7">Khối 7</option>
                          <option value="8">Khối 8</option>
                          <option value="9">Khối 9</option>
                          <option value="10">Khối 10</option>
                          <option value="11">Khối 11</option>
                          <option value="12">Khối 12</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="space-y-4">
                    {selectedUser.profile?.user_code ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900">User đã có mã</p>
                            <p className="text-sm text-blue-700 mt-1">
                              Mã hiện tại: <span className="font-mono font-bold">{selectedUser.profile.user_code}</span>
                            </p>
                            <p className="text-xs text-blue-500 mt-1">
                              Nếu muốn thay đổi mã, hãy hủy liên kết mã cũ trong trang Quản lý mã trước.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-yellow-900">Chưa có mã</p>
                              <p className="text-sm text-yellow-700 mt-1">
                                Chọn mã khả dụng từ kho để cấp cho user này
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Chọn mã khả dụng ({availableCodes.length} mã)
                          </label>
                          <select
                            value={selectedCodeId}
                            onChange={(e) => setSelectedCodeId(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            disabled={availableCodes.length === 0 || !editForm.profile_role}
                          >
                            <option value="">-- Chọn mã --</option>
                            {availableCodes.map((code) => (
                              <option key={code.id} value={code.id}>
                                {code.user_code} {code.class_name && `(${code.class_name})`}
                              </option>
                            ))}
                          </select>
                          {availableCodes.length === 0 && (
                            <p className="text-sm text-red-600 mt-2">
                              Không có mã khả dụng cho vai trò {roleLabels[editForm.profile_role] || 'đã chọn'}
                            </p>
                          )}
                          {!editForm.profile_role && (
                            <p className="text-sm text-gray-500 mt-2">
                              Chọn vai trò profile trong tab "Thông tin cơ bản" để lọc mã.
                            </p>
                          )}
                        </div>

                        {selectedCodeData && (
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                            <h4 className="font-semibold text-indigo-900 mb-3">Preview mã đã chọn</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                                <div>
                                  <p className="text-xs text-gray-600">User Code</p>
                                  <p className="font-mono font-bold text-indigo-600">{selectedCodeData.user_code}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCodeData.user_code);
                                    toast.success('Đã copy mã User Code!');
                                  }}
                                  className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-gray-100"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex-1">
                                  <p className="text-xs text-gray-600">Secret Code</p>
                                  <p className="font-mono text-sm">
                                    {showSecretPreview ? selectedCodeData.secret_code : '************'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setShowSecretPreview(!showSecretPreview)}
                                  className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-gray-100"
                                >
                                  {showSecretPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                  <p className="text-gray-600">Vai trò</p>
                                  <p className="font-medium">{roleLabels[selectedCodeData.role]}</p>
                                </div>
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                  <p className="text-gray-600">Lớp</p>
                                  <p className="font-medium">{selectedCodeData.class_name || '-'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-white"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateUserMutation.isPending || updateProfileMutation.isPending || assignCodeMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(updateUserMutation.isPending || updateProfileMutation.isPending || assignCodeMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Lưu thay đổi
                    </>
                  )}
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

export default function AdminUsers() {
  return (
    <ToastProvider>
      <AdminUsersContent />
    </ToastProvider>
  );
}
