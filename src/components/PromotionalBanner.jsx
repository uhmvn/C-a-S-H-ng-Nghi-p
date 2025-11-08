import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Target, TrendingUp, Award } from "lucide-react";

export default function PromotionalBanner() {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
      {/* Floating Animation Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
              y: [-20, -80, -120],
              x: [0, 30, -20]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut"
            }}
            style={{
              left: `${15 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`
            }}
          >
            <Sparkles className="w-6 h-6 text-white/60" />
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          {/* Icon Features */}
          <div className="flex justify-center gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-white/90">Chính xác</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-white/90">Hiệu quả</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-white/90">Khoa học</p>
            </motion.div>
          </div>

          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, type: "spring", stiffness: 100 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            Định Hướng Tương Lai Ngay Hôm Nay
          </motion.h2>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-2"
          >
            <p className="font-body text-xl md:text-2xl font-light text-white/90">
              Hệ Thống Hướng Nghiệp Thông Minh Dành Cho Học Sinh THCS & THPT
            </p>
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="font-body text-base md:text-lg text-white/80"
            >
              Trắc nghiệm khoa học • Phân tích AI • Tư vấn chuyên gia • Miễn phí 100%
            </motion.p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 150 }}
            viewport={{ once: true }}
            className="pt-6"
          >
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
              className="group bg-white text-indigo-600 px-8 py-4 rounded-full font-body font-semibold hover:bg-gray-50 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 mx-auto text-lg"
            >
              BẮT ĐẦU KHÁM PHÁ BẢN THÂN
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0, rotate: -90 }}
            whileInView={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-4 pt-4"
          >
            <div className="w-16 h-0.5 bg-white/30"></div>
            <Sparkles className="w-6 h-6 text-white/60" />
            <div className="w-16 h-0.5 bg-white/30"></div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}