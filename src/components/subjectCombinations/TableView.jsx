import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Eye } from 'lucide-react';

export default function TableView({ combinations, getComboDetails, setExpandedCombo }) {
  const [sortBy, setSortBy] = useState('code');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const sortedCombinations = [...combinations].sort((a, b) => {
    let aVal, bVal;
    
    if (sortBy === 'code') {
      aVal = a.code;
      bVal = b.code;
    } else if (sortBy === 'subjects') {
      aVal = a.subjects.length;
      bVal = b.subjects.length;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th 
                onClick={() => handleSort('code')}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Mã tổ hợp
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('subjects')}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Môn học
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Điểm chuẩn
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Ngành phù hợp
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedCombinations.map((combo, index) => {
              const details = getComboDetails(combo.code);
              
              return (
                <motion.tr
                  key={combo.code}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">{combo.code}</span>
                      </div>
                      <span className="font-bold text-gray-900">{combo.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {combo.subjects.map((subject, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                          <span className="text-sm text-gray-700">{subject}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      {details.admissionRange}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {details.suitableFor.slice(0, 2).map((career, idx) => (
                        <p key={idx} className="text-sm text-gray-700">• {career}</p>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setExpandedCombo(combo.code)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}