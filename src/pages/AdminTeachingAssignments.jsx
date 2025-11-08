
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Users, Plus, Edit2, Trash2, X, BookOpen, Calendar, Search
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

export default function AdminTeachingAssignments() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    school_id: '',
    academic_year_id: '',
    teacher_id: '',
    class_id: '',
    subject_id: '',
    role_in_class: 'subject',
    lessons_per_week: 0,
    status: 'active'
  });

  // Fetch data
  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: () => base44.entities.School.list(),
    initialData: []
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academicYears'],
    queryFn: () => base44.entities.AcademicYear.list(),
    initialData: []
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
    initialData: []
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('order'),
    initialData: []
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.UserProfile.filter({
      role: { $in: ['homeroom_teacher', 'subject_teacher'] }
    }),
    initialData: []
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['teachingAssignments'],
    queryFn: () => base44.entities.TeachingAssignment.list('-created_date'),
    initialData: []
  });

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => 
      !searchTerm ||
      a.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assignments, searchTerm]);

  // Create mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data) => {
      const teacher = teachers.find(t => t.id === data.teacher_id);
      const cls = classes.find(c => c.id === data.class_id);
      const subject = subjects.find(s => s.id === data.subject_id);
      
      return base44.entities.TeachingAssignment.create({
        ...data,
        teacher_name: teacher?.user_code || '',
        teacher_code: teacher?.user_code || '',
        class_name: cls?.name || '',
        subject_name: subject?.name || '',
        start_date: new Date().toISOString().split('T')[0],
        assigned_by: (await base44.auth.me()).id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachingAssignments'] });
      setIsAddModalOpen(false);
      setFormData({
        school_id: '',
        academic_year_id: '',
        teacher_id: '',
        class_id: '',
        subject_id: '',
        role_in_class: 'subject',
        lessons_per_week: 0,
        status: 'active'
      });
    }
  });

  // Delete mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: (id) => base44.entities.TeachingAssignment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teachingAssignments'] })
  });

  const handleCreate = () => {
    if (!formData.teacher_id || !formData.class_id) {
      alert('Vui lòng chọn giáo viên và lớp');
      return;
    }
    if (formData.role_in_class === 'subject' && !formData.subject_id) {
      alert('Vui lòng chọn môn học');
      return;
    }
    createAssignmentMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (confirm('Xóa phân công này?')) {
      deleteAssignmentMutation.mutate(id);
    }
  };

  // Group by class
  const assignmentsByClass = useMemo(() => {
    const grouped = {};
    filteredAssignments.forEach(a => {
      const className = a.class_name || 'Chưa có lớp';
      if (!grouped[className]) {
        grouped[className] = [];
      }
      grouped[className].push(a);
    });
    return grouped;
  }, [filteredAssignments]);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Phân Công Giảng Dạy</h1>
          <p className="text-gray-600">Gán giáo viên chủ nhiệm và giáo viên bộ môn cho các lớp</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            <p className="text-sm text-gray-600">Tổng phân công</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-2xl font-bold text-gray-900">
              {assignments.filter(a => a.role_in_class === 'homeroom').length}
            </p>
            <p className="text-sm text-gray-600">Chủ nhiệm</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-2xl font-bold text-gray-900">
              {assignments.filter(a => a.role_in_class === 'subject').length}
            </p>
            <p className="text-sm text-gray-600">Bộ môn</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
            <p className="text-sm text-gray-600">Giáo viên</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm GV, lớp, môn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl"
              />
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Phân công mới
            </button>
          </div>
        </div>

        {/* Assignments by Class */}
        <div className="space-y-6">
          {Object.entries(assignmentsByClass).map(([className, classAssignments]) => (
            <div key={className} className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                {className}
              </h3>
              <div className="space-y-3">
                {classAssignments.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        assignment.role_in_class === 'homeroom' 
                          ? 'bg-purple-100' 
                          : 'bg-blue-100'
                      }`}>
                        {assignment.role_in_class === 'homeroom' ? (
                          <Users className="w-5 h-5 text-purple-600" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignment.teacher_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {assignment.role_in_class === 'homeroom' ? 'Giáo viên chủ nhiệm' : assignment.subject_name}
                          {assignment.lessons_per_week > 0 && ` • ${assignment.lessons_per_week} tiết/tuần`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Assignment Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Phân Công Giảng Dạy</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Trường *</label>
                    <select
                      value={formData.school_id}
                      onChange={(e) => setFormData({...formData, school_id: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Chọn trường</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Năm học *</label>
                    <select
                      value={formData.academic_year_id}
                      onChange={(e) => setFormData({...formData, academic_year_id: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Chọn năm học</option>
                      {academicYears.map(y => (
                        <option key={y.id} value={y.id}>{y.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Vai trò *</label>
                  <select
                    value={formData.role_in_class}
                    onChange={(e) => setFormData({...formData, role_in_class: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="homeroom">Giáo viên chủ nhiệm</option>
                    <option value="subject">Giáo viên bộ môn</option>
                    <option value="assistant">Trợ giảng</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Giáo viên *</label>
                    <select
                      value={formData.teacher_id}
                      onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Chọn giáo viên</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.user_code} - {t.role === 'homeroom_teacher' ? 'GVCN' : 'GVBM'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Lớp *</label>
                    <select
                      value={formData.class_id}
                      onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Chọn lớp</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.role_in_class === 'subject' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Môn học *</label>
                      <select
                        value={formData.subject_id}
                        onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Chọn môn</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Số tiết/tuần</label>
                      <input
                        type="number"
                        value={formData.lessons_per_week}
                        onChange={(e) => setFormData({...formData, lessons_per_week: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Ghi chú</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createAssignmentMutation.isLoading}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createAssignmentMutation.isLoading ? 'Đang tạo...' : 'Phân công'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
