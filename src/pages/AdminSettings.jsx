import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Save, RefreshCw, Bell, Mail, Database, 
  Shield, Eye, EyeOff, Plus, Edit2, Trash2, AlertCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

const settingCategories = [
  { key: 'general', name: 'Cài đặt chung', icon: Settings },
  { key: 'notifications', name: 'Thông báo', icon: Bell },
  { key: 'email', name: 'Email', icon: Mail },
  { key: 'database', name: 'Cơ sở dữ liệu', icon: Database },
  { key: 'security', name: 'Bảo mật', icon: Shield }
];

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('general');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [newSetting, setNewSetting] = useState({
    setting_key: '',
    setting_value: '',
    setting_type: 'string',
    category: 'general',
    description: '',
    is_public: false
  });

  // Fetch all settings
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: () => base44.entities.SystemSettings.list(),
    initialData: []
  });

  // Filter by category
  const filteredSettings = useMemo(() => {
    return settings.filter(s => s.category === activeCategory);
  }, [settings, activeCategory]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.entities.SystemSettings.create(data);
      
      // Audit log
      await base44.entities.AuditLog.create({
        user_id: (await base44.auth.me()).id,
        user_email: (await base44.auth.me()).email,
        user_role: (await base44.auth.me()).role,
        action: 'create',
        resource_type: 'system_settings',
        resource_id: result.id,
        new_value: data,
        status: 'success'
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setIsAddingNew(false);
      setNewSetting({
        setting_key: '',
        setting_value: '',
        setting_type: 'string',
        category: 'general',
        description: '',
        is_public: false
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, oldValue }) => {
      const result = await base44.entities.SystemSettings.update(id, data);
      
      // Audit log
      await base44.entities.AuditLog.create({
        user_id: (await base44.auth.me()).id,
        user_email: (await base44.auth.me()).email,
        user_role: (await base44.auth.me()).role,
        action: 'update',
        resource_type: 'system_settings',
        resource_id: id,
        old_value: oldValue,
        new_value: data,
        status: 'success'
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setEditingSetting(null);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, setting }) => {
      await base44.entities.SystemSettings.delete(id);
      
      // Audit log
      await base44.entities.AuditLog.create({
        user_id: (await base44.auth.me()).id,
        user_email: (await base44.auth.me()).email,
        user_role: (await base44.auth.me()).role,
        action: 'delete',
        resource_type: 'system_settings',
        resource_id: id,
        old_value: setting,
        status: 'success'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    }
  });

  const handleCreate = () => {
    if (!newSetting.setting_key || !newSetting.setting_value) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    createMutation.mutate({
      ...newSetting,
      category: activeCategory
    });
  };

  const handleUpdate = (setting) => {
    if (!editingSetting.setting_value) {
      alert('Giá trị không được để trống');
      return;
    }
    updateMutation.mutate({
      id: setting.id,
      data: editingSetting,
      oldValue: setting
    });
  };

  const handleDelete = (setting) => {
    if (window.confirm(`Xóa cài đặt "${setting.setting_key}"?`)) {
      deleteMutation.mutate({ id: setting.id, setting });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li className="text-gray-500">Admin</li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Cài đặt hệ thống</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cài Đặt Hệ Thống</h1>
          <p className="text-gray-600">
            Quản lý cấu hình và tham số của hệ thống
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-xl mb-8">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-blue-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Cài Đặt Hệ Thống
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Cài đặt chung</strong>: Tên hệ thống, logo, theme, ngôn ngữ</p>
                <p>• <strong>Thông báo</strong>: Cấu hình thông báo email, SMS, push notification</p>
                <p>• <strong>Email</strong>: SMTP server, email template</p>
                <p>• <strong>Bảo mật</strong>: Password policy, session timeout, 2FA</p>
                <p>• <strong>Database</strong>: Backup schedule, data retention</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-4">Danh mục</h3>
              <div className="space-y-2">
                {settingCategories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      activeCategory === cat.key
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <cat.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {settingCategories.find(c => c.key === activeCategory)?.name}
                </h2>
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm cài đặt
                </button>
              </div>

              {/* Add New Form */}
              {isAddingNew && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-xl p-6 mb-6"
                >
                  <h3 className="font-bold text-gray-900 mb-4">Thêm cài đặt mới</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Khóa cài đặt *
                      </label>
                      <input
                        type="text"
                        value={newSetting.setting_key}
                        onChange={(e) => setNewSetting({...newSetting, setting_key: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                        placeholder="vd: site_name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kiểu dữ liệu
                      </label>
                      <select
                        value={newSetting.setting_type}
                        onChange={(e) => setNewSetting({...newSetting, setting_type: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá trị *
                    </label>
                    <input
                      type="text"
                      value={newSetting.setting_value}
                      onChange={(e) => setNewSetting({...newSetting, setting_value: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                      placeholder="Nhập giá trị"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={newSetting.description}
                      onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                      rows={2}
                      placeholder="Mô tả cài đặt này"
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={newSetting.is_public}
                      onChange={(e) => setNewSetting({...newSetting, is_public: e.target.checked})}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="is_public" className="text-sm text-gray-700">
                      Hiển thị công khai
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCreate}
                      disabled={createMutation.isLoading}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {createMutation.isLoading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Settings List */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Đang tải...</p>
                </div>
              ) : filteredSettings.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có cài đặt nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSettings.map((setting) => (
                    <div key={setting.id} className="border border-gray-200 rounded-xl p-4">
                      {editingSetting?.id === setting.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Khóa
                              </label>
                              <input
                                type="text"
                                value={editingSetting.setting_key}
                                onChange={(e) => setEditingSetting({...editingSetting, setting_key: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Giá trị
                              </label>
                              <input
                                type="text"
                                value={editingSetting.setting_value}
                                onChange={(e) => setEditingSetting({...editingSetting, setting_value: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mô tả
                            </label>
                            <textarea
                              value={editingSetting.description || ''}
                              onChange={(e) => setEditingSetting({...editingSetting, description: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleUpdate(setting)}
                              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                            >
                              <Save className="w-4 h-4 inline mr-2" />
                              Lưu
                            </button>
                            <button
                              onClick={() => setEditingSetting(null)}
                              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-gray-900">{setting.setting_key}</h4>
                              {setting.is_public ? (
                                <Eye className="w-4 h-4 text-green-500" title="Công khai" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" title="Riêng tư" />
                              )}
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                {setting.setting_type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Giá trị:</strong> {setting.setting_value}
                            </p>
                            {setting.description && (
                              <p className="text-sm text-gray-500">{setting.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setEditingSetting(setting)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(setting)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
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