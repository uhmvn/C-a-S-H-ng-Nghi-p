
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, School, FileText, Calendar, TrendingUp, Activity,
  Shield, Key, Settings, BarChart3, Clock, CheckCircle,
  AlertCircle, UserPlus, BookOpen, ArrowUp, ArrowDown
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // Fetch dashboard data
  const { data: profiles = [] } = useQuery({
    queryKey: ['dashboardProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 500),
    initialData: []
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['dashboardAppointments'],
    queryFn: () => base44.entities.Appointment.list('-created_date', 500),
    initialData: []
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['dashboardSchools'],
    queryFn: () => base44.entities.School.list('-created_date', 100),
    initialData: []
  });

  const { data: testResults = [] } = useQuery({
    queryKey: ['dashboardTests'],
    queryFn: () => base44.entities.TestResult.list('-completed_date', 500),
    initialData: []
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['recentAuditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 50),
    initialData: []
  });

  // Calculate stats
  const stats = {
    totalUsers: profiles.length,
    studentsCount: profiles.filter(p => p.role === 'student').length,
    teachersCount: profiles.filter(p => p.role === 'homeroom_teacher' || p.role === 'subject_teacher').length,
    pendingUsers: profiles.filter(p => p.status === 'pending').length,
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter(a => a.status === 'pending').length,
    totalSchools: schools.length,
    totalTests: testResults.length
  };

  // User growth chart data
  const userGrowthData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = profiles.filter(p => {
        if (!p.created_date) return false;
        const pDate = new Date(p.created_date).toISOString().split('T')[0];
        return pDate === dateStr;
      }).length;
      
      last7Days.push({
        date: date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        users: count
      });
    }
    return last7Days;
  }, [profiles]);

  // Role distribution
  const roleDistribution = useMemo(() => {
    return [
      { name: 'Học sinh', value: stats.studentsCount },
      { name: 'GV Chủ nhiệm', value: profiles.filter(p => p.role === 'homeroom_teacher').length },
      { name: 'GV Bộ môn', value: profiles.filter(p => p.role === 'subject_teacher').length },
      { name: 'Tư vấn viên', value: profiles.filter(p => p.role === 'counselor').length },
      { name: 'Admin', value: profiles.filter(p => p.role === 'school_admin' || p.role === 'department_admin').length }
    ];
  }, [profiles, stats]);

  // Test completion rate by type
  const testsByType = useMemo(() => {
    const types = {};
    testResults.forEach(test => {
      types[test.test_type] = (types[test.test_type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({
      type: type.toUpperCase(),
      count
    }));
  }, [testResults]);

  const quickActions = [
    {
      title: "Quản lý người dùng",
      description: "Xem, cấp mã và phân quyền",
      icon: Users,
      link: "AdminUsers",
      color: "bg-blue-500",
      stat: `${stats.totalUsers} người dùng`
    },
    {
      title: "Quản lý Test",
      description: "Loại test, bài test, câu hỏi",
      icon: FileText,
      link: "AdminTestManagement",
      color: "bg-purple-500",
      stat: `${stats.totalTests} bài test`
    },
    {
      title: "Kết quả Test",
      description: "Xem kết quả test học sinh",
      icon: BarChart3,
      link: "AdminTestResults",
      color: "bg-green-500",
      stat: `${stats.totalTests} lượt test`
    },
    {
      title: "Quản lý học sinh",
      description: "Danh sách và chuyển lớp HS",
      icon: Users,
      link: "StudentManagement",
      color: "bg-green-500",
      stat: `${stats.studentsCount} học sinh`
    },
    {
      title: "Quản lý giáo viên",
      description: "Danh sách và phân công GV",
      icon: Users,
      link: "TeacherManagement",
      color: "bg-purple-500",
      stat: `${stats.teachersCount} giáo viên`
    },
    {
      title: "Phân quyền RBAC",
      description: "Quản lý vai trò và quyền hạn",
      icon: Shield,
      link: "AdminRBAC",
      color: "bg-red-500",
      stat: "7 vai trò"
    },
    {
      title: "Cấu trúc học vụ",
      description: "Năm học, khối, lớp",
      icon: School,
      link: "AdminAcademicStructure",
      color: "bg-indigo-500",
      stat: "Quản lý"
    },
    {
      title: "Nhật ký Audit",
      description: "Theo dõi thao tác",
      icon: Activity,
      link: "AdminAuditLog",
      color: "bg-orange-500",
      stat: `${auditLogs.length} logs`
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chào mừng, {currentUser?.full_name || 'Admin'}! 👋
          </h1>
          <p className="text-gray-600">
            Tổng quan hệ thống hướng nghiệp - {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <ArrowUp className="w-4 h-4" />
                <span className="font-bold">12%</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalUsers}</h3>
            <p className="text-sm text-gray-600">Tổng người dùng</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalAppointments}</h3>
            <p className="text-sm text-gray-600">Lịch hẹn</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6 text-purple-600" />
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalSchools}</h3>
            <p className="text-sm text-gray-600">Trường học</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalTests}</h3>
            <p className="text-sm text-gray-600">Bài test</p>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tăng trưởng người dùng</h2>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="week">7 ngày</option>
                <option value="month">30 ngày</option>
                <option value="year">12 tháng</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Role Distribution Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Phân bố vai trò</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Test Results Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Kết quả test theo loại</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={testsByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Truy cập nhanh</h2>
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={action.title}
                to={createPageUrl(action.link)}
                className="group"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">{action.stat}</span>
                    {action.trend && (
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {action.trend}
                      </span>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity & System Info */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Audit Logs */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Hoạt động gần đây</h2>
              <Link
                to={createPageUrl("AdminAuditLog")}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log, index) => (
                <div key={log.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{log.action}</h4>
                    <p className="text-xs text-gray-600">{log.user_email}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_date).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-6">Hệ thống RBAC</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  <span>Vai trò</span>
                </div>
                <span className="font-bold">7 roles</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5" />
                  <span>Quyền hạn</span>
                </div>
                <span className="font-bold">15 permissions</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span>Người dùng active</span>
                </div>
                <span className="font-bold">{profiles.filter(p => p.status === 'active').length}</span>
              </div>
            </div>
            <Link
              to={createPageUrl("AdminRBAC")}
              className="block mt-6 text-center bg-white text-indigo-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Quản lý RBAC
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
