
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { MapPin, Phone, Mail, Globe, GraduationCap, DollarSign, TrendingUp, Star, Award, CheckCircle, Users, BookOpen, Building, ArrowRight } from "lucide-react"; // Added ArrowRight
import Breadcrumb from "@/components/Breadcrumb";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const getSchoolTypeLabel = (type) => {
  const types = {
    high_school: "THPT",
    college: "Cao đẳng",
    university: "Đại học",
    continuing_education: "Giáo dục thường xuyên"
  };
  return types[type] || type;
};

export default function SchoolDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const schoolId = urlParams.get('id');
  const [selectedMajor, setSelectedMajor] = useState(null); // New state

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => base44.entities.School.list(),
    initialData: [],
  });

  const school = useMemo(() => {
    return schools.find(s => s.id === schoolId);
  }, [schools, schoolId]);

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải thông tin trường...</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
            Không tìm thấy thông tin trường
          </h1>
          <button 
            onClick={() => window.history.back()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Sample admission history data
  const getAdmissionHistory = () => {
    return [
      { year: 2024, score: 25.5, applicants: 1200 },
      { year: 2023, score: 24.8, applicants: 1150 },
      { year: 2022, score: 24.2, applicants: 1100 },
      { year: 2021, score: 23.5, applicants: 1050 }
    ];
  };

  // Get subject combinations for a major
  const getMajorCombinations = (major) => {
    const majorCombos = {
      "Kỹ thuật Điện": ["A00", "A01"],
      "Kỹ thuật Cơ khí": ["A00", "A01"],
      "Khoa học Máy tính": ["A00", "A01", "D01"],
      "Công nghệ Thông tin": ["A00", "A01", "D01"],
      "Y khoa": ["B00", "B08"],
      "Dược học": ["B00", "D07"],
      "Điều dưỡng": ["B00", "B08"],
      "Kinh tế": ["A00", "A01", "C00", "D01"],
      "Luật": ["C00", "D01", "D14"],
      "Quản trị Kinh doanh": ["A00", "A01", "D01"]
    };
    return majorCombos[major] || ["A00", "D01"]; // Default if major not found
  };

  const breadcrumbItems = [
    { label: "Trường học", url: createPageUrl("Schools") },
    { label: school.name }
  ];

  const admissionHistory = getAdmissionHistory(); // New variable

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={school.image_url || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=90"}
                alt={school.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                {getSchoolTypeLabel(school.school_type)}
              </div>
              {school.featured && (
                <div className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Nổi bật
                </div>
              )}
            </div>
            {school.ranking && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-lg font-bold">{school.ranking}/5</span>
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {school.name}
            </h1>

            <div className="flex items-center gap-2 text-lg text-gray-600 mb-6">
              <MapPin className="w-5 h-5" />
              <span>{school.address || `${school.district}, ${school.province}`}</span>
            </div>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {school.description}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {school.admission_score_range && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm text-gray-500">Điểm chuẩn</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600">{school.admission_score_range}</p>
                </div>
              )}
              {school.tuition_range && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-500">Học phí</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">{school.tuition_range}</p>
                </div>
              )}
              {school.student_count && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-500">Sinh viên</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{school.student_count.toLocaleString()}</p>
                </div>
              )}
              {school.employment_rate && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-500">Việc làm</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{school.employment_rate}%</p>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {school.phone && (
                <a href={`tel:${school.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-colors">
                  <Phone className="w-5 h-5" />
                  <span>{school.phone}</span>
                </a>
              )}
              {school.email && (
                <a href={`mailto:${school.email}`} className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-colors">
                  <Mail className="w-5 h-5" />
                  <span>{school.email}</span>
                </a>
              )}
              {school.website && (
                <a href={school.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-colors">
                  <Globe className="w-5 h-5" />
                  <span>Website chính thức</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* Enhanced Majors Section with Subject Combinations */}
        {school.majors && school.majors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-lg mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <h2 className="font-display text-3xl font-bold text-gray-900">Các Ngành Đào Tạo</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {school.majors.map((major, index) => {
                const combinations = getMajorCombinations(major);
                const isSelected = selectedMajor === major;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-2xl p-5 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl' 
                        : 'bg-indigo-50 hover:bg-indigo-100'
                    }`}
                    onClick={() => setSelectedMajor(isSelected ? null : major)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className={`font-bold text-base ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {major}
                      </p>
                      <GraduationCap className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                    </div>
                    
                    <div className="space-y-2">
                      <p className={`text-xs font-semibold ${isSelected ? 'text-indigo-100' : 'text-gray-600'}`}>
                        Tổ hợp môn:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {combinations.map((combo, idx) => (
                          <span 
                            key={idx} 
                            className={`text-xs px-2 py-1 rounded-lg font-bold ${
                              isSelected 
                                ? 'bg-white/20 text-white' 
                                : 'bg-white text-indigo-600'
                            }`}
                          >
                            {combo}
                          </span>
                        ))}
                      </div>
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t border-white/20"
                      >
                        <p className="text-xs text-indigo-100">
                          Nhấn để xem chi tiết tổ hợp môn →
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {selectedMajor && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => window.location.href = createPageUrl('SubjectCombinations')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  Xem chi tiết tổ hợp môn
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Admission Score History */}
        {school.school_type === 'university' && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-lg mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h2 className="font-display text-3xl font-bold text-gray-900">Lịch Sử Điểm Chuẩn</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-indigo-600">
                    <th className="text-left py-4 px-4 font-bold text-gray-900">Năm</th>
                    <th className="text-center py-4 px-4 font-bold text-gray-900">Điểm chuẩn</th>
                    <th className="text-center py-4 px-4 font-bold text-gray-900">Số thí sinh</th>
                    <th className="text-center py-4 px-4 font-bold text-gray-900">Xu hướng</th>
                  </tr>
                </thead>
                <tbody>
                  {admissionHistory.map((item, index) => {
                    const prevScore = admissionHistory[index + 1]?.score;
                    let trend = 'stable';
                    if (prevScore !== undefined) {
                      if (item.score > prevScore) {
                        trend = 'up';
                      } else if (item.score < prevScore) {
                        trend = 'down';
                      }
                    }
                    
                    return (
                      <motion.tr
                        key={item.year}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-200 hover:bg-indigo-50 transition-colors"
                      >
                        <td className="py-4 px-4 font-bold text-indigo-600">{item.year}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">
                            {item.score}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">
                          {item.applicants.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {trend === 'up' && <span className="text-red-600">↑ Tăng</span>}
                          {trend === 'down' && <span className="text-green-600">↓ Giảm</span>}
                          {trend === 'stable' && <span className="text-gray-600">→ Ổn định</span>}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
              <p className="text-sm text-gray-700">
                <strong>Lưu ý:</strong> Điểm chuẩn có thể thay đổi hàng năm tùy theo số lượng và chất lượng thí sinh. 
                Đây chỉ là tham khảo, vui lòng xem thông tin chính thức từ nhà trường.
              </p>
            </div>
          </motion.div>
        )}

        {/* The old 'Subject Combinations' section has been removed as its functionality is integrated into the 'Enhanced Majors Section'. */}

        {/* Strengths */}
        {school.strengths && school.strengths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 md:p-12 mb-12"
          >
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-8 text-center">Điểm Mạnh Của Trường</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {school.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-3 bg-white rounded-xl p-4">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{strength}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Facilities */}
        {school.facilities && school.facilities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-lg mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-indigo-600" />
              <h2 className="font-display text-3xl font-bold text-gray-900">Cơ Sở Vật Chất</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {school.facilities.map((facility, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700">{facility}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-white"
        >
          <h2 className="font-display text-3xl font-bold mb-4">Quan Tâm Đến Trường Này?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Đặt lịch tư vấn để được hướng dẫn chi tiết về quy trình xét tuyển và chuẩn bị hồ sơ
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
            className="bg-white text-indigo-600 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition-all hover:scale-105 shadow-lg"
          >
            Đặt Lịch Tư Vấn Ngay
          </button>
        </motion.div>
      </div>
    </div>
  );
}
