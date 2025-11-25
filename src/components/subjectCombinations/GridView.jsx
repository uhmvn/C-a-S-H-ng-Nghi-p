import React from 'react';
import { motion } from 'framer-motion';

export default function GridView({ combinations, getComboDetails, expandedCombo, setExpandedCombo }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {combinations.map((combo, index) => {
        const details = getComboDetails(combo.code);
        const isExpanded = expandedCombo === combo.code;
        
        return (
          <motion.div
            key={combo.code}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="border-2 border-gray-200 rounded-2xl p-4 hover:border-indigo-600 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => setExpandedCombo(isExpanded ? null : combo.code)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base">{combo.code}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Mã tổ hợp</p>
                <p className="font-bold text-gray-900">{combo.code}</p>
                <p className="text-xs text-indigo-600">{details.admissionRange}</p>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              {combo.subjects.map((subject, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  <span className="text-sm text-gray-700">{subject}</span>
                </div>
              ))}
            </div>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t border-gray-200 space-y-3 overflow-hidden"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Ngành phù hợp:</p>
                  <div className="flex flex-wrap gap-1">
                    {details.suitableFor.slice(0, 3).map((career, idx) => (
                      <span key={idx} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                        {career}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Trường tiêu biểu:</p>
                  <div className="flex flex-wrap gap-1">
                    {details.universities.slice(0, 2).map((uni, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-lg">
                        {uni}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mt-2 text-center text-xs text-gray-500">
              {isExpanded ? '▲ Thu gọn' : '▼ Xem chi tiết'}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}