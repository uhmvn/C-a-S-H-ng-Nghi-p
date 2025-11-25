import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, BookOpen, Sparkles, GraduationCap } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { createPageUrl } from "@/utils";
import ViewModeToggle from "@/components/subjectCombinations/ViewModeToggle";
import GridView from "@/components/subjectCombinations/GridView";
import ListView from "@/components/subjectCombinations/ListView";
import TableView from "@/components/subjectCombinations/TableView";
import FlipCardView from "@/components/subjectCombinations/FlipCardView";
import ComboDetailModal from "@/components/subjectCombinations/ComboDetailModal";

const subjectCombinations = {
  "A": [
    { code: "A00", subjects: ["Toán", "Vật lý", "Hóa học"] },
    { code: "A01", subjects: ["Toán", "Vật lý", "Tiếng Anh"] },
    { code: "A02", subjects: ["Toán", "Vật lí", "Sinh học"] },
    { code: "A03", subjects: ["Toán", "Vật lý", "Lịch sử"] },
    { code: "A04", subjects: ["Toán", "Vật lý", "Địa lí"] },
    { code: "A05", subjects: ["Toán", "Hóa học", "Lịch sử"] },
    { code: "A06", subjects: ["Toán", "Hóa học", "Địa lí"] },
    { code: "A07", subjects: ["Toán", "Lịch sử", "Địa lí"] },
    { code: "A08", subjects: ["Toán", "Lịch sử", "Giáo dục công dân"] },
    { code: "A09", subjects: ["Toán", "Địa lí", "Giáo dục công dân"] },
    { code: "A10", subjects: ["Toán", "Vật lý", "Giáo dục công dân"] },
    { code: "A11", subjects: ["Toán", "Hóa học", "Giáo dục công dân"] }
  ],
  "B": [
    { code: "B00", subjects: ["Toán", "Hóa học", "Sinh học"] },
    { code: "B01", subjects: ["Toán", "Sinh học", "Lịch sử"] },
    { code: "B02", subjects: ["Toán", "Sinh học", "Địa lí"] },
    { code: "B03", subjects: ["Toán", "Sinh học", "Văn"] },
    { code: "B04", subjects: ["Toán", "Sinh học", "Giáo dục công dân"] },
    { code: "B08", subjects: ["Toán", "Sinh học", "Tiếng Anh"] }
  ],
  "C": [
    { code: "C00", subjects: ["Văn", "Lịch sử", "Địa lí"] },
    { code: "C01", subjects: ["Văn", "Toán", "Vật lí"] },
    { code: "C02", subjects: ["Văn", "Toán", "Hóa học"] },
    { code: "C03", subjects: ["Văn", "Toán", "Lịch sử"] },
    { code: "C04", subjects: ["Văn", "Toán", "Địa lí"] },
    { code: "C14", subjects: ["Văn", "Toán", "Giáo dục công dân"] },
    { code: "C15", subjects: ["Văn", "Toán", "Khoa học xã hội"] },
    { code: "C19", subjects: ["Văn", "Lịch sử", "Giáo dục công dân"] },
    { code: "C20", subjects: ["Văn", "Địa lí", "Giáo dục công dân"] }
  ],
  "D": [
    { code: "D01", subjects: ["Văn", "Toán", "Tiếng Anh"] },
    { code: "D02", subjects: ["Văn", "Toán", "Tiếng Nga"] },
    { code: "D03", subjects: ["Văn", "Toán", "Tiếng Pháp"] },
    { code: "D04", subjects: ["Văn", "Toán", "Tiếng Trung"] },
    { code: "D05", subjects: ["Văn", "Toán", "Tiếng Đức"] },
    { code: "D06", subjects: ["Văn", "Toán", "Tiếng Nhật"] },
    { code: "D07", subjects: ["Toán", "Hóa học", "Tiếng Anh"] },
    { code: "D08", subjects: ["Toán", "Sinh học", "Tiếng Anh"] },
    { code: "D09", subjects: ["Toán", "Lịch sử", "Tiếng Anh"] },
    { code: "D10", subjects: ["Toán", "Địa lí", "Tiếng Anh"] },
    { code: "D11", subjects: ["Văn", "Vật lí", "Tiếng Anh"] },
    { code: "D14", subjects: ["Văn", "Lịch sử", "Tiếng Anh"] },
    { code: "D15", subjects: ["Văn", "Địa lí", "Tiếng Anh"] },
    { code: "D16", subjects: ["Văn", "Giáo dục công dân", "Tiếng Anh"] },
    { code: "D17", subjects: ["Văn", "Khoa học xã hội", "Tiếng Anh"] },
    { code: "D18", subjects: ["Toán", "Khoa học tự nhiên", "Tiếng Anh"] },
    { code: "D19", subjects: ["Toán", "Khoa học xã hội", "Tiếng Anh"] }
  ],
  "Năng khiếu": [
    { code: "H00", subjects: ["Văn", "Năng khiếu vẽ 1", "Năng khiếu vẽ 2"] },
    { code: "H01", subjects: ["Toán", "Văn", "Vẽ"] },
    { code: "H02", subjects: ["Toán", "Vẽ Hình họa mỹ thuật", "Vẽ trang trí màu"] },
    { code: "V00", subjects: ["Toán", "Vật lí", "Vẽ Hình họa mỹ thuật"] },
    { code: "V01", subjects: ["Toán", "Văn", "Vẽ Hình họa mỹ thuật"] },
    { code: "V02", subjects: ["Vẽ mỹ thuật", "Toán", "Tiếng Anh"] },
    { code: "M00", subjects: ["Văn", "Toán", "Đọc diễn cảm", "Hát"] },
    { code: "M01", subjects: ["Văn", "Lịch sử", "Năng khiếu"] },
    { code: "N00", subjects: ["Văn", "Năng khiếu Âm nhạc 1", "Năng khiếu Âm nhạc 2"] },
    { code: "N01", subjects: ["Văn", "Ký xướng âm", "Biểu diễn tự chọn"] },
    { code: "R00", subjects: ["Văn", "Sử", "Năng khiếu nghệ thuật"] },
    { code: "S00", subjects: ["Văn", "Năng khiếu Sân khấu điện ảnh 1", "Năng khiếu Sân khấu điện ảnh 2"] },
    { code: "T00", subjects: ["Toán", "Sinh", "Năng khiếu TDTT"] },
    { code: "T01", subjects: ["Toán", "Văn", "Năng khiếu TDTT"] },
    { code: "K01", subjects: ["Toán", "Anh", "Năng khiếu"] }
  ]
};

const blockDescriptions = {
  "A": "Khối tự nhiên - Phù hợp với các ngành Kỹ thuật, Công nghệ, Khoa học tự nhiên",
  "B": "Khối sinh học - Phù hợp với các ngành Y, Dược, Nông - Lâm - Ngư nghiệp",
  "C": "Khối xã hội - Phù hợp với các ngành Văn học, Lịch sử, Giáo dục, Luật",
  "D": "Khối ngoại ngữ - Phù hợp với các ngành Ngoại ngữ, Du lịch, Quan hệ quốc tế",
  "Năng khiếu": "Khối năng khiếu - Phù hợp với các ngành Nghệ thuật, Thể dục thể thao"
};

export default function SubjectCombinations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("all");
  const [expandedCombo, setExpandedCombo] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [modalCombo, setModalCombo] = useState(null);

  const breadcrumbItems = [
    { label: "Dịch vụ", url: createPageUrl("Services") },
    { label: "Tra cứu tổ hợp môn" }
  ];

  const blocks = Object.keys(subjectCombinations);

  const filteredCombinations = useMemo(() => {
    let result = {};
    
    const blocksToShow = selectedBlock === "all" ? blocks : [selectedBlock];
    
    blocksToShow.forEach(block => {
      const combinations = subjectCombinations[block].filter(combo => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return combo.code.toLowerCase().includes(search) ||
               combo.subjects.some(subject => subject.toLowerCase().includes(search));
      });
      
      if (combinations.length > 0) {
        result[block] = combinations;
      }
    });
    
    return result;
  }, [searchTerm, selectedBlock, blocks]);

  // Sample data for detailed combo info
  const getComboDetails = (code) => {
    const details = {
      "A00": {
        suitableFor: ["Kỹ sư cơ khí", "Kỹ sư hóa", "Kỹ sư vật lý", "Nhà khoa học"],
        universities: ["ĐH Bách Khoa HCM", "ĐH Bách Khoa Hà Nội", "ĐH Khoa học Tự nhiên"],
        admissionRange: "22-28 điểm"
      },
      "B00": {
        suitableFor: ["Bác sĩ", "Dược sĩ", "Kỹ sư sinh học", "Nhà hóa học"],
        universities: ["ĐH Y Dược HCM", "ĐH Y Hà Nội", "ĐH Dược Hà Nội"],
        admissionRange: "24-29 điểm"
      },
      "C00": {
        suitableFor: ["Giáo viên", "Nhà báo", "Luật sư", "Nhà ngoại giao"],
        universities: ["ĐH Khoa học Xã hội & Nhân văn", "ĐH Sư phạm", "ĐH Luật"],
        admissionRange: "20-26 điểm"
      },
      "D01": {
        suitableFor: ["Phiên dịch viên", "Nhà ngoại giao", "Chuyên viên du lịch"],
        universities: ["ĐH Ngoại ngữ", "ĐH Sư phạm Ngoại ngữ", "ĐH Văn hóa"],
        admissionRange: "21-27 điểm"
      }
    };
    return details[code] || {
      suitableFor: ["Nhiều ngành khác nhau"],
      universities: ["Xem chi tiết tại các trường"],
      admissionRange: "18-25 điểm"
    };
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
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-600">Tổ hợp môn xét tuyển</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tra Cứu Tổ Hợp Môn
          </h1>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Tìm hiểu thông tin chi tiết về các tổ hợp môn xét tuyển đại học. 
            Chọn tổ hợp phù hợp với năng lực và nguyện vọng của bạn.
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg mb-12"
        >
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập mã hoặc tên môn học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors appearance-none bg-white"
              >
                <option value="all">Tất cả các khối</option>
                {blocks.map(block => (
                  <option key={block} value={block}>
                    Khối {block} ({subjectCombinations[block].length} tổ hợp)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-center pt-4 border-t border-gray-200">
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </motion.div>

        {/* Results */}
        <div className="space-y-8">
          {Object.entries(filteredCombinations).map(([block, combinations], blockIndex) => (
            <motion.div
              key={block}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + blockIndex * 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-lg"
            >
              {/* Block Header */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <div>
                  <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
                    Khối {block}
                  </h2>
                  <p className="text-gray-600">{blockDescriptions[block]}</p>
                </div>
                <div className="bg-indigo-600/10 text-indigo-600 px-4 py-2 rounded-full font-medium">
                  {combinations.length} tổ hợp
                </div>
              </div>

              {/* Dynamic View Rendering */}
              {viewMode === 'grid' && (
                <GridView 
                  combinations={combinations}
                  getComboDetails={getComboDetails}
                  expandedCombo={expandedCombo}
                  setExpandedCombo={setExpandedCombo}
                />
              )}

              {viewMode === 'list' && (
                <ListView 
                  combinations={combinations}
                  getComboDetails={getComboDetails}
                  setExpandedCombo={setModalCombo}
                />
              )}

              {viewMode === 'table' && (
                <TableView 
                  combinations={combinations}
                  getComboDetails={getComboDetails}
                  setExpandedCombo={setModalCombo}
                />
              )}

              {viewMode === '3d' && (
                <FlipCardView 
                  combinations={combinations}
                  getComboDetails={getComboDetails}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {Object.keys(filteredCombinations).length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
              Không tìm thấy tổ hợp môn
            </h3>
            <p className="text-gray-600">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
          </motion.div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-white text-center"
        >
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold mb-4">
            Chưa biết chọn tổ hợp nào?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Làm bài trắc nghiệm năng lực để nhận gợi ý tổ hợp môn phù hợp với bạn!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = createPageUrl('TestHolland')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition-all hover:scale-105 shadow-lg"
            >
              Trắc nghiệm Holland
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
              className="bg-white/20 text-white border-2 border-white px-8 py-4 rounded-full font-medium hover:bg-white/30 transition-all hover:scale-105"
            >
              Tư vấn với chuyên gia
            </button>
          </div>
        </motion.div>
      </div>

      {/* Detail Modal */}
      {modalCombo && (
        <ComboDetailModal 
          combo={Object.values(subjectCombinations).flat().find(c => c.code === modalCombo)}
          details={getComboDetails(modalCombo)}
          onClose={() => setModalCombo(null)}
        />
      )}
    </div>
  );
}