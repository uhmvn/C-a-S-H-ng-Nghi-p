
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
  const [html2pdfLoaded, setHtml2pdfLoaded] = useState(false);
  
  const resultsPerPage = 20;

  // Load html2pdf.js from CDN
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.html2pdf && !html2pdfLoaded) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.async = true;
      script.onload = () => {
        console.log("html2pdf.js loaded successfully");
        setHtml2pdfLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load html2pdf.js");
        toast.error("Không thể tải thư viện xuất PDF. Vui lòng kiểm tra kết nối mạng.");
      };
      document.head.appendChild(script);
    } else if (typeof window !== 'undefined' && window.html2pdf) {
      setHtml2pdfLoaded(true);
    }
  }, [html2pdfLoaded, toast]); // Add toast to dependency array if it's stable

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

  // Enhanced CSV Export with full data
  const handleExportCSV = async () => {
    const dataToExport = selectedIds.length > 0
      ? filteredResults.filter(r => selectedIds.includes(r.id))
      : filteredResults;

    if (dataToExport.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }

    toast.info("Đang chuẩn bị dữ liệu xuất...");

    // Fetch AI evaluations for each result
    const enrichedData = await Promise.all(
      dataToExport.map(async (r) => {
        let aiEval = null;
        if (r.ai_evaluation_id) {
          try {
            const evals = await base44.entities.AIEvaluation.filter({ 
              entity_id: r.id,
              evaluation_type: "test_result" 
            });
            aiEval = evals?.[0];
          } catch (error) {
            console.error("Error fetching AI eval:", error);
          }
        }
        return { result: r, aiEval };
      })
    );

    const headers = [
      "Học sinh",
      "Lớp",
      "Bài test",
      "Loại test",
      "Version",
      "Ngày hoàn thành",
      "Thời gian làm (phút)",
      "Số câu trả lời",
      "Top Type 1",
      "% Type 1",
      "Top Type 2",
      "% Type 2",
      "Top Type 3",
      "% Type 3",
      "Có AI",
      "Độ tin cậy AI",
      "Điểm mạnh 1",
      "Điểm mạnh 2",
      "Điểm mạnh 3",
      "Điểm cần cải thiện 1",
      "Điểm cần cải thiện 2",
      "Nghề nghiệp gợi ý 1",
      "Nghề nghiệp gợi ý 2",
      "Nghề nghiệp gợi ý 3"
    ];

    const rows = enrichedData.map(({ result: r, aiEval }) => {
      const topTypes = r.top_types || [];
      const strengths = aiEval?.strengths || [];
      const weaknesses = aiEval?.weaknesses || [];
      const careers = aiEval?.suggested_careers || [];

      return [
        userNameMap[r.user_id] || r.user_id,
        userClassMap[r.user_id] || "N/A",
        r.test_name || "N/A",
        r.test_type || "N/A",
        r.test_version || "N/A",
        r.completed_date ? format(new Date(r.completed_date), "dd/MM/yyyy HH:mm", { locale: vi }) : "N/A",
        r.duration_seconds ? Math.round(r.duration_seconds / 60) : "N/A",
        r.answers_count || 0,
        topTypes[0]?.type || topTypes[0]?.name || "",
        topTypes[0]?.percentage || "",
        topTypes[1]?.type || topTypes[1]?.name || "",
        topTypes[1]?.percentage || "",
        topTypes[2]?.type || topTypes[2]?.name || "",
        topTypes[2]?.percentage || "",
        r.ai_evaluation_id ? "Có" : "Không",
        aiEval?.confidence_score || "",
        strengths[0] || "",
        strengths[1] || "",
        strengths[2] || "",
        weaknesses[0] || "",
        weaknesses[1] || "",
        careers[0] || "",
        careers[1] || "",
        careers[2] || ""
      ];
    });

    const csv = [headers, ...rows].map(row => 
      row.map(cell => {
        const cellStr = String(cell || "");
        return cellStr.includes(",") ? `"${cellStr}"` : cellStr;
      }).join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `test-results-full-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success(`Đã xuất ${dataToExport.length} kết quả với đầy đủ thông tin`);
  };

  // Generate PDF HTML template
  const generatePDFHTML = (result, aiEval, studentName, className) => {
    const topTypes = result.top_types || [];
    const strengths = aiEval?.strengths || [];
    const weaknesses = aiEval?.weaknesses || [];
    const recommendations = aiEval?.recommendations || [];
    const careers = aiEval?.analysis?.suggested_careers || aiEval?.suggested_careers || [];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Roboto', Arial, sans-serif;
            padding: 30px;
            background: #ffffff;
            color: #1f2937;
            line-height: 1.6;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #4f46e5;
          }
          
          .logo {
            font-size: 28px;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 5px;
          }
          
          .subtitle {
            font-size: 14px;
            color: #6b7280;
          }
          
          .breadcrumb {
            font-size: 12px;
            color: #9ca3af;
            margin-bottom: 20px;
          }
          
          .test-title {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 10px;
          }
          
          .test-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
          }
          
          .info-item {
            font-size: 13px;
            color: #4b5563;
          }
          
          .info-label {
            font-weight: 600;
            color: #374151;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 25px 0;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }
          
          .stat-icon {
            font-size: 32px;
            margin-bottom: 10px;
          }
          
          .stat-number {
            font-size: 36px;
            font-weight: 700;
            display: block;
          }
          
          .stat-label {
            font-size: 13px;
            opacity: 0.9;
          }
          
          .section {
            margin: 30px 0;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .top-types {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .type-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            position: relative;
          }
          
          .type-card.rank-1 {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          }
          
          .type-card.rank-2 {
            background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
          }
          
          .type-card.rank-3 {
            background: linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%);
          }
          
          .rank-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 48px;
            opacity: 0.3;
            font-weight: 700;
          }
          
          .type-name {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          
          .type-percentage {
            font-size: 40px;
            font-weight: 700;
          }
          
          .ai-section {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
            border-left: 5px solid #7c3aed;
          }
          
          .ai-title {
            font-size: 18px;
            font-weight: 700;
            color: #7c3aed;
            margin-bottom: 15px;
          }
          
          .ai-confidence {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 15px;
          }
          
          .strengths-weaknesses {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .list-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .list-title {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #374151;
          }
          
          .list-title.strengths {
            color: #10b981;
          }
          
          .list-title.weaknesses {
            color: #f59e0b;
          }
          
          .list-item {
            display: flex;
            align-items: start;
            margin-bottom: 10px;
            font-size: 13px;
            color: #4b5563;
          }
          
          .list-icon {
            margin-right: 8px;
            flex-shrink: 0;
          }
          
          .recommendations {
            margin-top: 20px;
          }
          
          .recommendation-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 12px;
            border-left: 4px solid #4f46e5;
          }
          
          .rec-title {
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 5px;
            font-size: 14px;
          }
          
          .rec-desc {
            font-size: 13px;
            color: #6b7280;
          }
          
          .priority-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
          }
          
          .priority-high {
            background: #fee2e2;
            color: #dc2626;
          }
          
          .priority-medium {
            background: #fef3c7;
            color: #d97706;
          }
          
          .priority-low {
            background: #dcfce7;
            color: #16a34a;
          }
          
          .careers-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .career-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .career-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 15px;
          }
          
          .career-match {
            font-size: 22px;
            font-weight: 700;
            color: #4f46e5;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          
          .contact-info {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            gap: 30px;
            font-size: 11px;
          }
          
          @page {
            margin: 15mm;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">CỬA SỔ NGHỀ NGHIỆP</div>
          <div class="subtitle">Career Guidance</div>
        </div>
        
        <div class="breadcrumb">Trang chủ > Hồ sơ > Kết quả test</div>
        
        <div class="test-title">${result.test_name || "Bài test"}</div>
        
        <div class="test-info">
          <div class="info-item">
            <span class="info-label">Học sinh:</span> ${studentName}
          </div>
          <div class="info-item">
            <span class="info-label">Lớp:</span> ${className}
          </div>
          <div class="info-item">
            <span class="info-label">Version:</span> ${result.test_version || "N/A"}
          </div>
          <div class="info-item">
            <span class="info-label">Hoàn thành:</span> ${result.completed_date ? format(new Date(result.completed_date), "dd/MM/yyyy HH:mm", { locale: vi }) : "N/A"}
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <span class="stat-number">${result.answers_count || 0}</span>
            <div class="stat-label">Câu trả lời</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <span class="stat-number">${topTypes.length}</span>
            <div class="stat-label">Xu hướng chính</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <span class="stat-number">${result.duration_seconds ? Math.round(result.duration_seconds / 60) : 0}</span>
            <div class="stat-label">Phút</div>
          </div>
        </div>
        
        ${topTypes.length > 0 ? `
          <div class="section">
            <div class="section-title">Kết Quả Tính Cách Của Bạn</div>
            <div class="top-types">
              ${topTypes.slice(0, 3).map((type, idx) => `
                <div class="type-card rank-${idx + 1}">
                  <div class="rank-badge">#${idx + 1}</div>
                  <div class="type-name">${type.type || type.name || "N/A"}</div>
                  <div class="type-percentage">${type.percentage || 0}%</div>
                </div>
              `).join("")}
            </div>
            ${result.interpretation ? `
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 15px; font-size: 13px; color: #4b5563;">
                ${result.interpretation}
              </div>
            ` : ""}
          </div>
        ` : ""}
        
        ${aiEval ? `
          <div class="ai-section">
            <div class="ai-title">🧠 Phân Tích AI Chuyên Sâu</div>
            <div class="ai-confidence">
              Độ tin cậy: ${aiEval.confidence_score || 0}% | Model: ${aiEval.ai_model || "N/A"}
            </div>
            
            <div class="strengths-weaknesses">
              ${strengths.length > 0 ? `
                <div class="list-box">
                  <div class="list-title strengths">✅ Điểm Mạnh</div>
                  ${strengths.map(s => `
                    <div class="list-item">
                      <span class="list-icon">✓</span>
                      <span>${s}</span>
                    </div>
                  `).join("")}
                </div>
              ` : ""}
              
              ${weaknesses.length > 0 ? `
                <div class="list-box">
                  <div class="list-title weaknesses">⚠️ Điểm Cần Cải Thiện</div>
                  ${weaknesses.map(w => `
                    <div class="list-item">
                      <span class="list-icon">→</span>
                      <span>${w}</span>
                    </div>
                  `).join("")}
                </div>
              ` : ""}
            </div>
            
            ${recommendations.length > 0 ? `
              <div class="recommendations">
                <div class="list-title">💡 Khuyến Nghị Phát Triển</div>
                ${recommendations.map(rec => `
                  <div class="recommendation-item">
                    <div class="rec-title">
                      ${rec.title || "Khuyến nghị"}
                      ${rec.priority ? `<span class="priority-badge priority-${rec.priority}">${rec.priority}</span>` : ""}
                    </div>
                    <div class="rec-desc">${rec.description || ""}</div>
                  </div>
                `).join("")}
              </div>
            ` : ""}
          </div>
        ` : ""}
        
        ${careers.length > 0 ? `
          <div class="section">
            <div class="section-title">🎯 Top Nghề Nghiệp Phù Hợp</div>
            <div class="careers-grid">
              ${careers.slice(0, 10).map(career => {
                const careerName = typeof career === "string" ? career : (career.career || career.name || "N/A");
                const matchPct = career.match_percentage || career.percentage || "";
                return `
                  <div class="career-card">
                    <div class="career-name">${careerName}</div>
                    ${matchPct ? `<div class="career-match">${matchPct}%</div>` : ""}
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ""}
        
        <div class="footer">
          <div class="logo" style="font-size: 18px; margin-bottom: 10px;">CỬA SỔ NGHỀ NGHIỆP</div>
          <div>Nền tảng hướng nghiệp thông minh dành cho học sinh THCS & THPT</div>
          <div class="contact-info">
            <div>📍 523, Phạm Hùng, Phường Bà Ria, TP Bà Ria, Bà Rịa - Vũng Tàu</div>
            <div>📞 (0254) 3 826 178</div>
            <div>✉️ c2nguyendu.baria.bariavungtau@moet.edu.vn</div>
          </div>
          <div style="margin-top: 10px;">© 2024 Cửa Sổ Nghề Nghiệp. All rights reserved.</div>
        </div>
      </body>
      </html>
    `;
  };

  // Enhanced PDF Export with html2pdf.js
  const handleExportPDF = async () => {
    if (typeof window === 'undefined' || !window.html2pdf) {
      toast.error("Đang tải thư viện PDF, vui lòng thử lại sau vài giây...");
      return;
    }

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

      try {
        // Fetch AI evaluation
        let aiEval = null;
        if (result.ai_evaluation_id) {
          try {
            const evals = await base44.entities.AIEvaluation.filter({ 
              entity_id: result.id,
              evaluation_type: "test_result" 
            });
            aiEval = evals?.[0];
          } catch (error) {
            console.error("Error fetching AI eval:", error);
          }
        }

        const studentName = userNameMap[result.user_id] || "HocSinh";
        const className = userClassMap[result.user_id] || "N/A";
        
        // Generate HTML
        const htmlContent = generatePDFHTML(result, aiEval, studentName, className);
        
        // Create temporary div
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        document.body.appendChild(tempDiv);
        
        // Generate filename
        const safeStudentName = studentName.replace(/[^a-zA-Z0-9\s_]/g, "").replace(/\s+/g, "_");
        const testType = (result.test_type || "test").replace(/[^a-zA-Z0-9\s_]/g, "").replace(/\s+/g, "_");
        const dateStr = result.completed_date ? format(new Date(result.completed_date), "yyyyMMdd") : "NoDate";
        const filename = `${safeStudentName}_${testType}_${dateStr}.pdf`;
        
        // Convert to PDF
        const opt = {
          margin: [10, 10, 10, 10],
          filename: filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            letterRendering: true
          },
          jsPDF: { 
            unit: "mm", 
            format: "a4", 
            orientation: "portrait" 
          }
        };
        
        await window.html2pdf().set(opt).from(tempDiv).save();
        
        // Cleanup
        document.body.removeChild(tempDiv);
        
        // Small delay between files
        if (i < resultsToExport.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error("PDF generation error:", error);
        toast.error(`Lỗi xuất PDF cho ${userNameMap[result.user_id]}: ${error.message}`);
      }
    }

    setIsExporting(false);
    toast.success(`Đã xuất ${resultsToExport.length} file PDF thành công!`);
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
                      Xuất CSV đầy đủ
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting || !html2pdfLoaded}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang xuất {exportProgress.current}/{exportProgress.total}...
                        </>
                      ) : !html2pdfLoaded ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang tải...
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
