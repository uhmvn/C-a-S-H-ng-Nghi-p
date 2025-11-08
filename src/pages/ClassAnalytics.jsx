import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, Award, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export default function ClassAnalytics() {
  const { data: classes = [] } = useQuery({
    queryKey: ['analyticsClasses'],
    queryFn: () => base44.entities.Class.list(),
    initialData: []
  });

  const { data: students = [] } = useQuery({
    queryKey: ['analyticsStudents'],
    queryFn: () => base44.entities.UserProfile.filter({ role: 'student' }),
    initialData: []
  });

  const { data: testResults = [] } = useQuery({
    queryKey: ['analyticsTests'],
    queryFn: () => base44.entities.TestResult.list('-completed_date', 500),
    initialData: []
  });

  // Class performance data
  const classPerformance = useMemo(() => {
    return classes.map(cls => {
      const classStudents = students.filter(s => s.class_id === cls.id);
      const classTests = testResults.filter(t => 
        classStudents.some(s => s.user_id === t.user_id)
      );

      return {
        name: cls.name,
        students: classStudents.length,
        tests: classTests.length,
        avgTests: classStudents.length > 0 ? Math.round(classTests.length / classStudents.length) : 0,
        capacity: cls.capacity,
        utilization: Math.round((classStudents.length / cls.capacity) * 100)
      };
    });
  }, [classes, students, testResults]);

  // Test distribution
  const testDistribution = useMemo(() => {
    const types = {};
    testResults.forEach(t => {
      types[t.test_type] = (types[t.test_type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [testResults]);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Phân Tích Lớp Học</h1>
          <p className="text-gray-600">Thống kê hiệu suất và tiến độ theo lớp</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            <p className="text-sm text-gray-600">Tổng số lớp</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            <p className="text-sm text-gray-600">Tổng học sinh</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{testResults.length}</p>
            <p className="text-sm text-gray-600">Bài test đã làm</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(testResults.length / students.length) || 0}
            </p>
            <p className="text-sm text-gray-600">TB test/HS</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Class Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Hiệu suất theo lớp</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#4F46E5" name="Số HS" />
                <Bar dataKey="avgTests" fill="#10B981" name="TB tests/HS" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Test Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Phân bố loại test</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={testDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {testDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Details Table */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Chi tiết theo lớp</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Lớp</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sĩ số</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tỷ lệ lấp đầy</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Số tests</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">TB tests/HS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {classPerformance.map((cls, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{cls.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{cls.students}/{cls.capacity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className={`h-full ${
                              cls.utilization >= 90 ? 'bg-red-500' :
                              cls.utilization >= 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${cls.utilization}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{cls.utilization}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{cls.tests}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cls.avgTests >= 3 ? 'bg-green-100 text-green-800' :
                        cls.avgTests >= 1 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {cls.avgTests} bài
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}