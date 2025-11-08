
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Filter, Eye, Download, Calendar, User, CheckCircle, X, BarChart3, Shield, Target, BookOpen, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import { SkeletonTable } from "@/components/SkeletonLoader";

function AdminTestResultsContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch current user and permissions
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user.role === 'admin') {
          setUserPermissions(['view_all_tests', 'delete_tests', 'export_tests']);
        } else {
          // Fetch from UserProfile
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profiles && profiles.length > 0) {
            const userRole = profiles[0].role;
            
            // Fetch role permissions
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

  // Fetch data based on permissions
  const { data: testResults = [], isLoading } = useQuery({
    queryKey: ['testResults'],
    queryFn: async () => {
      if (!currentUser) return [];
      
      if (canViewAllTests) {
        return await base44.entities.TestResult.list('-completed_date', 500);
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

  const { data: users = [] } = useQuery({
    queryKey: ['testUsers'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 1000),
    enabled: canViewAllTests,
    initialData: []
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

  // Filter
  const filteredResults = useMemo(() => {
    return testResults.filter(result => {
      const user = users.find(u => u.user_id === result.user_id);
      
      const matchesSearch = !searchTerm || 
        result.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.user_code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || result.test_type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [testResults, users, searchTerm, filterType]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: testResults.length,
      holland: testResults.filter(r => r.test_type === 'holland').length,
      mbti: testResults.filter(r => r.test_type === 'mbti').length,
      iq: testResults.filter(r => r.test_type === 'iq').length,
      eq: testResults.filter(r => r.test_type === 'eq').length
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
      'User,Test Type,Test Name,Completed Date',
      ...filteredResults.map(r => {
        const user = users.find(u => u.user_id === r.user_id);
        return `${user?.user_code || r.user_id},${r.test_type},${r.test_name},${new Date(r.completed_date).toLocaleDateString('vi-VN')}`;
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

  // Helper function to render result details beautifully
  const renderResultDetail = (result) => {
    if (!result) return null;

    // For Holland test
    if (result.test_type === 'holland' && result.top_types) {
      return (
        <div className="space-y-4">
          <h4 className="font-bold text-gray-900 mb-4">Top 3 Nhóm Tính Cách</h4>
          {result.top_types.map((item, idx) => (
            <div key={idx} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-indigo-600">#{idx + 1}</span>
                <span className="text-xl font-bold text-gray-900">{item.percentage}%</span>
              </div>
              <h5 className="font-bold text-gray-900 mb-1">{item.name || item.type}</h5>
              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    // For MBTI test
    if (result.test_type === 'mbti' && result.results) {
      const mbtiData = result.results;
      return (
        <div className="space-y-4">
          <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <h4 className="text-4xl font-bold text-purple-600 mb-2">
              {mbtiData.mbti_type || 'N/A'}
            </h4>
            <p className="text-gray-600">{mbtiData.category || 'Personality Type'}</p>
          </div>
          
          {mbtiData.breakdown && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(mbtiData.breakdown).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">{key}</p>
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // For other tests or fallback
    if (result.results && typeof result.results === 'object') {
      return (
        <div className="space-y-3">
          {Object.entries(result.results).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">{key}:</p>
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

  // Helper function for creating page URLs (assuming '/admin' is the base path)
  const createPageUrl = (path) => {
    // This is a placeholder. In a real app, this would use a routing library
    // or a global configuration for base URLs.
    // Assuming the base path for pages is the current origin.
    // For Next.js/React, typically you'd use router.push or a known base path.
    return `${window.location.origin}/${path}`;
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Kết Quả Test</h1>
              <p className="text-gray-600">{filteredResults.length} kết quả</p>
              {!canViewAllTests && (
                <p className="text-sm text-yellow-600 mt-1">⚠️ Chỉ xem kết quả của bạn</p>
              )}
            </div>
            {canExportTests && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Tổng số</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-blue-600">{stats.holland}</p>
              <p className="text-xs text-gray-600">Holland</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-purple-600">{stats.mbti}</p>
              <p className="text-xs text-gray-600">MBTI</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-green-600">{stats.iq}</p>
              <p className="text-xs text-gray-600">IQ</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <p className="text-2xl font-bold text-yellow-600">{stats.eq}</p>
              <p className="text-xs text-gray-600">EQ</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm test hoặc người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border rounded-xl"
            >
              <option value="all">Tất cả loại test</option>
              <option value="holland">Holland</option>
              <option value="mbti">MBTI</option>
              <option value="iq">IQ</option>
              <option value="eq">EQ</option>
            </select>
          </div>
        </div>

        {/* Results Table */}
        {isLoading ? (
          <SkeletonTable rows={10} cols={5} />
        ) : filteredResults.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Chưa có kết quả test"
            description="Kết quả test sẽ xuất hiện ở đây sau khi học sinh hoàn thành"
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Học sinh</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Loại test</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Tên test</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Ngày hoàn thành</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredResults.map(result => {
                  const user = users.find(u => u.user_id === result.user_id);
                  
                  return (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {user?.user_code || result.user_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          result.test_type === 'holland' ? 'bg-blue-100 text-blue-800' :
                          result.test_type === 'mbti' ? 'bg-purple-100 text-purple-800' :
                          result.test_type === 'iq' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.test_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {result.test_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(result.completed_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetail(result)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canDeleteTests && (
                            <button
                              onClick={() => handleDelete(result.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Xóa"
                            >
                              <X className="w-4 h-4" />
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
        )}

        {/* Detail Modal - IMPROVED UI */}
        {isDetailModalOpen && selectedResult && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsDetailModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Chi Tiết Kết Quả Test</h3>
                <button onClick={() => setIsDetailModalOpen(false)}>
                  <X className="w-6 h-6 text-gray-600 hover:text-gray-900" />
                </button>
              </div>

              {/* Header Card */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-indigo-100 mb-1">Học sinh</p>
                    <p className="font-bold text-xl">
                      {users.find(u => u.user_id === selectedResult.user_id)?.user_code || selectedResult.user_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-100 mb-1">Loại test</p>
                    <p className="font-bold text-xl">{selectedResult.test_type.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-100 mb-1">Tên test</p>
                    <p className="font-bold">{selectedResult.test_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-100 mb-1">Ngày hoàn thành</p>
                    <p className="font-bold">
                      {new Date(selectedResult.completed_date).toLocaleDateString('vi-VN', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Scores Section */}
                {selectedResult.scores && Object.keys(selectedResult.scores).length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Điểm Số
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(selectedResult.scores).map(([key, value]) => {
                        // FIX: Handle case where value is an object
                        const displayValue = typeof value === 'object' && value !== null
                          ? `${value.total || 0}/${value.count || 0}`
                          : value;
                        
                        return (
                          <div key={key} className="bg-indigo-50 rounded-xl p-4 text-center">
                            <p className="text-sm text-gray-600 mb-1">{key}</p>
                            <p className="text-2xl font-bold text-indigo-600">{displayValue}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Result Detail - Beautiful Rendering */}
                <div className="bg-white rounded-2xl border-2 border-purple-100 p-6">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    Kết Quả Chi Tiết
                  </h4>
                  {renderResultDetail(selectedResult)}
                </div>

                {/* Suggested Careers */}
                {selectedResult.suggested_careers && selectedResult.suggested_careers.length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-green-100 p-6">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      Nghề Nghiệp Gợi Ý
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedResult.suggested_careers.map((career, idx) => (
                        <span key={idx} className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {career}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Combinations */}
                {selectedResult.suggested_combinations && selectedResult.suggested_combinations.length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-blue-100 p-6">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Tổ Hợp Môn Gợi Ý
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedResult.suggested_combinations.map((combo, idx) => (
                        <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {combo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interpretation */}
                {selectedResult.interpretation && (
                  <div className="bg-white rounded-2xl border-2 border-yellow-100 p-6">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-yellow-600" />
                      Diễn Giải
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{selectedResult.interpretation}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1 bg-gray-100 py-3 rounded-xl hover:bg-gray-200 font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => window.open(createPageUrl(`TestResultDetail?id=${selectedResult.id}`), '_blank')}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium"
                >
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
