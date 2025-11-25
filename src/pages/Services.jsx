import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, Play, Calendar, Eye, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";
import OptimizedServiceCard from "@/components/optimization/OptimizedServiceCard";

const categories = [
  { key: "all", name: "Tất cả dịch vụ" },
  { key: "assessment", name: "Trắc nghiệm" },
  { key: "career_counseling", name: "Tư vấn định hướng" },
  { key: "school_selection", name: "Chọn trường - Chọn ngành" },
  { key: "ai_analysis", name: "Phân tích AI" },
  { key: "career_profile", name: "Hồ sơ năng lực" }
];

const getServiceCTA = (service) => {
  if (service.test_code) {
    return { text: "Làm Ngay", icon: Play, action: 'test' };
  }
  
  if (service.action_type === 'test') {
    return { text: "Làm Ngay", icon: Play, action: 'test' };
  }
  if (service.action_type === 'redirect') {
    return { text: "Xem Ngay", icon: Eye, action: 'redirect' };
  }
  if (service.action_type === 'booking') {
    return { text: "Đặt Lịch", icon: Calendar, action: 'booking' };
  }
  
  if (service.redirect_url) {
    return { text: "Xem Ngay", icon: Eye, action: 'redirect' };
  }
  
  const ctaConfig = {
    assessment: { text: "Làm Ngay", icon: Play, action: 'test' },
    career_counseling: { text: "Đặt Lịch Tư Vấn", icon: Calendar, action: 'booking' },
    school_selection: { text: "Xem Ngay", icon: Eye, action: 'redirect' },
    ai_analysis: { text: "Phân Tích Ngay", icon: Play, action: 'test' },
    career_profile: { text: "Tạo Hồ Sơ", icon: Play, action: 'test' }
  };
  
  return ctaConfig[service.category] || { text: "Tìm Hiểu Thêm", icon: ArrowRight, action: 'detail' };
};

export default function Services() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: rawServices = [], isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      console.log('🔄 Fetching services...');
      try {
        const result = await base44.entities.Service.list('order');
        console.log('✅ Services API response:', { 
          type: typeof result, 
          isArray: Array.isArray(result),
          length: result?.length || 0, 
          data: result 
        });
        return result || [];
      } catch (err) {
        console.error('❌ Error loading services:', err, err.stack);
        return [];
      }
    },
    initialData: [],
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Map services to flat structure
  const services = useMemo(() => {
    return rawServices.map(service => ({
      id: service.id,
      ...service.data
    }));
  }, [rawServices]);

  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  
  useEffect(() => {
    const categoryFromUrl = urlParams.get('category');
    if (categoryFromUrl && categories.some(cat => cat.key === categoryFromUrl)) {
      setActiveFilter(categoryFromUrl);
    }
  }, [urlParams]);

  const filteredServices = useMemo(() => {
    console.log('🔍 Filtering services:', {
      total: services.length,
      activeFilter,
      servicesData: services
    });
    
    // Filter active services (is_active is true or undefined)
    const activeServices = services.filter(s => s.is_active !== false);
    console.log('✅ Active services:', activeServices.length);
    
    // Filter by category
    const filtered = activeFilter === "all" 
      ? activeServices 
      : activeServices.filter(service => service.category === activeFilter);
    
    console.log('📊 Filtered result:', filtered.length, filtered);
    return filtered;
  }, [activeFilter, services]);

  // ✅ REVERTED: Always go to ServiceDetail page
  const handleServiceClick = useCallback((service) => {
    // Go to service detail page - let detail page handle the action
    navigate(createPageUrl(`ServiceDetail?id=${service.id}`));
  }, [navigate]);

  const breadcrumbItems = [
    { label: "Dịch vụ" }
  ];

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium">Dịch vụ của chúng tôi</span>
          </div>
          
          <h1 className="font-display font-medium text-[length:var(--font-h1)] text-gray-900 mb-6 leading-tight">
            Dịch Vụ Hướng Nghiệp Chuyên Nghiệp
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-[1.618]">
            Khám phá bộ dịch vụ hướng nghiệp toàn diện từ trắc nghiệm, tư vấn đến phân tích AI. 
            Chúng tôi đồng hành cùng bạn tìm ra con đường sự nghiệp phù hợp nhất.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setActiveFilter(category.key)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeFilter === category.key
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Đang tải dịch vụ...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-2xl shadow-sm">
            <p className="text-red-600">Có lỗi xảy ra khi tải dịch vụ. Vui lòng thử lại sau.</p>
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-600 mb-2">Chưa có dịch vụ nào trong danh mục này</p>
            <p className="text-sm text-gray-500">
              {services.length > 0 
                ? `Có ${services.length} dịch vụ trong hệ thống, nhưng không có dịch vụ nào thuộc danh mục "${categories.find(c => c.key === activeFilter)?.name}"`
                : 'Hệ thống chưa có dịch vụ nào'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
              {filteredServices.map((service, index) => (
                <OptimizedServiceCard
                  key={service.id}
                  service={service}
                  index={index}
                  ctaConfig={getServiceCTA(service)}
                  onClick={handleServiceClick}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center mt-16"
            >
              <div className="bg-white rounded-3xl p-12 shadow-lg border border-indigo-600/20">
                <h2 className="font-display text-[length:var(--font-h2)] font-bold text-gray-900 mb-4">
                  Sẵn Sàng Khám Phá Tương Lai?
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-[1.618]">
                  Đặt lịch tư vấn ngay hôm nay và bắt đầu hành trình định hướng nghề nghiệp 
                  cùng đội ngũ chuyên gia hàng đầu của Cửa Sổ Nghề Nghiệp.
                </p>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Đặt Lịch Tư Vấn Ngay
                </button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}