import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Briefcase, GraduationCap } from 'lucide-react';

export default function FlipCardView({ combinations, getComboDetails }) {
  const [flippedCards, setFlippedCards] = useState(new Set());

  const toggleFlip = (code) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(code)) {
      newFlipped.delete(code);
    } else {
      newFlipped.add(code);
    }
    setFlippedCards(newFlipped);
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {combinations.map((combo, index) => {
        const details = getComboDetails(combo.code);
        const isFlipped = flippedCards.has(combo.code);
        
        return (
          <motion.div
            key={combo.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="h-[280px] perspective-1000"
            onClick={() => toggleFlip(combo.code)}
          >
            <motion.div
              className="relative w-full h-full cursor-pointer"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* FRONT SIDE */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 flex flex-col justify-between"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{combo.code}</span>
                    </div>
                    <BookOpen className="w-8 h-8 text-white/80" />
                  </div>

                  <h3 className="text-white font-bold text-xl mb-4">Tổ hợp {combo.code}</h3>

                  <div className="space-y-2">
                    {combo.subjects.map((subject, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span className="text-white text-sm">{subject}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-white/60 text-xs">Nhấn để xem chi tiết ↻</p>
                </div>
              </div>

              {/* BACK SIDE */}
              <div
                className="absolute inset-0 bg-white rounded-2xl shadow-xl p-6 flex flex-col justify-between border-2 border-indigo-200"
                style={{ 
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-indigo-600">{combo.code}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                      {details.admissionRange}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-semibold text-gray-700">Ngành phù hợp:</p>
                      </div>
                      <div className="space-y-1">
                        {details.suitableFor.slice(0, 3).map((career, idx) => (
                          <p key={idx} className="text-sm text-gray-700 pl-6">• {career}</p>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <p className="text-xs font-semibold text-gray-700">Trường tiêu biểu:</p>
                      </div>
                      <div className="space-y-1">
                        {details.universities.slice(0, 2).map((uni, idx) => (
                          <p key={idx} className="text-sm text-gray-700 pl-6">• {uni}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-gray-400 text-xs">Nhấn để quay lại ↻</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}