import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Filter, Eye, Download, Calendar, User, CheckCircle, X, BarChart3, Shield, Target, BookOpen, MessageCircle, Brain, TrendingUp, Award, AlertCircle, Sparkles, ExternalLink, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import { SkeletonTable } from "@/components/SkeletonLoader";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

function AdminTestResultsContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 20;

  // Fetch current user and permissions
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user.role === 'admin') {
          setUserPermissions(['view_all_tests', 'delete_tests', 'export_tests']);
        } else {
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profiles && profiles.length > 0) {
            const userRole = profiles[0].role;
            const rolePerms = await base44.entities.RolePermission.filter({
              role_key: userRole,
              is_granted: true
            });
            setUserPermissions(rolePerms.map(rp => rp.permission_key));
          }
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };
    fetchUserPermissions();
  }, []);

  // Check permissions
  const canViewAllTests = useMemo(() => {
    return userPermissions.includes('view_all_tests') || 
           userPermissions.includes('manage_all_tests') ||
           currentUser?.role === 'admin';
  }, [userPermissions, currentUser]);

  const canDeleteTests = useMemo(() => {
    return userPermissions.includes('delete_tests') || 
           userPermissions.includes('manage_all_tests') ||
           currentUser?.role === 'admin';
  }, [userPermissions, currentUser]);

  const canExportTests = useMemo(() => {
    return userPermissions.includes('export_tests') || 
           userPermissions.includes('manage_all_tests') ||
           currentUser?.role === 'admin';
  }, [userPermissions, currentUser]);

  // Fetch test results
  const { data: testResults = [], isLoading } = useQuery({
    queryKey: ['testResults'],
    queryFn: async () => {
      if (!currentUser) return [];
      if (canViewAllTests) {
        return await base44.entities.TestResult.list('-completed_date', 1000);
      } else {
        return await base44.entities.TestResult.filter(
          { user_id: currentUser.id },
          '-completed_date'
        );
      }
    },
    enabled: !!currentUser,
    initialData: []
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['testUsers'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 2000),
    enabled: canViewAllTests,
    initialData: []
  });

  // ✅ Fetch AI Evaluations for selected result
  const { data: aiEvaluation } = useQuery({
    queryKey: ['aiEvaluation', selectedResult?.id],
    queryFn: async () => {
      if (!selectedResult) return null;
      try {
        const evals = await base44.entities.AIEvaluation.filter({
          entity_id: selectedResult.id,
          evaluation_type: 'test_result'
        }, '-created_at', 1);
        return evals?.[0] || null;
      } catch (error) {
        return null;
      }
    },
    enabled: !!selectedResult,
  });

  // ✅ Fetch Academic Scores for selected result
  const { data: academicScores = [] } = useQuery({
    queryKey: ['academicScores', selectedResult?.user_id],
    queryFn: async () => {
      if (!selectedResult?.user_id) return [];
      try {
        const scores = await base44.entities.AcademicScore.filter({ user_id: selectedResult.user_id });
        return scores || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedResult?.user_id,
  });

  // Delete mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (id) => {
      if (!canDeleteTests) {
        throw new Error('Bạn không có quyền xóa kết quả test');
      }
      
      const result = await base44.entities.TestResult.delete(id);
      
      await base44.entities.AuditLog.create({
        user_id: currentUser.id,
        user_email: currentUser.email,
        user_role: currentUser.role,
        action: 'delete',
        resource_type: 'test_result',
        resource_id: id,
        status: 'success'
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testResults'] });
      toast.success('Đã xóa kết quả test');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // Filter & Pagination
  const filteredResults = useMemo(() => {
    return testResults.filter(result => {
      const user = users.find(u => u.user_id === result.user_id);
      
      const matchesSearch = !searchTerm || 
        result.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.user_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || result.test_type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [testResults, users, searchTerm, filterType]);

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    return filteredResults.slice(start, start + resultsPerPage);
  }, [filteredResults, currentPage]);

  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

  // Stats
  const stats = useMemo(() => {
    return {
      total: testResults.length,
      holland: testResults.filter(r => r.test_type === 'holland').length,
      mbti: testResults.filter(r => r.test_type === 'mbti').length,
      iq: testResults.filter(r => r.test_type === 'iq').length,
      eq: testResults.filter(r => r.test_type === 'eq').length,
      custom: testResults.filter(r => r.test_type === 'custom').length
    };
  }, [testResults]);

  const handleViewDetail = (result) => {
    setSelectedResult(result);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!canDeleteTests) {
      toast.error('Bạn không có quyền xóa kết quả test');
      return;
    }
    if (confirm('Bạn có chắc muốn xóa kết quả test này?')) {
      deleteTestMutation.mutate(id);
    }
  };

  const handleExport = () => {
    if (!canExportTests) {
      toast.error('Bạn không có quyền export dữ liệu');
      return;
    }

    const csv = [
      'User Code,Full Name,Test Type,Test Name,Completed Date,Duration (s),Top Result',
      ...filteredResults.map(r => {
        const user = users.find(u => u.user_id === r.user_id);
        const topResult = r.top_types?.[0]?.name || r.top_types?.[0]?.type || 'N/A';
        return `${user?.user_code || 'N/A'},${user?.full_name || 'N/A'},${r.test_type},${r.test_name},${new Date(r.completed_date).toLocaleDateString('vi-VN')},${r.duration_seconds || 0},${topResult}`;
      })
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Đã export CSV');
  };

  // ✅ Enhanced Result Detail Renderer
  const renderResultDetail = (result) => {
    if (!result) return null;

    if (result.test_type === 'holland' && result.top_types) {
      return (
        <div className="space-y-4">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Top 3 Nhóm Tính Cách RIASEC
          </h4>
          {result.top_types.slice(0, 3).map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-gradient-to-r rounded-xl p-5 ${
                idx === 0 ? 'from-indigo-500 to-purple-600 text-white' :
                idx === 1 ? 'from-purple-400 to-pink-500 text-white' :
                'from-blue-400 to-indigo-500 text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold">#{idx + 1}</span>
                  <div>
                    <h5 className="font-bold text-xl">{item.name || item.type}</h5>
                    <p className="text-sm opacity-90">Điểm: {item.score?.toFixed(1) || 'N/A'}</p>
                  </div>
                </div>
                <span className="text-3xl font-bold">{item.percentage}%</span>
              </div>
              {item.description && (
                <p className="text-sm opacity-90 mt-2">{item.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      );
    }

    if (result.test_type === 'mbti' && result.results) {
      const mbtiData = result.results;
      return (
        <div className="space-y-4">
          <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
            <h4 className="text-5xl font-bold text-purple-600 mb-3">
              {mbtiData.mbti_type || 'N/A'}
            </h4>
            <p className="text-gray-700 font-medium text-lg">{mbtiData.category || 'Personality Type'}</p>
          </div>
          
          {mbtiData.breakdown && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(mbtiData.breakdown).map(([key, value]) => (
                <div key={key} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">{key}</p>
                  <p className="text-2xl font-bold text-purple-600">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (result.results && typeof result.results === 'object') {
      return (
        <div className="space-y-3">
          {Object.entries(result.results).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-xl p-4 border-l-4 border-indigo-500">
              <p className="text-sm font-bold text-gray-700 mb-2">{key}</p>
              <p className="text-base text-gray-900">
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </p>
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-gray-600">Không có dữ liệu chi tiết</p>;
  };

  // No permission
  if (currentUser && !canViewAllTests && testResults.length === 0) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-yellow-400 mr-3" />
              <div>
                <h3 className="font-bold text-yellow-800">Quyền truy cập bị hạn chế</h3>
                <p className="text-sm text-yellow-700">
                  Bạn chỉ có thể xem kết quả test của chính mình.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Kết Quả Test</h1>
              <p className="text-gray-600">{filteredResults.length} kết quả • Trang {currentPage}/{totalPages}</p>
              {!canViewAllTests && (
                <p className="text-sm text-yellow-600 mt-1">⚠️ Chỉ xem kết quả của bạn</p>
              )}
            </div>
            {canExportTests && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 shadow-lg transition-all"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            )}
          </div>

          {/* ✅ Enhanced Stats */}
          <div className="grid md:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl p-5 shadow-lg text-white">
              <FileText className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm opacity-80">Tổng số</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 shadow-lg text-white">
              <Target className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.holland}</p>
              <p className="text-sm opacity-80">Holland</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 shadow-lg text-white">
              <Brain className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.mbti}</p>
              <p className="text-sm opacity-80">MBTI</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-5 shadow-lg text-white">
              <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.iq}</p>
              <p className="text-sm opacity-80">IQ</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl p-5 shadow-lg text-white">
              <Award className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.eq}</p>
              <p className="text-sm opacity-80">EQ</p>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl p-5 shadow-lg text-white">
              <Sparkles className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.custom}</p>
              <p className="text-sm opacity-80">Khác</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-indigo-100 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên test, mã học sinh, họ tên..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none"
            >
              <option value="all">Tất cả loại test</option>
              <option value="holland">Holland (RIASEC)</option>
              <option value="mbti">MBTI (16 Personalities)</option>
              <option value="iq">IQ Test</option>
              <option value="eq">EQ Test</option>
              <option value="custom">Custom Tests</option>
            </select>
          </div>
        </div>

        {/* Results Table */}
        {isLoading ? (
          <SkeletonTable rows={10} cols={6} />
        ) : filteredResults.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Chưa có kết quả test"
            description="Kết quả test sẽ xuất hiện ở đây sau khi học sinh hoàn thành"
          />
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Học sinh</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Loại test</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Tên test</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Kết quả nổi bật</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Ngày hoàn thành</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedResults.map(result => {
                    const user = users.find(u => u.user_id === result.user_id);
                    const topResult = result.top_types?.[0];
                    
                    return (
                      <tr key={result.id} className="hover:bg-indigo-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{user?.user_code || result.user_id}</p>
                              <p className="text-xs text-gray-500">{user?.full_name || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                            result.test_type === 'holland' ? 'bg-blue-500 text-white' :
                            result.test_type === 'mbti' ? 'bg-purple-500 text-white' :
                            result.test_type === 'iq' ? 'bg-green-500 text-white' :
                            result.test_type === 'eq' ? 'bg-yellow-500 text-white' :
                            'bg-pink-500 text-white'
                          }`}>
                            {result.test_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{result.test_name}</p>
                          {result.test_version && (
                            <p className="text-xs text-gray-500">v{result.test_version}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {topResult ? (
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-yellow-600" />
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{topResult.name || topResult.type}</p>
                                <p className="text-xs text-gray-600">{topResult.percentage}%</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(result.completed_date), 'dd/MM/yyyy', { locale: vi })}
                          </div>
                          <p className="text-xs text-gray-500">
                            {format(new Date(result.completed_date), 'HH:mm', { locale: vi })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleViewDetail(result)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {canDeleteTests && (
                              <button
                                onClick={() => handleDelete(result.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ✅ Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 bg-white rounded-xl p-4 shadow-sm border">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
                >
                  ← Trước
                </button>
                <span className="text-gray-700 font-medium">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}

        {/* ✅ ENHANCED Detail Modal */}
        {isDetailModalOpen && selectedResult && (
          <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setIsDetailModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-5xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Chi Tiết Kết Quả Test</h3>
                    <p className="text-sm text-gray-600">Phân tích toàn diện</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Info Header Card */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-xl">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-indigo-100 mb-1 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Học sinh
                    </p>
                    <p className="font-bold text-xl">{users.find(u => u.user_id === selectedResult.user_id)?.user_code || selectedResult.user_id}</p>
                    <p className="text-sm text-indigo-100">{users.find(u => u.user_id === selectedResult.user_id)?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-100 mb-1">Loại test</p>
                    <p className="font-bold text-xl">{selectedResult.test_type.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-100 mb-1">Tên test</p>
                    <p className="font-bold">{selectedResult.test_name}</p>
                    {selectedResult.test_version && (
                      <p className="text-xs text-indigo-200">Version {selectedResult.test_version}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-indigo-100 mb-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Hoàn thành
                    </p>
                    <p className="font-bold">{format(new Date(selectedResult.completed_date), 'dd/MM/yyyy', { locale: vi })}</p>
                    <p className="text-sm text-indigo-100">{format(new Date(selectedResult.completed_date), 'HH:mm', { locale: vi })}</p>
                  </div>
                </div>
                {selectedResult.duration_seconds && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-sm text-indigo-100">
                      ⏱️ Thời gian làm bài: <strong>{Math.floor(selectedResult.duration_seconds / 60)} phút {selectedResult.duration_seconds % 60} giây</strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Scores Section */}
                {selectedResult.scores && Object.keys(selectedResult.scores).length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-indigo-600" />
                      Điểm Số Chi Tiết
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(selectedResult.scores).map(([key, value], idx) => {
                        const displayValue = typeof value === 'object' && value !== null
                          ? `${value.total || 0}/${value.count || 0}`
                          : value;
                        
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 text-center border-2 border-indigo-200"
                          >
                            <p className="text-xs text-gray-600 mb-1">{key}</p>
                            <p className="text-3xl font-bold text-indigo-600">{displayValue}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Result Detail */}
                <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                    Kết Quả Chi Tiết
                  </h4>
                  {renderResultDetail(selectedResult)}
                </div>

                {/* ✅ AI Evaluation */}
                {aiEvaluation && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-6 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Brain className="w-6 h-6 text-purple-600" />
                      Phân Tích AI
                      <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded-full">
                        {aiEvaluation.confidence_score || 0}% tin cậy
                      </span>
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {aiEvaluation.strengths && aiEvaluation.strengths.length > 0 && (
                        <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                          <h5 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Điểm Mạnh
                          </h5>
                          <ul className="space-y-1">
                            {aiEvaluation.strengths.map((s, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {aiEvaluation.weaknesses && aiEvaluation.weaknesses.length > 0 && (
                        <div className="bg-white rounded-xl p-4 border-2 border-orange-200">
                          <h5 className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Cần Cải Thiện
                          </h5>
                          <ul className="space-y-1">
                            {aiEvaluation.weaknesses.map((w, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-orange-600">→</span>
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {aiEvaluation.recommendations && aiEvaluation.recommendations.length > 0 && (
                      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
                        <h5 className="font-bold text-indigo-700 mb-2 flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Khuyến Nghị
                        </h5>
                        <div className="space-y-2">
                          {aiEvaluation.recommendations.map((rec, idx) => (
                            <div key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-indigo-400">
                              <p className="font-medium">{rec.title || `Khuyến nghị ${idx + 1}`}</p>
                              <p className="text-gray-600">{rec.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Academic Scores Context */}
                {academicScores.length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                      Điểm Học Tập ({academicScores.length} môn)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {academicScores.slice(0, 8).map((score, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                          <p className="text-xs text-gray-600 mb-1">{score.subject_name}</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {score.average_score?.toFixed(1) || '0.0'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Careers */}
                {selectedResult.suggested_careers && selectedResult.suggested_careers.length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-green-100 p-6 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="w-6 h-6 text-green-600" />
                      Nghề Nghiệp Gợi Ý ({selectedResult.suggested_careers.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedResult.suggested_careers.map((career, idx) => (
                        <span key={idx} className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-300">
                          {career}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interpretation */}
                {selectedResult.interpretation && (
                  <div className="bg-white rounded-2xl border-2 border-yellow-100 p-6 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-6 h-6 text-yellow-600" />
                      Diễn Giải
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{selectedResult.interpretation}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8 pt-6 border-t-2 border-gray-100">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1 bg-gray-100 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => window.open(createPageUrl(`TestResultDetail?id=${selectedResult.id}`), '_blank')}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <ExternalLink className="w-5 h-5" />
                  Xem Trang Chi Tiết
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminTestResults() {
  return (
    <ToastProvider>
      <AdminTestResultsContent />
    </ToastProvider>
  );
}