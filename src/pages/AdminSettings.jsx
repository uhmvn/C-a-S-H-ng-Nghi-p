import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Save, MapPin, Phone, Mail, Globe, 
  Facebook, Plus, Edit2, Trash2, AlertCircle, Loader2, Building2, Clock
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";

const settingCategories = [
  { key: 'company', name: 'Thông tin đơn vị', icon: Building2 },
  { key: 'contact', name: 'Thông tin liên hệ', icon: Phone },
  { key: 'social', name: 'Mạng xã hội', icon: Facebook },
  { key: 'hours', name: 'Giờ làm việc', icon: Clock },
  { key: 'general', name: 'Cài đặt khác', icon: Settings }
];

// Default settings template
const defaultSettings = [
  // Company Info
  { setting_key: 'company_name', setting_value: 'Cửa Sổ Nghề Nghiệp', setting_type: 'string', category: 'company', description: 'Tên công ty/đơn vị', is_public: true },
  { setting_key: 'company_full_name', setting_value: 'Trường THCS Nguyễn Du', setting_type: 'string', category: 'company', description: 'Tên đầy đủ', is_public: true },
  { setting_key: 'company_tagline', setting_value: 'Career Guidance', setting_type: 'string', category: 'company', description: 'Slogan', is_public: true },
  { setting_key: 'company_description', setting_value: 'Nền tảng hướng nghiệp thông minh dành cho học sinh THCS & THPT', setting_type: 'string', category: 'company', description: 'Mô tả ngắn', is_public: true },
  
  // Contact
  { setting_key: 'contact_address', setting_value: '523, Phạm Hùng, Phường Bà Rịa, TP Bà Rịa, Bà Rịa - Vũng Tàu', setting_type: 'string', category: 'contact', description: 'Địa chỉ', is_public: true },
  { setting_key: 'contact_phone', setting_value: '(0254) 3 826 178', setting_type: 'string', category: 'contact', description: 'Số điện thoại', is_public: true },
  { setting_key: 'contact_email', setting_value: 'c2nguyendu.baria.bariavungtau@moet.edu.vn', setting_type: 'string', category: 'contact', description: 'Email liên hệ', is_public: true },
  { setting_key: 'contact_map_url', setting_value: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.8155076862684!2d107.16877631533658!3d10.507668992580858!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175772c1e6e1e0d%3A0x7c9c4e3e4e3e4e3e!2zNTIzIMSQLiBQaOG6oW0gSMO5bmcsIFBoxrDhu51uZyBCw6AgUuG7i2EsIFRow6BuaCBwaOG7kSBC4buRIFLhu4thLCBC4bq5IFLhu4thIC0gVsWpbmcgVMOgdSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1629788888888!5m2!1svi!2s', setting_type: 'string', category: 'contact', description: 'Google Maps embed URL', is_public: true },
  
  // Social Media
  { setting_key: 'social_facebook', setting_value: 'https://facebook.com', setting_type: 'string', category: 'social', description: 'Facebook URL', is_public: true },
  { setting_key: 'social_linkedin', setting_value: 'https://linkedin.com', setting_type: 'string', category: 'social', description: 'LinkedIn URL', is_public: true },
  
  // Working Hours
  { setting_key: 'hours_weekday', setting_value: 'Thứ 2 - Thứ 6: 7:00 AM - 5:00 PM', setting_type: 'string', category: 'hours', description: 'Giờ làm việc trong tuần', is_public: true },
  { setting_key: 'hours_saturday', setting_value: 'Thứ 7: 7:00 AM - 12:00 PM', setting_type: 'string', category: 'hours', description: 'Giờ làm việc thứ 7', is_public: true },
  { setting_key: 'hours_sunday', setting_value: 'Chủ nhật: Nghỉ', setting_type: 'string', category: 'hours', description: 'Giờ làm việc chủ nhật', is_public: true }
];

function AdminSettingsContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('company');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [newSetting, setNewSetting] = useState({
    setting_key: '',
    setting_value: '',
    setting_type: 'string',
    category: 'company',
    description: '',
    is_public: true
  });

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const data = await base44.entities.SystemSettings.list();
      return Array.isArray(data) ? data : [];
    },
    initialData: []
  });

  const filteredSettings = useMemo(() => {
    return settings.filter(s => s.category === activeCategory);
  }, [settings, activeCategory]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return await base44.entities.SystemSettings.create({
        ...data,
        updated_by: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success('✅ Đã thêm cài đặt!');
      setIsAddingNew(false);
      setNewSetting({
        setting_key: '',
        setting_value: '',
        setting_type: 'string',
        category: activeCategory,
        description: '',
        is_public: true
      });
    },
    onError: (error) => {
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const user = await base44.auth.me();
      return await base44.entities.SystemSettings.update(id, {
        ...data,
        updated_by: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success('✅ Đã cập nhật!');
      setEditingSetting(null);
    },
    onError: (error) => {
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.SystemSettings.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success('✅ Đã xóa!');
    },
    onError: (error) => {
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  });

  const initializeDefaultSettings = async () => {
    try {
      const user = await base44.auth.me();
      for (const setting of defaultSettings) {
        const existing = settings.find(s => s.setting_key === setting.setting_key);
        if (!existing) {
          await base44.entities.SystemSettings.create({
            ...setting,
            updated_by: user.id
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success('✅ Đã khởi tạo cài đặt mặc định!');
    } catch (error) {
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  };

  const handleCreate = () => {
    if (!newSetting.setting_key || !newSetting.setting_value) {
      toast.error('❌ Vui lòng điền đầy đủ thông tin');
      return;
    }
    createMutation.mutate({
      ...newSetting,
      category: activeCategory
    });
  };

  const handleUpdate = (setting) => {
    if (!editingSetting.setting_value) {
      toast.error('❌ Giá trị không được để trống');
      return;
    }
    updateMutation.mutate({
      id: setting.id,
      data: editingSetting
    });
  };

  const handleDelete = (setting) => {
    if (window.confirm(`Xóa cài đặt "${setting.setting_key}"?`)) {
      deleteMutation.mutate(setting.id);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Cài Đặt Hệ Thống</h1>
          <p className="text-gray-600">Quản lý metadata và cấu hình website</p>
        </div>

        {settings.length === 0 && !isLoading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 mb-2">Chưa có cài đặt nào</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  Hệ thống chưa được cấu hình. Nhấn nút bên dưới để khởi tạo các cài đặt mặc định.
                </p>
                <button
                  onClick={initializeDefaultSettings}
                  className="bg-yellow-600 text-white px-6 py-2.5 rounded-xl hover:bg-yellow-700 transition-colors"
                >
                  Khởi tạo cài đặt mặc định
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border p-4 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4">Danh mục</h3>
              <div className="space-y-2">
                {settingCategories.map((cat) => {
                  const Icon = cat.icon;
                  const count = settings.filter(s => s.category === cat.key).length;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeCategory === cat.key
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {settingCategories.find(c => c.key === activeCategory)?.name}
                </h2>
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Thêm
                </button>
              </div>

              {isAddingNew && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-indigo-50 rounded-xl p-6 mb-6 border border-indigo-200"
                >
                  <h3 className="font-bold text-gray-900 mb-4">Thêm cài đặt mới</h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Khóa (key) *</label>
                        <input
                          type="text"
                          value={newSetting.setting_key}
                          onChange={(e) => setNewSetting({...newSetting, setting_key: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="vd: site_name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Kiểu dữ liệu</label>
                        <select
                          value={newSetting.setting_type}
                          onChange={(e) => setNewSetting({...newSetting, setting_type: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="json">JSON</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Giá trị *</label>
                      <input
                        type="text"
                        value={newSetting.setting_value}
                        onChange={(e) => setNewSetting({...newSetting, setting_value: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="Nhập giá trị"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Mô tả</label>
                      <textarea
                        value={newSetting.description}
                        onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={newSetting.is_public}
                        onChange={(e) => setNewSetting({...newSetting, is_public: e.target.checked})}
                        className="w-4 h-4 rounded"
                      />
                      <label htmlFor="is_public" className="text-sm">Công khai (hiển thị cho client)</label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleCreate}
                        disabled={createMutation.isPending}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {createMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      <button
                        onClick={() => setIsAddingNew(false)}
                        className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                </div>
              ) : filteredSettings.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có cài đặt nào trong danh mục này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSettings.map((setting) => (
                    <div key={setting.id} className="border rounded-xl p-4 hover:border-indigo-200 transition-colors">
                      {editingSetting?.id === setting.id ? (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Khóa</label>
                              <input
                                type="text"
                                value={editingSetting.setting_key}
                                onChange={(e) => setEditingSetting({...editingSetting, setting_key: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Kiểu</label>
                              <select
                                value={editingSetting.setting_type}
                                onChange={(e) => setEditingSetting({...editingSetting, setting_type: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg"
                              >
                                <option value="string">String</option>
                                <option value="number">Number</option>
                                <option value="boolean">Boolean</option>
                                <option value="json">JSON</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Giá trị</label>
                            <input
                              type="text"
                              value={editingSetting.setting_value}
                              onChange={(e) => setEditingSetting({...editingSetting, setting_value: e.target.value})}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Mô tả</label>
                            <textarea
                              value={editingSetting.description || ''}
                              onChange={(e) => setEditingSetting({...editingSetting, description: e.target.value})}
                              className="w-full px-4 py-2 border rounded-lg"
                              rows={2}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`public-${setting.id}`}
                              checked={editingSetting.is_public}
                              onChange={(e) => setEditingSetting({...editingSetting, is_public: e.target.checked})}
                              className="w-4 h-4 rounded"
                            />
                            <label htmlFor={`public-${setting.id}`} className="text-sm">Công khai</label>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleUpdate(setting)}
                              disabled={updateMutation.isPending}
                              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {updateMutation.isPending ? (
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
                            <button
                              onClick={() => setEditingSetting(null)}
                              className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-gray-900">{setting.setting_key}</h4>
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                {setting.setting_type}
                              </span>
                              {setting.is_public && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  Công khai
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1 break-all">
                              <strong>Giá trị:</strong> {setting.setting_value}
                            </p>
                            {setting.description && (
                              <p className="text-sm text-gray-500">{setting.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setEditingSetting(setting)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(setting)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminSettings() {
  return (
    <ToastProvider>
      <AdminSettingsContent />
    </ToastProvider>
  );
}