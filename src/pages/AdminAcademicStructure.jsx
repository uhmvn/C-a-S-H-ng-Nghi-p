
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  School, Calendar, Users, Plus, Edit2, Trash2, Save, X,
  AlertCircle, CheckCircle, Clock, BookOpen
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

export default function AdminAcademicStructure() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("years");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Fetch data
  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: () => base44.entities.School.list(),
    initialData: []
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academicYears'],
    queryFn: () => base44.entities.AcademicYear.list('-created_date'),
    initialData: []
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => base44.entities.Grade.list('order'),
    initialData: []
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list('-created_date'),
    initialData: []
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['teacherProfiles'],
    queryFn: () => base44.entities.UserProfile.filter({
      role: { $in: ['homeroom_teacher', 'subject_teacher'] }
    }),
    initialData: []
  });

  // ✅ NEW: Fetch Subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('order'),
    initialData: []
  });

  // Create mutations
  const createYearMutation = useMutation({
    mutationFn: (data) => base44.entities.AcademicYear.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      setIsAddModalOpen(false);
      setFormData({});
    }
  });

  const createGradeMutation = useMutation({
    mutationFn: (data) => base44.entities.Grade.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      setIsAddModalOpen(false);
      setFormData({});
    }
  });

  const createClassMutation = useMutation({
    mutationFn: (data) => base44.entities.Class.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsAddModalOpen(false);
      setFormData({});
    }
  });

  // Update mutations
  const updateYearMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AcademicYear.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      setEditingItem(null);
    }
  });

  const updateGradeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Grade.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      setEditingItem(null);
    }
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Class.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setEditingItem(null);
    }
  });

  // Delete mutations
  const deleteYearMutation = useMutation({
    mutationFn: (id) => base44.entities.AcademicYear.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academicYears'] })
  });

  const deleteGradeMutation = useMutation({
    mutationFn: (id) => base44.entities.Grade.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grades'] })
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id) => base44.entities.Class.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] })
  });

  // ✅ NEW: Subject mutations
  const createSubjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Subject.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsAddModalOpen(false);
      setFormData({});
    }
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subject.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setEditingItem(null);
    }
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id) => base44.entities.Subject.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] })
  });

  const handleCreate = () => {
    if (activeTab === "years") {
      createYearMutation.mutate(formData);
    } else if (activeTab === "grades") {
      createGradeMutation.mutate(formData);
    } else if (activeTab === "classes") {
      createClassMutation.mutate(formData);
    } else if (activeTab === "subjects") { // ✅ NEW
      createSubjectMutation.mutate(formData);
    }
  };

  const handleUpdate = () => {
    if (activeTab === "years") {
      updateYearMutation.mutate({ id: editingItem.id, data: formData });
    } else if (activeTab === "grades") {
      updateGradeMutation.mutate({ id: editingItem.id, data: formData });
    } else if (activeTab === "classes") {
      updateClassMutation.mutate({ id: editingItem.id, data: formData });
    } else if (activeTab === "subjects") { // ✅ NEW
      updateSubjectMutation.mutate({ id: editingItem.id, data: formData });
    }
  };

  const handleDelete = (id) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;

    if (activeTab === "years") {
      deleteYearMutation.mutate(id);
    } else if (activeTab === "grades") {
      deleteGradeMutation.mutate(id);
    } else if (activeTab === "classes") {
      deleteClassMutation.mutate(id);
    } else if (activeTab === "subjects") { // ✅ NEW
      deleteSubjectMutation.mutate(id);
    }
  };

  const openAddModal = () => {
    setFormData({
      school_id: schools[0]?.id || '',
      ...(activeTab === "years" && {
        year_code: '',
        name: '',
        start_date: '',
        end_date: '',
        status: 'upcoming',
        semester_count: 2,
        is_active: false
      }),
      ...(activeTab === "grades" && {
        grade_code: '',
        name: '',
        level: 'high_school',
        order: grades.length + 1,
        is_active: true
      }),
      ...(activeTab === "classes" && {
        academic_year_id: academicYears.find(y => y.is_active)?.id || '',
        grade_id: '',
        class_code: '',
        name: '',
        capacity: 40,
        student_count: 0,
        status: 'active'
      }),
      ...(activeTab === "subjects" && { // ✅ NEW
        subject_code: '',
        name: '',
        name_en: '',
        level: 'both',
        category: 'core',
        lessons_per_week: 3,
        coefficient: 1,
        is_active: true,
        order: subjects.length + 1
      })
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData(item);
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cấu Trúc Học Vụ</h1>
          <p className="text-gray-600">Quản lý năm học, khối lớp, lớp học và môn học</p> {/* ✅ UPDATED */}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto"> {/* ✅ UPDATED: overflow-x-auto added */}
          {[
            { key: 'years', label: 'Năm học', icon: Calendar },
            { key: 'grades', label: 'Khối lớp', icon: BookOpen },
            { key: 'classes', label: 'Lớp học', icon: Users },
            { key: 'subjects', label: 'Môn học', icon: BookOpen } // ✅ NEW
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-4 px-4 font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${ // ✅ UPDATED: whitespace-nowrap added
                activeTab === tab.key ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {activeTab === 'years' && 'Danh sách năm học'}
              {activeTab === 'grades' && 'Danh sách khối lớp'}
              {activeTab === 'classes' && 'Danh sách lớp học'}
              {activeTab === 'subjects' && 'Danh sách môn học'} {/* ✅ NEW */}
            </h2>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Thêm mới
            </button>
          </div>

          {/* Academic Years Tab */}
          {activeTab === 'years' && (
            <div className="space-y-4">
              {academicYears.map(year => (
                <div key={year.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{year.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          year.status === 'active' ? 'bg-green-100 text-green-800' :
                          year.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          year.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {year.status === 'active' ? 'Đang diễn ra' :
                           year.status === 'upcoming' ? 'Sắp tới' :
                           year.status === 'completed' ? 'Đã kết thúc' : 'Lưu trữ'}
                        </span>
                        {year.is_active && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Mã: {year.year_code} • {year.start_date} đến {year.end_date} • {year.semester_count} học kỳ
                      </p>
                      {year.description && (
                        <p className="text-sm text-gray-500 mt-2">{year.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openEditModal(year)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(year.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grades.map(grade => (
                <div key={grade.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(grade)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(grade.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{grade.name}</h3>
                  <p className="text-sm text-gray-600">
                    Mã: {grade.grade_code} • {grade.level === 'middle_school' ? 'THCS' : 'THPT'}
                  </p>
                  {grade.description && (
                    <p className="text-sm text-gray-500 mt-2">{grade.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div className="space-y-4">
              {classes.map(cls => {
                const grade = grades.find(g => g.id === cls.grade_id);
                const year = academicYears.find(y => y.id === cls.academic_year_id);

                return (
                  <div key={cls.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            cls.status === 'active' ? 'bg-green-100 text-green-800' :
                            cls.status === 'full' ? 'bg-red-100 text-red-800' :
                            cls.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cls.status === 'active' ? 'Hoạt động' :
                             cls.status === 'full' ? 'Đã đủ' :
                             cls.status === 'inactive' ? 'Không hoạt động' : 'Lưu trữ'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p>Mã lớp: {cls.class_code}</p>
                            <p>Khối: {grade?.name || 'N/A'}</p>
                            <p>Năm học: {year?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p>Sĩ số: {cls.student_count}/{cls.capacity}</p>
                            <p>GVCN: {profiles.find(p => p.id === cls.homeroom_teacher_id)?.user_code || 'Chưa có'}</p>
                            <p>Phòng: {cls.room_number || 'Chưa có'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => openEditModal(cls)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cls.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ✅ NEW: Subjects Tab */}
          {activeTab === 'subjects' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map(subject => (
                <div key={subject.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(subject)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{subject.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Mã: {subject.subject_code} {subject.name_en && `• ${subject.name_en}`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      subject.level === 'high_school' ? 'bg-purple-100 text-purple-700' :
                      subject.level === 'middle_school' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {subject.level === 'high_school' ? 'THPT' :
                       subject.level === 'middle_school' ? 'THCS' : 'Cả hai'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                        subject.category === 'core' ? 'bg-yellow-100 text-yellow-700' :
                        subject.category === 'science' ? 'bg-indigo-100 text-indigo-700' :
                        subject.category === 'social' ? 'bg-teal-100 text-teal-700' :
                        subject.category === 'language' ? 'bg-pink-100 text-pink-700' :
                        subject.category === 'arts' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                        {subject.category === 'core' ? 'Cốt lõi' :
                         subject.category === 'science' ? 'KHTN' :
                         subject.category === 'social' ? 'KHXH' :
                         subject.category === 'language' ? 'Ngoại ngữ' :
                         subject.category === 'arts' ? 'Nghệ thuật' :
                         'Thể chất'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      {subject.lessons_per_week || 3} tiết/tuần
                    </span>
                    {subject.coefficient > 1 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        Hệ số {subject.coefficient}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(isAddModalOpen || editingItem) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Chỉnh sửa' : 'Thêm mới'}
                  {activeTab === 'years' && ' năm học'}
                  {activeTab === 'grades' && ' khối lớp'}
                  {activeTab === 'classes' && ' lớp học'}
                  {activeTab === 'subjects' && ' môn học'} {/* ✅ NEW */}
                </h3>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                    setFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Academic Year Form */}
                {activeTab === 'years' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trường <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.school_id || ''}
                        onChange={(e) => setFormData({...formData, school_id: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Chọn trường</option>
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mã năm học *
                        </label>
                        <input
                          type="text"
                          value={formData.year_code || ''}
                          onChange={(e) => setFormData({...formData, year_code: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="2025-2026"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên năm học *
                        </label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="Năm học 2025-2026"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ngày bắt đầu *
                        </label>
                        <input
                          type="date"
                          value={formData.start_date || ''}
                          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ngày kết thúc *
                        </label>
                        <input
                          type="date"
                          value={formData.end_date || ''}
                          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trạng thái
                        </label>
                        <select
                          value={formData.status || 'upcoming'}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="upcoming">Sắp tới</option>
                          <option value="active">Đang diễn ra</option>
                          <option value="completed">Đã kết thúc</option>
                          <option value="archived">Lưu trữ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số học kỳ
                        </label>
                        <input
                          type="number"
                          value={formData.semester_count || 2}
                          onChange={(e) => setFormData({...formData, semester_count: parseInt(e.target.value, 10)})}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái hoạt động
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-indigo-600 rounded"
                                checked={formData.is_active || false}
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                            />
                            <span className="ml-2 text-gray-700">Đang hoạt động</span>
                        </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {/* Grade Form */}
                {activeTab === 'grades' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trường <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.school_id || ''}
                        onChange={(e) => setFormData({...formData, school_id: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mã khối *
                        </label>
                        <input
                          type="text"
                          value={formData.grade_code || ''}
                          onChange={(e) => setFormData({...formData, grade_code: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="10, 11, 12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên khối *
                        </label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="Khối 10"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cấp học *
                        </label>
                        <select
                          value={formData.level || 'high_school'}
                          onChange={(e) => setFormData({...formData, level: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="middle_school">THCS</option>
                          <option value="high_school">THPT</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thứ tự
                        </label>
                        <input
                          type="number"
                          value={formData.order || ''}
                          onChange={(e) => setFormData({...formData, order: parseInt(e.target.value, 10)})}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái hoạt động
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-indigo-600 rounded"
                                checked={formData.is_active || false}
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                            />
                            <span className="ml-2 text-gray-700">Đang hoạt động</span>
                        </label>
                    </div>
                  </>
                )}

                {/* Class Form */}
                {activeTab === 'classes' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trường <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.school_id || ''}
                        onChange={(e) => setFormData({...formData, school_id: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Năm học *
                        </label>
                        <select
                          value={formData.academic_year_id || ''}
                          onChange={(e) => setFormData({...formData, academic_year_id: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="">Chọn năm học</option>
                          {academicYears.map(y => (
                            <option key={y.id} value={y.id}>{y.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Khối *
                        </label>
                        <select
                          value={formData.grade_id || ''}
                          onChange={(e) => setFormData({...formData, grade_id: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="">Chọn khối</option>
                          {grades.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mã lớp *
                        </label>
                        <input
                          type="text"
                          value={formData.class_code || ''}
                          onChange={(e) => setFormData({...formData, class_code: e.target.value.toUpperCase()})}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="10A, 11B"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên lớp *
                        </label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="Lớp 10A"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sĩ số tối đa
                        </label>
                        <input
                          type="number"
                          value={formData.capacity || 40}
                          onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value, 10)})}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số HS hiện tại
                        </label>
                        <input
                          type="number"
                          value={formData.student_count || 0}
                          onChange={(e) => setFormData({...formData, student_count: parseInt(e.target.value, 10)})}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phòng học
                        </label>
                        <input
                          type="text"
                          value={formData.room_number || ''}
                          onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="A101"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GV Chủ nhiệm
                      </label>
                      <select
                        value={formData.homeroom_teacher_id || ''}
                        onChange={(e) => {
                          const teacher = profiles.find(p => p.id === e.target.value);
                          setFormData({
                            ...formData,
                            homeroom_teacher_id: e.target.value,
                            homeroom_teacher_name: teacher?.user_code || ''
                          });
                        }}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Chọn GVCN</option>
                        {profiles.filter(p => p.role === 'homeroom_teacher').map(t => (
                          <option key={t.id} value={t.id}>{t.user_code} - {t.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* ✅ NEW: Subject Form */}
                {activeTab === 'subjects' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mã môn học *
                        </label>
                        <input
                          type="text"
                          value={formData.subject_code || ''}
                          onChange={(e) => setFormData({...formData, subject_code: e.target.value.toUpperCase()})}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="MATH, LIT, PHYS"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên môn *
                        </label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="Toán, Văn, Lý"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên tiếng Anh
                      </label>
                      <input
                        type="text"
                        value={formData.name_en || ''}
                        onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="Mathematics, Literature"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cấp học *
                        </label>
                        <select
                          value={formData.level || 'both'}
                          onChange={(e) => setFormData({...formData, level: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="both">Cả THCS & THPT</option>
                          <option value="middle_school">Chỉ THCS</option>
                          <option value="high_school">Chỉ THPT</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nhóm môn *
                        </label>
                        <select
                          value={formData.category || 'core'}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="core">Cốt lõi</option>
                          <option value="science">Khoa học tự nhiên</option>
                          <option value="social">Khoa học xã hội</option>
                          <option value="language">Ngoại ngữ</option>
                          <option value="arts">Nghệ thuật</option>
                          <option value="physical">Thể chất</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tiết/tuần
                        </label>
                        <input
                          type="number"
                          value={formData.lessons_per_week || 3}
                          onChange={(e) => setFormData({...formData, lessons_per_week: parseInt(e.target.value, 10)})}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hệ số
                        </label>
                        <select
                          value={formData.coefficient || 1}
                          onChange={(e) => setFormData({...formData, coefficient: parseInt(e.target.value, 10)})}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thứ tự
                        </label>
                        <input
                          type="number"
                          value={formData.order || ''}
                          onChange={(e) => setFormData({...formData, order: parseInt(e.target.value, 10)})}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái hoạt động
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-indigo-600 rounded"
                                checked={formData.is_active || false}
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                            />
                            <span className="ml-2 text-gray-700">Đang hoạt động</span>
                        </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        rows={2}
                        placeholder="Mô tả về môn học..."
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                    setFormData({});
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={editingItem ? handleUpdate : handleCreate}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  {editingItem ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
