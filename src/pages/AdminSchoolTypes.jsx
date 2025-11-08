import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { School, Search, Plus, Edit2, Trash2, X, Save, GraduationCap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";

function AdminSchoolTypesContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [formData, setFormData] = useState({
    type_code: '',
    type_name: '',
    description: '',
    level: 'high_school',
    order: 1,
    is_active: true
  });

  const { data: schoolTypes = [], isLoading } = useQuery({
    queryKey: ['schoolTypes'],
    queryFn: () => base44.entities.SchoolType.list('order'),
    initialData: []
  });

  const filteredTypes = useMemo(() => {
    return schoolTypes.filter(type => {
      const matchesSearch = !searchTerm ||
        type.type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.type_code?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [schoolTypes, searchTerm]);

  const createTypeMutation = useMutation({
    mutationFn: (data) => base44.entities.SchoolType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolTypes'] });
      setIsCreateModalOpen(false);
      setFormData({
        type_code: '',
        type_name: '',
        description: '',
        level: 'high_school',
        order: 1,
        is_active: true
      });
      toast.success('Tạo loại trường thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SchoolType.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolTypes'] });
      setIsEditModalOpen(false);
      setSelectedType(null);
      toast.success('Cập nhật thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id) => base44.entities.SchoolType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolTypes'] });
      toast.success('Xóa loại trường thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const handleEdit = (type) => {
    setSelectedType(type);
    setFormData(type);
    setIsEditModalOpen(true);
  };

  const handleDelete = (type) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa loại trường',
      message: `Bạn có chắc muốn xóa loại trường "${type.type_name}"? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: () => {
        deleteTypeMutation.mutate(type.id);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleCreate = () => {
    if (!formData.type_code || !formData.type_name) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    createTypeMutation.mutate(formData);
  };

  const handleSaveEdit = () => {
    if (!formData.type_code || !formData.type_name) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    updateTypeMutation.mutate({ id: selectedType.id, data: formData });
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Loại Trường</h1>
              <p className="text-gray-600">{filteredTypes.length} loại trường</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Thêm loại trường
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm loại trường..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl"
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredTypes.length === 0 ? (
          <EmptyState
            icon={School}
            title="Chưa có loại trường nào"
            description="Bắt đầu bằng cách tạo loại trường đầu tiên"
            actionLabel="Thêm loại trường"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Loại trường</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Cấp học</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Mô tả</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Thứ tự</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTypes.map(type => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{type.type_name}</p>
                          <p className="text-xs text-gray-500">{type.type_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {type.level === 'middle_school' ? 'THCS' :
                         type.level === 'high_school' ? 'THPT' :
                         type.level === 'higher_education' ? 'Đại học/Cao đẳng' :
                         type.level === 'continuing_education' ? 'GDTX' : type.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{type.description || '-'}</td>
                    <td className="px-6 py-4 text-sm">{type.order}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        type.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {type.is_active ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(type)}
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

        {/* Create Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Thêm loại trường</h2>
                  <button onClick={() => setIsCreateModalOpen(false)}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã loại trường <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.type_code || ''}
                      onChange={(e) => setFormData({...formData, type_code: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                      placeholder="VD: high_school"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên loại trường <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.type_name || ''}
                      onChange={(e) => setFormData({...formData, type_name: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                      placeholder="VD: THPT"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cấp học</label>
                    <select
                      value={formData.level || 'high_school'}
                      onChange={(e) => setFormData({...formData, level: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                    >
                      <option value="middle_school">THCS</option>
                      <option value="high_school">THPT</option>
                      <option value="higher_education">Đại học/Cao đẳng</option>
                      <option value="continuing_education">GDTX</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
                      <input
                        type="number"
                        value={formData.order || 1}
                        onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-3 border rounded-xl"
                      />
                    </div>

                    <div className="flex items-center pt-7">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active !== false}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                        Hoạt động
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreate}
                    disabled={createTypeMutation.isPending}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
                    Tạo
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 border py-3 rounded-xl hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {isEditModalOpen && selectedType && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa loại trường</h2>
                  <button onClick={() => setIsEditModalOpen(false)}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã loại trường <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.type_code || ''}
                      onChange={(e) => setFormData({...formData, type_code: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl bg-gray-50"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên loại trường <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.type_name || ''}
                      onChange={(e) => setFormData({...formData, type_name: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cấp học</label>
                    <select
                      value={formData.level || 'high_school'}
                      onChange={(e) => setFormData({...formData, level: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                    >
                      <option value="middle_school">THCS</option>
                      <option value="high_school">THPT</option>
                      <option value="higher_education">Đại học/Cao đẳng</option>
                      <option value="continuing_education">GDTX</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
                      <input
                        type="number"
                        value={formData.order || 1}
                        onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-3 border rounded-xl"
                      />
                    </div>

                    <div className="flex items-center pt-7">
                      <input
                        type="checkbox"
                        id="edit_is_active"
                        checked={formData.is_active !== false}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <label htmlFor="edit_is_active" className="ml-2 text-sm font-medium text-gray-700">
                        Hoạt động
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    disabled={updateTypeMutation.isPending}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    Lưu
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 border py-3 rounded-xl hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog({ isOpen: false })}
          type={confirmDialog.type}
        />
      </div>
    </AdminLayout>
  );
}

export default function AdminSchoolTypes() {
  return (
    <ToastProvider>
      <AdminSchoolTypesContent />
    </ToastProvider>
  );
}