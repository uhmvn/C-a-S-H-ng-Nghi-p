
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, User, Mail, Phone, MessageSquare, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { Appointment } from "@/entities/Appointment";
import { BookingNotification } from "@/entities/BookingNotification";

const servicesData = [
  {
    id: 1,
    name: "Trắc nghiệm Holland",
    category: "assessment",
    description: "Đánh giá nghề nghiệp RIASEC",
    duration: "45 phút"
  },
  {
    id: 2,
    name: "Trắc nghiệm MBTI",
    category: "assessment",
    description: "16 nhóm tính cách Myers-Briggs",
    duration: "60 phút"
  },
  {
    id: 3,
    name: "Tư vấn 1-1 cơ bản",
    category: "career_counseling",
    description: "Gặp chuyên gia hướng nghiệp",
    duration: "60 phút"
  },
  {
    id: 4,
    name: "Tư vấn chọn ngành",
    category: "school_selection",
    description: "Gợi ý ngành học phù hợp",
    duration: "90 phút"
  },
  {
    id: 5,
    name: "Phân tích AI nghề nghiệp",
    category: "ai_analysis",
    description: "AI phân tích và gợi ý nghề",
    duration: "Tức thì"
  }
];

export default function BookingModal({ isOpen, onClose, initialService }) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    client_name: "",
    email: "",
    phone: "",
    preferred_date: "",
    preferred_time: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialService) {
        setSelectedService(initialService);
        setStep(2);
      } else {
        setStep(1);
        setSelectedService(null);
      }
      setFormData({
        client_name: "",
        email: "",
        phone: "",
        preferred_date: "",
        preferred_time: "",
        message: ""
      });
      setSubmitSuccess(false);
    }
  }, [isOpen, initialService]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (!formData.client_name || !formData.email || !formData.phone || !formData.preferred_date || !formData.preferred_time) {
        alert("Vui lòng điền đầy đủ các thông tin bắt buộc.");
        setIsSubmitting(false);
        return;
    }
    if (!selectedService) {
        alert("Vui lòng chọn dịch vụ.");
        setIsSubmitting(false);
        return;
    }
    
    // Date in the past validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.preferred_date);
    if (selectedDate < today) {
        alert("Vui lòng chọn ngày trong tương lai.");
        setIsSubmitting(false);
        return;
    }

    try {
      const appointmentData = {
        ...formData,
        service: selectedService.name,
        duration: selectedService.duration,
        status: "pending"
      };

      const appointment = await Appointment.create(appointmentData);

      await BookingNotification.create({
        booking_id: appointment.id,
        client_name: formData.client_name,
        client_email: formData.email,
        client_phone: formData.phone,
        service_name: selectedService.name,
        service_duration: selectedService.duration,
        appointment_date: formData.preferred_date,
        appointment_time: formData.preferred_time,
        special_requests: formData.message || "",
        notification_status: "pending",
        priority: "normal"
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        setStep(1);
        setSelectedService(null);
        setFormData({
          client_name: "",
          email: "",
          phone: "",
          preferred_date: "",
          preferred_time: "",
          message: ""
        });
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Booking error:', error);
      alert('Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedService(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6" />
                <h2 className="font-display text-2xl font-bold">Đăng Ký Tư Vấn Hướng Nghiệp</h2>
              </div>
              
              <p className="text-white/90 text-sm">
                {step === 1 ? 'Bước 1: Chọn Dịch Vụ' : 'Bước 2: Thông Tin Của Bạn'}
              </p>

              {/* Progress Bar */}
              <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: step === 1 ? "50%" : "100%" }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {submitSuccess ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="text-green-600 text-5xl font-bold"
                    >
                      ✓
                    </motion.div>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">
                    Đăng Ký Thành Công!
                  </h3>
                  <p className="text-gray-600">
                    Chúng tôi sẽ liên hệ với bạn sớm nhất có thể để xác nhận lịch hẹn.
                  </p>
                </motion.div>
              ) : step === 1 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {servicesData.map((service) => (
                    <motion.button
                      key={service.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleServiceSelect(service)}
                      className="text-left p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-transparent hover:border-indigo-600 transition-all"
                    >
                      <h3 className="font-display text-lg font-bold text-gray-900 mb-2">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {service.duration}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Selected Service Display */}
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-indigo-600 font-medium">Dịch vụ đã chọn</p>
                        <p className="font-display text-lg font-bold text-gray-900">{selectedService?.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Đổi dịch vụ
                      </button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        name="client_name"
                        value={formData.client_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors"
                        placeholder="0123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Ngày mong muốn
                      </label>
                      <input
                        type="date"
                        name="preferred_date"
                        value={formData.preferred_date}
                        onChange={handleInputChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Giờ mong muốn
                      </label>
                      <select
                        name="preferred_time"
                        value={formData.preferred_time}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors"
                      >
                        <option value="">Chọn giờ</option>
                        <option value="08:00">08:00</option>
                        <option value="09:00">09:00</option>
                        <option value="10:00">10:00</option>
                        <option value="13:00">13:00</option>
                        <option value="14:00">14:00</option>
                        <option value="15:00">15:00</option>
                        <option value="16:00">16:00</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-2" />
                        Ghi chú (không bắt buộc)
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors resize-none"
                        placeholder="Chia sẻ thêm về mục tiêu và mong muốn của bạn..."
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          Xác nhận đăng ký
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
