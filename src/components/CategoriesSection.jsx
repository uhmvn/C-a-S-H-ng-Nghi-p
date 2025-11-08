import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categories = [
  {
    id: 1,
    key: "assessment",
    title: "Trắc Nghiệm Nghề Nghiệp",
    description: "Đánh giá toàn diện về tính cách, sở thích, năng lực và tiềm năng nghề nghiệp của bạn.",
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="8" width="28" height="32" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="33" cy="33" r="7" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M38 38l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    bgColor: "bg-blue-50"
  },
  {
    id: 2,
    key: "career_counseling",
    title: "Tư Vấn Định Hướng",
    description: "Gặp gỡ chuyên gia để được tư vấn chi tiết về con đường sự nghiệp phù hợp nhất.",
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M8 32c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="32" cy="16" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M24 32c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 12l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    bgColor: "bg-indigo-50"
  },
  {
    id: 3,
    key: "school_selection",
    title: "Chọn Trường - Chọn Ngành",
    description: "Gợi ý tổ hợp môn, ngành học và trường đại học phù hợp với năng lực và mục tiêu của bạn.",
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 8l16 8-16 8-16-8z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
        <path d="M8 24v8c0 2 7.2 8 16 8s16-6 16-8v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M40 18v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    bgColor: "bg-white border border-indigo-200"
  },
  {
    id: 4,
    key: "ai_analysis",
    title: "Phân Tích AI",
    description: "Công nghệ AI phân tích dữ liệu và đưa ra gợi ý nghề nghiệp chính xác nhất.",
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="24" cy="24" r="3" fill="currentColor"/>
        <path d="M24 12v4M24 32v4M12 24h4M32 24h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16.8 16.8l2.8 2.8M28.4 28.4l2.8 2.8M16.8 31.2l2.8-2.8M28.4 19.6l2.8-2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    bgColor: "bg-purple-50"
  },
  {
    id: 5,
    key: "career_profile",
    title: "Hồ Sơ Năng Lực Số",
    description: "Xây dựng và theo dõi hồ sơ năng lực cá nhân, lưu trữ kết quả và tiến độ phát triển.",
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="24" cy="18" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M16 32c0-4.4 3.6-6 8-6s8 1.6 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    bgColor: "bg-green-50"
  }
];

export default function CategoriesSection() {
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const scrollStep = 1;
    const scrollDelay = 50;

    const autoScroll = () => {
      if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
        scrollAmount = 0;
        scrollContainer.scrollLeft = 0;
      } else {
        scrollAmount += scrollStep;
        scrollContainer.scrollLeft = scrollAmount;
      }
    };

    const intervalId = setInterval(autoScroll, scrollDelay);

    const handleMouseEnter = () => clearInterval(intervalId);
    const handleMouseLeave = () => {
      const newIntervalId = setInterval(autoScroll, scrollDelay);
      return newIntervalId;
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', () => {
      clearInterval(intervalId);
      const newIntervalId = setInterval(autoScroll, scrollDelay);
    });

    return () => {
      clearInterval(intervalId);
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <section className="py-16 md:py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="font-body text-sm text-indigo-600 font-medium">Dịch Vụ Của Chúng Tôi</span>
          </div>
          
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-gray-900">Giải Pháp Hướng Nghiệp</span>
            <br />
            <span className="text-indigo-600">Toàn Diện</span>
          </h2>
          
          <p className="font-body text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá các dịch vụ hướng nghiệp chuyên nghiệp, từ trắc nghiệm đến tư vấn cá nhân hóa
          </p>
        </motion.div>

        {/* Auto-Scrolling Categories */}
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 cursor-pointer"
            style={{ 
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {/* Duplicate categories for seamless loop */}
            {[...categories, ...categories].map((category, index) => (
              <Link 
                key={`${category.id}-${index}`} 
                to={createPageUrl(`Services?category=${category.key}`)} 
                className="flex-shrink-0 w-80 group cursor-pointer"
              >
                <motion.div
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: (index % categories.length) * 0.1,
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                  className="h-full"
                >
                  <div className={`${category.bgColor} rounded-3xl p-6 h-full flex flex-col hover:shadow-xl transition-all duration-500 group-hover:-translate-y-2 min-h-[280px]`}>
                    {/* Icon */}
                    <div className="mb-6 text-indigo-600 group-hover:text-purple-600 transition-colors duration-300">
                      {category.icon}
                    </div>
                    
                    {/* Content */}
                    <h3 className="font-display text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors duration-300 leading-tight">
                      {category.title}
                    </h3>
                    
                    <p className="font-body text-gray-600 leading-relaxed mb-6 flex-grow">
                      {category.description}
                    </p>
                    
                    {/* Read More Button */}
                    <div className="flex items-center gap-2 font-body text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors duration-300 group mt-auto">
                      KHÁM PHÁ THÊM
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Manual Navigation Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="font-body text-sm text-gray-400">
            Di chuột vào để tạm dừng • Tự động cuộn
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}