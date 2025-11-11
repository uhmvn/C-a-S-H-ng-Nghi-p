import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Eye, Download, Calendar, User, CheckCircle, X, BarChart3, Shield, Target, BookOpen, Brain, TrendingUp, Award, AlertCircle, Sparkles, ExternalLink, ChevronRight, FileDown, CheckSquare, Loader2, SlidersHorizontal } from "lucide-react";
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
    return userPermissions.includes('view_all_