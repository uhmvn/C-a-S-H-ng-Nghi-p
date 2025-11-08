
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Target, Users, BookOpen, TrendingUp, ExternalLink } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

const projectHighlights = [
  {
    icon: Target,
    title: "Mục tiêu của dự án",
    description: "Giúp học sinh THCS & THPT xác định nghề nghiệp, hiểu rõ sở thích và năng lực, cũng như nắm bắt nhu cầu nghề nghiệp của xã hội theo Quyết định 522/QĐ-TTg."
  },
  {
    icon: Users,
    title: "Đối tượng hướng đến",
    description: "Học sinh THCS & THPT đang đứng trước ngưỡng cửa tương lai, cần định hướng nghề nghiệp và lựa chọn trường học phù hợp."
  },
  {
    icon: BookOpen,
    title: "Công cụ hỗ trợ",
    description: "Trắc nghiệm khoa học, phân tích AI, gợi ý nghề nghiệp, tư vấn chọn trường và tổ hợp môn thi phù hợp với năng lực cá nhân."
  },
  {
    icon: TrendingUp,
    title: "Kết nối với thực tế",
    description: "Cung cấp thông tin ngành nghề cập nhật, xu hướng thị trường lao động để học sinh có cái nhìn thực tế về tương lai nghề nghiệp."
  }
];

const galleryImages = [
  {
    src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690800a89985178f2ceea9b5/b12dd9b27_image.png",
    title: "Trường THCS Nguyễn Du",
    category: "Cơ sở vật chất"
  },
  {
    src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=90",
    title: "Học sinh khám phá nghề nghiệp",
    category: "Hướng nghiệp"
  },
  {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=90",
    title: "Tư vấn định hướng cá nhân",
    category: "Tư vấn"
  },
  {
    src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=90",
    title: "Trắc nghiệm năng lực",
    category: "Đánh giá"
  },
  {
    src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=90",
    title: "Chọn trường đại học",
    category: "Tuyển sinh"
  },
  {
    src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=90",
    title: "Phân tích kết quả AI",
    category: "Công nghệ"
  },
  {
    src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=90",
    title: "Tư vấn chọn ngành học",
    category: "Định hướng"
  }
];

export default function Gallery() {
  const breadcrumbItems = [
    { label: "Về chúng tôi" }
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
            <span className="text-sm font-medium">Về Dự Án</span>
          </div>
          
          <h1 className="font-display font-medium text-[length:var(--font-h1)] text-gray-900 mb-6 leading-tight">
            Về Dự Án "Cửa Sổ Nghề Nghiệp"
          </h1>
          
          <div className="text-xl text-gray-600 max-w-4xl mx-auto leading-[1.618] space-y-4">
            <p>
              Tên gọi <strong>"Cửa Sổ Nghề Nghiệp"</strong> được chọn bởi vì chúng ta – các em học sinh lớp 9 & 12 – như đang đứng trước một cánh cửa mở ra tương lai, nơi có thể nhìn thấy nhiều lựa chọn nghề nghiệp khác nhau ở phía trước.
            </p>
            <p>
              Việc "mở cửa sổ" ở đây tượng trưng cho việc <strong>khám phá bản thân</strong>, tiếp cận thông tin ngành nghề và thị trường lao động, từ đó tìm ra hướng đi phù hợp.
            </p>
          </div>
        </motion.div>

        {/* Project Highlights */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-8">
            {projectHighlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-6">
                  <item.icon className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Government Decision Banner */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl"
        >
          <div className="text-center mb-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Căn Cứ Pháp Lý
            </h2>
            <div className="w-24 h-1 bg-white/30 mx-auto"></div>
          </div>
          
          <p className="text-lg leading-relaxed mb-6 text-center max-w-4xl mx-auto">
            Website này được xây dựng nhằm mục tiêu giúp các em học sinh xác định nghề nghiệp, hiểu rõ sở thích và năng lực của mình, cũng như hiểu được bối cảnh nhu cầu nghề nghiệp của xã hội — theo đúng định hướng của:
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h3 className="font-display text-xl font-bold mb-3 text-center">
              Đề án "Giáo dục hướng nghiệp và định hướng phân luồng học sinh trong giáo dục phổ thông giai đoạn 2018‑2025"
            </h3>
            <p className="text-center text-white/90 mb-4">
              Được phê duyệt tại <strong>Quyết định 522/QĐ-TTg</strong>
            </p>
          </div>

          <div className="text-center">
            <a 
              href="https://vanban.chinhphu.vn/default.aspx?pageid=27160&docid=193710"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-indigo-600 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <ExternalLink className="w-5 h-5" />
              Xem Văn Bản Chính Thức
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-indigo-600/20 mb-16"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            Sứ Mệnh Của Chúng Tôi
          </h2>
          
          <div className="prose prose-lg max-w-4xl mx-auto text-gray-600">
            <p className="leading-relaxed mb-4">
              Theo Quyết định 522/QĐ-TTg, việc giáo dục hướng nghiệp và phân luồng học sinh là một nhiệm vụ trọng tâm của giáo dục phổ thông, nhằm kết nối giữa năng lực, sở thích cá nhân của học sinh với yêu cầu phát triển kinh tế – xã hội của đất nước.
            </p>
            <p className="leading-relaxed">
              Website <strong>"Cửa Sổ Nghề Nghiệp"</strong> chính là một công cụ hỗ trợ để thực hiện mục tiêu này — bằng cách cung cấp thông tin ngành nghề, trắc nghiệm, lời khuyên và hướng dẫn giúp học sinh chuẩn bị cho giai đoạn chuyển tiếp và định hướng nghề nghiệp tương lai.
            </p>
          </div>
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-16"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Hình Ảnh Hoạt Động
          </h2>
          
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
            {galleryImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.8 + index * 0.1,
                  ease: "easeOut"
                }}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={image.src}
                      alt={`${image.title} - Cửa Sổ Nghề Nghiệp`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute inset-0 flex items-end justify-start p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="text-white">
                        <span className="inline-block bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium mb-2">
                          {image.category}
                        </span>
                        <h3 className="font-display text-xl font-bold">
                          {image.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center"
        >
          <div className="bg-white rounded-3xl p-12 shadow-lg border border-indigo-600/20">
            <h2 className="font-display text-[length:var(--font-h2)] font-bold text-gray-900 mb-4">
              Bắt Đầu Hành Trình Khám Phá
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-[1.618]">
              Hãy bước qua "Cửa Sổ Nghề Nghiệp" để khám phá tiềm năng của bạn và tìm ra con đường sự nghiệp phù hợp nhất.
            </p>
            <button 
              onClick={() => window.location.href = '/Services'}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              Khám Phá Dịch Vụ
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
