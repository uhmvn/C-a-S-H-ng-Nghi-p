import React from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, School, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Trắc nghiệm năng lực",
    description: "Đánh giá toàn diện về tính cách, sở thích và năng lực của học sinh"
  },
  {
    icon: BookOpen,
    title: "Gợi ý nghề nghiệp",
    description: "AI phân tích và đề xuất các nghề nghiệp phù hợp nhất với bạn"
  },
  {
    icon: School,
    title: "Tư vấn chọn trường",
    description: "Hỗ trợ lựa chọn ngành học, tổ hợp môn và trường đại học phù hợp"
  },
  {
    icon: TrendingUp,
    title: "Theo dõi tiến độ",
    description: "Xây dựng hồ sơ năng lực số và theo dõi sự phát triển của học sinh"
  }
];

export default function WhatWeDo() {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.8 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", type: "spring", stiffness: 100 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.p 
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.3em" }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
            className="font-body text-sm text-gray-500 mb-4 tracking-wider uppercase"
          >
            Dịch Vụ Của Chúng Tôi
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 50, skewX: 10 }}
            whileInView={{ opacity: 1, y: 0, skewX: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
          >
            Hệ Thống Hướng Nghiệp<br />
            <motion.span 
              initial={{ opacity: 0, scale: 0.5, color: "#4F46E5" }}
              whileInView={{ opacity: 1, scale: 1, color: "#4F46E5" }}
              transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="text-indigo-600"
            >
              Toàn Diện & Khoa Học
            </motion.span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30, filter: 'blur(5px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            Cửa Sổ Nghề Nghiệp cung cấp giải pháp hướng nghiệp toàn diện cho học sinh THCS & THPT. 
            Từ trắc nghiệm năng lực, phân tích AI đến tư vấn chuyên sâu, chúng tôi đồng hành cùng bạn 
            trong hành trình khám phá và định hướng tương lai.
          </motion.p>
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Image */}
          <motion.div
            initial={{ opacity: 0, x: -150, rotate: -15, scale: 0.7 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut", type: "spring", stiffness: 80 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="lg:col-span-3 flex justify-center lg:justify-start"
          >
            <motion.div 
              whileHover={{ boxShadow: "0 30px 60px rgba(79, 70, 229, 0.3)" }}
              className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=90"
                alt="Học sinh đang học tập và định hướng nghề nghiệp"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </motion.div>
          </motion.div>

          {/* Center Features */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ 
                    opacity: 0, 
                    y: 100, 
                    scale: 0.7,
                    rotateX: index % 2 === 0 ? 45 : -45,
                    rotateY: index % 2 === 0 ? -20 : 20
                  }}
                  whileInView={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    rotateX: 0,
                    rotateY: 0
                  }}
                  transition={{ 
                    duration: 1.5, 
                    delay: index * 0.2,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.08, 
                    y: -10,
                    rotateZ: index % 2 === 0 ? 2 : -2,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                  }}
                  className="flex items-start gap-4 group cursor-pointer"
                >
                  {/* Icon */}
                  <motion.div 
                    initial={{ scale: 0, rotate: -360 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 1, 
                      delay: index * 0.2 + 0.3,
                      type: "spring",
                      stiffness: 300
                    }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      rotate: 180, 
                      scale: 1.3,
                      backgroundColor: "#4F46E5"
                    }}
                    className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-500"
                  >
                    <feature.icon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                  </motion.div>
                  
                  {/* Content */}
                  <div>
                    <motion.h3 
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.2 + 0.5 }}
                      viewport={{ once: true }}
                      className="font-display text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300"
                    >
                      {feature.title}
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 + 0.7 }}
                      viewport={{ once: true }}
                      className="font-body text-sm text-gray-600 leading-relaxed"
                    >
                      {feature.description}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 150, rotate: 15, scale: 0.7 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut", type: "spring", stiffness: 80, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="lg:col-span-3 flex justify-center lg:justify-end"
          >
            <motion.div 
              whileHover={{ boxShadow: "0 30px 60px rgba(124, 58, 237, 0.3)" }}
              className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=90"
                alt="Học sinh được tư vấn hướng nghiệp chuyên nghiệp"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.button 
            whileHover={{ scale: 1.1, boxShadow: "0 20px 40px rgba(79, 70, 229, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-body font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-lg text-lg"
          >
            Đặt Lịch Tư Vấn Ngay
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}