import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Compass, Phone, Mail, Linkedin, Facebook, MapPin, X, Menu, Users, LogOut, Settings, LayoutDashboard, User as UserIcon, ChevronDown } from "lucide-react";
import React from "react";
const ChatBot = React.lazy(() => import("@/components/ChatBot"));
const BookingModal = React.lazy(() => import("@/components/BookingModal"));
import ReviewWidget from "@/components/ReviewWidget";
import SeoSchema from "@/components/SeoSchema";
import LoadingScreen from "@/components/LoadingScreen";
import BackToTop from "@/components/BackToTop";
import PWAManifest from "@/components/pwa/PWAManifest";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import PerformanceMonitor from "@/components/optimization/PerformanceMonitor";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [initialService, setInitialService] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userRole, setUserRole] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = React.useState(false);
  const userMenuRef = React.useRef(null);
  const servicesDropdownRef = React.useRef(null);
  const [authError, setAuthError] = React.useState(false);
  const isAuthChecking = React.useRef(true);
  const [userPermissions, setUserPermissions] = useState([]);

  // Fetch public settings for footer & nav
  const { data: settings = [] } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: async () => {
      try {
        const all = await base44.entities.SystemSettings.filter({ is_public: true });
        return Array.isArray(all) ? all : [];
      } catch (error) {
        console.error('Error loading settings:', error);
        return [];
      }
    },
    initialData: [],
    staleTime: 30 * 60 * 1000, // 30 minutes - rarely changes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false
  });

  // Helper to get setting
  const getSetting = React.useCallback((key, defaultValue = '') => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value || defaultValue;
  }, [settings]);

  React.useEffect(() => {
    const checkUserRole = async () => {
      try {
        isAuthChecking.current = true;
        setAuthError(false);
        
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user) {
          if (user.role === 'admin') {
            setUserRole('admin');
            setUserPermissions(['manage_all_users']);
          } else {
            try {
              const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
              
              if (!profiles || profiles.length === 0) {
                await base44.entities.UserProfile.create({
                  user_id: user.id,
                  role: 'student'
                });
                setUserRole('student');
                setUserPermissions([]);
              } else {
                const profile = profiles[0];
                const currentProfileRole = profile.role || 'user';
                setUserRole(currentProfileRole);
                
                try {
                  const rolePerms = await base44.entities.RolePermission.filter({
                    role_key: currentProfileRole,
                    is_granted: true
                  });
                  const permissions = rolePerms.map(rp => rp.permission_key);
                  setUserPermissions(permissions);
                } catch (permError) {
                  setUserPermissions([]);
                }
              }
            } catch (profileError) {
              setUserRole('user');
              setUserPermissions([]);
            }
          }
        } else {
          setUserRole(null);
          setUserPermissions([]);
        }
      } catch (error) {
        const isAuthError = error.message?.toLowerCase().includes('authentication') || 
                           error.message?.toLowerCase().includes('not authenticated') ||
                           error.message?.toLowerCase().includes('unauthorized');
        
        if (!isAuthError) {
          setAuthError(true);
        }
        
        setUserRole(null);
        setCurrentUser(null);
        setUserPermissions([]);
      } finally {
        isAuthChecking.current = false;
      }
    };

    checkUserRole();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const openBookingModal = () => {
      setInitialService(null);
      setIsBookingOpen(true);
    };
    
    const openBookingModalWithService = (event) => {
      setInitialService(event.detail.service);
      setIsBookingOpen(true);
    };

    window.addEventListener('open-booking-modal', openBookingModal);
    window.addEventListener('open-booking-modal-with-service', openBookingModalWithService);

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      // New: Close services dropdown when clicking outside
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target)) {
        setShowServicesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-booking-modal', openBookingModal);
      window.removeEventListener('open-booking-modal-with-service', openBookingModalWithService);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLoadingComplete = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleCloseBookingModal = React.useCallback(() => {
    setIsBookingOpen(false);
    setInitialService(null);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      await base44.auth.logout();
      window.location.href = createPageUrl("/");
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const navigationItems = React.useMemo(() => {
    const baseItems = [
      { name: "Trang chủ", url: "/", roles: ['all'] },
      { 
        name: "Dịch vụ", 
        url: createPageUrl("Services"), 
        roles: ['all'],
        hasDropdown: true,
        dropdownItems: [
          { name: "Tất cả dịch vụ", url: createPageUrl("Services") },
          { name: "Trắc nghiệm", url: createPageUrl("Services?category=assessment") },
          { name: "Tư vấn nghề nghiệp", url: createPageUrl("Services?category=career_counseling") },
          { name: "Chọn trường - Chọn ngành", url: createPageUrl("Services?category=school_selection") },
          { name: "Game Khảo Sát", url: createPageUrl("CareerSurveyGame") },
        ]
      },
      { name: "Tổ hợp môn", url: createPageUrl("SubjectCombinations"), roles: ['all'] },
      { name: "Trường học", url: createPageUrl("Schools"), roles: ['all'] },
      { name: "Về chúng tôi", url: createPageUrl("Gallery"), roles: ['all'] },
      { name: "Liên hệ", url: createPageUrl("Contact"), roles: ['all'] }
    ];

    return baseItems.filter(item => 
      item.roles.includes('all') || 
      (userRole && item.roles.includes(userRole))
    );
  }, [userRole]);

  const isAdmin = React.useMemo(() => {
    return userRole && (
      userRole === 'admin' || 
      userRole === 'school_admin' ||
      userRole === 'department_admin'
    );
  }, [userRole]);

  const canAccessAdmin = React.useMemo(() => {
    return isAdmin || userPermissions.includes('manage_all_users');
  }, [isAdmin, userPermissions]);

  const isAdminPage = React.useMemo(() => {
    const adminPageNames = [
      'AdminDashboard', 'AdminUsers', 'AdminAppointments', 'AdminSchools', 'AdminSchoolTypes',
      'AdminTestResults', 'AdminTestManagement', 'AdminServices', 'AdminReports', 'AdminRBAC',
      'AdminAuditLog', 'AdminNotifications', 'AdminSettings', 'AdminCodeManagement', 'AdminCodeInventory',
      'AdminAcademicStructure', 'AdminTeachingAssignments', 'AdminCMS', 'AdminStudentInfo',
      'StudentManagement', 'TeacherManagement', 'StudentProgress',
      'ClassAnalytics', 'BulkImportStudents', 'AcademicRecords'
    ];
    
    const isAdminByName = currentPageName && adminPageNames.includes(currentPageName);
    const isAdminByPath = location.pathname.toLowerCase().includes('admin');
    
    return isAdminByName || isAdminByPath;
  }, [currentPageName, location.pathname]);

  if (isAdminPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <>
      <PWAManifest />
      <PWAInstallPrompt />
      <PerformanceMonitor />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans text-[length:var(--font-body)] leading-[1.618]">
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
          --font-display: 'Playfair Display', serif;
          --font-body: 'Inter', sans-serif;
          --color-primary: #4F46E5;
          --color-secondary: #9333EA;
        }

        .font-display { font-family: var(--font-display); }
        .font-body { font-family: var(--font-body); }
        
        /* ✅ IMPROVED: Solid white nav with subtle shadow */
        .glass-nav { 
          background: rgba(255, 255, 255, 0.98); 
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border-bottom: 1px solid rgba(229, 231, 235, 0.8);
        }
        
        .text-shadow-dark { text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); }
        
        /* ✅ NEW: Ensure readable text on light backgrounds */
        .nav-link-light {
          color: #1F2937;
          font-weight: 500;
        }
        
        .nav-link-light:hover {
          color: #EA580C;
        }
        
        .nav-link-light.active {
          color: #EA580C;
          font-weight: 600;
        }
      `}</style>

      <SeoSchema />

      {authError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">Không thể kết nối. Vui lòng kiểm tra kết nối mạng.</p>
              </div>
              <button onClick={() => setAuthError(false)} className="ml-auto">
                <X className="h-5 w-5 text-yellow-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMenuOpen ? 'glass-nav py-3' : 'bg-gradient-to-r from-indigo-600/95 to-purple-600/95 backdrop-blur-sm py-4 shadow-lg'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between pt-4">
            <Link to="/" className="flex items-center gap-3 group" aria-label={`${getSetting('company_name', 'CỬA SỔ NGHỀ NGHIỆP')} - Home`}>
              <div className="relative">
                <Compass className={`w-10 h-10 transition-all duration-300 ${
                  isScrolled || isMenuOpen ? 'text-orange-600' : 'text-white drop-shadow-lg'
                } group-hover:rotate-180`} />
              </div>
              <div className="flex flex-col">
                <span className={`font-display text-xl font-bold transition-all duration-300 ${
                  isScrolled || isMenuOpen ? 'text-gray-900' : 'text-white drop-shadow-lg'
                }`}>
                  {getSetting('company_name', 'CỬA SỔ NGHỀ NGHIỆP')}
                </span>
                <span className={`font-body text-xs tracking-wider transition-all duration-300 ${
                  isScrolled || isMenuOpen ? 'text-gray-600' : 'text-white/90 drop-shadow-md'
                }`}>
                  {getSetting('company_tagline', 'Career Guidance')}
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-6" role="menubar">
              {navigationItems.map((item) => (
                <div key={item.name} className="relative" ref={item.hasDropdown ? servicesDropdownRef : null}>
                  {item.hasDropdown ? (
                    <>
                      <button
                        onClick={() => setShowServicesDropdown(!showServicesDropdown)}
                        className={`text-sm transition-all duration-300 flex items-center gap-1 font-body ${
                          location.pathname.includes('Services') || location.pathname.includes('CareerSurveyGame')
                            ? (isScrolled || isMenuOpen ? 'text-orange-600 font-bold' : 'text-white font-bold drop-shadow-lg')
                            : (isScrolled || isMenuOpen ? 'text-gray-800 font-medium hover:text-orange-600' : 'text-white font-medium drop-shadow-md hover:text-orange-200')
                        }`}
                        aria-expanded={showServicesDropdown}
                        aria-haspopup="true"
                      >
                        {item.name}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showServicesDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border py-2 z-50" role="menu" aria-orientation="vertical" tabIndex={-1}>
                          {item.dropdownItems.map((dropItem) => (
                            <Link
                              key={dropItem.name}
                              to={dropItem.url}
                              onClick={() => setShowServicesDropdown(false)}
                              className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                              role="menuitem"
                              tabIndex={0}
                            >
                              {dropItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.url}
                      role="menuitem"
                      className={`text-sm transition-all duration-300 relative group font-body ${
                        location.pathname === item.url 
                          ? (isScrolled || isMenuOpen ? 'text-orange-600 font-bold' : 'text-white font-bold drop-shadow-lg')
                          : (isScrolled || isMenuOpen ? 'text-gray-800 font-medium hover:text-orange-600' : 'text-white font-medium drop-shadow-md hover:text-orange-200')
                      }`}
                      aria-current={location.pathname === item.url ? 'page' : undefined}
                    >
                      {item.name}
                      {(isScrolled || isMenuOpen) && (
                        <span className={`absolute -bottom-1 left-0 h-0.5 bg-orange-600 transition-all duration-300 ${
                          location.pathname === item.url ? 'w-full' : 'w-0 group-hover:w-full'
                        }`} aria-hidden="true" />
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBookingOpen(true)}
                className="hidden lg:block bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:from-red-600 hover:to-orange-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-orange-500/50"
                aria-label="Đặt lịch tư vấn ngay"
              >
                Đặt Lịch
              </button>

              {isAuthChecking.current ? (
                <div className="hidden lg:block w-24 h-9 bg-gray-200 animate-pulse rounded-full" />
              ) : userRole ? (
                <div className="hidden lg:block relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 shadow-sm ${
                      isScrolled || isMenuOpen 
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200' 
                        : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30'
                    }`}
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <div className="w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-sm">Menu</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50" role="menu" aria-orientation="vertical" tabIndex={-1}>
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser?.full_name || currentUser?.email || 'Người dùng'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{currentUser?.email}</p>
                        {userRole && userRole !== 'user' && (
                          <span className="inline-block mt-2 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                            {userRole === 'admin' ? 'Admin' : 
                             userRole === 'school_admin' ? 'Admin Trường' :
                             userRole === 'department_admin' ? 'Admin Sở' :
                             userRole === 'homeroom_teacher' ? 'GV Chủ nhiệm' :
                             userRole === 'subject_teacher' ? 'GV Bộ môn' :
                             userRole === 'counselor' ? 'Tư vấn viên' :
                             userRole === 'student' ? 'Học sinh' : 'User'}
                          </span>
                        )}
                      </div>

                      <div className="py-2">
                        <Link
                          to={createPageUrl("UserProfile")}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          role="menuitem"
                          tabIndex={0}
                        >
                          <UserIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">Hồ sơ cá nhân</span>
                        </Link>

                        {canAccessAdmin && (
                          <Link
                            to={createPageUrl("AdminDashboard")}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            role="menuitem"
                            tabIndex={0}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="text-sm font-medium">Admin Dashboard</span>
                          </Link>
                        )}

                        {(isAdmin || userPermissions.includes('manage_all_users')) && (
                          <Link
                            to={createPageUrl("AdminSettings")}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            role="menuitem"
                            tabIndex={0}
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-medium">Cài đặt</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-200 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                          role="menuitem"
                          tabIndex={0}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${
                    isScrolled || isMenuOpen
                      ? 'bg-orange-600 text-white hover:bg-orange-700 border border-orange-600'
                      : 'bg-white text-orange-600 border-2 border-white hover:bg-orange-50'
                  }`}
                  aria-label="Login"
                >
                  <UserIcon className="w-4 h-4" />
                  Đăng nhập
                </button>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  isScrolled || isMenuOpen ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/20'
                }`}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {isMenuOpen && (
        <div 
          id="mobile-menu"
          className="fixed inset-0 bg-white/98 backdrop-blur-lg z-40 flex flex-col items-center justify-center lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div className="flex flex-col items-center gap-8 w-full px-6">
            {userRole && currentUser ? (
              <div className="w-full max-w-sm bg-orange-50 rounded-2xl p-6 mb-4 border border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {currentUser?.full_name || 'Người dùng'}
                    </p>
                    <p className="text-xs text-gray-600">{currentUser?.email}</p>
                    {userRole && userRole !== 'user' && (
                      <span className="inline-block mt-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                        {userRole === 'admin' ? 'Admin' : 
                         userRole === 'school_admin' ? 'Admin Trường' :
                         userRole === 'student' ? 'Học sinh' : 'User'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Link
                    to={createPageUrl("UserProfile")}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    <UserIcon className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </Link>
                  {canAccessAdmin && (
                    <Link
                      to={createPageUrl("AdminDashboard")}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogin();
                }}
                className="w-full max-w-sm bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-orange-700"
              >
                <UserIcon className="w-5 h-5" />
                Đăng nhập
              </button>
            )}

            {navigationItems.map((item) => (
              item.hasDropdown ? (
                <div key={item.name} className="w-full max-w-sm">
                  <p className="text-lg font-semibold text-gray-500 mb-2">{item.name}</p>
                  {item.dropdownItems.map((dropItem) => (
                    <Link
                      key={dropItem.name}
                      to={dropItem.url}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block text-xl font-medium py-2 px-2 rounded font-display transition-colors ${
                        location.pathname === dropItem.url ? 'text-orange-600' : 'text-gray-800 hover:text-orange-600'
                      }`}
                    >
                      {dropItem.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.name}
                  to={item.url}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-2xl font-bold py-1 px-2 rounded font-display transition-colors ${
                    location.pathname === item.url ? 'text-orange-600' : 'text-gray-800 hover:text-orange-600'
                  }`}
                >
                  {item.name}
                </Link>
              )
            ))}

            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsBookingOpen(true);
              }}
              className="mt-4 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-full font-bold hover:from-red-600 hover:to-orange-600 shadow-lg font-body focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Đặt lịch tư vấn ngay"
            >
              Đặt Lịch Ngay
            </button>

            {userRole && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="w-full max-w-sm border-2 border-red-600 text-red-600 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                Đăng xuất
              </button>
            )}
          </div>
        </div>
      )}

      <main role="main" className="relative">
        {children}
      </main>

      <footer className="bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCUyMikiLz48L3N2Zz4=')] opacity-30" aria-hidden="true" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[clamp(1rem,2vw,2.5rem)] text-center md:text-left">
            <div className="mb-[1.2em]">
              <Link to="/" className="inline-flex items-center gap-3 mb-6 group" aria-label={getSetting('company_name', 'CỬA SỔ NGHỀ NGHIỆP')}>
                <Compass className="w-8 h-8 text-orange-400 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-display text-xl font-bold">
                  {getSetting('company_name', 'CỬA SỔ NGHỀ NGHIỆP')}
                </span>
              </Link>
              <p className="text-gray-300 text-sm leading-relaxed mb-6 font-body">
                {getSetting('company_description', 'Nền tảng hướng nghiệp thông minh dành cho học sinh THCS & THPT')}
              </p>
              <div className="flex gap-4 justify-center md:justify-start">
                <a 
                  href={getSetting('social_facebook', 'https://facebook.com')}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-white/10 hover:bg-orange-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href={getSetting('social_linkedin', 'https://linkedin.com')}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-white/10 hover:bg-orange-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="mb-[1.2em]">
              <h3 className="font-display text-lg font-semibold mb-6 text-orange-300">Dịch vụ</h3>
              <nav aria-label="Services navigation">
                <ul className="space-y-3 text-sm font-body">
                  <li><Link to={createPageUrl("Services?category=assessment")} className="text-gray-300 hover:text-orange-300 transition-colors">Trắc nghiệm nghề nghiệp</Link></li>
                  <li><Link to={createPageUrl("Services?category=career_counseling")} className="text-gray-300 hover:text-orange-300 transition-colors">Tư vấn định hướng</Link></li>
                  <li><Link to={createPageUrl("Services?category=ai_analysis")} className="text-gray-300 hover:text-orange-300 transition-colors">Phân tích năng lực</Link></li>
                  <li><Link to={createPageUrl("SubjectCombinations")} className="text-gray-300 hover:text-orange-300 transition-colors">Tổ hợp môn thi</Link></li>
                  <li><Link to={createPageUrl("Schools")} className="text-gray-300 hover:text-orange-300 transition-colors">Tư vấn chọn trường</Link></li>
                </ul>
              </nav>
            </div>

            <div className="mb-[1.2em]">
              <h3 className="font-display text-lg font-semibold mb-6 text-orange-300">Liên hệ</h3>
              <ul className="space-y-3 text-sm font-body">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{getSetting('contact_address', '523, Phạm Hùng, Phường Bà Ria, TP Bà Ria')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <a href={`tel:${getSetting('contact_phone', '02543826178').replace(/\s/g, '')}`} className="text-gray-300 hover:text-orange-300 transition-colors">
                    {getSetting('contact_phone', '(0254) 3 826 178')}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <a href={`mailto:${getSetting('contact_email', 'c2nguyendu.baria.bariavungtau@moet.edu.vn')}`} className="text-gray-300 hover:text-orange-300 transition-colors break-all">
                    {getSetting('contact_email', 'c2nguyendu.baria.bariavungtau@moet.edu.vn')}
                  </a>
                </li>
              </ul>
            </div>

            <div className="mb-[1.2em]">
              <h3 className="font-display text-lg font-semibold mb-6 text-orange-300">Nhận tin tức</h3>
              <p className="text-gray-300 text-sm mb-4 font-body">Đăng ký để nhận thông tin mới nhất.</p>
              <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
                >
                  Đăng ký
                </button>
              </form>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400 font-body">
                © 2024 {getSetting('company_name', 'Cửa Sổ Nghề Nghiệp')}. All rights reserved.
              </p>
              
              <nav aria-label="Legal links" className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm font-body">
                <Link to={createPageUrl("Sitemap")} className="text-gray-400 hover:text-orange-300 transition-colors">
                  Sơ đồ trang
                </Link>
                
                {isAdmin && (
                  <Link 
                    to={createPageUrl("AdminDashboard")}
                    className="text-yellow-400 hover:text-yellow-300 font-bold"
                  >
                    🔧 Admin Dashboard
                  </Link>
                )}
                
                <Link to={createPageUrl("Privacy")} className="text-gray-400 hover:text-orange-300 transition-colors">
                  Chính sách
                </Link>
                
                <Link to={createPageUrl("Terms")} className="text-gray-400 hover:text-orange-300 transition-colors">
                  Điều khoản
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>

      <React.Suspense fallback={<div />}>
        <ChatBot />
      </React.Suspense>
      <BackToTop />
      <React.Suspense fallback={<div />}>
        <BookingModal 
          isOpen={isBookingOpen} 
          onClose={handleCloseBookingModal}
          initialService={initialService} 
        />
      </React.Suspense>
      </div>
      </>
      );
}