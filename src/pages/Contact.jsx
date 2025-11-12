
import React from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Facebook, Sparkles, Send } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

export default function Contact() {
  const breadcrumbItems = [
    { label: "Liên hệ" }
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
            <span className="text-sm font-medium">Liên Hệ</span>
          </div>
          
          <h1 className="font-display font-medium text-[length:var(--font-h1)] text-gray-900 mb-6 leading-tight">
            Liên Hệ Với Chúng Tôi
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-[1.618]">
            Trường THCS Nguyễn Du - Nơi nuôi dưỡng ước mơ và định hướng tương lai cho học sinh. 
            Hãy liên hệ với chúng tôi để được tư vấn về hướng nghiệp và giáo dục.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-[1.2em]"
          >
            {/* Address */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Địa chỉ trường</h3>
                  <p className="leading-[1.618] text-gray-600">
                    523, Phạm Hùng, Phường Bà Rịa<br />
                    Thành phố Bà Rịa<br />
                    Tỉnh Bà Rịa - Vũng Tàu
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Điện thoại</h3>
                  <p className="leading-[1.618] text-gray-600">
                    <a href="tel:02543826178" className="hover:text-indigo-600 transition-colors duration-300">
                      (0254) 3.826.178
                    </a>
                    <br />
                    <span className="text-sm">Liên hệ trong giờ hành chính</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Email</h3>
                  <p className="leading-[1.618] text-gray-600">
                    <a 
                      href="mailto:c2nguyendu.baria.bariavungtau@moet.edu.vn" 
                      className="hover:text-indigo-600 transition-colors duration-300 break-all"
                    >
                      c2nguyendu.baria.bariavungtau@moet.edu.vn
                    </a>
                    <br />
                    <span className="text-sm">Phản hồi trong vòng 24 giờ</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Giờ làm việc</h3>
                  <div className="text-gray-600 space-y-1 leading-[1.618]">
                    <p>Thứ 2 - Thứ 6: 7:00 AM - 5:00 PM</p>
                    <p>Thứ 7: 7:00 AM - 12:00 PM</p>
                    <p>Chủ nhật: Nghỉ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20">
              <h3 className="font-display text-xl font-bold text-gray-900 mb-4">Theo dõi chúng tôi</h3>
              <div className="flex gap-4">
                <a 
                  href="#" 
                  className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center hover:bg-purple-600 transition-colors duration-300 text-white"
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20"
          >
            <h2 className="font-display text-[length:var(--font-h2)] font-bold text-gray-900 mb-6">Gửi tin nhắn cho chúng tôi</h2>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors duration-300"
                    placeholder="Họ của bạn"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Tên
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors duration-300"
                    placeholder="Tên của bạn"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors duration-300"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors duration-300"
                  placeholder="0123 456 789"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Chủ đề
                </label>
                <select
                  id="subject"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors duration-300"
                >
                  <option value="">Chọn chủ đề</option>
                  <option value="career_guidance">Tư vấn hướng nghiệp</option>
                  <option value="admission">Tuyển sinh</option>
                  <option value="cooperation">Hợp tác</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors duration-300 resize-none"
                  placeholder="Hãy cho chúng tôi biết bạn cần hỗ trợ gì..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Gửi tin nhắn
              </button>
            </form>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16"
        >
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-600/20">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6 text-center">Bản đồ đến trường</h2>
            <div className="aspect-video rounded-2xl overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.8155076862684!2d107.16877631533658!3d10.507668992580858!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175772c1e6e1e0d%3A0x7c9c4e3e4e3e4e3e!2zNTIzIMSQLiBQaOG6oW0gSMO5bmcsIFBoxrDhu51uZyBCw6AgUuG7i2EsIFRow6BuaCBwaOG7kSBC4buRIFLhu4thLCBC4bq5IFLhu4thIC0gVsWpbmcgVMOgdSwgVmihu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1629788888888!5m2!1svi!2s"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy"
                title="Bản đồ Trường THCS Nguyễn Du"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
