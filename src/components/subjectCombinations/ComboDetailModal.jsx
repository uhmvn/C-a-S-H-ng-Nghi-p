import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Briefcase, GraduationCap, TrendingUp } from 'lucide-react';

export default function ComboDetailModal({ combo, details, onClose }) {
  if (!combo) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-t-3xl relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-3xl">{combo.code}</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-3xl">Tổ hợp {combo.code}</h2>
                <p className="text-white/80 text-sm mt-1">Chi tiết tổ hợp môn xét tuyển</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Subjects */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Môn học</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {combo.subjects.map((subject, idx) => (
                  <div key={idx} className="bg-indigo-50 rounded-xl p-4 text-center">
                    <p className="text-indigo-900 font-semibold">{subject}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Admission Range */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Điểm chuẩn tham khảo</h3>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-900 text-lg font-bold text-center">
                  {details.admissionRange}
                </p>
                <p className="text-yellow-700 text-sm text-center mt-1">
                  Dựa trên các trường đại học năm gần đây
                </p>
              </div>
            </div>

            {/* Suitable Careers */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Ngành nghề phù hợp</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {details.suitableFor.map((career, idx) => (
                  <div key={idx} className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <p className="text-green-900 font-medium">{career}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Universities */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Trường đại học tiêu biểu</h3>
              </div>
              <div className="space-y-3">
                {details.universities.map((uni, idx) => (
                  <div key={idx} className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{idx + 1}</span>
                    </div>
                    <p className="text-blue-900 font-medium">{uni}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 rounded-b-3xl">
            <button
              onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}