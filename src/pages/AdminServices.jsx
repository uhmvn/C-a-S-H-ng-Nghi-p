import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, Search, Plus, Edit, Trash2, X, Save, DollarSign, 
  Clock, Eye, EyeOff, Star, Image as ImageIcon, ArrowUp, ArrowDown
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createPageUrl } from "@/utils";

const serviceCategories = {
  assessment: "Trắc nghiệm",
  career_counseling: "Tư vấn nghề nghiệp",
  school_selection: "Chọn trường - Chọn ngành",
  ai_analysis: "Phân tích AI",
  career_profile: "Hồ sơ năng lực"
};

function AdminServicesContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [formData, setFormData] = useState({
    name: '',
    category: 'assessment',
    description: '',
    price: 0,
    duration: '',
    image_url: '',
    alt_text: '',
    test_code: '',
    redirect_url: '',
    action_type: 'booking',
    featured: false,
    is_active: true,
    order: 1,
    benefits: []
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list('order'),
    initialData: [],
  });

  // ✅ FIXED: Fetch available PUBLISHED tests without duplicates
  const { data: availableTests = [], isLoading: loadingTests } = useQuery({
    queryKey: ['availableTests'],
    queryFn: async () => {
      const tests = await base44.entities.Test.filter({ is_published: true }, '-created_date');
      
      // Remove duplicates by test_code (keep latest)
      const uniqueTests = [];
      const seenCodes = new Set();
      
      for (const test of tests) {
        if (!seenCodes.has(test.test_code)) {
          seenCodes.add(test.test_code);
          uniqueTests.push(test);
        }
      }
      
      return uniqueTests;
    },
    initialData: []
  });

  const createServiceMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        category: 'assessment',
        description: '',
        price: 0,
        duration: '',
        image_url: '',
        alt_text: '',
        test_code: '',
        redirect_url: '',
        action_type: 'booking',
        featured: false,
        is_active: true,
        order: 1,
        benefits: []
      });
      toast.success('Tạo dịch vụ thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsEditModalOpen(false);
      setSelectedService(null);
      toast.success('Cập nhật thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Xóa dịch vụ thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const toggleActiveStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Service.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Cập nhật trạng thái thành công!');
    }
  });

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = !searchTerm ||
        service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === "all" || service.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, filterCategory]);

  const stats = useMemo(() => {
    return {
      total: services.length,
      active: services.filter(s => s.is_active).length,
      inactive: services.filter(s => !s.is_active).length,
      featured: services.filter(s => s.featured).length
    };
  }, [services]);

  const handleEdit = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name || '',
      category: service.category || 'assessment',
      description: service.description || '',
      price: service.price || 0,
      duration: service.duration || '',
      image_url: service.image_url || '',
      alt_text: service.alt_text || '',
      test_code: service.test_code || '',
      redirect_url: service.redirect_url || '',
      action_type: service.action_type || 'booking',
      featured: service.featured || false,
      is_active: service.is_active !== false,
      order: service.order || 1,
      benefits: service.benefits || []
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (service) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa dịch vụ',
      message: `Bạn có chắc muốn xóa dịch vụ "${service.name}"? Hành động này không thể hoàn tác.`,
      onConfirm: () => {
        deleteServiceMutation.mutate(service.id);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.category || !formData.price || !formData.description) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    if (formData.action_type === 'test' && !formData.test_code) {
      toast.warning('Vui lòng chọn bài test!');
      return;
    }
    if (formData.action_type === 'redirect' && !formData.redirect_url) {
      toast.warning('Vui lòng nhập URL chuyển hướng!');
      return;
    }
    await createServiceMutation.mutateAsync(formData);
  };

  const handleSaveEdit = async () => {
    if (!formData.name || !formData.price || !formData.description) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    if (formData.action_type === 'test' && !formData.test_code) {
      toast.warning('Vui lòng chọn bài test!');
      return;
    }
    if (formData.action_type === 'redirect' && !formData.redirect_url) {
      toast.warning('Vui lòng nhập URL chuyển hướng!');
      return;
    }
    await updateServiceMutation.mutateAsync({
      id: selectedService.id,
      data: formData
    });
  };

  const handleToggleActive = (service) => {
    toggleActiveStatusMutation.mutate({
      id: service.id,
      is_active: !service.is_active
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Dịch Vụ</h1>
              <p className="text-gray-600">{filteredServices.length} dịch vụ</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Thêm dịch vụ
            </button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Tổng số dịch vụ</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-600">Đang hoạt động</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              <p className="text-xs text-gray-600">Không hoạt động</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-yellow-600">{stats.featured}</p>
              <p className="text-xs text-gray-600">Nổi bật</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
            >
              <option value="all">Tất cả danh mục</option>
              {Object.entries(serviceCategories).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <EmptyState
            icon={Database}
            title="Chưa có dịch vụ nào"
            description="Bắt đầu bằng cách tạo dịch vụ đầu tiên"
            actionLabel="Thêm dịch vụ"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div 
                key={service.id} 
                onClick={() => handleEdit(service)}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              >
                {service.image_url ? (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={service.image_url} 
                      alt={service.alt_text || service.name}
                      className="w-full h-full object-cover"
                    />
                    {service.featured && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        NỔI BẬT
                      </div>
                    )}
                    {!service.is_active && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold">KHÔNG HOẠT ĐỘNG</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {serviceCategories[service.category]}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(service);
                      }}
                      className={`p-1 rounded-lg ${
                        service.is_active 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={service.is_active ? 'Ẩn dịch vụ' : 'Hiển thị dịch vụ'}
                    >
                      {service.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{service.name}</h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-indigo-600">{service.price?.toLocaleString()} VNĐ</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration}</span>
                    </div>
                    {service.featured && (
                      <div className="flex items-center gap-2 text-sm text-yellow-600">
                        <Star className="w-4 h-4 fill-current" />
                        <span>Dịch vụ nổi bật</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(service);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(service);
                      }}
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

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {(isCreateModalOpen || isEditModalOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isCreateModalOpen ? 'Thêm dịch vụ mới' : 'Chỉnh sửa dịch vụ'}
                  </h2>
                  <button onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại hành động <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.action_type || 'booking'}
                      onChange={(e) => setFormData({...formData, action_type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                    >
                      <option value="test">Làm bài test</option>
                      <option value="booking">Đặt lịch tư vấn</option>
                      <option value="redirect">Chuyển hướng tùy chỉnh</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Hành động khi user click CTA
                    </p>
                  </div>

                  {/* ✅ FIXED: Test Code field */}
                  {formData.action_type === 'test' && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn bài test <span className="text-red-500">*</span>
                      </label>
                      
                      {loadingTests ? (
                        <div className="flex items-center gap-2 bg-white rounded-lg p-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                          <span className="text-sm text-gray-600">Đang tải danh sách test...</span>
                        </div>
                      ) : availableTests.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-2">
                          <p className="text-sm text-yellow-800 font-medium">⚠️ Chưa có bài test nào được publish</p>
                          <p className="text-xs text-yellow-700 mt-2">
                            Vào <strong>Quản lý Test</strong> → Tạo test → Thêm câu hỏi → Bấm nút <strong>Publish</strong>
                          </p>
                          <button
                            type="button"
                            onClick={() => window.location.href = createPageUrl('AdminTestManagement')}
                            className="mt-3 text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                          >
                            Đi đến Quản lý Test
                          </button>
                        </div>
                      ) : (
                        <>
                          <select
                            value={formData.test_code || ''}
                            onChange={(e) => {
                              const selectedTest = availableTests.find(t => t.test_code === e.target.value);
                              setFormData(prev => ({
                                ...prev, 
                                test_code: e.target.value,
                                duration: prev.duration || (selectedTest?.duration_minutes ? selectedTest.duration_minutes + ' phút' : ''),
                                description: prev.description || selectedTest?.description || ''
                              }));
                            }}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                          >
                            <option value="">-- Chọn bài test --</option>
                            {availableTests.map(test => (
                              <option key={test.id} value={test.test_code}>
                                {test.name} ({test.test_code}) - {test.question_count || 0} câu
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-blue-700 mt-2">
                            ℹ️ User sẽ được đưa đến làm bài test này khi click CTA
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* ✅ Redirect URL field */}
                  {formData.action_type === 'redirect' && (
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL chuyển hướng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.redirect_url || ''}
                        onChange={(e) => setFormData({...formData, redirect_url: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                        placeholder="SubjectCombinations, Schools, hoặc URL tùy chỉnh"
                      />
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-purple-700">
                          ℹ️ <strong>Ví dụ:</strong>
                        </p>
                        <ul className="text-xs text-purple-600 list-disc list-inside space-y-1">
                          <li><code>SubjectCombinations</code> - Trang tổ hợp môn</li>
                          <li><code>Schools</code> - Trang danh sách trường</li>
                          <li><code>https://external-site.com</code> - Link ngoài</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* ✅ Booking info */}
                  {formData.action_type === 'booking' && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-xl">
                      <p className="text-sm text-green-800">
                        ℹ️ User sẽ thấy popup đặt lịch tư vấn khi click CTA
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên dịch vụ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      placeholder="VD: Trắc nghiệm Holland"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Danh mục <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category || 'assessment'}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      >
                        {Object.entries(serviceCategories).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                        placeholder="199000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời lượng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.duration || ''}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      placeholder="VD: 60 phút, 1 tháng, Tức thì"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      placeholder="Mô tả chi tiết về dịch vụ..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL ảnh</label>
                    <input
                      type="text"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alt text (SEO)</label>
                    <input
                      type="text"
                      value={formData.alt_text || ''}
                      onChange={(e) => setFormData({...formData, alt_text: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      placeholder="Mô tả ảnh cho SEO"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
                      <input
                        type="number"
                        value={formData.order || 1}
                        onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-7">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured || false}
                        onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                        Nổi bật
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-7">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active !== false}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                        Hoạt động
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={isCreateModalOpen ? handleCreate : handleSaveEdit}
                      disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isCreateModalOpen ? <Plus className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                      {isCreateModalOpen ? 'Tạo dịch vụ' : 'Lưu thay đổi'}
                    </button>
                    <button
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setIsEditModalOpen(false);
                        setFormData({
                          name: '',
                          category: 'assessment',
                          description: '',
                          price: 0,
                          duration: '',
                          image_url: '',
                          alt_text: '',
                          test_code: '',
                          redirect_url: '',
                          action_type: 'booking',
                          featured: false,
                          is_active: true,
                          order: 1,
                          benefits: []
                        });
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

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog({ isOpen: false })}
          type="danger"
        />
      </div>
    </AdminLayout>
  );
}

export default function AdminServices() {
  return (
    <ToastProvider>
      <AdminServicesContent />
    </ToastProvider>
  );
}