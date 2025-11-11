import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Filter, Eye, Download, Calendar, User, CheckCircle, X, BarChart3, Shield, Target, BookOpen, MessageCircle, Brain, TrendingUp, Award, AlertCircle, Sparkles, ExternalLink, ChevronRight, FileDown, Printer, CheckSquare, Square, Loader2, SlidersHorizontal } from "lucide-react";
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
  
  // Selection & Filters
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterAI, setFilterAI] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // UI State
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  
  const resultsPerPage = 20;

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

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['testUserProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 2000),
    enabled: canViewAllTests,
    initialData: []
  });

  const { data: userAccounts = [] } = useQuery({
    queryKey: ['testUserAccounts'],
    queryFn: () => base44.entities.User.list('-created_date', 2000),
    enabled: canViewAllTests,
    initialData: []
  });

  const users = useMemo(() => {
    return userProfiles.map(profile => {
      const account = userAccounts.find(acc => acc.id === profile.user_id);
      return {
        ...profile,
        full_name: account?.full_name || profile.full_name || 'N/A',
        email: account?.email || 'N/A'
      };
    });
  }, [userProfiles, userAccounts]);

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
    onSuccess: (deletedResultId) => {
      queryClient.invalidateQueries({ queryKey: ['testResults'] });
      toast.success('Đã xóa kết quả test');
      setSelectedIds(prev => prev.filter(id => id !== deletedResultId));
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const uniqueClasses = useMemo(() => {
    const classes = new Set();
    users.forEach(u => {
      if (u.class_name) classes.add(u.class_name);
    });
    return Array.from(classes).sort();
  }, [users]);

  const filteredResults = useMemo(() => {
    let results = [...testResults];

    if (searchTerm) {
      results = results.filter(result => {
        const user = users.find(u => u.user_id === result.user_id);
        const userCode = user?.user_code?.toLowerCase() || '';
        const fullName = user?.full_name?.toLowerCase() || '';
        const className = user?.class_name?.toLowerCase() || '';
        const testName = result.test_name?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();

        return testName.includes(searchLower) ||
               userCode.includes(searchLower) ||
               fullName.includes(searchLower) ||
               className.includes(searchLower);
      });
    }

    if (filterType !== "all") {
      results = results.filter(r => r.test_type === filterType);
    }

    if (filterClass !== "all") {
      results = results.filter(r => {
        const user = users.find(u => u.user_id === r.user_id);
        return user?.class_name === filterClass;
      });
    }

    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      results = results.filter(r => new Date(r.completed_date) >= fromDate);
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo + 'T23:59:59');
      results = results.filter(r => new Date(r.completed_date) <= toDate);
    }

    if (filterAI === "with_ai") {
      results = results.filter(r => r.ai_evaluation_id);
    } else if (filterAI === "without_ai") {
      results = results.filter(r => !r.ai_evaluation_id);
    }

    if (sortBy === "date_desc") {
      results.sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date));
    } else if (sortBy === "date_asc") {
      results.sort((a, b) => new Date(a.completed_date) - new Date(b.completed_date));
    } else if (sortBy === "name_asc") {
      results.sort((a, b) => {
        const userA = users.find(u => u.user_id === a.user_id);
        const userB = users.find(u => u.user_id === b.user_id);
        return (userA?.full_name || '').localeCompare(userB?.full_name || '');
      });
    } else if (sortBy === "type_asc") {
      results.sort((a, b) => a.test_type.localeCompare(b.test_type));
    }

    return results;
  }, [testResults, users, searchTerm, filterType, filterClass, filterDateFrom, filterDateTo, filterAI, sortBy]);

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    return filteredResults.slice(start, start + resultsPerPage);
  }, [filteredResults, currentPage]);

  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

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

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedResults.length && paginatedResults.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedResults.map(r => r.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleViewDetail = (result) => {
    setSelectedResult(result);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!canDeleteTests) {
      toast