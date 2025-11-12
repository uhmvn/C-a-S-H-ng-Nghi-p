
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, School, Calendar, Target, CheckCircle, Clock, FileText, AlertCircle,
  Award, TrendingUp, Plus, BookOpen, Brain, ExternalLink, Lightbulb, MessageCircle, X,
  Download, Zap, Activity, BarChart3, ArrowRight, Users, Edit, Camera, Save
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";
import toast, { Toaster } from 'react-hot-toast';
import { createPageUrl } from "@/utils";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import JourneyTimeline from "@/components/JourneyTimeline";
import InsightsCloud from "@/components/InsightsCloud";
import ClarityProgressCard from "@/components/ClarityProgressCard";
import SessionCard from "@/components/SessionCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function UserProfileContent() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [showAddScoreModal, setShowAddScoreModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    bio: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [scoreForm, setScoreForm] = useState({
    academic_year_id: '',
    semester: 1,
    subject_code: '',
    subject_name: '',
    midterm_score: '',
    final_score: '',
    average_score: '',
    classification: 'average'
  });

  // ✅ Fetch Academic Years
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academicYears'],
    queryFn: async () => {
      const years = await base44.entities.AcademicYear.filter({ is_active: true }, '-year_code');
      return years || [];
    },
    initialData: []
  });

  // ✅ FIX: Fetch Subjects WITHOUT duplicates
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', profileData?.grade_level],
    queryFn: async () => {
      const allSubjects = await base44.entities.Subject.filter({ is_active: true }, 'order');
      
      let filteredSubjects = allSubjects || [];

      if (profileData?.grade_level) {
        const gradeNum = parseInt(profileData.grade_level);
        const level = gradeNum >= 10 ? 'high_school' : 'middle_school';
        filteredSubjects = (allSubjects || []).filter(s => s.level === level || s.level === 'both');
      }

      // ✅ Remove duplicates by subject_code
      const uniqueSubjects = filteredSubjects.reduce((acc, current) => {
        const existing = acc.find(item => item.subject_code === current.subject_code);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      return uniqueSubjects;
    },
    enabled: !!profileData,
    initialData: []
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setError(null);
        const user = await base44.auth.me();

        if (user) {
          setCurrentUser(user);
          
          // ✅ Initialize edit form with user data
          setEditForm(prev => ({
            ...prev,
            full_name: user.full_name || ''
          }));

          if (user.role !== 'admin') {
            try {
              const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
              if (profiles && profiles.length > 0) {
                const userRole = profiles[0].role;
                const rolePerms = await base44.entities.RolePermission.filter({
                  role_key: userRole,
                  is_granted: true
                });
                setUserPermissions((rolePerms || []).map(rp => rp.permission_key));
              } else {
                setUserPermissions(['view_own_profile']);
              }
            } catch (permError) {
              setUserPermissions(['view_own_profile']);
            }
          } else {
            setUserPermissions(['view_own_profile', 'edit_own_profile', 'manage_all_users', 'view_test_results']);
          }
        } else {
          base44.auth.redirectToLogin(window.location.pathname);
        }
      } catch (error) {
        const isAuthError = error.message?.toLowerCase().includes('authentication') ||
                           error.message?.toLowerCase().includes('not authenticated') ||
                           error.message?.toLowerCase().includes('unauthorized') ||
                           error.response?.status === 401;

        if (!isAuthError) {
          setError(error.message || 'Không thể kết nối đến server');
        } else {
          base44.auth.redirectToLogin(window.location.pathname);
        }
      }
    };
    fetchUser();
  }, []);

  const canViewTestResults = useMemo(() => {
    return userPermissions.includes('view_test_results') ||
           userPermissions.includes('view_own_profile') ||
           currentUser?.role === 'admin';
  }, [userPermissions, currentUser]);

  const { data: profiles = [], isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const data = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
      return data || [];
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });

  useEffect(() => {
    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      setProfileData(profile);
      
      // ✅ Populate edit form with profile data
      setEditForm(prev => ({
        ...prev,
        full_name: currentUser?.full_name || profile.full_name || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        address: profile.address || '',
        bio: profile.bio || ''
      }));
    }
  }, [profiles, currentUser]);

  const { data: testResults = [] } = useQuery({
    queryKey: ['testResults', currentUser?.id],
    queryFn: async () => {
      if (!canViewTestResults || !currentUser?.id) return [];
      try {
        return await base44.entities.TestResult.filter({ user_id: currentUser.id }, '-completed_date') || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!currentUser && canViewTestResults,
    initialData: [],
  });

  const { data: academicScores = [], isLoading: scoresLoading, refetch: refetchScores } = useQuery({
    queryKey: ['academicScores', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) {
        return [];
      }
      
      try {
        const scores = await base44.entities.AcademicScore.filter({ user_id: currentUser.id });
        return scores || [];
      } catch (error) {
        console.error('❌ Error fetching academic scores:', error);
        return [];
      }
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });

  const { data: studentJourney } = useQuery({
    queryKey: ['studentJourney', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      try {
        const journeys = await base44.entities.StudentJourney.filter({ user_id: currentUser.id });
        return (journeys && journeys.length > 0) ? journeys[0] : null;
      } catch (error) {
        return null;
      }
    },
    enabled: !!currentUser?.id,
  });

  const { data: counselingSessions = [] } = useQuery({
    queryKey: ['counselingSessions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      try {
        return await base44.entities.AICounselingSession.filter({ user_id: currentUser.id }, '-session_date', 20) || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });

  // ✅ NEW: Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData) => {
      let avatarUrl = profileData?.avatar_url;
      
      // Upload avatar if file selected
      if (avatarFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
        avatarUrl = file_url;
      }
      
      // Update User full_name
      await base44.auth.updateMe({ full_name: formData.full_name });
      
      // Update UserProfile
      if (profileData?.id) {
        return await base44.entities.UserProfile.update(profileData.id, {
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          bio: formData.bio,
          avatar_url: avatarUrl
        });
      }
      return null; // Should not happen if profileData.id exists
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('✅ Đã cập nhật hồ sơ!');
      setShowEditProfileModal(false);
      setAvatarFile(null);
      // Refresh user data to get updated full_name
      base44.auth.me().then(user => setCurrentUser(user));
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  // ✅ ENHANCED: Validate score inputs
  const validateScore = (value) => {
    if (value === '') return true; // Allow empty for incomplete input
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 10;
  };

  const handleScoreChange = (field, value) => {
    // ✅ Validate on change
    if (value !== '' && !validateScore(value)) {
      toast.error('Điểm phải từ 0.0 đến 10.0');
      return;
    }
    setScoreForm(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (scoreForm.midterm_score !== '' && scoreForm.final_score !== '') {
      const midterm = parseFloat(scoreForm.midterm_score);
      const final = parseFloat(scoreForm.final_score);
      
      // ✅ Validate range
      if (!validateScore(scoreForm.midterm_score) || !validateScore(scoreForm.final_score)) {
        return;
      }
      
      if (!isNaN(midterm) && !isNaN(final)) {
        const avg = (midterm + final) / 2;
        const classification = avg >= 8.0 ? 'excellent' : avg >= 6.5 ? 'good' : avg >= 5.0 ? 'average' : 'weak';
        setScoreForm(prev => ({
          ...prev,
          average_score: avg.toFixed(1),
          classification: classification
        }));
      }
    } else {
      setScoreForm(prev => ({ ...prev, average_score: '', classification: 'average' }));
    }
  }, [scoreForm.midterm_score, scoreForm.final_score]);

  const groupedScores = useMemo(() => {
    const groups = {};
    (academicScores || []).forEach(score => {
      const key = `${score.academic_year_id || 'N/A'}-${score.semester}`;
      if (!groups[key]) {
        groups[key] = {
          year: score.academic_year_id || 'N/A',
          semester: score.semester,
          scores: []
        };
      }
      groups[key].scores.push(score);
    });

    return Object.values(groups).sort((a, b) => {
      const yearCompare = b.year.localeCompare(a.year);
      if (yearCompare !== 0) return yearCompare;
      return b.semester - a.semester;
    });
  }, [academicScores]);

  const academicAnalysis = useMemo(() => {
    if (!academicScores || academicScores.length === 0) return null;

    const validScores = (academicScores || []).filter(s => 
      typeof s.average_score === 'number' && !isNaN(s.average_score)
    );
    if (validScores.length === 0) return null;

    const totalAvg = validScores.reduce((sum, s) => sum + s.average_score, 0) / validScores.length;
    const subjectAvgs = {};

    validScores.forEach(score => {
      const subj = score.subject_name || score.subject_code;
      if (!subjectAvgs[subj]) {
        subjectAvgs[subj] = { total: 0, count: 0 };
      }
      subjectAvgs[subj].total += score.average_score;
      subjectAvgs[subj].count += 1;
    });

    const subjectList = Object.entries(subjectAvgs)
      .map(([name, data]) => ({
        name,
        avg: data.total / data.count
      }))
      .sort((a, b) => b.avg - a.avg);

    return {
      gpa: totalAvg.toFixed(2),
      strongSubjects: subjectList.slice(0, 3),
      weakSubjects: subjectList.slice(-3).reverse(),
      totalSubjects: subjectList.length
    };
  }, [academicScores]);

  const academicChartData = useMemo(() => {
    if (!academicScores || academicScores.length === 0) return [];

    const subjectMap = {};
    academicScores.forEach(score => {
      const subj = score.subject_name || score.subject_code;
      if (!subjectMap[subj]) {
        subjectMap[subj] = { name: subj, total: 0, count: 0 };
      }
      if (typeof score.average_score === 'number') {
        subjectMap[subj].total += score.average_score;
        subjectMap[subj].count += 1;
      }
    });

    return Object.values(subjectMap)
      .map(s => ({ name: s.name, average: (s.total / s.count).toFixed(1) }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 8);
  }, [academicScores]);

  const recentActivity = useMemo(() => {
    const activities = [];

    (testResults || []).slice(0, 3).forEach(test => {
      activities.push({
        type: 'test',
        title: `Hoàn thành: ${test.test_name}`,
        date: new Date(test.completed_date),
        icon: Brain,
        color: 'indigo'
      });
    });

    (counselingSessions || []).slice(0, 3).forEach(session => {
      activities.push({
        type: 'session',
        title: session.counseling_summary || 'Chat với AI',
        date: new Date(session.session_date),
        icon: MessageCircle,
        color: 'green'
      });
    });

    return activities.sort((a, b) => b.date - a.date).slice(0, 5);
  }, [testResults, counselingSessions]);

  const recommendedActions = useMemo(() => {
    const actions = [];

    if (!testResults || testResults.length === 0) {
      actions.push({
        title: 'Làm bài test đầu tiên',
        description: 'Khám phá tính cách và sở thích',
        icon: Brain,
        link: createPageUrl('Services?category=assessment'),
        color: 'from-indigo-500 to-purple-600'
      });
    }

    if (!studentJourney || !counselingSessions || counselingSessions.length === 0) {
      actions.push({
        title: 'Chat với AI Cố Vấn',
        description: 'Bắt đầu hành trình tự nhận thức',
        icon: MessageCircle,
        onClick: () => {
          // This is a bit hacky, but directly triggering the chatbox open.
          // In a real app, you'd likely have a global state or event bus for this.
          const brainButton = document.querySelector('button.fixed.bottom-4.right-4');
          if (brainButton) brainButton.click();
        },
        color: 'from-green-500 to-blue-600'
      });
    }

    if (!academicScores || academicScores.length === 0) {
      actions.push({
        title: 'Thêm điểm học bạ',
        description: 'Phân tích năng lực học tập',
        icon: BookOpen,
        onClick: () => {
          setActiveTab('transcript');
          setTimeout(() => setShowAddScoreModal(true), 300);
        },
        color: 'from-purple-500 to-pink-600'
      });
    }

    if (studentJourney && studentJourney.current_clarity_score >= 60) {
      actions.push({
        title: 'Xem gợi ý nghề nghiệp',
        description: 'Dựa trên kết quả phân tích',
        icon: Target,
        link: createPageUrl('Services?category=career_counseling'),
        color: 'from-yellow-500 to-orange-600'
      });
    }

    return actions.slice(0, 4);
  }, [testResults, studentJourney, counselingSessions, academicScores]);

  // ✅ ENHANCED: Add Score with Validation
  const addScoreMutation = useMutation({
    mutationFn: async (scoreData) => {
      // ✅ Final validation before submit
      const midterm = parseFloat(scoreData.midterm_score);
      const final = parseFloat(scoreData.final_score);
      
      if (isNaN(midterm) || isNaN(final)) {
        throw new Error('Điểm phải là số hợp lệ');
      }
      
      if (midterm < 0 || midterm > 10 || final < 0 || final > 10) {
        throw new Error('Điểm phải từ 0.0 đến 10.0');
      }
      
      return await base44.entities.AcademicScore.create({
        student_id: profileData.id,
        user_id: currentUser.id, // ✅ ADD user_id for easier queries
        ...scoreData,
        midterm_score: midterm,
        final_score: final,
        average_score: parseFloat(scoreData.average_score),
        updated_at: new Date().toISOString()
      });
    },
    onSuccess: (newScore) => {
      queryClient.invalidateQueries({ queryKey: ['academicScores'] });
      queryClient.invalidateQueries({ queryKey: ['scores-academic'] });
      toast.success('✅ Đã thêm điểm thành công!');
      setShowAddScoreModal(false);
      setScoreForm({
        academic_year_id: '',
        semester: 1,
        subject_code: '',
        subject_name: '',
        midterm_score: '',
        final_score: '',
        average_score: '',
        classification: 'average'
      });
      setTimeout(() => refetchScores(), 500);
    },
    onError: (error) => {
      console.error('❌ Add score error:', error);
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const deleteScoreMutation = useMutation({
    mutationFn: async (scoreId) => {
      return await base44.entities.AcademicScore.delete(scoreId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicScores', profileData?.id] });
      queryClient.invalidateQueries({ queryKey: ['scores-academic'] }); // Invalidate admin view
      toast.success('✅ Đã xóa điểm!');
      setTimeout(() => refetchScores(), 500);
    },
    onError: (error) => {
      console.error('❌ Delete score error:', error);
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const displayFullName = currentUser?.full_name || 'Chưa cập nhật';
  const displayEmail = currentUser?.email || '';

  const displayRole = useMemo(() => {
    if (profileData && profileData.role) return profileData.role;
    if (currentUser && currentUser.role && currentUser.role !== 'user') return currentUser.role;
    return 'student';
  }, [profileData, currentUser]);

  const showTranscriptTab = displayRole === 'student';
  const isParent = displayRole === 'parent';

  // ✅ FIX: Safe access to linked students
  const linkedStudents = useMemo(() => {
    if (!isParent || !profileData?.linked_student_codes) return [];
    return Array.isArray(profileData.linked_student_codes) ? profileData.linked_student_codes : [];
  }, [isParent, profileData]);

  const roleLabels = {
    student: 'Học sinh',
    homeroom_teacher: 'GV Chủ nhiệm',
    subject_teacher: 'GV Bộ môn',
    school_admin: 'Admin Trường',
    department_admin: 'Admin Sở',
    counselor: 'Tư vấn viên',
    parent: 'Phụ huynh',
    admin: 'Quản Trị Viên',
    user: 'Người dùng'
  };

  if (error && !currentUser) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi kết nối</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || profileLoading) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Hồ sơ cá nhân" }]} />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ Sơ Cá Nhân</h1>
            <p className="text-gray-600">Quản lý thông tin và xem kết quả của bạn</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
              {/* ✅ Avatar with Upload */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                {profileData?.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt={displayFullName}
                    className="w-full h-full rounded-full object-cover border-4 border-indigo-100"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border-4 border-indigo-100">
                    <User className="w-16 h-16 text-indigo-600" />
                  </div>
                )}
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"
                  title="Chỉnh sửa hồ sơ"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">{displayFullName}</h2>
              <p className="text-indigo-600 font-medium mb-4">{roleLabels[displayRole] || displayRole}</p>

              {profileData?.user_code && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Mã người dùng</p>
                  <p className="font-mono font-bold text-xl text-indigo-600">{profileData.user_code}</p>
                </div>
              )}

              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm break-all">{displayEmail}</span>
                </div>
                {profileData?.school_name && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <School className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm">{profileData.school_name}</span>
                  </div>
                )}
                {profileData?.class_name && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm">Lớp {profileData.class_name}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Chỉnh sửa hồ sơ
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Thống kê
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tests hoàn thành</p>
                    <p className="font-bold">{testResults.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lần tư vấn AI</p>
                    <p className="font-bold">{counselingSessions.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Điểm học bạ</p>
                    <p className="font-bold">{academicScores.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ NEW: Linked Students for Parent */}
            {isParent && (
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-6 shadow-lg border-2 border-pink-200">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-600" />
                  Con Em ({linkedStudents.length})
                </h3>
                
                {linkedStudents.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-3">Chưa liên kết với con nào</p>
                    <a
                      href={createPageUrl("ParentLinking")}
                      className="inline-block bg-pink-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-pink-700"
                    >
                      Liên kết ngay
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedStudents.map((student, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 border-2 border-pink-100 hover:border-pink-300 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{student.student_name || student.student_code}</p>
                            <p className="text-xs text-gray-600">
                              {student.relationship === 'father' ? '👨 Cha' :
                               student.relationship === 'mother' ? '👩 Mẹ' :
                               student.relationship === 'guardian' ? '👤 Giám hộ' : '👥 Khác'}
                            </p>
                          </div>
                          {student.verified && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <a
                          href={createPageUrl(`ParentDashboard?student_code=${student.student_code}`)} // Ensure correct URL for dashboard
                          className="block w-full bg-pink-600 text-white text-center py-2 rounded-lg text-sm hover:bg-pink-700"
                        >
                          Xem Dashboard
                        </a>
                      </div>
                    ))}
                    
                    <a
                      href={createPageUrl("ParentLinking")}
                      className="block w-full bg-white border-2 border-pink-600 text-pink-600 text-center py-2 rounded-lg text-sm hover:bg-pink-50 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Liên kết thêm con
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            {recommendedActions.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 shadow-lg border-2 border-indigo-200">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  Hành động đề xuất
                </h3>
                <div className="space-y-3">
                  {recommendedActions.map((action, idx) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={idx}
                        onClick={action.onClick || (() => action.link && (window.location.href = action.link))}
                        whileHover={{ scale: 1.02 }}
                        className={`w-full bg-gradient-to-r ${action.color} text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all text-left`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm">{action.title}</p>
                            <p className="text-xs opacity-90">{action.description}</p>
                          </div>
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex gap-4 border-b mb-8 overflow-x-auto">
              {[
                { key: 'overview', label: 'Tổng quan', show: true },
                { key: 'journey', label: `Hành trình (${counselingSessions.length})`, show: displayRole === 'student' },
                { key: 'tests', label: `Tests (${testResults.length})`, show: canViewTestResults },
                { key: 'transcript', label: `Học bạ (${academicScores.length})`, show: showTranscriptTab }
              ].filter(t => t.show).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-4 px-2 font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.key ? 'text-indigo-600' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Welcome Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl p-8 shadow-lg">
                  <h3 className="text-2xl font-bold mb-2">Chào mừng {displayFullName}! 👋</h3>
                  <p className="text-indigo-100 mb-4">Đây là tổng quan về hồ sơ và tiến độ của bạn</p>

                  {studentJourney && studentJourney.current_clarity_score > 0 && (
                    <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Độ rõ ràng nghề nghiệp</span>
                        <span className="text-2xl font-bold">{studentJourney.current_clarity_score}%</span>
                      </div>
                      <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${studentJourney.current_clarity_score}%` }}
                          className="bg-white h-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-indigo-100 hover:border-indigo-300 transition-colors">
                    <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                    <p className="text-3xl font-bold text-gray-900">{testResults.length}</p>
                    <p className="text-sm text-gray-600">Bài tests</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-green-100 hover:border-green-300 transition-colors">
                    <MessageCircle className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-3xl font-bold text-gray-900">{counselingSessions.length}</p>
                    <p className="text-sm text-gray-600">Lần tư vấn</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-purple-100 hover:border-purple-300 transition-colors">
                    <BookOpen className="w-8 h-8 text-purple-600 mb-2" />
                    <p className="text-3xl font-bold">{academicScores.length}</p>
                    <p className="text-sm text-gray-600">Điểm số</p>
                  </div>
                </div>

                {/* Journey Preview */}
                {studentJourney && studentJourney.key_insights && (
                  <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold text-2xl flex items-center gap-2">
                        <Lightbulb className="w-6 h-6 text-indigo-600" />
                        Insights gần đây
                      </h4>
                      <button
                        onClick={() => setActiveTab('journey')}
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        Xem đầy đủ
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    <InsightsCloud insights={studentJourney.key_insights} />
                  </div>
                )}

                {/* Academic Chart Preview */}
                {academicChartData.length > 0 && (
                  <div className="bg-white rounded-3xl p-8 shadow-lg">
                    <h4 className="font-bold text-xl mb-6 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-indigo-600" />
                      Điểm trung bình các môn
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={academicChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} className="text-xs" />
                        <YAxis domain={[0, 10]} className="text-xs" />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0px 0px 10px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="average" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recent Activity */}
                {recentActivity.length > 0 && (
                  <div className="bg-white rounded-3xl p-8 shadow-lg">
                    <h4 className="font-bold text-xl mb-6 flex items-center gap-2">
                      <Clock className="w-6 h-6 text-indigo-600" />
                      Hoạt động gần đây
                    </h4>
                    <div className="space-y-3">
                      {recentActivity.map((activity, idx) => {
                        const Icon = activity.icon;
                        const colorClasses = {
                          indigo: 'bg-indigo-100 text-indigo-600',
                          green: 'bg-green-100 text-green-600',
                          purple: 'bg-purple-100 text-purple-600'
                        };
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className={`w-10 h-10 ${colorClasses[activity.color]} rounded-lg flex items-center justify-center`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{activity.title}</p>
                              <p className="text-xs text-gray-500">
                                {format(activity.date, 'dd/MM/yyyy HH:mm', { locale: vi })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'journey' && displayRole === 'student' && (
              <div className="space-y-6">
                {studentJourney ? (
                  <>
                    <ClarityProgressCard
                      currentScore={studentJourney.current_clarity_score || 0}
                      previousScore={studentJourney.milestones?.[0]?.clarity_score || 0}
                    />

                    {studentJourney.key_insights && (
                      <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-indigo-200">
                        <h4 className="font-bold text-2xl mb-6 flex items-center gap-2">
                          <Lightbulb className="w-6 h-6 text-indigo-600" />
                          Insights Về Bạn
                        </h4>
                        <InsightsCloud insights={studentJourney.key_insights} />
                      </div>
                    )}

                    {studentJourney.milestones && studentJourney.milestones.length > 0 && (
                      <div className="bg-white rounded-3xl p-8 shadow-lg">
                        <h4 className="font-bold text-2xl mb-6 flex items-center gap-2">
                          <TrendingUp className="w-6 h-6 text-indigo-600" />
                          Timeline Phát Triển ({studentJourney.milestones.length})
                        </h4>
                        <JourneyTimeline milestones={studentJourney.milestones} />
                      </div>
                    )}

                    {counselingSessions.length > 0 && (
                      <div className="bg-white rounded-3xl p-8 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-bold text-2xl">Lịch Sử Tư Vấn ({counselingSessions.length})</h4>
                          <div className="text-sm text-gray-600">
                            {counselingSessions.filter(s => s.is_completed).length} hoàn tất
                          </div>
                        </div>
                        <div className="space-y-4">
                          {counselingSessions.map((session, idx) => (
                            <SessionCard key={session.id} session={session} index={idx} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center">
                    <Brain className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h4 className="font-bold text-gray-900 mb-2">Bắt Đầu Hành Trình</h4>
                    <p className="text-gray-600 mb-6">Chat với AI để khám phá bản thân!</p>
                    <div className="bg-indigo-50 rounded-xl p-4 max-w-md mx-auto">
                      <p className="text-sm text-gray-700 mb-3">💡 Click vào icon Brain (góc phải dưới) để:</p>
                      <ul className="text-xs text-left text-gray-600 space-y-1">
                        <li>✅ Khám phá sở thích, mục tiêu</li>
                        <li>✅ Tăng độ rõ ràng nghề nghiệp</li>
                        <li>✅ Nhận gợi ý cá nhân hóa</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tests' && canViewTestResults && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                  <h3 className="text-xl font-bold">Kết Quả Tests</h3>
                  <p className="text-sm text-gray-600">{testResults.length} bài test</p>
                </div>

                {testResults.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center">
                    <Brain className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h4 className="font-bold text-gray-900 mb-2">Chưa có kết quả test</h4>
                    <p className="text-gray-600 mb-6">Hãy bắt đầu làm test!</p>
                    <a
                      href={createPageUrl("Services?category=assessment")}
                      className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700"
                    >
                      Xem bài test
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testResults.map((result, idx) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Brain className="w-6 h-6 text-indigo-600" />
                              <h4 className="text-lg font-bold text-gray-900">{result.test_name}</h4>
                              {result.test_version && (
                                <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                  v{result.test_version}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {format(new Date(result.completed_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </p>
                          </div>
                          <a
                            href={createPageUrl(`TestResultDetail?id=${result.id}`)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                          >
                            Chi tiết
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>

                        {result.top_types && result.top_types.length > 0 && (
                          <div className="grid grid-cols-3 gap-3">
                            {result.top_types.slice(0, 3).map((type, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500">#{idx + 1}</p>
                                <p className="text-sm font-bold">{type.type || type.name}</p>
                                <p className="text-lg font-bold text-indigo-600">{type.percentage}%</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transcript' && showTranscriptTab && (
              <div className="space-y-6">
                {academicAnalysis && (
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
                    <h3 className="text-2xl font-bold mb-6">Phân Tích Học Lực</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-white/10 rounded-2xl p-5">
                        <Award className="w-8 h-8 mb-2" />
                        <p className="text-3xl font-bold">{academicAnalysis.gpa}</p>
                        <p className="text-xs">GPA</p>
                      </div>
                      <div className="bg-white/10 rounded-2xl p-5">
                        <TrendingUp className="w-8 h-8 mb-2" />
                        <p className="text-sm font-bold truncate">{academicAnalysis.strongSubjects[0]?.name || 'N/A'}</p>
                        <p className="text-2xl font-bold">{academicAnalysis.strongSubjects[0]?.avg.toFixed(1) || '-'}</p>
                        <p className="text-xs">Môn mạnh nhất</p>
                      </div>
                      <div className="bg-white/10 rounded-2xl p-5">
                        <Target className="w-8 h-8 mb-2" />
                        <p className="text-sm font-bold truncate">{academicAnalysis.weakSubjects[0]?.name || 'N/A'}</p>
                        <p className="text-2xl font-bold">{academicAnalysis.weakSubjects[0]?.avg.toFixed(1) || '-'}</p>
                        <p className="text-xs">Cần cải thiện</p>
                      </div>
                      <div className="bg-white/10 rounded-2xl p-5">
                        <BookOpen className="w-8 h-8 mb-2" />
                        <p className="text-3xl font-bold">{academicAnalysis.totalSubjects}</p>
                        <p className="text-xs">Tổng môn</p>
                      </div>
                    </div>

                    {/* Top 3 subjects detail */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {academicAnalysis.strongSubjects.slice(0, 3).map((subj, idx) => (
                        <div key={idx} className="bg-white/10 rounded-xl p-3 text-center">
                          <p className="text-xs opacity-80">#{idx + 1}</p>
                          <p className="font-bold text-sm truncate">{subj.name}</p>
                          <p className="text-xl font-bold">{subj.avg.toFixed(1)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center bg-white rounded-2xl p-6 shadow-sm border">
                  <div>
                    <h3 className="text-xl font-bold">Bảng Điểm Chi Tiết</h3>
                    <p className="text-sm text-gray-600">{academicScores.length} bản ghi • {groupedScores.length} kỳ học</p>
                  </div>
                  <button
                    onClick={() => setShowAddScoreModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm điểm
                  </button>
                </div>

                {scoresLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Đang tải điểm...</p>
                  </div>
                ) : groupedScores.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center">
                    <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h4 className="font-bold text-gray-900 mb-2">Chưa có điểm</h4>
                    <p className="text-gray-600 mb-6">Thêm điểm học bạ để AI có thể phân tích chính xác hơn</p>
                    <button
                      onClick={() => setShowAddScoreModal(true)}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Thêm điểm đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedScores.map((group, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-3xl shadow-lg border-2 border-indigo-100 overflow-hidden"
                      >
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-white">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-lg flex items-center gap-2">
                              <Calendar className="w-5 h-5" />
                              Năm {group.year} - Học kỳ {group.semester}
                            </h4>
                            <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                              {group.scores.length} môn
                            </div>
                          </div>
                        </div>
                        <div className="p-6 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-indigo-100">
                                <th className="px-4 py-3 text-left font-bold text-gray-700">Môn học</th>
                                <th className="px-4 py-3 text-center font-bold text-gray-700">Giữa kỳ</th>
                                <th className="px-4 py-3 text-center font-bold text-gray-700">Cuối kỳ</th>
                                <th className="px-4 py-3 text-center font-bold text-gray-700">TB</th>
                                <th className="px-4 py-3 text-center font-bold text-gray-700">Xếp loại</th>
                                <th className="px-4 py-3 text-center font-bold text-gray-700">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.scores.map((score, scoreIdx) => (
                                <motion.tr
                                  key={score.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: scoreIdx * 0.05 }}
                                  className="border-t border-gray-100 hover:bg-indigo-50/50 transition-colors"
                                >
                                  <td className="px-4 py-4 font-medium text-gray-900">{score.subject_name}</td>
                                  <td className="px-4 py-4 text-center">
                                    <span className="inline-block px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-medium">
                                      {typeof score.midterm_score === 'number' ? score.midterm_score.toFixed(1) : '-'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <span className="inline-block px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-medium">
                                      {typeof score.final_score === 'number' ? score.final_score.toFixed(1) : '-'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <span className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-base shadow-sm">
                                      {typeof score.average_score === 'number' ? score.average_score.toFixed(1) : '-'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                      score.classification === 'excellent' ? 'bg-green-500 text-white' :
                                      score.classification === 'good' ? 'bg-blue-500 text-white' :
                                      score.classification === 'average' ? 'bg-yellow-500 text-white' :
                                      'bg-red-500 text-white'
                                    }`}>
                                      {score.classification === 'excellent' ? '🏆 Giỏi' :
                                       score.classification === 'good' ? '⭐ Khá' :
                                       score.classification === 'average' ? '📝 TB' : '📉 Yếu'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <button
                                      onClick={() => {
                                        if (confirm(`Xóa điểm ${score.subject_name}?`)) {
                                          deleteScoreMutation.mutate(score.id);
                                        }
                                      }}
                                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                      title="Xóa điểm"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Semester Summary */}
                        <div className="bg-indigo-50 px-6 py-4 border-t-2 border-indigo-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Trung bình kỳ:</span>
                            <span className="text-xl font-bold text-indigo-600">
                              {(group.scores.reduce((sum, s) => sum + (s.average_score || 0), 0) / group.scores.length).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Download Transcript */}
                {academicScores.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Xuất học bạ</h4>
                        <p className="text-sm text-gray-600">Tải về file Excel để lưu trữ hoặc in ấn</p>
                      </div>
                      <button
                        onClick={() => {
                          const rows = [['Năm học', 'Học kỳ', 'Môn', 'Điểm GK', 'Điểm CK', 'TB', 'Xếp loại'].join(',')];
                          academicScores.forEach(score => {
                            rows.push([
                              score.academic_year_id || '',
                              score.semester || '',
                              score.subject_name || '',
                              (typeof score.midterm_score === 'number' ? score.midterm_score.toFixed(1) : ''),
                              (typeof score.final_score === 'number' ? score.final_score.toFixed(1) : ''),
                              (typeof score.average_score === 'number' ? score.average_score.toFixed(1) : ''),
                              score.classification === 'excellent' ? 'Giỏi' :
                              score.classification === 'good' ? 'Khá' :
                              score.classification === 'average' ? 'TB' : 'Yếu'
                            ].join(','));
                          });
                          const csv = rows.join('\n');
                          const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = `hoc-ba-${displayFullName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
                          link.click();
                          toast.success('Đã tải xuống học bạ!');
                        }}
                        className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 shadow-md"
                      >
                        <Download className="w-5 h-5" />
                        Tải Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ NEW: Edit Profile Modal */}
      {showEditProfileModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditProfileModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit className="w-6 h-6 text-indigo-600" />
                Chỉnh Sửa Hồ Sơ
              </h3>
              <button onClick={() => setShowEditProfileModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="text-center">
                <label className="block text-sm font-medium mb-2">Ảnh đại diện</label>
                <div className="relative inline-block">
                  {avatarFile ? (
                    <img
                      src={URL.createObjectURL(avatarFile)}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                    />
                  ) : profileData?.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt={displayFullName}
                      className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border-4 border-indigo-100">
                      <User className="w-16 h-16 text-indigo-600" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
                {avatarFile && (
                  <button
                    onClick={() => setAvatarFile(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Hủy ảnh
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    placeholder="0123456789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Ngày sinh</label>
                  <input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Địa chỉ</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    placeholder="Số nhà, đường, phường/xã"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Giới thiệu bản thân</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                  rows="4"
                  placeholder="Viết vài dòng về bạn..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => updateProfileMutation.mutate(editForm)}
                disabled={updateProfileMutation.isPending || !editForm.full_name}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ✅ ENHANCED: Add Score Modal with Validation */}
      {showAddScoreModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddScoreModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-6 h-6 text-indigo-600" />
                Thêm Điểm Mới
              </h3>
              <button onClick={() => setShowAddScoreModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">📅 Năm học *</label>
                  {academicYears.length > 0 ? (
                    <select
                      value={scoreForm.academic_year_id}
                      onChange={(e) => setScoreForm({...scoreForm, academic_year_id: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                    >
                      <option value="">-- Chọn năm học --</option>
                      {academicYears.map(year => (
                        <option key={year.id} value={year.year_code}>
                          {year.name || year.year_code}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                      ⚠️ Chưa có năm học. Liên hệ admin để thêm.
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">📖 Học kỳ *</label>
                  <select
                    value={scoreForm.semester}
                    onChange={(e) => setScoreForm({...scoreForm, semester: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                  >
                    <option value={1}>Học kỳ 1</option>
                    <option value={2}>Học kỳ 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">📚 Môn học *</label>
                {subjects.length > 0 ? (
                  <select
                    value={scoreForm.subject_code}
                    onChange={(e) => {
                      const selected = subjects.find(s => s.subject_code === e.target.value);
                      setScoreForm({
                        ...scoreForm,
                        subject_code: selected ? selected.subject_code : '',
                        subject_name: selected ? selected.name : ''
                      });
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.subject_code}>
                        {s.name} ({s.subject_code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                    ⚠️ Chưa có môn học. Liên hệ admin để thêm.
                  </div>
                )}
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
                <p className="text-sm font-medium mb-3 text-gray-700">Nhập điểm (0.0 - 10.0):</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Điểm giữa kỳ *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={scoreForm.midterm_score}
                      onChange={(e) => handleScoreChange('midterm_score', e.target.value)}
                      placeholder="0.0 - 10.0"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none text-center font-bold text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Điểm cuối kỳ *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={scoreForm.final_score}
                      onChange={(e) => handleScoreChange('final_score', e.target.value)}
                      placeholder="0.0 - 10.0"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none text-center font-bold text-lg"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  ⚠️ Điểm phải từ 0.0 đến 10.0
                </p>
              </div>

              {scoreForm.average_score && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Điểm trung bình</p>
                      <p className="text-3xl font-bold">{scoreForm.average_score}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-90">Xếp loại</p>
                      <p className="text-xl font-bold">
                        {scoreForm.classification === 'excellent' ? '🏆 Giỏi' :
                         scoreForm.classification === 'good' ? '⭐ Khá' :
                         scoreForm.classification === 'average' ? '📝 TB' : '📉 Yếu'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddScoreModal(false)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => addScoreMutation.mutate(scoreForm)}
                disabled={
                  addScoreMutation.isPending || 
                  !scoreForm.subject_code || 
                  !scoreForm.academic_year_id || 
                  scoreForm.midterm_score === '' || 
                  scoreForm.final_score === '' ||
                  !validateScore(scoreForm.midterm_score) ||
                  !validateScore(scoreForm.final_score)
                }
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {addScoreMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Thêm điểm
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function UserProfile() {
  return (
    <>
      <UserProfileContent />
      <Toaster />
    </>
  );
}
