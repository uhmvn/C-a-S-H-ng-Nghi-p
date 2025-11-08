
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, Users, BookOpen, Award, GraduationCap, Plus, Edit2, Trash2, 
  Eye, X, Save, Loader2, Mail, School, Calendar
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function TeacherManagement() {
  return (
    <ToastProvider>
      <TeacherManagementContent />
    </ToastProvider>
  );
}

function TeacherManagementContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [editForm, setEditForm] = useState({});

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['teacherProfiles'],
    queryFn: async () => {
      const allProfiles = await base44.entities.UserProfile.list('-created_date', 1000);
      return allProfiles.filter(p => 
        p.role === 'homeroom_teacher' || p.role === 'subject_teacher'
      );
    },
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
    initialData: [],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['teachingAssignments'],
    queryFn: () => base44.entities.TeachingAssignment.list('-created_date', 500),
    initialData: [],
  });

  const teachersWithUsers = useMemo(() => {
    return profiles.map(profile => {
      const user = users.find(u => u.id === profile.user_id);
      const teacherAssignments = assignments.filter(a => a.teacher_id === profile.id);
      return { 
        ...profile, 
        user, 
        teaching_count: teacherAssignments.length,
        assignments: teacherAssignments
      };
    });
  }, [profiles, users, assignments]);

  const filteredTeachers = useMemo(() => {
    return teachersWithUsers.filter(teacher => {
      const matchesSearch = !searchTerm ||
        teacher.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.user_code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === "all" || teacher.role === filterRole;
      const matchesSubject = filterSubject === "all" || teacher.subject_name === filterSubject;
      const matchesStatus = filterStatus === "all" || teacher.status === filterStatus;
      
      return matchesSearch && matchesRole && matchesSubject && matchesStatus;
    });
  }, [teachersWithUsers, searchTerm, filterRole, filterSubject, filterStatus]);

  const uniqueSubjects = useMemo(() => {
    return [...new Set(profiles.map(p => p.subject_name).filter(Boolean))].sort();
  }, [profiles]);

  const stats = useMemo(() => {
    return {
      total: profiles.length,
      homeroom: profiles.filter(p => p.role === 'homeroom_teacher').length,
      subject: profiles.filter(p => p.role === 'subject_teacher').length,
      withCode: profiles.filter(p => p.user_code).length
    };
  }, [profiles]);

  const updateProfileMutation = useMutation({
    mutationFn: async ({ profileId, data }) => {
      return await base44.entities.UserProfile.update(profileId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherProfiles'] });
      toast.success('Cập nhật giáo viên thành công!');
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (profileId) => {
      await base44.entities.UserProfile.delete(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherProfiles'] });
      toast.success('Xóa giáo viên thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const handleView = (teacher) => {
    setSelectedTeacher(teacher);
    setIsViewModalOpen(true);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setEditForm({
      role: teacher.role || 'subject_teacher',
      school_name: teacher.school_name || '',
      class_name: teacher.class_name || '',
      subject_name: teacher.subject_name || '',
      status: teacher.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTeacher) return;
    updateProfileMutation.mutate({
      profileId: selectedTeacher.id,
      data: editForm
    });
  };

  const handleDelete = (teacher) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa giáo viên',
      message: `Xóa giáo viên ${teacher.user?.full_name || teacher.user_code}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: () => {
        deleteTeacherMutation.mutate(teacher.id);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Giáo Viên</h1>
          <p className="text-gray-600">{filteredTeachers.length} giáo viên</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Tổng số GV</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.homeroom}</p>
                <p className="text-sm text-gray-600">GV Chủ nhiệm</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.subject}</p>
                <p className="text-sm text-gray-600">GV Bộ môn</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.withCode}</p>
                <p className="text-sm text-gray-600">Đã có mã</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm giáo viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="homeroom_teacher">GV Chủ nhiệm</option>
              <option value="subject_teacher">GV Bộ môn</option>
            </select>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả môn</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="suspended">Tạm khóa</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>

        {profilesLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có giáo viên</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{teacher.user?.full_name || 'Chưa có tên'}</h3>
                        <p className="text-sm text-gray-500">{teacher.user_code || 'Chưa có mã'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      teacher.role === 'homeroom_teacher' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {teacher.role === 'homeroom_teacher' ? 'GVCN' : 'GVBM'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <School className="w-4 h-4" />
                      <span>{teacher.school_name || 'Chưa có trường'}</span>
                    </div>
                    {teacher.role === 'homeroom_teacher' && teacher.class_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Chủ nhiệm lớp {teacher.class_name}</span>
                      </div>
                    )}
                    {teacher.role === 'subject_teacher' && teacher.subject_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span>Môn {teacher.subject_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{teacher.user?.email || 'Chưa có email'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-indigo-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-indigo-600">{teacher.teaching_count || 0}</p>
                      <p className="text-xs text-gray-600">Lớp dạy</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-green-600">1</p>
                      <p className="text-xs text-gray-600">Năm học</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(teacher)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Xem
                    </button>
                    <button
                      onClick={() => handleEdit(teacher)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(teacher)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && selectedTeacher && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsViewModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Chi tiết giáo viên</h3>
                <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{selectedTeacher.user?.full_name || 'Chưa có tên'}</h4>
                    <p className="text-gray-600">{selectedTeacher.user_code || 'Chưa có mã'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-medium">{selectedTeacher.user?.email || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vai trò</p>
                    <p className="font-medium">
                      {selectedTeacher.role === 'homeroom_teacher' ? 'Giáo viên chủ nhiệm' : 'Giáo viên bộ môn'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Trường</p>
                    <p className="font-medium">{selectedTeacher.school_name || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lớp chủ nhiệm</p>
                    <p className="font-medium">{selectedTeacher.class_name || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Môn giảng dạy</p>
                    <p className="font-medium">{selectedTeacher.subject_name || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Số lớp dạy</p>
                    <p className="font-medium">{selectedTeacher.teaching_count || 0} lớp</p>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <h5 className="font-bold text-gray-900 mb-3">Phân công giảng dạy ({selectedTeacher.assignments?.length || 0})</h5>
                  {selectedTeacher.assignments?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTeacher.assignments.map((assignment, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{assignment.class_name}</p>
                              {assignment.subject_name && (
                                <p className="text-sm text-gray-600">Môn {assignment.subject_name}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              assignment.role_in_class === 'homeroom' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {assignment.role_in_class === 'homeroom' ? 'Chủ nhiệm' : 'Bộ môn'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Chưa có phân công giảng dạy</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedTeacher && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Chỉnh sửa giáo viên</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Vai trò</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="homeroom_teacher">Giáo viên chủ nhiệm</option>
                      <option value="subject_teacher">Giáo viên bộ môn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Trường</label>
                    <input
                      type="text"
                      value={editForm.school_name}
                      onChange={(e) => setEditForm({...editForm, school_name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Lớp chủ nhiệm</label>
                    <input
                      type="text"
                      value={editForm.class_name}
                      onChange={(e) => setEditForm({...editForm, class_name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      disabled={editForm.role !== 'homeroom_teacher'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Môn giảng dạy</label>
                    <input
                      type="text"
                      value={editForm.subject_name}
                      onChange={(e) => setEditForm({...editForm, subject_name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      disabled={editForm.role !== 'subject_teacher'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Trạng thái</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="suspended">Tạm khóa</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Lưu
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
