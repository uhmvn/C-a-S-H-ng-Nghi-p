import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Eye, Download, Calendar, User, CheckCircle, X, BarChart3, Shield, TrendingUp, Loader2, SlidersHorizontal, FileDown } from "lucide-react";
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
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterAI, setFilterAI] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  
  const resultsPerPage = 20;

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user.role === "admin") {
          setUserPermissions(["view_all_tests", "delete_tests", "export_tests"]);
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
        console.error("Error fetching permissions:", error);
      }
    };
    fetchUserPermissions();
  }, []);

  const canViewAllTests = useMemo(() => {
    return userPermissions.includes("view_all_tests") || currentUser?.role === "admin";
  }, [userPermissions, currentUser]);

  const canDeleteTests = useMemo(() => {
    return userPermissions.includes("delete_tests") || currentUser?.role === "admin";
  }, [userPermissions, currentUser]);

  const canExportTests = useMemo(() => {
    return userPermissions.includes("export_tests") || currentUser?.role === "admin";
  }, [userPermissions, currentUser]);

  const { data: testResults = [], isLoading: loadingResults } = useQuery({
    queryKey: ["admin-test-results"],
    queryFn: async () => {
      return await base44.entities.TestResult.list("-completed_date");
    },
    enabled: canViewAllTests,
    initialData: []
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ["user-profiles-for-tests"],
    queryFn: async () => {
      return await base44.entities.UserProfile.list();
    },
    enabled: canViewAllTests,
    initialData: []
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users-for-tests"],
    queryFn: async () => {
      try {
        return await base44.asServiceRole.entities.User.list();
      } catch {
        return [];
      }
    },
    enabled: canViewAllTests && currentUser?.role === "admin",
    initialData: []
  });

  const userNameMap = useMemo(() => {
    const map = {};
    users.forEach(u => {
      map[u.id] = u.full_name || u.email;
    });
    userProfiles.forEach(p => {
      if (p.user_id && !map[p.user_id]) {
        map[p.user_id] = p.user_code || p.class_name || "N/A";
      }
    });
    return map;
  }, [users, userProfiles]);

  const userClassMap = useMemo(() => {
    const map = {};
    userProfiles.forEach(p => {
      if (p.user_id) {
        map[p.user_id] = p.class_name || "N/A";
      }
    });
    return map;
  }, [userProfiles]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set();
    userProfiles.forEach(p => {
      if (p.class_name) classes.add(p.class_name);
    });
    return Array.from(classes).sort();
  }, [userProfiles]);

  const uniqueTestTypes = useMemo(() => {
    const types = new Set();
    testResults.forEach(r => {
      if (r.test_type) types.add(r.test_type);
    });
    return Array.from(types);
  }, [testResults]);

  const filteredResults = useMemo(() => {
    let results = [...testResults];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(r => {
        const studentName = (userNameMap[r.user_id] || "").toLowerCase();
        const testName = (r.test_name || "").toLowerCase();
        return studentName.includes(term) || testName.includes(term) || r.user_id.toLowerCase().includes(term);
      });
    }

    if (filterType !== "all") {
      results = results.filter(r => r.test_type === filterType);
    }

    if (filterClass !== "all") {
      results = results.filter(r => userClassMap[r.user_id] === filterClass);
    }

    if (filterDateFrom) {
      results = results.filter(r => {
        const date = new Date(r.completed_date);
        return date >= new Date(filterDateFrom);
      });
    }
    if (filterDateTo) {
      results = results.filter(r => {
        const date = new Date(r.completed_date);
        return date <= new Date(filterDateTo);
      });
    }

    if (filterAI === "yes") {
      results = results.filter(r => r.ai_evaluation_id);
    } else if (filterAI === "no") {
      results = results.filter(r => !r.ai_evaluation_id);
    }

    results.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return new Date(b.completed_date) - new Date(a.completed_date);
        case "date_asc":
          return new Date(a.completed_date) - new Date(b.completed_date);
        case "name_asc":
          return (userNameMap[a.user_id] || "").localeCompare(userNameMap[b.user_id] || "");
        case "name_desc":
          return (userNameMap[b.user_id] || "").localeCompare(userNameMap[a.user_id] || "");
        default:
          return 0;
      }
    });

    return results;
  }, [testResults, searchTerm, filterType, filterClass, filterDateFrom, filterDateTo, filterAI, sortBy, userNameMap, userClassMap]);

  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedResults.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedResults.map(r => r.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.TestResult.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-test-results"]);
      toast.success("Đã xóa kết quả test");
    },
    onError: (error) => {
      toast.error("Lỗi khi xóa: " + error.message);
    }
  });

  const handleDelete = (id) => {
    if (confirm("Bạn có chắc muốn xóa kết quả test này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.warning("Chưa chọn kết quả nào");
      return;
    }
    if (confirm(`Xóa ${selectedIds.length} kết quả đã chọn?`)) {
      selectedIds.forEach(id => deleteMutation.mutate(id));
      setSelectedIds([]);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = selectedIds.length > 0
      ? filteredResults.filter(r => selectedIds.includes(r.id))
      : filteredResults;

    if (dataToExport.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }

    const headers = ["Học sinh", "Lớp", "Bài test", "Loại", "Ngày hoàn thành", "Số câu", "AI"];
    const rows = dataToExport.map(r => [
      userNameMap[r.user_id] || r.user_id,
      userClassMap[r.user_id] || "N/A",
      r.test_name || "N/A",
      r.test_type || "N/A",
      r.completed_date ? format(new Date(r.completed_date), "dd/MM/yyyy HH:mm", { locale: vi }) : "N/A",
      r.answers_count || 0,
      r.ai_evaluation_id ? "Có" : "Không"
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `test-results-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success(`Đã xuất ${dataToExport.length} kết quả`);
  };

  const handleExportPDF = async () => {
    const resultsToExport = selectedIds.length > 0
      ? filteredResults.filter(r => selectedIds.includes(r.id))
      : filteredResults;

    if (resultsToExport.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 0, total: resultsToExport.length });

    for (let i = 0; i < resultsToExport.length; i++) {
      const result = resultsToExport[i];
      setExportProgress({ current: i + 1, total: resultsToExport.length });

      const detailUrl = createPageUrl(`TestResultDetail?id=${result.id}`);
      window.open(detailUrl, "_blank");
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsExporting(false);
    toast.success(`Đã mở ${resultsToExport.length} cửa sổ để tải PDF. Vui lòng in/lưu từ mỗi trang.`);
  };

  const stats = useMemo(() => {
    return {
      total: testResults.length,
      withAI: testResults.filter(r => r.ai_evaluation_id).length,
      today: testResults.filter(r => {
        const date = new Date(r.completed_date);
        const today = new Date();
        return date.toDateString() === today.toDateString();
      }).length,
      thisWeek: testResults.filter(r => {
        const date = new Date(r.completed_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      }).length
    };
  }, [testResults]);

  if (!canViewAllTests) {
    return (
      <AdminLayout>
        <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-xl">
          <Shield className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-center text-gray-700">Bạn không có quyền xem kết quả test.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kết Quả Test</h1>
          <p className="text-gray-600">Quản lý và xem kết quả test của học sinh</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-indigo-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600">Tổng số test</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.withAI}</span>
            </div>
            <p className="text-sm text-gray-600">Có phân tích AI</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.today}</span>
            </div>
            <p className="text-sm text-gray-600">Hôm nay</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.thisWeek}</span>
            </div>
            <p className="text-sm text-gray-600">Tuần này</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, ID học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả loại test</option>
              {uniqueTestTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc {showAdvancedFilters ? "▲" : "▼"}
            </button>
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">Tất cả lớp</option>
                    {uniqueClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phân tích AI</label>
                  <select
                    value={filterAI}
                    onChange={(e) => setFilterAI(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">Tất cả</option>
                    <option value="yes">Có AI</option>
                    <option value="no">Chưa có AI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="date_desc">Ngày mới nhất</option>
                    <option value="date_asc">Ngày cũ nhất</option>
                    <option value="name_asc">Tên A-Z</option>
                    <option value="name_desc">Tên Z-A</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedIds.length > 0 && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-900">
                Đã chọn {selectedIds.length} kết quả
              </span>
              <div className="flex gap-2">
                {canExportTests && (
                  <>
                    <button
                      onClick={handleExportCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                    >
                      <FileDown className="w-4 h-4" />
                      Xuất CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {exportProgress.current}/{exportProgress.total}
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Xuất PDF
                        </>
                      )}
                    </button>
                  </>
                )}
                {canDeleteTests && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Xóa
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loadingResults ? (
            <SkeletonTable rows={5} columns={7} />
          ) : filteredResults.length === 0 ? (
            <EmptyState
              type="search"
              title="Không tìm thấy kết quả"
              description="Thử thay đổi bộ lọc hoặc tìm kiếm"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === paginatedResults.length && paginatedResults.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học sinh</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài test</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedResults.map((result) => {
                      const studentName = userNameMap[result.user_id] || result.user_id.slice(0, 8) + "...";
                      const className = userClassMap[result.user_id] || "N/A";

                      return (
                        <motion.tr
                          key={result.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(result.id)}
                              onChange={() => toggleSelectOne(result.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900 truncate max-w-[150px]" title={studentName}>
                                {studentName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{className}</td>
                          <td className="px-6 py-4">
                            <div className="max-w-[200px] truncate text-sm text-gray-900" title={result.test_name}>
                              {result.test_name || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                              {result.test_type || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {result.completed_date ? format(new Date(result.completed_date), "dd/MM/yyyy", { locale: vi }) : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            {result.ai_evaluation_id ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300" />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href={createPageUrl(`TestResultDetail?id=${result.id}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
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
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Hiển thị {(currentPage - 1) * resultsPerPage + 1} - {Math.min(currentPage * resultsPerPage, filteredResults.length)} / {filteredResults.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <span className="px-4 py-2">
                      Trang {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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