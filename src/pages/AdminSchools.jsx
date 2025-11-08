
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  School, Search, Plus, Edit, Trash2, X, Save,
  MapPin, Phone, Mail, Star
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

export default function AdminSchools() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [formData, setFormData] = useState({});

  // Load school types from DB
  const { data: schoolTypes = [], isLoading: isLoadingSchoolTypes } = useQuery({
    queryKey: ['schoolTypes'],
    queryFn: () => base44.entities.SchoolType.list('order'),
    initialData: []
  });

  const { data: schools = [], isLoading: isLoadingSchools } = useQuery({
    queryKey: ['schools'],
    queryFn: () => base44.entities.School.list('-created_date'),
    initialData: [],
  });

  const createSchoolMutation = useMutation({
    mutationFn: (data) => base44.entities.School.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setIsCreateModalOpen(false);
      setFormData({});
      alert('Tạo trường học thành công!');
    },
  });

  const updateSchoolMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.School.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setIsEditModalOpen(false);
      setSelectedSchool(null);
      alert('Cập nhật thành công!');
    },
  });

  const deleteSchoolMutation = useMutation({
    mutationFn: (id) => base44.entities.School.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      alert('Xóa trường học thành công!');
    },
  });

  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      const matchesSearch = !searchTerm ||
        school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.province?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [schools, searchTerm]);

  const handleEdit = (school) => {
    setSelectedSchool(school);
    setFormData(school);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (school) => {
    if (!confirm(`Xóa trường ${school.name}?`)) return;
    await deleteSchoolMutation.mutateAsync(school.id);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.school_type || !formData.province) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    await createSchoolMutation.mutateAsync(formData);
  };

  const handleSaveEdit = async () => {
    await updateSchoolMutation.mutateAsync({
      id: selectedSchool.id,
      data: formData
    });
  };

  // Helper to get school type label
  const getSchoolTypeLabel = (typeCode) => {
    const type = schoolTypes.find(t => t.type_code === typeCode);
    return type?.type_name || typeCode;
  };

  const isLoading = isLoadingSchools || isLoadingSchoolTypes;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li className="text-gray-500">Admin</li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Quản lý trường học</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Trường Học</h1>
            <p className="text-gray-600">{filteredSchools.length} trường học</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm trường học
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm trường học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Schools Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((school) => (
              <div key={school.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <School className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {getSchoolTypeLabel(school.school_type)}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{school.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{school.province}</span>
                    </div>
                    {school.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{school.phone}</span>
                      </div>
                    )}
                    {school.ranking && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < school.ranking ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(school)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(school)}
                      className="px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setIsCreateModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Thêm trường học mới</h2>
                  <button onClick={() => setIsCreateModalOpen(false)}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên trường *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      placeholder="Đại học Bách Khoa"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loại trường *</label>
                      <select
                        value={formData.school_type || ''}
                        onChange={(e) => setFormData({...formData, school_type: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      >
                        <option value="">Chọn loại trường</option>
                        {schoolTypes.map(type => (
                          <option key={type.type_code} value={type.type_code}>
                            {type.type_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/TP *</label>
                      <input
                        type="text"
                        value={formData.province || ''}
                        onChange={(e) => setFormData({...formData, province: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                        placeholder="TP. Hồ Chí Minh"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreate}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Tạo trường học
                    </button>
                    <button
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setFormData({});
                      }}
                      className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal - Similar structure */}
        <AnimatePresence>
          {isEditModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setIsEditModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa trường học</h2>
                  <button onClick={() => setIsEditModalOpen(false)}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên trường *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loại trường *</label>
                      <select
                        value={formData.school_type || ''}
                        onChange={(e) => setFormData({...formData, school_type: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      >
                         <option value="">Chọn loại trường</option>
                        {schoolTypes.map(type => (
                          <option key={type.type_code} value={type.type_code}>
                            {type.type_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/TP *</label>
                      <input
                        type="text"
                        value={formData.province || ''}
                        onChange={(e) => setFormData({...formData, province: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      Lưu thay đổi
                    </button>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
