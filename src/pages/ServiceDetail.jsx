import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Clock, Star, ArrowRight, Sparkles, CheckCircle, Users, Award, TrendingUp, Calendar, Target, AlertCircle } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function ServiceDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const serviceId = urlParams.get('id');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log('User not logged in');
      }
    };
    fetchUser();
  }, []);
  
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const services = await base44.entities.Service.filter({ id: serviceId });
      return services[0] || null;
    },
    enabled: !!serviceId
  });

  const { data: testVersions = [] } = useQuery({
    queryKey: ['testVersions', service?.test_code],
    queryFn: async () => {
      if (!service?.test_code) return [];
      try {
        const tests = await base44.entities.Test.filter({ 
          test_code: service.test_code,
          is_published: true 
        }, '-version');
        return tests || [];
      } catch (error) {
        console.error('Error fetching test versions:', error);
        return [];
      }
    },
    enabled: !!service?.test_code,
    retry: 1
  });

  const { data: userTestHistory = [] } = useQuery({
    queryKey: ['userTestHistory', currentUser?.id, service?.test_code],
    queryFn: async () => {
      if (!currentUser?.id || !service?.test_code) return [];
      try {
        let testType = 'custom';
        if (service.test_code.includes('holland')) testType = 'holland';
        else if (service.test_code.includes('mbti')) testType = 'mbti';
        else if (service.test_code.includes('iq')) testType = 'iq';
        else if (service.test_code.includes('eq')) testType = 'eq';
        
        const results = await base44.entities.TestResult.filter({
          user_id: currentUser.id,
          test_type: testType
        }, '-completed_date');
        return results || [];
      } catch (error) {
        console.error('Error fetching test history:', error);
        return [];
      }
    },
    enabled: !!currentUser?.id && !!service?.test_code,
    retry: 1
  });

  React.useEffect(() => {
    if (testVersions && testVersions.length > 0 && !selectedVersion) {
      setSelectedVersion(testVersions[0]);
    }
  }, [testVersions, selectedVersion]);

  // ✅ FIX: Simplified CTA handler - ALWAYS go to test page if test_code exists
  const handleCTA = () => {
    if (!service) return;
    
    // ✅ Priority 1: Test code (with or without version) - GO TO TEST PAGE
    if (service.test_code) {
      let testUrl = createPageUrl(`Test?code=${service.test_code}`);
      
      // Add version if selected
      if (selectedVersion && selectedVersion.version) {
        testUrl += `&version=${selectedVersion.version}`;
      }
      
      console.log('🧪 Redirecting to test:', testUrl);
      window.location.href = testUrl;
      return;
    }
    
    // ✅ Priority 2: Custom redirect URL (for non-test services)
    if (service.redirect_url) {
      console.log('🔗 Redirecting to:', service.redirect_url);
      window.location.href = service.redirect_url;
      return;
    }
    
    // ✅ Priority 3: Default booking modal (for counseling services)
    console.log('📅 Opening booking modal');
    window.dispatchEvent(new CustomEvent('open-booking-modal-with-service', { 
      detail: { service } 
    }));
  };

  const ctaText = useMemo(() => {
    if (!service) return 'Tìm hiểu thêm';
    
    // ✅ If test service and user has history
    if (service.test_code && userTestHistory.length > 0) {
      return 'Làm lại bài test';
    }
    
    // ✅ If test service (first time or no history)
    if (service.test_code) {
      return 'Làm bài test ngay';
    }
    
    // ✅ Based on action_type
    if (service.action_type === 'test') return 'Làm bài test ngay';
    if (service.action_type === 'redirect') return 'Xem ngay';
    if (service.action_type === 'booking') return 'Đặt lịch tư vấn';
    
    // ✅ Fallback based on category
    if (service.category === 'assessment') return 'Làm bài test ngay';
    if (service.redirect_url) return 'Xem ngay';

    return 'Đăng ký ngay';
  }, [service, userTestHistory.length]);

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
            Không tìm thấy dịch vụ
          </h1>
          <button 
            onClick={() => window.history.back()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const categoryLabels = {
    assessment: "Trắc nghiệm",
    career_counseling: "Tư vấn nghề nghiệp",
    school_selection: "Chọn trường - Chọn ngành",
    ai_analysis: "Phân tích AI",
    career_profile: "Hồ sơ năng lực"
  };

  const breadcrumbItems = [
    { label: "Dịch vụ", url: createPageUrl("Services") },
    { label: service.name }
  ];

  const isTestService = service?.test_code || service?.action_type === 'test' || service?.category === 'assessment';
  const hasTestHistory = userTestHistory.length > 0;
  const latestResult = hasTestHistory ? userTestHistory[0] : null;
  const hasMultipleVersions = testVersions.length > 1;

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={service.image_url}
                alt={service.alt_text || service.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                <Star className="w-4 h-4 text-indigo-600 fill-current" />
                <span className="text-sm font-medium">5.0</span>
              </div>
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                {service.price.toLocaleString('vi-VN')}đ
              </div>
            </div>
            {service.featured && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                NỔI BẬT
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-indigo-600/10 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium">
                {categoryLabels[service.category] || service.category}
              </span>
            </div>

            <h1 className="font-display font-bold text-4xl md:text-5xl text-gray-900 mb-4">
              {service.name}
            </h1>

            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {service.description}
            </p>

            {isTestService && hasMultipleVersions && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn phiên bản:
                </label>
                <select
                  value={selectedVersion?.id || ''}
                  onChange={(e) => {
                    const version = testVersions.find(v => v?.id === e.target.value);
                    if (version) setSelectedVersion(version);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                >
                  {testVersions.map(version => version && (
                    <option key={version.id} value={version.id}>
                      {version.name || 'Test'} - Version {version.version || '1.0'} ({version.question_count || 0} câu)
                    </option>
                  ))}
                </select>
                {selectedVersion && (
                  <p className="text-xs text-gray-500 mt-2">
                    ℹ️ Bạn sẽ làm version {selectedVersion.version || '1.0'}
                  </p>
                )}
              </div>
            )}

            {isTestService && hasTestHistory && latestResult && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 mb-6 border-2 border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-gray-900">Lịch sử làm bài</h3>
                </div>
                
                <div className="bg-white rounded-xl p-4 mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">Lần gần nhất</p>
                      <p className="text-sm text-gray-600">
                        {latestResult.completed_date ? format(new Date(latestResult.completed_date), 'dd/MM/yyyy HH:mm', { locale: vi }) : 'N/A'}
                      </p>
                      {latestResult.test_version && (
                        <span className="inline-block mt-1 text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                          Version {latestResult.test_version}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => window.location.href = createPageUrl(`TestResultDetail?id=${latestResult.id}`)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                    >
                      Xem kết quả
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  {latestResult.top_types && Array.isArray(latestResult.top_types) && latestResult.top_types.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {latestResult.top_types.slice(0, 3).map((type, idx) => type && (
                        <div key={idx} className="flex-1 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600">#{idx + 1}</p>
                          <p className="text-lg font-bold text-indigo-600">{type.percentage || 0}%</p>
                          <p className="text-xs text-gray-700">{type.name || type.type || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {userTestHistory.length > 1 && (
                  <div className="text-sm text-gray-700">
                    <p>📊 Tổng: <strong>{userTestHistory.length}</strong> lần</p>
                    <button
                      onClick={() => window.location.href = createPageUrl('UserProfile')}
                      className="text-indigo-600 hover:text-indigo-700 mt-2 inline-flex items-center gap-1"
                    >
                      Xem tất cả
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Thời gian</p>
                  <p className="font-medium">{service.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Đã sử dụng</p>
                  <p className="font-medium">1,234+ học sinh</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
                <Award className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Đánh giá</p>
                  <p className="font-medium">5.0/5.0</p>
                </div>
              </div>
            </div>

            {isTestService && !currentUser && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Bạn cần đăng nhập để lưu kết quả test và xem lịch sử
                  </p>
                </div>
              </div>
            )}

            <button 
              onClick={handleCTA}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              {ctaText}
              <ArrowRight className="w-5 h-5" />
            </button>
            
            {hasTestHistory && (
              <p className="text-xs text-center text-gray-500 mt-2">
                💡 Làm lại sẽ tạo kết quả mới và so sánh với lần trước
              </p>
            )}
          </motion.div>
        </div>

        {service.benefits && service.benefits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 md:p-12 mb-12"
          >
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-8 text-center">Lợi ích khi sử dụng dịch vụ</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {service.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-3 bg-white rounded-xl p-4"
                >
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-white"
        >
          <h2 className="font-display text-3xl font-bold mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-xl mb-8 opacity-90">
            {hasTestHistory 
              ? 'Làm lại để cải thiện và so sánh kết quả với lần trước'
              : isTestService
              ? 'Bắt đầu làm bài test để khám phá bản thân' 
              : 'Đăng ký ngay để nhận tư vấn từ chuyên gia'}
          </p>
          <button 
            onClick={handleCTA}
            className="bg-white text-indigo-600 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition-all hover:scale-105 shadow-lg inline-flex items-center gap-2"
          >
            {ctaText}
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}