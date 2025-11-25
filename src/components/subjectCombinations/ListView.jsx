import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function ListView({ combinations, getComboDetails, setExpandedCombo }) {
  return (
    <div className="space-y-2">
      {combinations.map((combo, index) => {
        const details = getComboDetails(combo.code);
        
        return (
          <motion.div
            key={combo.code}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            onClick={() => setExpandedCombo(combo.code)}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow flex-shrink-0">
                <span className="text-white font-bold text-sm">{combo.code}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900">{combo.code}</span>
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {details.admissionRange}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {combo.subjects.join(' • ')}
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <div className="text-right mr-2">
                  <p className="text-xs text-gray-500">Nghề phù hợp</p>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {details.suitableFor[0]}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <ChevronRight className="md:hidden w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}