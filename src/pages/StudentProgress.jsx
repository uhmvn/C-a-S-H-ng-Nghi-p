import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, BookOpen, Calendar, Award, Target, 
  CheckCircle, AlertCircle, BarChart3
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { SkeletonStats, SkeletonCard } from "@/components/SkeletonLoader";

export default function StudentProgress() {
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['progressStudents'],
    queryFn: () => base44.entities.UserProfile.filter({ role: 'student' }),
    initialData: []
  });

  const { data: testResults = [], isLoading: loadingTests } = useQuery({
    queryKey: ['progressTests'],
    queryFn: () => base44.entities.TestResult.list('-completed_date', 500),
    initialData: []
  });

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['progressAppointments'],
    queryFn: () => base44.entities.Appointment.list('-created_date', 500),
    initialData: []
  });

  // Calculate student progress
  const studentProgress = useMemo(() => {
    return students.map(student => {
      const tests = testResults.filter(t => t.user_id === student.user_id);
      const counseling = appointments.filter(a => 
        a.client_email === student.user_code && a.status === 'completed'
      );

      // Calculate profile completion
      let completion = 0;
      if (student.user_code) completion += 20;
      if (student.class_name) completion += 20;
      if (student.school_name) completion += 20;
      if (student.parent_phone) completion += 20;
      if (student.date_of_birth) completion += 20;

      return {
        ...student,
        test_count: tests.length,
        counseling_count: counseling.length,
        profile_completion: completion,
        last_test: tests[0]?.completed_date || null
      };
    });
  }, [students, testResults, appointments]);

  // Overall stats
  const stats = useMemo(() => {
    return {
      totalStudents: students.length,
      completedTests: testResults.length,
      avgCompletion: Math.round(
        studentProgress.reduce((acc, s) => acc + s.profile_completion, 0) / studentProgress.length
      ) || 0,
      needsAttention: studentProgress.filter(s => s.test_count === 0).length
    };
  }, [students, testResults, studentProgress]);

  if (loadingStudents || loadingTests || loadingAppts) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tiến Độ Học Sinh</h1>
            <p className="text-gray-600">Theo dõi tiến trình học tập và tư vấn nghề nghiệp</p>
          </div>
          <SkeletonStats />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tiến Độ Học Sinh</h1>
          <p className="text-gray-600">Theo dõi tiến trình học tập và tư vấn nghề nghiệp của {stats.totalStudents} học sinh</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.completedTests}</p>
            <p className="text-sm text-gray-600">Bài test hoàn thành</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgCompletion}%</p>
            <p className="text-sm text-gray-600">TB hoàn thành hồ sơ</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            <p className="text-sm text-gray-600">Buổi tư vấn</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.needsAttention}</p>
            <p className="text-sm text-gray-600">Cần quan tâm</p>
          </motion.div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Chi tiết theo học sinh</h2>
          <div className="space-y-4">
            {studentProgress.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">
                        {student.user_code?.slice(0, 2) || 'HS'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{student.user_code}</h3>
                      <p className="text-sm text-gray-600">{student.class_name || 'Chưa có lớp'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{student.test_count}</p>
                      <p className="text-gray-600">Tests</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{student.counseling_count}</p>
                      <p className="text-gray-600">Tư vấn</p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full ${
                            student.profile_completion >= 80 ? 'bg-green-500' :
                            student.profile_completion >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          } transition-all duration-300`}
                          style={{ width: `${student.profile_completion}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{student.profile_completion}% hồ sơ</p>
                    </div>
                  </div>
                </div>
                
                {student.test_count === 0 && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>Chưa làm bài test nào - Cần quan tâm</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}