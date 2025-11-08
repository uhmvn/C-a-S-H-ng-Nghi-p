import React from 'react';
import { FileQuestion, Plus, Search, Users, Calendar } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = FileQuestion,
  title = "Không có dữ liệu",
  description = "Chưa có dữ liệu nào được tạo",
  actionLabel,
  onAction,
  type = "default"
}) => {
  const configs = {
    users: {
      icon: Users,
      title: "Chưa có người dùng",
      description: "Bắt đầu bằng cách tạo người dùng hoặc cấp mã đăng nhập"
    },
    classes: {
      icon: Users,
      title: "Chưa có lớp học",
      description: "Tạo lớp học đầu tiên để bắt đầu quản lý học sinh"
    },
    appointments: {
      icon: Calendar,
      title: "Chưa có lịch hẹn",
      description: "Học sinh sẽ đặt lịch tư vấn qua website"
    },
    search: {
      icon: Search,
      title: "Không tìm thấy kết quả",
      description: "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm"
    }
  };

  const config = configs[type] || {};
  const FinalIcon = Icon || config.icon || FileQuestion;
  const finalTitle = title || config.title || "Không có dữ liệu";
  const finalDescription = description || config.description;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FinalIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{finalTitle}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{finalDescription}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;