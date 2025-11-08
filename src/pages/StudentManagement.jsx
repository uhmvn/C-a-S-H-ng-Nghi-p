
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Users, BookOpen, TrendingUp, Award, Plus, Edit2, Trash2,
  Eye, X, Save, Loader2, Mail, Phone, School, Calendar
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function StudentManagement() {
  return (
    <ToastProvider>
      <StudentManagementContent />
    </ToastProvider>
  );
}

function StudentManagementContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [editForm, setEditForm] = useState({});

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['studentProfiles'],
    queryFn: async () => {
      const allProfiles = await base44.entities.UserProfile.list('-created_date', 1000);
      return allProfiles.filter(p => p.role === 'student');
    },
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
    initialData: [],
  });

  const { data: testResults = [] } = useQuery({
    queryKey: ['testResults'],
    queryFn: () => base44.entities.TestResult.list('-completed_date', 500),
    initialData: [],
  });

  const studentsWithUsers = useMemo(() => {
    return profiles.map(profile => {
      const user = users.find(u => u.id === profile.user_id);
      const studentTests = testResults.filter(t => t.user_id === profile.user_id);
      return { ...profile, user, test_count: studentTests.length, testResults: studentTests };
    });
  }, [profiles, users, testResults]);

  const filteredStudents = useMemo(() => {
    return studentsWithUsers.filter(student => {
      const matchesSearch = !searchTerm ||
        student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGrade = filterGrade === "all" || student.grade_level === filterGrade;
      const matchesClass = filterClass === "all" || student.class_name === filterClass;
      const matchesStatus = filterStatus === "all" || student.status === filterStatus;

      return matchesSearch && matchesGrade && matchesClass && matchesStatus;
    });
  }, [studentsWithUsers, searchTerm, filterGrade, filterClass, filterStatus]);

  const uniqueGrades = useMemo(() => {
    return [...new Set(profiles.map(p => p.grade_level).filter(Boolean))].sort();
  }, [profiles]);

  const uniqueClasses = useMemo(() => {
    return [...new Set(profiles.map(p => p.class_name).filter(Boolean))].sort();
  }, [profiles]);

  const stats = useMemo(() => {
    return {
      total: profiles.length,
      withCode: profiles.filter(p => p.user_code).length,
      active: profiles.filter(p => p.status === 'active').length,
      averageGPA: 8.5 // This is a placeholder, needs actual calculation
    };
  }, [profiles]);

  const updateProfileMutation = useMutation({
    mutationFn: async ({ profileId, data }) => {
      return await base44.entities.UserProfile.update(profileId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfiles'] });
      toast.success('Cập nhật học sinh thành công!');
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (profileId) => {
      await base44.entities.UserProfile.delete(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfiles'] });
      toast.success('Xóa học sinh thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const handleView = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setEditForm({
      school_name: student.school_name || '',
      class_name: student.class_name || '',
      grade_level: student.grade_level || '',
      student_id: student.student_id || '',
      parent_phone: student.parent_phone || '',
      status: student.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedStudent) return;
    updateProfileMutation.mutate({
      profileId: selectedStudent.id,
      data: editForm
    });
  };

  const handleDelete = (student) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa học sinh',
      message: `Xóa học sinh ${student.user?.full_name || student.user_code}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: () => {
        deleteStudentMutation.mutate(student.id);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Học Sinh</h1>
            <Link
              to={createPageUrl("AdminStudentInfo")}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Users className="w-5 h-5" />
              Xem thông tin chi tiết
            </Link>
          </div>
          <p className="text-gray-600">{filteredStudents.length} học sinh</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Tổng số học sinh</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-sm text-gray-600">Đang học</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.withCode}</p>
                <p className="text-sm text-gray-600">Đã có mã</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.averageGPA}</p>
                <p className="text-sm text-gray-600">Điểm TB chung</p>
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
                placeholder="Tìm học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả khối</option>
              {uniqueGrades.map(grade => (
                <option key={grade} value={grade}>Khối {grade}</option>
              ))}
            </select>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả lớp</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>Lớp {cls}</option>
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
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có học sinh</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{student.user?.full_name || 'Chưa có tên'}</h3>
                        <p className="text-sm text-gray-500">{student.user_code || 'Chưa có mã'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      student.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <School className="w-4 h-4" />
                      <span>{student.school_name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>Lớp {student.class_name || '-'} - Khối {student.grade_level || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{student.parent_phone || 'Chưa có SĐT'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{student.user?.email || 'Chưa có email'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-blue-600">{student.test_count || 0}</p>
                      <p className="text-xs text-gray-600">Bài test</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-green-600">8.5</p>
                      <p className="text-xs text-gray-600">Điểm TB</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-yellow-600">85%</p>
                      <p className="text-xs text-gray-600">Hoàn thành</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(student)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Xem
                    </button>
                    <button
                      onClick={() => handleEdit(student)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Sửa
                    </button>
                    <Link
                      to={`${createPageUrl("AdminStudentInfo")}?student=${student.id}`}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Xem chi tiết đầy đủ"
                    >
                      <Users className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(student)}
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
        {isViewModalOpen && selectedStudent && (
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
                <h3 className="text-xl font-bold">Chi tiết học sinh</h3>
                <div className="flex items-center gap-2">
                  <Link
                    to={`${createPageUrl("AdminStudentInfo")}?student=${selectedStudent.id}`}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 text-sm"
                  >
                    <Users className="w-4 h-4" />
                    Xem đầy đủ
                  </Link>
                  <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{selectedStudent.user?.full_name || 'Chưa có tên'}</h4>
                    <p className="text-gray-600">{selectedStudent.user_code || 'Chưa có mã'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-medium">{selectedStudent.user?.email || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Trường</p>
                    <p className="font-medium">{selectedStudent.school_name || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lớp</p>
                    <p className="font-medium">{selectedStudent.class_name || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Khối</p>
                    <p className="font-medium">Khối {selectedStudent.grade_level || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Mã số học sinh</p>
                    <p className="font-medium">{selectedStudent.student_id || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">SĐT Phụ huynh</p>
                    <p className="font-medium">{selectedStudent.parent_phone || 'Chưa có'}</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <h5 className="font-bold text-gray-900 mb-3">Kết quả Test ({selectedStudent.test_count || 0})</h5>
                  {selectedStudent.testResults?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedStudent.testResults.slice(0, 3).map((test, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3">
                          <p className="font-medium text-sm">{test.test_name}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(test.completed_date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Chưa có kết quả test</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedStudent && (
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
                <h3 className="text-xl font-bold">Chỉnh sửa học sinh</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Trường</label>
                    <input
                      type="text"
                      value={editForm.school_name}
                      onChange={(e) => setEditForm({...editForm, school_name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Lớp</label>
                    <input
                      type="text"
                      value={editForm.class_name}
                      onChange={(e) => setEditForm({...editForm, class_name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Khối</label>
                    <select
                      value={editForm.grade_level}
                      onChange={(e) => setEditForm({...editForm, grade_level: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Chọn khối</option>
                      {['6','7','8','9','10','11','12'].map(g => (
                        <option key={g} value={g}>Khối {g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mã số học sinh</label>
                    <input
                      type="text"
                      value={editForm.student_id}
                      onChange={(e) => setEditForm({...editForm, student_id: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">SĐT Phụ huynh</label>
                    <input
                      type="text"
                      value={editForm.parent_phone}
                      onChange={(e) => setEditForm({...editForm, parent_phone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
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
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
