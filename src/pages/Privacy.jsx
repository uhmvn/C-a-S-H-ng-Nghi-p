import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Shield, Lock, Eye, Database, FileCheck } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "Thu thập thông tin",
    content: `Chúng tôi thu thập thông tin cá nhân khi bạn:
    
• Đăng ký tài khoản trên website
• Đặt lịch tư vấn hướng nghiệp
• Thực hiện các bài trắc nghiệm năng lực
• Liên hệ với chúng tôi qua form hoặc email
• Sử dụng các dịch vụ trên nền tảng

Thông tin có thể bao gồm: họ tên, email, số điện thoại, thông tin học vấn, kết quả trắc nghiệm và các thông tin liên quan đến việc định hướng nghề nghiệp.`
  },
  {
    icon: Lock,
    title: "Sử dụng thông tin",
    content: `Thông tin cá nhân của bạn được sử dụng để:
    
• Cung cấp dịch vụ hướng nghiệp và tư vấn
• Phân tích năng lực và gợi ý nghề nghiệp phù hợp
• Liên hệ và hỗ trợ bạn khi cần thiết
• Cải thiện chất lượng dịch vụ
• Gửi thông tin về các dịch vụ mới (nếu bạn đồng ý)
• Tuân thủ các yêu cầu pháp lý

Chúng tôi cam kết không bán hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba.`
  },
  {
    icon: Shield,
    title: "Bảo mật thông tin",
    content: `Chúng tôi áp dụng các biện pháp bảo mật nghiêm ngặt:
    
• Mã hóa dữ liệu trong quá trình truyền tải
• Lưu trữ an toàn trên hệ thống được bảo vệ
• Giới hạn quyền truy cập chỉ cho nhân viên có thẩm quyền
• Thường xuyên kiểm tra và cập nhật bảo mật
• Tuân thủ các tiêu chuẩn bảo mật quốc tế

Tuy nhiên, không có hệ thống nào là an toàn tuyệt đối 100%. Chúng tôi khuyến khích bạn bảo vệ thông tin đăng nhập của mình.`
  },
  {
    icon: Eye,
    title: "Chia sẻ thông tin",
    content: `Thông tin của bạn có thể được chia sẻ trong các trường hợp:
    
• Với phụ huynh/giáo viên (nếu bạn là học sinh dưới 18 tuổi)
• Với các chuyên gia tư vấn của chúng tôi (để phục vụ tư vấn)
• Với các cơ quan có thẩm quyền theo yêu cầu pháp luật
• Với đối tác cung cấp dịch vụ (với cam kết bảo mật nghiêm ngặt)

Trong mọi trường hợp, chúng tôi đảm bảo thông tin được bảo vệ và chỉ sử dụng cho mục đích hợp pháp.`
  },
  {
    icon: FileCheck,
    title: "Quyền của bạn",
    content: `Bạn có các quyền sau đối với thông tin cá nhân:
    
• Quyền truy cập và xem thông tin của mình
• Quyền yêu cầu sửa đổi thông tin không chính xác
• Quyền yêu cầu xóa thông tin (trong một số trường hợp)
• Quyền rút lại sự đồng ý bất cứ lúc nào
• Quyền từ chối nhận thông tin marketing
• Quyền khiếu nại với cơ quan quản lý

Để thực hiện các quyền này, vui lòng liên hệ với chúng tôi qua email: c2nguyendu.baria.bariavungtau@moet.edu.vn`
  }
];

export default function Privacy() {
  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium">Chính sách bảo mật</span>
          </div>
          
          <h1 className="font-display font-medium text-4xl md:text-5xl text-gray-900 mb-6 leading-tight">
            Chính Sách Bảo Mật
          </h1>
          
          <p className="text-lg text-gray-600 leading-relaxed">
            Cửa Sổ Nghề Nghiệp cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. 
            Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
          </p>
          
          <p className="text-sm text-gray-500 mt-4">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
                    {section.title}
                  </h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center"
        >
          <h2 className="font-display text-2xl font-bold mb-4">
            Có Câu Hỏi Về Chính Sách Bảo Mật?
          </h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Nếu bạn có bất kỳ thắc mắc nào về chính sách bảo mật của chúng tôi, 
            vui lòng liên hệ với chúng tôi.
          </p>
          <div className="space-y-2">
            <p>Email: c2nguyendu.baria.bariavungtau@moet.edu.vn</p>
            <p>Điện thoại: (0254) 3.826.178</p>
            <p>Địa chỉ: 523, Phạm Hùng, Phường Bà Rịa, TP. Bà Rịa, Bà Rịa - Vũng Tàu</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}