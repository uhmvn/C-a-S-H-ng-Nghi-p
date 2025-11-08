
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Phụ huynh Nguyễn Thị Mai",
    role: "Phụ huynh học sinh lớp 9",
    rating: 5,
    text: "Cửa Sổ Nghề Nghiệp đã giúp con tôi tìm ra định hướng rõ ràng cho tương lai. Các bài trắc nghiệm khoa học và lời tư vấn từ chuyên gia rất hữu ích. Con đã tự tin hơn trong việc lựa chọn tổ hợp môn và ngành học.",
    image_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=90"
  },
  {
    id: 2,
    name: "Em Trần Minh Khoa",
    role: "Học sinh lớp 12",
    rating: 5,
    text: "Website này thực sự là 'cửa sổ' giúp em nhìn rõ con đường nghề nghiệp phía trước. Em đã làm trắc nghiệm MBTI và Holland, kết quả giúp em hiểu rõ điểm mạnh của bản thân và chọn được ngành Công nghệ thông tin phù hợp.",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=90"
  },
  {
    id: 3,
    name: "Thầy Lê Văn Nam",
    role: "Giáo viên Trường THCS Nguyễn Du",
    rating: 5,
    text: "Là giáo viên chủ nhiệm lớp 9, tôi thấy Cửa Sổ Nghề Nghiệp là công cụ rất hữu ích trong công tác định hướng nghề nghiệp cho học sinh. Hệ thống trắc nghiệm khoa học, kết hợp AI giúp các em có cái nhìn khách quan về bản thân.",
    image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=90"
  },
  {
    id: 4,
    name: "Em Phạm Thu Hà",
    role: "Học sinh lớp 9",
    rating: 5,
    text: "Em rất thích phần gợi ý nghề nghiệp của website. Sau khi làm trắc nghiệm, em được gợi ý nhiều nghề phù hợp với tính cách và sở thích của mình. Giờ em đã biết mình nên học tổ hợp nào và chọn trường nào rồi!",
    image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=90"
  },
  {
    id: 5,
    name: "Phụ huynh Hoàng Văn Tuấn",
    role: "Phụ huynh học sinh lớp 12",
    rating: 5,
    text: "Trước đây gia đình tôi rất lo lắng về định hướng nghề nghiệp cho con. Nhờ Cửa Sổ Nghề Nghiệp, con đã có báo cáo năng lực chi tiết, giúp cả nhà cùng thảo luận và đưa ra quyết định đúng đắn về tương lai của con.",
    image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=90"
  },
  {
    id: 6,
    name: "Cô Trần Thị Lan",
    role: "Giáo viên Tư vấn Học đường",
    rating: 5,
    text: "Cửa Sổ Nghề Nghiệp là một nền tảng tuyệt vời hỗ trợ công tác giáo dục hướng nghiệp theo Quyết định 522/QĐ-TTg. Dữ liệu phân tích của hệ thống giúp tôi tư vấn chính xác hơn cho từng học sinh.",
    image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=90"
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState({});
  const intervalRef = useRef(null);

  const startSlideshow = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);
  };

  const resetSlideshow = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startSlideshow();
  };

  useEffect(() => {
    startSlideshow();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    resetSlideshow();
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    resetSlideshow();
  };

  const goToTestimonial = (index) => {
    setCurrentIndex(index);
    resetSlideshow();
  };

  const handleImageError = (testimonialId) => {
    setImageError(prev => ({ ...prev, [testimonialId]: true }));
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section
      className="py-12 relative overflow-hidden"
      onMouseEnter={() => clearInterval(intervalRef.current)}
      onMouseLeave={startSlideshow}
    >
      <div className="relative max-w-4xl mx-auto px-6">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative"
          >
            <Quote className="absolute -top-2 -right-2 w-16 h-16 text-indigo-200/80" />
            
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-gray-900 mb-8 relative z-10">
              Phụ Huynh & Học Sinh Nói Gì
            </h2>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-indigo-100 bg-gray-200">
                    {imageError[currentTestimonial.id] ? (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {currentTestimonial.name.split(' ').slice(-2).map(n => n[0]).join('')}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={currentTestimonial.image_url}
                        alt={`${currentTestimonial.name} - ${currentTestimonial.role}`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(currentTestimonial.id)}
                      />
                    )}
                  </div>
                </div>

                <p className="font-body text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto min-h-[120px]">
                  "{currentTestimonial.text}"
                </p>

                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 transition-colors duration-300 ${
                        i < currentTestimonial.rating
                          ? 'text-indigo-600 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <div>
                  <h4 className="font-display text-xl font-semibold text-gray-900">
                    {currentTestimonial.name}
                  </h4>
                  <p className="font-body text-sm text-indigo-600 uppercase tracking-wider">
                    {currentTestimonial.role}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 max-w-md mx-auto">
              <button
                onClick={prevTestimonial}
                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'bg-indigo-600 w-6'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextTestimonial}
                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
