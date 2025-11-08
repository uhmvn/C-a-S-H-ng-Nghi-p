
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { 
  User, Mail, Phone, MapPin, Heart, Award, BookOpen, 
  TrendingUp, Calendar, AlertCircle, Users, Home, Briefcase
} from "lucide-react";
import { motion } from "framer-motion";
import Breadcrumb from "@/components/Breadcrumb";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function ParentDashboard() {
  const [searchParams] = useSearchParams();
  const studentCode = searchParams.get('student');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [parentProfile, setParentProfile] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profiles && profiles.length > 0) {
            const profile = profiles[0];
            setParentProfile(profile);

            // ✅ FIX: Safe access with null checks
            const linkedStudents = Array.isArray(profile.linked_student_codes) 
              ? profile.linked_student_codes 
              : [];
            const isLinked = linkedStudents.some(l => l && l.student_code === studentCode);
            setIsAuthorized(isLinked);

            if (!isLinked) {
              console.warn('⚠️ Parent not authorized for this student');
            }
          }
        } else {
          base44.auth.redirectToLogin(window.location.pathname);
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [studentCode]);

  const { data: studentProfile, isLoading: studentLoading } = useQuery({
    queryKey: ['studentProfile', studentCode],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ 
        user_code: studentCode,
        role: 'student'
      });
      return (profiles && profiles.length > 0) ? profiles[0] : null;
    },
    enabled: !!studentCode && isAuthorized,
    initialData: null
  });

  const { data: academicScores = [] } = useQuery({
    queryKey: ['studentScores', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.user_id) return [];
      const scores = await base44.entities.AcademicScore.filter({ 
        user_id: studentProfile.user_id 
      }, '-updated_at', 200);
      return scores || [];
    },
    enabled: !!studentProfile?.user_id && isAuthorized,
    initialData: []
  });

  const { data: testResults = [] } = useQuery({
    queryKey: ['studentTests', studentProfile?.user_id],
    queryFn: async () => {
      if (!studentProfile?.user_id) return [];
      const results = await base44.entities.TestResult.filter({ 
        user_id: studentProfile.user_id 
      }, '-completed_date', 50);
      return results || [];
    },
    enabled: !!studentProfile?.user_id && isAuthorized,
    initialData: []
  });

  // ✅ FIX: Safe GPA calculation
  const gpa = useMemo(() => {
    if (!academicScores || academicScores.length === 0) return 0;
    const validScores = academicScores.filter(s => 
      s && typeof s.average_score === 'number' && !isNaN(s.average_score)
    );
    if (validScores.length === 0) return 0;
    return (validScores.reduce((sum, s) => sum + s.average_score, 0) / validScores.length).toFixed(2);
  }, [academicScores]);

  const breadcrumbItems = [
    { label: "Dashboard", url: "/parent-linking" },
    { label: studentProfile?.full_name || studentCode || 'Học sinh' }
  ];

  if (isLoading || studentLoading) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Không có quyền truy cập</h2>
            <p className="text-red-700 mb-6">
              Bạn chưa liên kết với học sinh này hoặc liên kết đã bị hủy
            </p>
            <a
              href="/parent-linking"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700"
            >
              Về trang liên kết
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">Không tìm thấy học sinh</h2>
            <p className="text-yellow-700">Mã học sinh: {studentCode}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        {/* Header with Student Info */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl p-8 mb-8"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{studentProfile.full_name || studentCode}</h1>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    Mã: {studentProfile.user_code || 'N/A'}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    Lớp: {studentProfile.class_name || 'N/A'}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    Khối: {studentProfile.grade_level || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{gpa}</div>
              <p className="text-sm opacity-90">GPA</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Personal Info */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border"
            >
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Thông Tin Cá Nhân
              </h2>
              <div className="space-y-3 text-sm">
                {studentProfile.date_of_birth && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Ngày sinh:</span>
                    <span className="font-medium">
                      {format(new Date(studentProfile.date_of_birth), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                )}
                {studentProfile.gender && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Giới tính:</span>
                    <span className="font-medium">
                      {studentProfile.gender === 'male' ? 'Nam' : 
                       studentProfile.gender === 'female' ? 'Nữ' : 'Khác'}
                    </span>
                  </div>
                )}
                {studentProfile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">SĐT:</span>
                    <span className="font-medium">{studentProfile.phone}</span>
                  </div>
                )}
                {studentProfile.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-600 block">Địa chỉ:</span>
                      <span className="font-medium">{studentProfile.address}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Family Info */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border"
            >
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Thông Tin Gia Đình
              </h2>
              <div className="space-y-4 text-sm">
                {studentProfile.father_name && (
                  <div className="border-l-4 border-blue-500 pl-3">
                    <p className="font-bold text-gray-900">👨 Cha</p>
                    <p className="text-gray-600">{studentProfile.father_name}</p>
                    {studentProfile.father_phone && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {studentProfile.father_phone}
                      </p>
                    )}
                    {studentProfile.father_job && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {studentProfile.father_job}
                      </p>
                    )}
                  </div>
                )}
                {studentProfile.mother_name && (
                  <div className="border-l-4 border-pink-500 pl-3">
                    <p className="font-bold text-gray-900">👩 Mẹ</p>
                    <p className="text-gray-600">{studentProfile.mother_name}</p>
                    {studentProfile.mother_phone && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {studentProfile.mother_phone}
                      </p>
                    )}
                    {studentProfile.mother_job && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {studentProfile.mother_job}
                      </p>
                    )}
                  </div>
                )}
                {studentProfile.guardian_name && (
                  <div className="border-l-4 border-green-500 pl-3">
                    <p className="font-bold text-gray-900">👤 Người giám hộ</p>
                    <p className="text-gray-600">{studentProfile.guardian_name}</p>
                    {studentProfile.guardian_relationship && (
                      <p className="text-xs text-gray-500">{studentProfile.guardian_relationship}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Academic */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Academic Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-3 gap-4"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <BookOpen className="w-8 h-8 text-blue-500 mb-3" />
                <h3 className="text-3xl font-bold">{academicScores?.length || 0}</h3>
                <p className="text-sm text-gray-600">Bản ghi điểm</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <Award className="w-8 h-8 text-green-500 mb-3" />
                <h3 className="text-3xl font-bold">{gpa}</h3>
                <p className="text-sm text-gray-600">GPA trung bình</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <TrendingUp className="w-8 h-8 text-purple-500 mb-3" />
                <h3 className="text-3xl font-bold">{testResults?.length || 0}</h3>
                <p className="text-sm text-gray-600">Bài test đã làm</p>
              </div>
            </motion.div>

            {/* Recent Scores */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border"
            >
              <h2 className="font-bold text-lg mb-4">📊 Điểm Số Gần Đây</h2>
              {!academicScores || academicScores.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  Chưa có điểm
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left">Môn</th>
                        <th className="px-3 py-2 text-center">Năm - HK</th>
                        <th className="px-3 py-2 text-center">GK</th>
                        <th className="px-3 py-2 text-center">CK</th>
                        <th className="px-3 py-2 text-center">TB</th>
                        <th className="px-3 py-2 text-center">XL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academicScores.slice(0, 10).map((score, idx) => {
                        if (!score) return null;
                        return (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">{score.subject_name || 'N/A'}</td>
                            <td className="px-3 py-2 text-center text-xs">
                              {score.academic_year_id || 'N/A'} - HK{score.semester}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {score.midterm_score?.toFixed(1) || '-'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {score.final_score?.toFixed(1) || '-'}
                            </td>
                            <td className="px-3 py-2 text-center font-bold">
                              {score.average_score?.toFixed(1) || '-'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                score.classification === 'excellent' ? 'bg-green-100 text-green-700' :
                                score.classification === 'good' ? 'bg-blue-100 text-blue-700' :
                                score.classification === 'average' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {score.classification === 'excellent' ? 'Giỏi' :
                                 score.classification === 'good' ? 'Khá' :
                                 score.classification === 'average' ? 'TB' : 'Yếu'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Test Results */}
            {testResults && testResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-sm border"
              >
                <h2 className="font-bold text-lg mb-4">🧠 Kết Quả Test</h2>
                <div className="space-y-3">
                  {testResults.slice(0, 5).map((test, idx) => {
                    if (!test) return null;
                    return (
                      <div key={idx} className="border rounded-xl p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold">{test.test_name || 'Test'}</h3>
                            <p className="text-xs text-gray-500">
                              {test.completed_date ? format(new Date(test.completed_date), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                            </p>
                          </div>
                          <a
                            href={`/test-result-detail?id=${test.id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            Xem chi tiết →
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
