import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Bell, CheckCircle, AlertTriangle, Info, XCircle, 
  Send, Trash2, Eye, Filter, Search, Plus, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

const notificationTypes = {
  info: { icon: Info, color: "bg-blue-100 text-blue-800" },
  success: { icon: CheckCircle, color: "bg-green-100 text-green-800" },
  warning: { icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800" },
  error: { icon: XCircle, color: "bg-red-100 text-red-800" }
};

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target_users: 'all',
    action_url: ''
  });

  // Fetch notifications from SystemSettings
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const settings = await base44.entities.SystemSettings.filter({ 
        category: 'notifications' 
      }, '-created_date');
      return settings.map(s => ({
        id: s.id,
        ...JSON.parse(s.setting_value)
      }));
    },
    initialData: [],
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (data) => {
      const notificationData = {
        ...data,
        created_at: new Date().toISOString(),
        status: 'active'
      };
      
      return await base44.entities.SystemSettings.create({
        setting_key: `notification_${Date.now()}`,
        setting_value: JSON.stringify(notificationData),
        setting_type: 'json',
        category: 'notifications',
        description: data.title
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        target_users: 'all',
        action_url: ''
      });
      alert('Tạo thông báo thành công!');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.SystemSettings.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      alert('Xóa thông báo thành công!');
    },
  });

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const matchesSearch = !searchTerm ||
        notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === "all" || notif.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [notifications, searchTerm, typeFilter]);

  const handleCreate = async () => {
    if (!formData.title || !formData.message) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    await createNotificationMutation.mutateAsync(formData);
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa thông báo này?')) return;
    await deleteNotificationMutation.mutateAsync(id);
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li className="text-gray-500">Admin</li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Thông báo</li>
          </ol>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Thông Báo</h1>
            <p className="text-gray-600">{filteredNotifications.length} thông báo</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tạo thông báo
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
            >
              <option value="all">Tất cả loại</option>
              <option value="info">Thông tin</option>
              <option value="success">Thành công</option>
              <option value="warning">Cảnh báo</option>
              <option value="error">Lỗi</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotifications.map((notification) => {
              const TypeIcon = notificationTypes[notification.type]?.icon || Info;
              
              return (
                <div key={notification.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${notificationTypes[notification.type]?.color}`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg mb-2">{notification.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{notification.message}</p>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Bell className="w-4 h-4" />
                      <span>{notification.target_users === 'all' ? 'Tất cả' : notification.target_users}</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
                className="bg-white rounded-2xl p-8 max-w-2xl w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Tạo thông báo mới</h2>
                  <button onClick={() => setIsCreateModalOpen(false)}>
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      placeholder="Thông báo quan trọng"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung *</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      placeholder="Nội dung thông báo..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loại</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      >
                        <option value="info">Thông tin</option>
                        <option value="success">Thành công</option>
                        <option value="warning">Cảnh báo</option>
                        <option value="error">Lỗi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Đối tượng</label>
                      <select
                        value={formData.target_users}
                        onChange={(e) => setFormData({...formData, target_users: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      >
                        <option value="all">Tất cả</option>
                        <option value="students">Học sinh</option>
                        <option value="teachers">Giáo viên</option>
                        <option value="parents">Phụ huynh</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreate}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                      Gửi thông báo
                    </button>
                    <button
                      onClick={() => setIsCreateModalOpen(false)}
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