import React from "react";
import { motion } from "framer-motion";
import { Sparkles, FileText, AlertCircle, CheckCircle, XCircle, Scale } from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "Điều khoản sử dụng",
    content: `Khi sử dụng website Cửa Sổ Nghề Nghiệp, bạn đồng ý với các điều khoản sau:

• Cung cấp thông tin chính xác và trung thực
• Sử dụng dịch vụ cho mục đích hợp pháp
• Không vi phạm quyền lợi của người khác
• Tuân thủ các quy định pháp luật Việt Nam
• Chịu trách nhiệm về mật khẩu và tài khoản của mình
• Không sao chép, phân phối nội dung trái phép

Chúng tôi có quyền từ chối hoặc chấm dứt dịch vụ nếu phát hiện vi phạm.`
  },
  {
    icon: CheckCircle,
    title: "Dịch vụ và cam kết",
    content: `Cửa Sổ Nghề Nghiệp cam kết:

• Cung cấp dịch vụ hướng nghiệp chất lượng cao
• Sử dụng phương pháp khoa học và công nghệ AI tiên tiến
• Bảo mật thông tin cá nhân của học sinh
• Hỗ trợ tư vấn từ đội ngũ chuyên gia giàu kinh nghiệm
• Cập nhật thông tin về ngành nghề và trường học
• Phản hồi các yêu cầu hỗ trợ trong thời gian hợp lý

Tuy nhiên, kết quả hướng nghiệp là gợi ý tham khảo, quyết định cuối cùng thuộc về học sinh và gia đình.`
  },
  {
    icon: AlertCircle,
    title: "Trách nhiệm người dùng",
    content: `Người sử dụng dịch vụ có trách nhiệm:

• Đọc kỹ và hiểu rõ các điều khoản sử dụng
• Cung cấp thông tin chính xác khi đăng ký và sử dụng dịch vụ
• Bảo mật thông tin đăng nhập tài khoản
• Sử dụng kết quả trắc nghiệm một cách có trách nhiệm
• Tham khảo ý kiến phụ huynh/giáo viên trước khi đưa ra quyết định
• Thanh toán đầy đủ các dịch vụ đã đăng ký
• Thông báo kịp thời nếu phát hiện vấn đề về tài khoản

Với học sinh dưới 18 tuổi, phụ huynh/người giám hộ cần giám sát và đồng ý.`
  },
  {
    icon: XCircle,
    title: "Giới hạn trách nhiệm",
    content: `Cửa Sổ Nghề Nghiệp không chịu trách nhiệm về:

• Quyết định nghề nghiệp cuối cùng của học sinh
• Kết quả học tập hoặc thi cử của học sinh
• Các vấn đề phát sinh do cung cấp thông tin không chính xác
• Gián đoạn dịch vụ do sự cố kỹ thuật bất khả kháng
• Nội dung từ các website liên kết bên ngoài
• Tranh chấp giữa người dùng với nhau

Dịch vụ được cung cấp "như hiện có" và chúng tôi không đảm bảo kết quả cụ thể.`
  },
  {
    icon: Scale,
    title: "Thanh toán và hoàn trả",
    content: `Chính sách thanh toán:

• Giá dịch vụ được niêm yết rõ ràng trên website
• Thanh toán có thể thực hiện qua chuyển khoản hoặc tiền mặt
• Hóa đơn sẽ được cung cấp sau khi thanh toán thành công
• Các chương trình khuyến mãi có thời hạn nhất định

Chính sách hoàn trả:

• Hoàn lại 100% nếu hủy trước 24 giờ so với lịch hẹn
• Hoàn lại 50% nếu hủy trong vòng 12-24 giờ
• Không hoàn lại nếu hủy dưới 12 giờ hoặc không đến
• Trường hợp đặc biệt sẽ được xem xét cụ thể

Vui lòng liên hệ để biết thêm chi tiết về chính sách hoàn trả.`
  }
];

export default function Terms() {
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
            <span className="text-sm font-medium">Điều khoản dịch vụ</span>
          </div>
          
          <h1 className="font-display font-medium text-4xl md:text-5xl text-gray-900 mb-6 leading-tight">
            Điều Khoản Dịch Vụ
          </h1>
          
          <p className="text-lg text-gray-600 leading-relaxed">
            Vui lòng đọc kỹ các điều khoản và điều kiện sử dụng dịch vụ của Cửa Sổ Nghề Nghiệp. 
            Bằng việc sử dụng website, bạn đồng ý tuân thủ các điều khoản này.
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

        {/* Agreement Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20"
        >
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-4 text-center">
            Chấp Nhận Điều Khoản
          </h2>
          <p className="text-gray-600 leading-relaxed text-center mb-6">
            Bằng việc tiếp tục sử dụng website và dịch vụ của Cửa Sổ Nghề Nghiệp, 
            bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý với tất cả các điều khoản và 
            điều kiện được nêu trong tài liệu này.
          </p>
          <p className="text-sm text-gray-500 text-center">
            Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ của chúng tôi.
          </p>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center"
        >
          <h2 className="font-display text-2xl font-bold mb-4">
            Có Câu Hỏi Về Điều Khoản?
          </h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Nếu bạn có bất kỳ thắc mắc nào về điều khoản dịch vụ của chúng tôi, 
            đừng ngần ngại liên hệ với chúng tôi.
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