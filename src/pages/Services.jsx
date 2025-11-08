
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Star, ArrowRight, Sparkles, Play, Calendar, Eye } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";

const categories = [
  { key: "all", name: "Tất cả dịch vụ" },
  { key: "assessment", name: "Trắc nghiệm" },
  { key: "career_counseling", name: "Tư vấn định hướng" },
  { key: "school_selection", name: "Chọn trường - Chọn ngành" },
  { key: "ai_analysis", name: "Phân tích AI" },
  { key: "career_profile", name: "Hồ sơ năng lực" }
];

// ✅ IMPROVED: Smart CTA helper function
const getServiceCTA = (service) => {
  // Priority 1: action_type
  if (service.action_type === 'test') {
    return { text: "Làm Ngay", icon: Play };
  }
  if (service.action_type === 'redirect') {
    return { text: "Xem Ngay", icon: Eye };
  }
  if (service.action_type === 'booking') {
    return { text: "Đặt Lịch", icon: Calendar };
  }
  
  // Priority 2: test_code or redirect_url
  if (service.test_code) {
    return { text: "Làm Ngay", icon: Play };
  }
  if (service.redirect_url) {
    return { text: "Xem Ngay", icon: Eye };
  }
  
  // Priority 3: Category-based
  const ctaConfig = {
    assessment: { text: "Làm Ngay", icon: Play },
    career_counseling: { text: "Đặt Lịch Tư Vấn", icon: Calendar },
    school_selection: { text: "Xem Ngay", icon: Eye },
    ai_analysis: { text: "Phân Tích Ngay", icon: Play },
    career_profile: { text: "Tạo Hồ Sơ", icon: Play }
  };
  
  return ctaConfig[service.category] || { text: "Tìm Hiểu Thêm", icon: ArrowRight };
};

export default function Services() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch services from database
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list('order'),
    initialData: []
  });

  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  
  useEffect(() => {
    const categoryFromUrl = urlParams.get('category');
    if (categoryFromUrl && categories.some(cat => cat.key === categoryFromUrl)) {
      setActiveFilter(categoryFromUrl);
    }
  }, [urlParams]);

  const filteredServices = useMemo(() => {
    // Only show active services
    const activeServices = services.filter(s => s.is_active !== false);
    
    return activeFilter === "all" 
      ? activeServices 
      : activeServices.filter(service => service.category === activeFilter);
  }, [activeFilter, services]);

  const handleServiceClick = useCallback((service) => {
    // Navigate to service detail page
    navigate(createPageUrl(`ServiceDetail?id=${service.id}`));
  }, [navigate]);

  const breadcrumbItems = [
    { label: "Dịch vụ" }
  ];

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        {/* Page Header */}
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

        {/* Category Filters */}
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

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Đang tải dịch vụ...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-600">Chưa có dịch vụ nào trong danh mục này</p>
          </div>
        ) : (
          <>
            {/* Services Grid */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
              {filteredServices.map((service, index) => {
                const ctaConfig = getServiceCTA(service);
                const CTAIcon = ctaConfig.icon;
                
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    whileHover={{ scale: 1.03, y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                    onClick={() => handleServiceClick(service)}
                    className="group bg-white rounded-3xl overflow-hidden shadow-lg will-change-transform cursor-pointer"
                  >
                    {/* Service Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={service.image_url}
                        alt={service.alt_text || service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Price Badge */}
                      <div className="absolute top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        {service.price.toLocaleString('vi-VN')}đ
                      </div>

                      {/* Duration Badge */}
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.duration}
                      </div>

                      {/* Featured Badge */}
                      {service.featured && (
                        <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          NỔI BẬT
                        </div>
                      )}
                    </div>

                    {/* Service Content */}
                    <div className="p-6">
                      <h3 className="font-display text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">
                        {service.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                        {service.description}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-indigo-600 fill-current" />
                        ))}
                        <span className="text-sm text-gray-500 ml-2">(5.0)</span>
                      </div>
                      
                      <div className="w-full bg-indigo-600/10 text-indigo-600 py-3 rounded-full font-medium group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 group-hover:shadow-lg flex items-center justify-center gap-2">
                        <CTAIcon className="w-4 h-4" />
                        {ctaConfig.text}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom CTA */}
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
