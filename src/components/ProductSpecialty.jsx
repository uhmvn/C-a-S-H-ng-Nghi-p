import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, Users, TrendingUp, CheckCircle, Target, Lightbulb } from 'lucide-react';

const specialtyItems = [
  { icon: Shield, text: "An toàn dữ liệu" },
  { icon: Award, text: "Chứng nhận chuyên nghiệp" },
  { icon: Users, text: "10,000+ Học sinh" },
  { icon: TrendingUp, text: "AI tiên tiến" },
  { icon: CheckCircle, text: "Đã được kiểm chứng" },
  { icon: Target, text: "Chính xác cao" },
  { icon: Lightbulb, text: "Phương pháp khoa học" }
];

export default function ProductSpecialty() {
  const extendedSpecialties = [...specialtyItems, ...specialtyItems, ...specialtyItems, ...specialtyItems];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut", type: "spring", stiffness: 100 }}
      viewport={{ once: true }}
      className="py-16 md:py-20 overflow-hidden relative bg-gradient-to-b from-white to-blue-50"
    >
      <style jsx>{`
        .marquee-container {
          display: flex;
          width: fit-content;
          animation: marquee 60s linear infinite;
        }

        .marquee-item {
          flex-shrink: 0;
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .group:hover .marquee-container {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="text-center mb-16 relative">
          <motion.h2 
            initial={{ opacity: 0, y: 60, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-bold leading-tight"
          >
              <span className="text-gray-900">Cam Kết Chất Lượng</span>
              <br />
              <span className="text-indigo-600">Nền Tảng Của Chúng Tôi</span>
          </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="font-body text-lg text-gray-600 mt-6 max-w-3xl mx-auto leading-relaxed"
        >
          Tại Cửa Sổ Nghề Nghiệp, chúng tôi cam kết sử dụng công nghệ AI tiên tiến, 
          phương pháp khoa học được kiểm chứng và đảm bảo an toàn dữ liệu tuyệt đối 
          để mang đến trải nghiệm hướng nghiệp tốt nhất cho học sinh.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative group"
      >
        <div className="flex overflow-hidden">
            <div className="marquee-container">
                {extendedSpecialties.map((item, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, y: 50, rotateY: 90 }}
                      whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: (index % specialtyItems.length) * 0.1,
                        ease: "easeOut"
                      }}
                      viewport={{ once: true }}
                      whileHover={{ 
                        scale: 1.1, 
                        y: -10,
                        rotateZ: 5,
                        transition: { duration: 0.3 }
                      }}
                      className="marquee-item flex flex-col items-center justify-center mx-8 text-center w-32"
                    >
                        <motion.div 
                          whileHover={{ 
                            rotate: 360,
                            scale: 1.2,
                            boxShadow: "0 15px 30px rgba(79, 70, 229, 0.3)"
                          }}
                          transition={{ duration: 0.5 }}
                          className="w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-300 border-2 border-transparent hover:border-indigo-600/30 bg-white"
                        >
                            <item.icon className="w-8 h-8 text-gray-500 transition-colors duration-300 group-hover:text-indigo-600" />
                        </motion.div>
                        <motion.p 
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 0.6, delay: (index % specialtyItems.length) * 0.1 + 0.3 }}
                          viewport={{ once: true }}
                          className="font-body text-sm text-gray-700 font-medium transition-colors duration-300 group-hover:text-gray-900"
                        >
                            {item.text}
                        </motion.p>
                    </motion.div>
                ))}
            </div>
        </div>
      </motion.div>
    </motion.section>
  );
}