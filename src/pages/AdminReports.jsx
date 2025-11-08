import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, Users, Calendar, School, FileText, TrendingUp, 
  Download, Calendar as CalendarIcon, Filter
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

export default function AdminReports() {
  const [timeRange, setTimeRange] = useState("30d");

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date'),
    initialData: [],
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-created_date'),
    initialData: [],
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: () => base44.entities.School.list(),
    initialData: [],
  });

  const { data: testResults = [] } = useQuery({
    queryKey: ['testResults'],
    queryFn: () => base44.entities.TestResult.list('-completed_date'),
    initialData: [],
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const getDaysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const filterByDate = (items, dateField) => {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
      const days = daysMap[timeRange] || 30;
      const cutoffDate = getDaysAgo(days);
      
      return items.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= cutoffDate;
      });
    };

    const filteredUsers = filterByDate(userProfiles, 'created_date');
    const filteredAppointments = filterByDate(appointments, 'created_date');
    const filteredTests = filterByDate(testResults, 'completed_date');

    // Role distribution
    const roleDistribution = {};
    userProfiles.forEach(user => {
      roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1;
    });

    // Test type distribution
    const testTypeDistribution = {};
    testResults.forEach(test => {
      testTypeDistribution[test.test_type] = (testTypeDistribution[test.test_type] || 0) + 1;
    });

    // Appointment status
    const appointmentStatus = {};
    appointments.forEach(apt => {
      appointmentStatus[apt.status] = (appointmentStatus[apt.status] || 0) + 1;
    });

    // School type distribution
    const schoolTypeDistribution = {};
    schools.forEach(school => {
      schoolTypeDistribution[school.school_type] = (schoolTypeDistribution[school.school_type] || 0) + 1;
    });

    return {
      totalUsers: userProfiles.length,
      newUsers: filteredUsers.length,
      totalAppointments: appointments.length,
      newAppointments: filteredAppointments.length,
      totalSchools: schools.length,
      totalTests: testResults.length,
      newTests: filteredTests.length,
      roleDistribution,
      testTypeDistribution,
      appointmentStatus,
      schoolTypeDistribution,
      completionRate: appointments.length > 0 
        ? Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100) 
        : 0
    };
  }, [userProfiles, appointments, schools, testResults, timeRange]);

  const handleExportReport = () => {
    const reportData = {
      generated_at: new Date().toISOString(),
      time_range: timeRange,
      statistics: stats
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li className="text-gray-500">Admin</li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Báo cáo</li>
          </ol>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo Cáo & Thống Kê</h1>
            <p className="text-gray-600">Phân tích dữ liệu hệ thống</p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
            >
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="90d">90 ngày qua</option>
              <option value="365d">1 năm qua</option>
            </select>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { 
              label: "Người dùng", 
              value: stats.totalUsers, 
              change: `+${stats.newUsers}`, 
              color: "bg-blue-500",
              icon: Users 
            },
            { 
              label: "Lịch hẹn", 
              value: stats.totalAppointments, 
              change: `+${stats.newAppointments}`, 
              color: "bg-green-500",
              icon: Calendar 
            },
            { 
              label: "Trường học", 
              value: stats.totalSchools, 
              change: "Active", 
              color: "bg-purple-500",
              icon: School 
            },
            { 
              label: "Kết quả Test", 
              value: stats.totalTests, 
              change: `+${stats.newTests}`, 
              color: "bg-yellow-500",
              icon: FileText 
            }
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-xs text-green-600 font-medium mt-2">{stat.change} trong kỳ</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Role Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Phân bố vai trò</h2>
            <div className="space-y-4">
              {Object.entries(stats.roleDistribution).map(([role, count]) => {
                const percentage = Math.round((count / stats.totalUsers) * 100);
                return (
                  <div key={role}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">{role}</span>
                      <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Type Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Loại test phổ biến</h2>
            <div className="space-y-4">
              {Object.entries(stats.testTypeDistribution).map(([type, count]) => {
                const percentage = Math.round((count / stats.totalTests) * 100);
                return (
                  <div key={type}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 uppercase">{type}</span>
                      <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Appointment Status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Trạng thái lịch hẹn</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats.appointmentStatus).map(([status, count]) => {
                const colors = {
                  pending: 'bg-yellow-100 text-yellow-800',
                  confirmed: 'bg-green-100 text-green-800',
                  completed: 'bg-blue-100 text-blue-800',
                  cancelled: 'bg-red-100 text-red-800'
                };
                return (
                  <div key={status} className={`${colors[status]} rounded-xl p-4`}>
                    <p className="text-2xl font-bold mb-1">{count}</p>
                    <p className="text-sm capitalize">{status}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* School Type Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Phân loại trường học</h2>
            <div className="space-y-4">
              {Object.entries(stats.schoolTypeDistribution).map(([type, count]) => {
                const percentage = Math.round((count / stats.totalSchools) * 100);
                return (
                  <div key={type}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                      <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">Hiệu suất hệ thống</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <TrendingUp className="w-8 h-8 mb-3" />
              <p className="text-3xl font-bold mb-1">{stats.completionRate}%</p>
              <p className="text-sm text-white/80">Tỷ lệ hoàn thành lịch hẹn</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Users className="w-8 h-8 mb-3" />
              <p className="text-3xl font-bold mb-1">{stats.newUsers}</p>
              <p className="text-sm text-white/80">Người dùng mới trong kỳ</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <BarChart3 className="w-8 h-8 mb-3" />
              <p className="text-3xl font-bold mb-1">{Math.round(stats.totalTests / Math.max(stats.totalUsers, 1) * 10) / 10}</p>
              <p className="text-sm text-white/80">Trung bình test/người dùng</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}