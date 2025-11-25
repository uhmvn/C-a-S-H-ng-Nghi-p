import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, GraduationCap, MapPin, DollarSign, TrendingUp, Star, Phone, Mail, Globe, ArrowRight, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import Breadcrumb from "@/components/Breadcrumb";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import LazyImage from "@/components/optimization/LazyImage";

const schoolTypes = [
  { key: "all", name: "Tất cả" },
  { key: "high_school", name: "THPT" },
  { key: "college", name: "Cao đẳng" },
  { key: "university", name: "Đại học" },
  { key: "continuing_education", name: "Giáo dục thường xuyên" }
];

const provinces = [
  "Tất cả tỉnh thành",
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Bà Rịa - Vũng Tàu",
  "Bình Dương",
  "Đồng Nai",
  "Khánh Hòa",
  "Lâm Đồng"
];

export default function Schools() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("Tất cả tỉnh thành");

  const breadcrumbItems = [
    { label: "Thông tin trường học" }
  ];

  // Fetch schools from database
  const { data: rawSchools = [], isLoading, error } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      console.log('🔄 Fetching schools...');
      try {
        const result = await base44.entities.School.list();
        console.log('✅ Schools API response:', { 
          type: typeof result, 
          isArray: Array.isArray(result),
          length: result?.length || 0, 
          data: result 
        });
        return result || [];
      } catch (err) {
        console.error('❌ Error loading schools:', err, err.stack);
        return [];
      }
    },
    initialData: [],
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Map schools to flat structure
  const schools = useMemo(() => {
    return rawSchools.map(school => ({
      id: school.id,
      ...school.data
    }));
  }, [rawSchools]);

  const filteredSchools = useMemo(() => {
    console.log('🔍 Filtering schools:', {
      total: schools.length,
      searchTerm,
      selectedType,
      selectedProvince,
      schoolsData: schools
    });
    
    const filtered = schools.filter(school => {
      const matchesSearch = !searchTerm || 
        school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.majors?.some(major => major.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = selectedType === "all" || school.school_type === selectedType;
      
      const matchesProvince = selectedProvince === "Tất cả tỉnh thành" || school.province === selectedProvince;
      
      return matchesSearch && matchesType && matchesProvince;
    });
    
    console.log('📊 Filtered schools:', filtered.length, filtered);
    return filtered;
  }, [schools, searchTerm, selectedType, selectedProvince]);

  const handleSchoolClick = (school) => {
    navigate(createPageUrl(`SchoolDetail?id=${school.id}`));
  };

  const getSchoolTypeLabel = (type) => {
    const typeObj = schoolTypes.find(t => t.key === type);
    return typeObj?.name || type;
  };

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 rounded-full px-4 py-2 mb-6">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-600">Thông tin trường học</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Khám Phá Các Trường Học
          </h1>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Tìm hiểu thông tin chi tiết về các trường THPT, Cao đẳng, Đại học và Giáo dục thường xuyên. 
            Chọn trường phù hợp với năng lực và nguyện vọng của bạn.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg mb-12"
        >
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên trường, ngành học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors appearance-none bg-white"
              >
                {schoolTypes.map(type => (
                  <option key={type.key} value={type.key}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* Province Filter */}
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors appearance-none bg-white"
              >
                {provinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Tìm thấy <span className="font-bold text-indigo-600">{filteredSchools.length}</span> trường học
          </p>
        </div>

        {/* Schools Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-2xl shadow-sm">
            <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</p>
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-2xl shadow-sm p-8"
          >
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
              Không tìm thấy trường học
            </h3>
            <p className="text-gray-600 mb-2">
              {schools.length > 0 
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                : 'Hệ thống chưa có dữ liệu trường học'}
            </p>
            {schools.length > 0 && (
              <p className="text-sm text-gray-500">
                Có {schools.length} trường trong hệ thống
              </p>
            )}
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((school, index) => (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => handleSchoolClick(school)}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <LazyImage
                    src={school.image_url || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=90"}
                    alt={school.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {getSchoolTypeLabel(school.school_type)}
                    </div>
                    {school.featured && (
                      <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Nổi bật
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  {school.ranking && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-bold">{school.ranking}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {school.name}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{school.province}</span>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-2 mb-4">
                    {school.admission_score_range && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Điểm chuẩn:</span>
                        <span className="font-medium text-indigo-600">{school.admission_score_range}</span>
                      </div>
                    )}
                    {school.tuition_range && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Học phí:</span>
                        <span className="font-medium">{school.tuition_range}</span>
                      </div>
                    )}
                    {school.employment_rate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tỷ lệ việc làm:</span>
                        <span className="font-medium text-green-600">{school.employment_rate}%</span>
                      </div>
                    )}
                  </div>

                  {/* Majors */}
                  {school.majors && school.majors.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Ngành đào tạo:</p>
                      <div className="flex flex-wrap gap-1">
                        {school.majors.slice(0, 3).map((major, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {major}
                          </span>
                        ))}
                        {school.majors.length > 3 && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            +{school.majors.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm text-indigo-600 font-medium">Xem chi tiết</span>
                    <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-white text-center"
        >
          <GraduationCap className="w-12 h-12 mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold mb-4">
            Chưa Chọn Được Trường?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Làm bài trắc nghiệm năng lực để nhận gợi ý trường học phù hợp với bạn!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = createPageUrl('TestHolland')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition-all hover:scale-105 shadow-lg"
            >
              Trắc nghiệm Holland
            </button>
            <button 
              onClick={() => window.location.href = createPageUrl('TestMBTI')}
              className="bg-white/20 text-white border-2 border-white px-8 py-4 rounded-full font-medium hover:bg-white/30 transition-all hover:scale-105"
            >
              Trắc nghiệm MBTI
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}