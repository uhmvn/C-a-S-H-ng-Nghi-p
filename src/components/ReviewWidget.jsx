import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";

// Import testimonials từ TestimonialsSection
const testimonials = [
  {
    id: 1,
    name: "Phụ huynh Nguyễn Thị Mai",
    role: "Phụ huynh học sinh lớp 9",
    rating: 5,
    text: "Cửa Sổ Nghề Nghiệp đã giúp con tôi tìm ra định hướng rõ ràng cho tương lai. Các bài trắc nghiệm khoa học và lời tư vấn từ chuyên gia rất hữu ích.",
    service: "Trắc nghiệm Holland",
    image_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=90"
  },
  {
    id: 2,
    name: "Em Trần Minh Khoa",
    role: "Học sinh lớp 12",
    rating: 5,
    text: "Website này thực sự là 'cửa sổ' giúp em nhìn rõ con đường nghề nghiệp phía trước. Kết quả giúp em hiểu rõ điểm mạnh của bản thân.",
    service: "Trắc nghiệm MBTI",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=90"
  },
  {
    id: 3,
    name: "Thầy Lê Văn Nam",
    role: "Giáo viên THCS Nguyễn Du",
    rating: 5,
    text: "Là giáo viên chủ nhiệm, tôi thấy đây là công cụ rất hữu ích trong công tác định hướng nghề nghiệp cho học sinh.",
    service: "Hệ thống hướng nghiệp",
    image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=90"
  },
  {
    id: 4,
    name: "Em Phạm Thu Hà",
    role: "Học sinh lớp 9",
    rating: 5,
    text: "Em rất thích phần gợi ý nghề nghiệp. Giờ em đã biết mình nên học tổ hợp nào và chọn trường nào rồi!",
    service: "Tư vấn chọn ngành",
    image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=90"
  },
  {
    id: 5,
    name: "Phụ huynh Hoàng Văn Tuấn",
    role: "Phụ huynh học sinh lớp 12",
    rating: 5,
    text: "Nhờ Cửa Sổ Nghề Nghiệp, con đã có báo cáo năng lực chi tiết, giúp cả nhà cùng thảo luận và đưa ra quyết định đúng đắn.",
    service: "Phân tích AI",
    image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=90"
  },
  {
    id: 6,
    name: "Cô Trần Thị Lan",
    role: "Giáo viên Tư vấn",
    rating: 5,
    text: "Cửa Sổ Nghề Nghiệp là nền tảng tuyệt vời hỗ trợ công tác giáo dục hướng nghiệp theo Quyết định 522/QĐ-TTg.",
    service: "Dữ liệu phân tích",
    image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=90"
  }
];

export default function ReviewWidget() {
  const [currentReview, setCurrentReview] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [isManuallyDismissed, setIsManuallyDismissed] = useState(
    () => sessionStorage.getItem('reviewWidgetDismissed') === 'true'
  );

  useEffect(() => {
    if (isManuallyDismissed) return;

    const showWidget = () => {
      setIsVisible(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % testimonials.length);
      showWidget();
    }, 8000);

    const initialTimer = setTimeout(() => {
      showWidget();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, [isManuallyDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsManuallyDismissed(true);
    sessionStorage.setItem('reviewWidgetDismissed', 'true');
  };

  const handleImageError = (reviewId) => {
    setImageErrors(prev => ({ ...prev, [reviewId]: true }));
  };

  const review = testimonials[currentReview];

  return (
    <AnimatePresence>
      {!isManuallyDismissed && isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -100, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-2 left-2 z-50 w-56 xs:w-60 sm:w-64 md:w-72"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-3 sm:p-4 relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-white to-purple-600/5" />
            
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-1 right-1 w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>

            {/* Content */}
            <div className="relative">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-indigo-600/20 flex-shrink-0 bg-gray-100">
                  {imageErrors[review.id] ? (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">{review.name.charAt(0)}</span>
                    </div>
                  ) : (
                    <img
                      src={review.image_url}
                      alt={review.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(review.id)}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm font-semibold text-gray-900 truncate">
                    {review.name}
                  </p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating
                            ? 'text-indigo-600 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <p className="font-sans text-xs sm:text-sm text-gray-600 leading-tight mb-2 line-clamp-2 pr-4">
                "{review.text}"
              </p>

              {/* Service */}
              <div className="inline-block bg-indigo-600/10 text-indigo-600 px-2 py-1 rounded-full text-xs font-medium">
                {review.service}
              </div>
            </div>

            {/* Pulse Animation Border */}
            <div className="absolute inset-0 rounded-xl border-2 border-indigo-600/30 animate-pulse pointer-events-none" />
          </div>

          {/* Badge */}
          <div className="absolute -top-1 -right-1 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-lg">
            CỬA SỔ NGHỀ NGHIỆP
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}