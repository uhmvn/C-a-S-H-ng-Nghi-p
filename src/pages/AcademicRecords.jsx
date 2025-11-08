
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/AdminLayout";
import { 
  BookOpen, Search, Download, TrendingUp, Award, 
  User, School, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";

export default function AcademicRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [expandedStudents, setExpandedStudents] = useState({});
  const [processedData, setProcessedData] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgGPA: '0.00',
    totalRecords: 0,
    excellentCount: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 20;

  // ✅ FIX: Simpler query - list all then filter in memory
  const { data: rawStudents = [], isLoading: studentsLoading, error: studentsError, refetch: refetchStudents } = useQuery({
    queryKey: ['students-academic'],
    queryFn: async () => {
      console.log('🔍 [ADMIN] Fetching ALL UserProfiles...');
      try {
        // Get all profiles first
        const all = await base44.entities.UserProfile.list('-created_date', 1000);
        console.log('✅ [ADMIN] All profiles loaded:', all.length);
        
        // Filter students in memory
        const students = all.filter(p => p.role === 'student');
        console.log('✅ [ADMIN] Students filtered:', students.length);
        
        if (students.length > 0) {
          console.log('📋 Sample student:', students[0]);
        }
        
        return students;
      } catch (error) {
        console.error('❌ [ADMIN] Error:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 60000, // Cache 1 min
    refetchOnWindowFocus: false
  });

  // ✅ FIX: Try to fetch User names, but optional
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-academic'],
    queryFn: async () => {
      try {
        const allUsers = await base44.entities.User.list('-created_date', 1000);
        console.log('✅ [ADMIN] Users loaded:', allUsers.length);
        return allUsers;
      } catch (error) {
        console.warn('⚠️ [ADMIN] Cannot fetch Users, using fallback');
        return [];
      }
    },
    enabled: rawStudents.length > 0, // Only try to fetch users if there are student profiles
    retry: 0, // Don't retry if it fails
    staleTime: 60000,
    throwOnError: false // Don't throw error - just return empty
  });

  // ✅ FIX: Optimize scores query
  const { data: rawScores = [], isLoading: scoresLoading, error: scoresError, refetch: refetchScores } = useQuery({
    queryKey: ['scores-academic'],
    queryFn: async () => {
      console.log('🔍 [ADMIN] Fetching AcademicScores...');
      try {
        const scores = await base44.entities.AcademicScore.list('-updated_at', 2000);
        console.log('✅ [ADMIN] Scores loaded:', scores.length);
        
        if (scores.length > 0) {
          console.log('📋 Sample score:', scores[0]);
        }
        
        return scores;
      } catch (error) {
        console.error('❌ [ADMIN] Error fetching scores:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  // Process data
  useEffect(() => {
    if (studentsLoading || scoresLoading) {
      console.log('⏳ Still loading...', { studentsLoading, scoresLoading });
      return;
    }
    
    console.log('🔄 [ADMIN] Processing data...');
    console.log('📊 Students:', rawStudents.length, 'Scores:', rawScores.length);
    
    if (rawStudents.length === 0) {
      console.warn('⚠️ No students found!');
      setProcessedData([]);
      setStats({
        totalStudents: 0,
        avgGPA: '0.00',
        totalRecords: 0,
        excellentCount: 0
      });
      return;
    }
    
    // Build student data
    const studentsData = rawStudents.map(student => {
      // Get name from User entity or fallback
      let fullName = 'Chưa có tên';
      if (users.length > 0) {
        const user = users.find(u => u.id === student.user_id);
        fullName = user?.full_name || student.full_name || student.user_code || 'N/A';
      } else {
        // Fallback: use whatever is available
        fullName = student.full_name || student.user_code || 'Chưa có tên';
      }
      
      // Match scores by user_id OR student_id
      const studentScores = rawScores.filter(score => {
        const matchUserId = score.user_id && student.user_id && score.user_id === student.user_id;
        const matchStudentId = score.student_id && score.student_id === student.id;
        return matchUserId || matchStudentId;
      });

      if (studentScores.length > 0) {
        console.log(`📚 ${student.user_code || student.id?.substring(0,8)}: ${studentScores.length} scores`);
      }

      // Calculate GPA
      const validScores = studentScores.filter(s => 
        typeof s.average_score === 'number' && !isNaN(s.average_score)
      );
      
      const gpa = validScores.length > 0
        ? validScores.reduce((sum, s) => sum + s.average_score, 0) / validScores.length
        : 0;

      return {
        id: student.id,
        user_id: student.user_id,
        full_name: fullName,
        user_code: student.user_code || 'N/A',
        class_name: student.class_name || 'Chưa có',
        school_name: student.school_name || 'Chưa có',
        grade_level: student.grade_level,
        allScores: studentScores,
        totalScores: studentScores.length,
        gpa: parseFloat(gpa.toFixed(2))
      };
    });

    setProcessedData(studentsData);

    // Extract years
    const years = [...new Set(rawScores.map(s => s.academic_year_id).filter(Boolean))];
    setAcademicYears(years.sort().reverse());

    // Calculate stats
    const withScores = studentsData.filter(s => s.totalScores > 0);
    const avgGPA = withScores.length > 0
      ? (withScores.reduce((sum, s) => sum + s.gpa, 0) / withScores.length).toFixed(2)
      : '0.00';
    const excellent = studentsData.filter(s => s.gpa >= 8.0).length;

    setStats({
      totalStudents: studentsData.length,
      avgGPA,
      totalRecords: rawScores.length,
      excellentCount: excellent
    });

    console.log('✅ [ADMIN] Processing complete!');
    console.log('📊 Final stats:', {
      students: studentsData.length,
      scores: rawScores.length,
      withScores: withScores.length,
      avgGPA
    });
  }, [rawStudents, rawScores, studentsLoading, scoresLoading, users]);

  // ✅ Optimized filtering with useMemo
  const filteredStudents = useMemo(() => {
    let filtered = processedData;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.full_name?.toLowerCase().includes(search) ||
        s.user_code?.toLowerCase().includes(search) ||
        s.class_name?.toLowerCase().includes(search)
      );
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(s => 
        s.allScores.some(score => score.academic_year_id === selectedYear)
      );
    }

    if (selectedSemester !== 'all') {
      filtered = filtered.filter(s => 
        s.allScores.some(score => score.semester === parseInt(selectedSemester))
      );
    }

    return filtered.sort((a, b) => b.gpa - a.gpa);
  }, [processedData, searchTerm, selectedYear, selectedSemester]);

  // ✅ Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * studentsPerPage;
    return filteredStudents.slice(start, start + studentsPerPage);
  }, [filteredStudents, currentPage, studentsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedYear, selectedSemester]);

  const handleExportCSV = () => {
    const rows = [['Mã HS', 'Họ tên', 'Lớp', 'Năm', 'HK', 'Môn', 'GK', 'CK', 'TB', 'XL'].join(',')];

    filteredStudents.forEach(student => {
      student.allScores.forEach(score => {
        rows.push([
          student.user_code || '',
          student.full_name || '',
          student.class_name || '',
          score.academic_year_id || '',
          score.semester || '',
          score.subject_name || '',
          typeof score.midterm_score === 'number' ? score.midterm_score.toFixed(1) : '',
          typeof score.final_score === 'number' ? score.final_score.toFixed(1) : '',
          typeof score.average_score === 'number' ? score.average_score.toFixed(1) : '',
          score.classification === 'excellent' ? 'Giỏi' :
          score.classification === 'good' ? 'Khá' :
          score.classification === 'average' ? 'Trung bình' :
          score.classification === 'poor' ? 'Yếu' : ''
        ].join(','));
      });
    });

    const csv = rows.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `hoc-ba-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Đã xuất Excel!');
  };

  // Error UI
  if (studentsError || scoresError) {
    const errorMsg = studentsError?.message || scoresError?.message || 'Không xác định';
    
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-red-900 mb-2">❌ Lỗi Tải Dữ Liệu</h3>
              <p className="text-red-700 mb-4">{errorMsg}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  refetchStudents();
                  refetchScores();
                }}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 font-medium flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Thử Lại
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 font-medium"
              >
                ← Quay Lại
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Loading UI
  if (studentsLoading || scoresLoading) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">
          <div className="bg-white rounded-2xl p-16 text-center max-w-md mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Đang tải dữ liệu...</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center justify-between">
                <span>Học sinh:</span>
                <span className={studentsLoading ? 'text-yellow-600' : 'text-green-600'}>
                  {studentsLoading ? '⏳ Đang tải...' : '✓ Xong'}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span>Điểm số:</span>
                <span className={scoresLoading ? 'text-yellow-600' : 'text-green-600'}>
                  {scoresLoading ? '⏳ Đang tải...' : '✓ Xong'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Quản Lý Học Bạ</h1>
              <p className="text-gray-600">
                {stats.totalStudents} học sinh • {stats.totalRecords} điểm
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  refetchStudents();
                  refetchScores();
                  toast.success('Đã làm mới dữ liệu!');
                }}
                className="flex items-center gap-2 border-2 border-indigo-600 text-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-50"
              >
                <RefreshCw className="w-5 h-5" />
                Làm mới
              </button>
              <button
                onClick={handleExportCSV}
                disabled={filteredStudents.length === 0}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Xuất Excel ({filteredStudents.length})
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-500 text-white rounded-2xl p-6">
              <User className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold mb-1">{stats.totalStudents}</h3>
              <p className="text-sm">Học sinh</p>
            </div>

            <div className="bg-green-500 text-white rounded-2xl p-6">
              <Award className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold mb-1">{stats.avgGPA}</h3>
              <p className="text-sm">GPA TB</p>
            </div>

            <div className="bg-purple-500 text-white rounded-2xl p-6">
              <BookOpen className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold mb-1">{stats.totalRecords}</h3>
              <p className="text-sm">Bản ghi</p>
            </div>

            <div className="bg-yellow-500 text-white rounded-2xl p-6">
              <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold mb-1">{stats.excellentCount}</h3>
              <p className="text-sm">HS Giỏi</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">🔍 Tìm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tên, mã..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">📅 Năm</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg"
              >
                <option value="all">Tất cả</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">📖 HK</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg"
              >
                <option value="all">Tất cả</option>
                <option value="1">HK 1</option>
                <option value="2">HK 2</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedYear('all');
                  setSelectedSemester('all');
                }}
                className="w-full border-2 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50"
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {processedData.length === 0 ? (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-16 text-center">
              <BookOpen className="w-20 h-20 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">Chưa có học sinh</h3>
              <p className="text-gray-600 mb-4">
                Tìm thấy {rawStudents.length} UserProfile nhưng 0 có role='student'
              </p>
              <div className="bg-white rounded-xl p-4 max-w-md mx-auto text-left text-sm">
                <p className="font-bold mb-2">💡 Để thêm học sinh:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>Admin → Code Management → Cấp mã HS</li>
                  <li>HS đăng nhập bằng mã → Tự tạo UserProfile</li>
                  <li>Hoặc Admin → Import học sinh</li>
                </ol>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center">
              <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Không tìm thấy</h3>
              <p className="text-gray-600">Không có học sinh phù hợp bộ lọc</p>
              <p className="text-sm text-gray-500 mt-2">Tổng: {processedData.length} học sinh</p>
            </div>
          ) : (
            <>
              {paginatedStudents.map((student, index) => {
                const isExpanded = expandedStudents[student.id];
              
                let displayScores = student.allScores;
                
                if (selectedYear !== 'all') {
                  displayScores = displayScores.filter(s => s.academic_year_id === selectedYear);
                }
                
                if (selectedSemester !== 'all') {
                  displayScores = displayScores.filter(s => s.semester === parseInt(selectedSemester));
                }

                const scoreGroups = {};
                displayScores.forEach(score => {
                  const key = `${score.academic_year_id}-${score.semester}`;
                  if (!scoreGroups[key]) {
                    scoreGroups[key] = {
                      year: score.academic_year_id,
                      semester: score.semester,
                      items: []
                    };
                  }
                  scoreGroups[key].items.push(score);
                });

                const groups = Object.values(scoreGroups).sort((a, b) => {
                  const yearCmp = b.year.localeCompare(a.year);
                  if (yearCmp !== 0) return yearCmp;
                  return b.semester - a.semester;
                });

                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md"
                  >
                    <div
                      onClick={() => setExpandedStudents(prev => ({
                        ...prev,
                        [student.id]: !prev[student.id]
                      }))}
                      className="p-6 cursor-pointer hover:bg-indigo-50/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center">
                            <User className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-lg">{student.full_name}</h3>
                              {student.user_code && (
                                <span className="text-sm font-mono text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                  {student.user_code}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <School className="w-4 h-4" />
                                {student.class_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {student.totalScores} điểm
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <Award className="w-6 h-6 text-yellow-500" />
                              <span className="text-3xl font-bold">{student.gpa.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-500">GPA</p>
                          </div>
                          <div className="text-gray-400">
                            {isExpanded ? <ChevronUp className="w-7 h-7" /> : <ChevronDown className="w-7 h-7" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t-2 border-indigo-100"
                        >
                          <div className="p-6 bg-gray-50">
                            {groups.length === 0 ? (
                              <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed">
                                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-600">Chưa có điểm</p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {groups.map((group, idx) => (
                                  <div key={idx} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                                    <div className="bg-indigo-500 px-6 py-3 text-white">
                                      <h4 className="font-bold text-lg">
                                        📅 {group.year} - HK {group.semester}
                                      </h4>
                                    </div>
                                    <div className="p-5 overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b-2">
                                            <th className="px-4 py-3 text-left">Môn</th>
                                            <th className="px-4 py-3 text-center">GK</th>
                                            <th className="px-4 py-3 text-center">CK</th>
                                            <th className="px-4 py-3 text-center">TB</th>
                                            <th className="px-4 py-3 text-center">XL</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {group.items.map(score => (
                                            <tr key={score.id} className="border-t hover:bg-indigo-50/30">
                                              <td className="px-4 py-3 font-medium">{score.subject_name}</td>
                                              <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                                                  {typeof score.midterm_score === 'number' ? score.midterm_score.toFixed(1) : '-'}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 rounded-lg">
                                                  {typeof score.final_score === 'number' ? score.final_score.toFixed(1) : '-'}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg font-bold">
                                                  {typeof score.average_score === 'number' ? score.average_score.toFixed(1) : '-'}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                                                  score.classification === 'excellent' ? 'bg-green-500 text-white' :
                                                  score.classification === 'good' ? 'bg-blue-500 text-white' :
                                                  score.classification === 'average' ? 'bg-yellow-500 text-white' :
                                                  'bg-red-500 text-white'
                                                }`}>
                                                  {score.classification === 'excellent' ? 'Giỏi' :
                                                   score.classification === 'good' ? 'Khá' :
                                                   score.classification === 'average' ? 'TB' : 'Yếu'}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    ← Trước
                  </button>
                  <span className="px-4 py-2">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
