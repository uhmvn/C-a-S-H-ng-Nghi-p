
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, Home, BookOpen, Image, Users, Phone, ArrowRight } from "lucide-react";

const sitePages = [
  {
    category: "Trang Chính",
    icon: Home,
    pages: [
      {
        name: "Trang chủ",
        url: "/",
        description: "Chào mừng đến với Cửa Sổ Nghề Nghiệp - Nền tảng hướng nghiệp thông minh cho học sinh"
      },
      {
        name: "Dịch vụ",
        url: createPageUrl("Services"),
        description: "Danh sách đầy đủ các dịch vụ trắc nghiệm, tư vấn, phân tích AI và hồ sơ năng lực"
      },
      {
        name: "Tổ hợp môn",
        url: createPageUrl("SubjectCombinations"),
        description: "Tra cứu 78+ tổ hợp môn xét tuyển đại học theo khối A, B, C, D và Năng khiếu"
      },
      {
        name: "Trường học",
        url: createPageUrl("Schools"),
        description: "Thông tin các trường THPT, Cao đẳng, Đại học và Giáo dục thường xuyên"
      },
      {
        name: "Về chúng tôi",
        url: createPageUrl("Gallery"),
        description: "Thông tin về dự án Cửa Sổ Nghề Nghiệp và Quyết định 522/QĐ-TTg"
      },
      {
        name: "Đội ngũ",
        url: createPageUrl("Team"),
        description: "Gặp gỡ nhóm học sinh và giáo viên phát triển dự án"
      },
      {
        name: "Liên hệ",
        url: createPageUrl("Contact"),
        description: "Thông tin liên hệ Trường THCS Nguyễn Du và form liên hệ"
      }
    ]
  },
  {
    category: "Danh Mục Dịch Vụ",
    icon: BookOpen,
    pages: [
      {
        name: "Trắc nghiệm nghề nghiệp",
        url: createPageUrl("Services?category=assessment"),
        description: "Holland, MBTI, IQ, EQ và gói trắc nghiệm toàn diện"
      },
      {
        name: "Tư vấn định hướng",
        url: createPageUrl("Services?category=career_counseling"),
        description: "Tư vấn 1-1 với chuyên gia, gói theo dõi dài hạn"
      },
      {
        name: "Chọn trường - Chọn ngành",
        url: createPageUrl("Services?category=school_selection"),
        description: "Tư vấn chọn ngành học, trường đại học, tổ hợp môn thi"
      },
      {
        name: "Phân tích AI",
        url: createPageUrl("Services?category=ai_analysis"),
        description: "AI phân tích nghề nghiệp, dự đoán xu hướng, so khớp công việc"
      },
      {
        name: "Hồ sơ năng lực số",
        url: createPageUrl("Services?category=career_profile"),
        description: "Xây dựng hồ sơ, báo cáo chi tiết, theo dõi tiến độ"
      }
    ]
  }
];

export default function Sitemap() {
  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium">Sơ đồ trang</span>
          </div>
          
          <h1 className="font-display font-medium text-[length:var(--font-h1)] text-[#0F0F0F] mb-6 leading-tight">
            Sơ Đồ Website Cửa Sổ Nghề Nghiệp
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-[1.618]">
            Khám phá tất cả các trang và dịch vụ của nền tảng hướng nghiệp. 
            Tìm chính xác những gì bạn cần trong cấu trúc website có tổ chức.
          </p>
        </motion.div>

        {/* Sitemap Grid */}
        <div className="space-y-12">
          {sitePages.map((section, sectionIndex) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: sectionIndex * 0.2,
                ease: "easeOut"
              }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20"
            >
              {/* Section Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                  <section.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="font-display text-2xl font-bold text-[#0F0F0F]">
                  {section.category}
                </h2>
              </div>

              {/* Pages Grid */}
              <div className="grid lg:grid-cols-2 gap-6">
                {section.pages.map((page, pageIndex) => (
                  <motion.div
                    key={page.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: sectionIndex * 0.2 + pageIndex * 0.1
                    }}
                    className="group"
                  >
                    <Link
                      to={page.url}
                      className="block p-6 bg-gray-50 rounded-2xl hover:bg-indigo-600/5 transition-all duration-300 hover:shadow-md group-hover:border-indigo-600/30 border border-transparent"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display text-lg font-bold text-[#0F0F0F] group-hover:text-indigo-600 transition-colors duration-300">
                          {page.name}
                        </h3>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {page.description}
                      </p>
                      
                      <div className="text-xs font-mono text-indigo-600 bg-indigo-600/10 px-3 py-1 rounded-full inline-block">
                        {page.url}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* SEO Information */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20"
        >
          <h2 className="font-display text-2xl font-bold text-[#0F0F0F] mb-6 text-center">
            Về Website Của Chúng Tôi
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display text-lg font-bold text-indigo-600 mb-3">
                Tính Năng Website
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Thiết kế responsive trên mọi thiết bị</li>
                <li>• Hệ thống đặt lịch tư vấn hiện đại</li>
                <li>• Danh mục dịch vụ hướng nghiệp chuyên nghiệp</li>
                <li>• Thông tin dự án và đội ngũ</li>
                <li>• Form liên hệ và thông tin trường học</li>
                <li>• Trợ lý AI hỗ trợ 24/7</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-display text-lg font-bold text-indigo-600 mb-3">
                Thông Tin Liên Hệ
              </h3>
              <div className="text-gray-600 space-y-1">
                <p className="font-bold">Trường THCS Nguyễn Du</p>
                <p>523, Phạm Hùng, Phường Bà Rịa</p>
                <p>TP. Bà Rịa, Bà Rịa - Vũng Tàu</p>
                <p className="mt-3">Điện thoại: <span className="font-medium">(0254) 3.826.178</span></p>
                <p>Email: <span className="font-medium">c2nguyendu.baria.bariavungtau@moet.edu.vn</span></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="font-display text-3xl font-bold mb-4">
              Sẵn Sàng Khám Phá Nghề Nghiệp?
            </h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Đăng ký tư vấn ngay hôm nay và bắt đầu hành trình định hướng tương lai với Cửa Sổ Nghề Nghiệp.
            </p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
              className="bg-white text-indigo-600 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Đặt Lịch Tư Vấn Ngay
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
