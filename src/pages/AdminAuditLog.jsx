import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Search, Filter, Eye, AlertCircle, CheckCircle, XCircle, User, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

const actionColors = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  view: "bg-gray-100 text-gray-800",
  approve: "bg-purple-100 text-purple-800",
  reject: "bg-orange-100 text-orange-800",
  login: "bg-indigo-100 text-indigo-800",
  logout: "bg-gray-100 text-gray-800"
};

const statusIcons = {
  success: <CheckCircle className="w-4 h-4 text-green-600" />,
  failed: <XCircle className="w-4 h-4 text-red-600" />,
  pending: <AlertCircle className="w-4 h-4 text-yellow-600" />
};

export default function AdminAuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 100),
    initialData: [],
  });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !searchTerm ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesStatus = statusFilter === "all" || log.status === statusFilter;
      
      return matchesSearch && matchesAction && matchesStatus;
    });
  }, [logs, searchTerm, actionFilter, statusFilter]);

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    today: logs.filter(l => {
      const today = new Date().toDateString();
      const logDate = new Date(l.created_date).toDateString();
      return today === logDate;
    }).length
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li className="text-gray-500">Admin</li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Nhật ký hệ thống</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Nhật Ký Hệ Thống</h1>
          
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: "Tổng số", value: stats.total, color: "bg-indigo-500" },
              { label: "Thành công", value: stats.success, color: "bg-green-500" },
              { label: "Thất bại", value: stats.failed, color: "bg-red-500" },
              { label: "Hôm nay", value: stats.today, color: "bg-blue-500" }
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
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
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
            >
              <option value="all">Tất cả hành động</option>
              <option value="create">Tạo mới</option>
              <option value="update">Cập nhật</option>
              <option value="delete">Xóa</option>
              <option value="view">Xem</option>
              <option value="approve">Phê duyệt</option>
              <option value="login">Đăng nhập</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="pending">Đang xử lý</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Người dùng</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hành động</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tài nguyên</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Thời gian</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{log.user_email}</p>
                            <p className="text-xs text-gray-500">{log.user_role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${actionColors[log.action]}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{log.resource_type}</p>
                        {log.resource_id && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">{log.resource_id}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {new Date(log.created_date).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {statusIcons[log.status]}
                          <span className="text-sm">{log.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Chi Tiết Nhật Ký</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Người dùng</p>
                    <p className="font-medium">{selectedLog.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vai trò</p>
                    <p className="font-medium">{selectedLog.user_role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hành động</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${actionColors[selectedLog.action]}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Trạng thái</p>
                    <div className="flex items-center gap-2">
                      {statusIcons[selectedLog.status]}
                      <span>{selectedLog.status}</span>
                    </div>
                  </div>
                </div>

                {selectedLog.old_value && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Giá trị cũ</p>
                    <pre className="bg-gray-50 p-4 rounded-xl text-xs overflow-auto">
                      {JSON.stringify(selectedLog.old_value, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_value && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Giá trị mới</p>
                    <pre className="bg-gray-50 p-4 rounded-xl text-xs overflow-auto">
                      {JSON.stringify(selectedLog.new_value, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Lỗi</p>
                    <p className="text-red-600 bg-red-50 p-4 rounded-xl">{selectedLog.error_message}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="mt-6 w-full px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}