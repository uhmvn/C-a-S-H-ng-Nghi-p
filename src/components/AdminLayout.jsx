import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Users, BookOpen, School, Settings, FileText, Menu, X,
  ChevronDown, ChevronRight, ClipboardList, BarChart3, TestTube, Calendar,
  ShieldCheck, Bell, Activity, Code, GraduationCap, UserCheck, FolderOpen,
  UsersRound, Home, UserCog
} from "lucide-react";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState(['overview', 'management', 'academic']);

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const menuSections = [
    {
      key: 'overview',
      title: 'Tổng quan',
      icon: LayoutDashboard,
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin-dashboard' },
        { icon: BarChart3, label: 'Báo cáo', path: '/admin-reports' },
        { icon: Bell, label: 'Thông báo', path: '/admin-notifications' },
      ]
    },
    {
      key: 'management',
      title: 'Quản lý',
      icon: Users,
      items: [
        { icon: Users, label: 'Người dùng', path: '/admin-users' },
        { icon: GraduationCap, label: 'Học sinh', path: '/student-management' },
        { icon: UserCog, label: 'Thông tin HS', path: '/admin-student-info', badge: 'Mới' },
        { icon: UsersRound, label: 'Giáo viên', path: '/teacher-management' },
        { icon: Code, label: 'Mã truy cập', path: '/admin-code-management' },
        { icon: ClipboardList, label: 'Kho mã', path: '/admin-code-inventory' },
      ]
    },
    {
      key: 'academic',
      title: 'Học vụ',
      icon: BookOpen,
      items: [
        { icon: BookOpen, label: 'Học bạ', path: '/academic-records' },
        { icon: FolderOpen, label: 'Cấu trúc học thuật', path: '/admin-academic-structure' },
        { icon: UserCheck, label: 'Phân công giảng dạy', path: '/admin-teaching-assignments' },
        { icon: Activity, label: 'Tiến độ học sinh', path: '/student-progress' },
        { icon: BarChart3, label: 'Phân tích lớp', path: '/class-analytics' },
      ]
    },
    {
      key: 'tests',
      title: 'Tests & Tư vấn',
      icon: TestTube,
      items: [
        { icon: TestTube, label: 'Quản lý Tests', path: '/admin-test-management' },
        { icon: FileText, label: 'Kết quả Tests', path: '/admin-test-results' },
        { icon: Calendar, label: 'Lịch hẹn', path: '/admin-appointments' },
        { icon: Bell, label: 'Đặt lịch mới', path: '/booking-notifications' },
      ]
    },
    {
      key: 'content',
      title: 'Nội dung',
      icon: School,
      items: [
        { icon: School, label: 'Trường học', path: '/admin-schools' },
        { icon: ClipboardList, label: 'Loại trường', path: '/admin-school-types' },
        { icon: FileText, label: 'Dịch vụ', path: '/admin-services' },
      ]
    },
    {
      key: 'system',
      title: 'Hệ thống',
      icon: Settings,
      items: [
        { icon: ShieldCheck, label: 'Phân quyền', path: '/admin-rbac' },
        { icon: Activity, label: 'Audit Log', path: '/admin-audit-log' },
        { icon: Settings, label: 'Cài đặt', path: '/admin-settings' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} bg-white border-r transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Admin Panel</h2>
              <p className="text-xs text-gray-500">Quản trị hệ thống</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {menuSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections.includes(section.key);
            
            return (
              <div key={section.key} className="mb-4">
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-4 h-4" />
                    <span>{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="mt-1 ml-2 space-y-1">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = location.pathname === item.path;
                      
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Quản trị viên</p>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}