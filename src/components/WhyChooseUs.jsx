import React from "react";
import { motion } from "framer-motion";
import { Brain, Target, Award, Sparkles } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Trắc nghiệm khoa học với AI",
    subtitle: "PHÂN TÍCH CHÍNH XÁC",
    description: "Hệ thống trắc nghiệm đa chiều kết hợp công nghệ AI để phân tích sâu năng lực, sở thích và tiềm năng của học sinh một cách khoa học và chính xác nhất."
  },
  {
    icon: Target,
    title: "Tư vấn cá nhân hóa",
    subtitle: "CHUYÊN GIA TƯ VẤN",
    description: "Đội ngũ chuyên gia giàu kinh nghiệm trong lĩnh vực giáo dục và hướng nghiệp, cam kết đồng hành cùng học sinh tìm ra con đường phù hợp nhất."
  },
  {
    icon: Award,
    title: "Cơ sở dữ liệu toàn diện",
    subtitle: "THÔNG TIN CẬP NHẬT",
    description: "Kho thông tin đầy đủ về nghề nghiệp, ngành học, trường đại học và xu hướng thị trường lao động được cập nhật liên tục và chính xác."
  }
];

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="pt-20 md:pt-24 lg:pt-28 pb-16 md:pb-20 lg:pb-24 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      {/* Enhanced Background Decorations */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.3, rotate: 45 }}
        whileInView={{ opacity: 0.1, scale: 1, rotate: 0 }}
        transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
        viewport={{ once: true }}
        className="absolute bottom-10 left-10"
      >
        <div className="w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
      </motion.div>

      <div className="mx-auto my-1 px-6 max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 items-center">
          {/* Centered Content */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, rotateX: 15 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", type: "spring", stiffness: 100 }}
            viewport={{ once: true }}
            className="space-y-8 text-center"
          >
            {/* Header */}
            <div>
              <motion.div 
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 bg-indigo-600/10 rounded-full px-4 py-2 mb-6"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="font-sans text-sm text-indigo-600 font-medium uppercase tracking-wider">Nền Tảng Hướng Nghiệp Hàng Đầu</span>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 50, skewY: 5 }}
                whileInView={{ opacity: 1, y: 0, skewY: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                viewport={{ once: true }}
                className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              >
                <span className="text-gray-900">Tại Sao Chọn</span>
                <br />
                <span className="text-indigo-600">Cửa Sổ Nghề Nghiệp</span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 30, filter: 'blur(5px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                viewport={{ once: true }}
                className="font-body text-lg text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto"
              >
                Nền tảng hướng nghiệp thông minh #1 dành cho học sinh THCS & THPT. Kết hợp công nghệ AI tiên tiến với đội ngũ chuyên gia giáo dục để giúp bạn tìm ra con đường sự nghiệp phù hợp nhất, chọn trường đúng và định hướng tương lai một cách khoa học.
              </motion.p>
            </div>

            {/* Features List */}
            <div className="space-y-8 max-w-2xl mx-auto text-left">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100, rotateY: index % 2 === 0 ? -30 : 30, scale: 0.8 }}
                  whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                  transition={{ 
                    duration: 1.2, 
                    delay: index * 0.3,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, x: 10 }}
                  className="flex items-start gap-4 group cursor-pointer"
                >
                  {/* Icon */}
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.3 + 0.2, type: "spring", stiffness: 200 }}
                    viewport={{ once: true }}
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-all duration-500 flex-shrink-0"
                  >
                    <feature.icon className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors duration-300" />
                  </motion.div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <motion.h3 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.3 + 0.4 }}
                      viewport={{ once: true }}
                      className="font-display text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors duration-300"
                    >
                      {feature.title}
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.3 + 0.5 }}
                      viewport={{ once: true }}
                      className="font-body text-sm font-medium text-indigo-600 uppercase tracking-wider mb-2"
                    >
                      {feature.subtitle}
                    </motion.p>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.3 + 0.6 }}
                      viewport={{ once: true }}
                      className="font-body text-gray-600 leading-relaxed"
                    >
                      {feature.description}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.5 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 1.2, type: "spring", stiffness: 150 }}
              viewport={{ once: true }}
              className="pt-4"
            >
              <motion.button 
                whileHover={{ scale: 1.1, boxShadow: "0 20px 40px rgba(79, 70, 229, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-body font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-lg"
              >
                Bắt Đầu Khám Phá Nghề Nghiệp
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}