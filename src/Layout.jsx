
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Compass, Phone, Mail, Linkedin, Facebook, MapPin, X, Menu, Users, LogOut, Settings, LayoutDashboard, User as UserIcon } from "lucide-react";
import ChatBot from "@/components/ChatBot";
import BookingModal from "@/components/BookingModal";
import ReviewWidget from "@/components/ReviewWidget";
import SeoSchema from "@/components/SeoSchema";
import LoadingScreen from "@/components/LoadingScreen";
import BackToTop from "@/components/BackToTop";
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [initialService, setInitialService] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userRole, setUserRole] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(null); // Added state for current user
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuRef = React.useRef(null);
  const [authError, setAuthError] = React.useState(false);
  const isAuthChecking = React.useRef(true); // Changed to useRef to prevent re-renders on every update
  const [userPermissions, setUserPermissions] = useState([]);

  React.useEffect(() => {
    const checkUserRole = async () => {
      try {
        isAuthChecking.current = true;
        setAuthError(false); // Reset error state
        
        const user = await base44.auth.me();
        console.log('Current logged in user:', user);
        setCurrentUser(user);
        
        if (user) {
          // User role từ Base44 built-in User entity
          if (user.role === 'admin') {
            setUserRole('admin');
            console.log('User is Base44 admin');
            setUserPermissions(['manage_all_users']); // Built-in admin has full permissions
          } else {
            // Regular user
            // Auto-create UserProfile if not exists + fetch permissions
            try {
              const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
              
              if (!profiles || profiles.length === 0) {
                console.log('Creating UserProfile for extended data:', user.id);
                await base44.entities.UserProfile.create({
                  user_id: user.id,
                  role: 'student' // Default role for new users
                });
                console.log('UserProfile created successfully');
                setUserRole('student'); // Set initial role to student
                setUserPermissions([]); // No specific permissions for new student by default
              } else {
                const profile = profiles[0];
                const currentProfileRole = profile.role || 'user'; // Ensure a default role if not set
                setUserRole(currentProfileRole);
                console.log('UserProfile found, role:', currentProfileRole);
                
                // Fetch permissions for this role
                try {
                  const rolePerms = await base44.entities.RolePermission.filter({
                    role_key: currentProfileRole,
                    is_granted: true
                  });
                  const permissions = rolePerms.map(rp => rp.permission_key);
                  setUserPermissions(permissions);
                  console.log('Permissions for role', currentProfileRole, ':', permissions);
                } catch (permError) {
                  console.error("Error fetching permissions:", permError);
                  setUserPermissions([]);
                }
              }
            } catch (profileError) {
              console.error("Error with UserProfile:", profileError);
              setUserRole('user'); // Fallback to 'user' if profile fetch fails
              setUserPermissions([]);
            }
          }
        } else {
          console.log('No user logged in');
          setUserRole(null);
          setUserPermissions([]);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        
        // FIXED: Only show network error if it's NOT an authentication error
        const isAuthError = error.message?.toLowerCase().includes('authentication') || 
                           error.message?.toLowerCase().includes('not authenticated') ||
                           error.message?.toLowerCase().includes('unauthorized');
        
        if (!isAuthError) {
          // This is a real network/server error
          setAuthError(true);
        }
        
        // User is just not logged in - this is normal
        setUserRole(null);
        setCurrentUser(null);
        setUserPermissions([]);
      } finally {
        isAuthChecking.current = false; // Set directly
      }
    };

    checkUserRole();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    const scrollHandler = (e) => handleScroll();
    window.addEventListener('scroll', scrollHandler, { passive: true });

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

    // Close user menu when clicking outside
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('open-booking-modal', openBookingModal);
      window.removeEventListener('open-booking-modal-with-service', openBookingModalWithService);
      document.removeEventListener('mousedown', handleClickOutside); // Cleanup for user menu
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
      try {
        await base44.auth.logout();
        // Redirect to home or login page after logout
        window.location.href = createPageUrl("/"); // Reloads the page, clearing all state
      } catch (error) {
        console.error("Error during logout:", error);
        alert("Đăng xuất không thành công. Vui lòng thử lại.");
      }
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const navigationItems = React.useMemo(() => {
    const baseItems = [
      { name: "Trang chủ", url: "/", roles: ['all'] },
      { name: "Dịch vụ", url: createPageUrl("Services"), roles: ['all'] },
      { name: "Tổ hợp môn", url: createPageUrl("SubjectCombinations"), roles: ['all'] },
      { name: "Trường học", url: createPageUrl("Schools"), roles: ['all'] },
      { name: "Về chúng tôi", url: createPageUrl("Gallery"), roles: ['all'] },
      { name: "Đội ngũ", url: createPageUrl("Team"), roles: ['all'] },
      { name: "Liên hệ", url: createPageUrl("Contact"), roles: ['all'] }
    ];

    // Filter based on role - all items are public for now
    // In future, can add role-specific menu items
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
    // Check if user has admin permissions
    return isAdmin || userPermissions.includes('manage_all_users');
  }, [isAdmin, userPermissions]);

  // Check if current page is an admin page - IMPROVED CHECK
  const isAdminPage = React.useMemo(() => {
    const adminPageNames = [
      'AdminDashboard', 'AdminUsers', 'AdminAppointments', 'AdminSchools', 'AdminSchoolTypes',
      'AdminTestResults', 'AdminTestManagement', 'AdminServices', 'AdminReports', 'AdminRBAC',
      'AdminAuditLog', 'AdminNotifications', 'AdminSettings', 'AdminCodeManagement', 'AdminCodeInventory',
      'AdminAcademicStructure', 'AdminTeachingAssignments',
      'StudentManagement', 'TeacherManagement', 'StudentProgress',
      'ClassAnalytics', 'BulkImportStudents', 'AcademicRecords'
    ];
    
    // Check both currentPageName and URL path
    const isAdminByName = currentPageName && adminPageNames.includes(currentPageName);
    const isAdminByPath = location.pathname.toLowerCase().includes('admin');
    
    return isAdminByName || isAdminByPath;
  }, [currentPageName, location.pathname]);

  // If it's an admin page, just render children without client layout
  if (isAdminPage) {
    return <>{children}</>;
  }

  // Use a state derived from useRef for rendering conditional checks
  const isAuthCheckingState = isAuthChecking.current;

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans text-[length:var(--font-body)] leading-[1.618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
          --font-display: 'Playfair Display', serif;
          --font-body: 'Inter', sans-serif;
          --color-primary: #4F46E5;
          --color-secondary: #9333EA;
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }

        .font-display {
          font-family: var(--font-display);
        }

        .font-body {
          font-family: var(--font-body);
        }

        .glass-nav {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.18);
        }

        .nav-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .text-shadow-dark {
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>

      <SeoSchema />

      {/* Auth Error Banner */}
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
                <p className="text-sm text-yellow-700">
                  Không thể kết nối. Vui lòng kiểm tra kết nối mạng.
                </p>
              </div>
              <button
                onClick={() => setAuthError(false)}
                className="ml-auto flex-shrink-0"
              >
                <X className="h-5 w-5 text-yellow-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      <nav 
        className={`fixed top-0 left-0 right-0 z-50 nav-transition ${
          isScrolled || isMenuOpen ? 'glass-nav py-3' : 'bg-transparent py-4'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between pt-4">
            <Link to="/" className="flex items-center gap-3 group" aria-label="CỬA SỔ NGHỀ NGHIỆP - Home">
              <div className="relative">
                <Compass className={`w-10 h-10 transition-all duration-300 ${
                  isScrolled || isMenuOpen ? 'text-indigo-600' : 'text-white'
                } group-hover:rotate-180`} />
              </div>
              <div className="flex flex-col">
                <span className={`font-display text-xl font-bold transition-all duration-300 ${
                  isScrolled || isMenuOpen ? 'text-gray-900' : 'text-white text-shadow-dark'
                }`}>
                  CỬA SỔ NGHỀ NGHIỆP
                </span>
                <span className={`font-body text-xs tracking-wider transition-all duration-300 ${
                  isScrolled || isMenuOpen ? 'text-gray-600' : 'text-white/80 text-shadow-dark'
                }`}>
                  Career Guidance
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-8" role="menubar">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.url}
                  role="menuitem"
                  className={`text-sm font-medium transition-all duration-300 hover:text-indigo-600 relative group font-body ${
                    location.pathname === item.url 
                      ? 'text-indigo-600' 
                      : (isScrolled || isMenuOpen ? 'text-gray-700' : 'text-white text-shadow-dark')
                  }`}
                  aria-current={location.pathname === item.url ? 'page' : undefined}
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full" aria-hidden="true" />
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3"> {/* Changed gap from 4 to 3 here */}
              {/* Compact Booking Button */}
              <button
                onClick={() => setIsBookingOpen(true)}
                className="hidden lg:block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-indigo-500/30"
                aria-label="Đặt lịch tư vấn ngay"
              >
                Đặt Lịch
              </button>

              {/* Compact User Menu - Desktop */}
              {isAuthCheckingState ? (
                <div className="hidden lg:block w-24 h-9 bg-gray-200 animate-pulse rounded-full" />
              ) : userRole ? (
                <div className="hidden lg:block relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
                      isScrolled || isMenuOpen 
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-900' 
                        : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                    }`}
                  >
                    <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-sm">Menu</span>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser?.full_name || currentUser?.email || 'Người dùng'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{currentUser?.email}</p>
                        {/* Show role badge */}
                        {userRole && userRole !== 'user' && (
                          <span className="inline-block mt-2 text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
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
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-50 transition-colors"
                        >
                          <UserIcon className="w-4 h-4" />
                          <span className="text-sm">Hồ sơ cá nhân</span>
                        </Link>

                        {canAccessAdmin && (
                          <Link
                            to={createPageUrl("AdminDashboard")}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-50 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="text-sm">Admin Dashboard</span>
                          </Link>
                        )}

                        {/* Settings only for admin or users with manage permissions */}
                        {(isAdmin || userPermissions.includes('manage_all_users')) && (
                          <Link
                            to={createPageUrl("AdminSettings")}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-50 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Cài đặt</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-200 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    isScrolled || isMenuOpen
                      ? 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                      : 'bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white hover:text-indigo-600'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Đăng nhập
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? (
                  <X className={`w-6 h-6 ${isScrolled || isMenuOpen ? 'text-gray-900' : 'text-white'}`} />
                ) : (
                  <Menu className={`w-6 h-6 ${isScrolled || isMenuOpen ? 'text-gray-900' : 'text-white'}`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {isMenuOpen && (
        <div 
          id="mobile-menu"
          className="fixed inset-0 bg-white/95 backdrop-blur-lg z-40 flex flex-col items-center justify-center lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div className="flex flex-col items-center gap-8 w-full px-6">
            {/* User Info Section - Mobile */}
            {userRole && currentUser ? (
              <div className="w-full max-w-sm bg-indigo-50 rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {currentUser?.full_name || 'Người dùng'}
                    </p>
                    <p className="text-xs text-gray-600">{currentUser?.email}</p>
                    {userRole && userRole !== 'user' && (
                      <span className="inline-block mt-1 text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
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
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <UserIcon className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </Link>
                  {canAccessAdmin && (
                    <Link
                      to={createPageUrl("AdminDashboard")}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
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
                className="w-full max-w-sm bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <UserIcon className="w-5 h-5" />
                Đăng nhập
              </button>
            )}

            {/* Navigation Links */}
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.url}
                onClick={() => setIsMenuOpen(false)}
                className={`text-2xl font-medium transition-all duration-300 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1 font-display ${
                  location.pathname === item.url ? 'text-indigo-600' : 'text-gray-800'
                }`}
                aria-current={location.pathname === item.url ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}

            {/* CTA Button */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsBookingOpen(true);
              }}
              className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-lg font-body focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Đặt lịch tư vấn ngay"
            >
              Đặt Lịch Ngay
            </button>

            {/* Logout Button - Mobile */}
            {userRole && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="w-full max-w-sm border-2 border-red-600 text-red-600 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-50"
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

      <footer className="bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white relative overflow-hidden" role="contentinfo">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCIvPjwvc3ZnPg==')] opacity-30" aria-hidden="true" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[clamp(1rem,2vw,2.5rem)] text-center md:text-left">
            <div className="mb-[1.2em]">
              <Link to="/" className="inline-flex items-center gap-3 mb-6 group" aria-label="CỬA SỔ NGHỀ NGHIỆP">
                <Compass className="w-8 h-8 text-indigo-400 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-display text-xl font-bold">CỬA SỔ NGHỀ NGHIỆP</span>
              </Link>
              <p className="text-gray-300 text-sm leading-relaxed mb-6 font-body">
                Nền tảng hướng nghiệp thông minh dành cho học sinh THCS & THPT. Chúng tôi giúp bạn hiểu bản thân, chọn nghề đúng, và định hướng tương lai một cách khoa học.
              </p>
              <div className="flex gap-4 justify-center md:justify-start">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-white/10 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-white/10 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="mb-[1.2em]">
              <h3 className="font-display text-lg font-semibold mb-6 text-indigo-300">Dịch vụ</h3>
              <nav aria-label="Services navigation">
                <ul className="space-y-3 text-sm font-body">
                  <li><Link to={createPageUrl("Services?category=assessment")} className="text-gray-300 hover:text-indigo-300 transition-colors duration-300">Trắc nghiệm nghề nghiệp</Link></li>
                  <li><Link to={createPageUrl("Services?category=career_counseling")} className="text-gray-300 hover:text-indigo-300 transition-colors duration-300">Tư vấn định hướng</Link></li>
                  <li><Link to={createPageUrl("Services?category=ai_analysis")} className="text-gray-300 hover:text-indigo-300 transition-colors duration-300">Phân tích năng lực</Link></li>
                  <li><Link to={createPageUrl("SubjectCombinations")} className="text-gray-300 hover:text-indigo-300 transition-colors duration-300">Tổ hợp môn thi</Link></li>
                  <li><Link to={createPageUrl("Schools")} className="text-gray-300 hover:text-indigo-300 transition-colors duration-300">Tư vấn chọn trường</Link></li>
                </ul>
              </nav>
            </div>

            <div className="mb-[1.2em]">
              <h3 className="font-display text-lg font-semibold mb-6 text-indigo-300">Liên hệ</h3>
              <ul className="space-y-3 text-sm font-body">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">523, Phạm Hùng, Phường Bà Ria, TP Bà Ria, Bà Rịa - Vũng Tàu</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <a href="tel:(0254) 3 826 178" className="text-gray-300 hover:text-indigo-300 transition-colors duration-300">(0254) 3 826 178</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <a href="mailto:c2nguyendu.baria.bariavungtau@moet.edu.vn" className="text-gray-300 hover:text-indigo-300 transition-colors duration-300 break-all">c2nguyendu.baria.bariavungtau@moet.edu.vn</a>
                </li>
              </ul>
            </div>

            <div className="mb-[1.2em]">
              <h3 className="font-display text-lg font-semibold mb-6 text-indigo-300">Nhận tin tức</h3>
              <p className="text-gray-300 text-sm mb-4 font-body">Đăng ký để nhận thông tin mới nhất về hướng nghiệp và tuyển sinh.</p>
              <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 font-body"
                  required
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-indigo-500/30 font-body"
                >
                  Đăng ký
                </button>
              </form>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400 font-body">
                © 2024 Cửa Sổ Nghề Nghiệp. All rights reserved.
              </p>
              
              <nav aria-label="Legal links" className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm font-body">
                <Link to={createPageUrl("Sitemap")} className="text-gray-400 hover:text-indigo-300 transition-colors duration-300">
                  Sơ đồ trang
                </Link>
                
                {isAdmin && (
                  <Link 
                    to={createPageUrl("AdminDashboard")}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors duration-300 font-bold flex items-center gap-1"
                  >
                    🔧 Admin Dashboard
                  </Link>
                )}
                
                <Link to={createPageUrl("Privacy")} className="text-gray-400 hover:text-indigo-300 transition-colors duration-300">
                  Chính sách
                </Link>
                
                <Link to={createPageUrl("Terms")} className="text-gray-400 hover:text-indigo-300 transition-colors duration-300">
                  Điều khoản
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>

      <ChatBot />
      <BackToTop />
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={handleCloseBookingModal}
        initialService={initialService} 
      />
    </div>
  );
}
