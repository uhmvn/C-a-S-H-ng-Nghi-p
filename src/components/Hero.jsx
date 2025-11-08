
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Target, TrendingUp, ArrowRight, GraduationCap, Users, Award } from "lucide-react";

// Utility function for creating page URLs
const createPageUrl = (pageName) => {
  // This assumes a simple path structure like /TestHolland or /Schools.
  // Adjust this function if your application's routing requires a different base path or structure.
  return `/${pageName}`;
};

const slides = [
  {
    id: 1,
    image_url: "https://baoquyen.vn/thumbs/1366x600x1/upload/news/con-duong-su-nghiep-la-co-hoi-de-song-mot-cuoc-doi-tron-ven-hinh-dai-dien-6621.jpg",
    headline: "Khám Phá Con Đường Sự Nghiệp Của Bạn",
    subheading: "Navigate Your Future with Confidence",
    description: "Nền tảng hướng nghiệp thông minh giúp học sinh THCS & THPT hiểu bản thân, chọn nghề đúng, và định hướng tương lai một cách khoa học với sự hỗ trợ của AI.",
    cta_text: "BẮT ĐẦU KHÁM PHÁ",
    cta_action: "booking",
    isH1: true,
  },
  {
    id: 2,
    image_url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=2560&q=90",
    headline: "Phân Tích Năng Lực Toàn Diện",
    subheading: "AI-Powered Career Assessment",
    description: "Trắc nghiệm đa chiều kết hợp công nghệ AI để phân tích sâu điểm mạnh, sở thích và tiềm năng của bạn. Nhận báo cáo chi tiết về nghề nghiệp phù hợp nhất.",
    cta_text: "LÀM TRẮC NGHIỆM NGAY",
    cta_action: "test",
    isH1: false,
  },
  {
    id: 3,
    image_url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=2560&q=90",
    headline: "Chọn Trường - Chọn Ngành Đúng Đắn",
    subheading: "Smart School & Major Selection",
    description: "Gợi ý tổ hợp môn, chuyên ngành và trường học phù hợp với năng lực và định hướng của bạn. Kết nối với hàng nghìn thông tin tuyển sinh cập nhật.",
    cta_text: "TÌM TRƯỜNG PHÙ HỢP",
    cta_action: "schools",
    isH1: false,
  }
];

const trustIndicators = [
  { icon: Users, text: "10,000+ Học sinh tin dùng", color: "text-white" },
  { icon: Award, text: "Công nghệ AI tiên tiến", color: "text-blue-300" },
  { icon: GraduationCap, text: "1000+ Trường hợp thành công", color: "text-white" }
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  const handleCTAClick = (action) => {
    if (action === 'booking') {
      window.dispatchEvent(new CustomEvent('open-booking-modal'));
    } else if (action === 'test') {
      window.location.href = createPageUrl('TestHolland');
    } else if (action === 'schools') {
      window.location.href = createPageUrl('Schools');
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Images */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <img
            src={currentSlide.image_url}
            alt={`${currentSlide.headline} - Cửa Sổ Nghề Nghiệp, nền tảng hướng nghiệp thông minh cho học sinh`}
            className="w-full h-full object-cover object-center"
            style={{
              objectPosition: 'center center',
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              minHeight: '100vh',
              maxWidth: '100vw'
            }}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 via-purple-900/70 to-blue-900/60 z-10" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.5, 1],
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
          >
            <Compass className="w-12 h-12 text-blue-300" />
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 md:pt-40 pb-16 sm:pb-20">
        <div className="w-full max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-white space-y-6 sm:space-y-8"
            >
              {/* Main Headline */}
              {currentSlide.isH1 ? (
                <h1 className="font-display font-bold leading-[1.1] text-white text-[clamp(2rem,8vw,5rem)]">
                  {currentSlide.headline}
                  <br />
                  <span className="block text-blue-300 glow-text mt-4 sm:mt-6 text-[0.85em]">
                    {currentSlide.subheading}
                  </span>
                </h1>
              ) : (
                <h2 className="font-display font-bold leading-[1.1] text-white text-[clamp(2rem,8vw,5rem)]">
                  {currentSlide.headline}
                  <br />
                  <span className="block text-blue-300 glow-text mt-4 sm:mt-6 text-[0.85em]">
                    {currentSlide.subheading}
                  </span>
                </h2>
              )}

              {/* Description */}
              <p className="text-gray-100 text-[clamp(1.125rem,4vw,1.5rem)] font-light leading-relaxed max-w-4xl font-body">
                {currentSlide.description}
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-4 sm:gap-6 pt-2 sm:pt-4">
                {trustIndicators.map((indicator, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <indicator.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${indicator.color}`} />
                    <span className="text-xs sm:text-sm font-medium text-white/90 font-body">{indicator.text}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-6">
                <button
                  onClick={() => handleCTAClick(currentSlide.cta_action)}
                  className="group bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-6 sm:px-8 lg:px-10 py-4 sm:py-5 rounded-full font-body font-semibold text-sm sm:text-base lg:text-lg hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 transition-all duration-500 hover:scale-105 shadow-2xl hover:shadow-blue-500/30 flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] sm:min-h-[56px] lg:min-h-[60px] w-full sm:w-auto"
                >
                  <span className="text-center leading-tight">
                    {currentSlide.cta_text}
                  </span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300 flex-shrink-0" />
                </button>
                
                <button
                  onClick={() => window.location.href = 'tel:02543826178'}
                  className="group bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-6 sm:px-8 py-4 sm:py-5 rounded-full font-body font-semibold text-sm sm:text-base lg:text-lg hover:bg-white hover:text-indigo-900 transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] sm:min-h-[56px] lg:min-h-[60px] w-full sm:w-auto"
                >
                  <span className="whitespace-nowrap">Gọi ngay: (0254) 3.826.178</span>
                </button>
              </div>

              {/* Urgency Element */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md border border-blue-400/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-300 flex-shrink-0" />
                  <span className="text-blue-300 font-medium text-xs sm:text-sm font-display">ƯU ĐÃI ĐẶC BIỆT</span>
                </div>
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed font-body">
                  Đăng ký ngay hôm nay để nhận tư vấn miễn phí từ chuyên gia hướng nghiệp
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
              currentIndex === index ? "bg-white scale-125" : "bg-white/50 hover:bg-white"
            }`}
            aria-label={`Đi đến slide ${index + 1}`}
          />
        ))}
      </div>

      <style jsx>{`
        .glow-text {
          text-shadow: 
            0 0 10px rgba(147, 197, 253, 0.5),
            0 0 20px rgba(147, 197, 253, 0.3);
          filter: drop-shadow(0 0 5px rgba(147, 197, 253, 0.3));
        }
        
        @media (max-width: 640px) {
          .glow-text {
            text-shadow: 
              0 0 5px rgba(147, 197, 253, 0.6),
              0 0 12px rgba(147, 197, 253, 0.4);
            filter: drop-shadow(0 0 3px rgba(147, 197, 253, 0.4));
          }
        }
      `}</style>
    </section>
  );
}
