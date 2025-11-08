import React from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, Zap } from "lucide-react";

export default function ClarityProgressCard({ currentScore, previousScore = 0 }) {
  const diff = currentScore - previousScore;
  const hasImproved = diff > 0;
  
  const getPhaseInfo = (score) => {
    if (score < 25) return { phase: 'Khám phá', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Đang tìm hiểu bản thân' };
    if (score < 50) return { phase: 'Nhận thức', color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Bắt đầu hiểu rõ hơn' };
    if (score < 75) return { phase: 'Định hình', color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Đã có hướng đi' };
    return { phase: 'Sẵn sàng', color: 'text-green-600', bg: 'bg-green-50', desc: 'Tự tin với quyết định' };
  };

  const phaseInfo = getPhaseInfo(currentScore);
  const nextMilestone = currentScore < 25 ? 25 : currentScore < 50 ? 50 : currentScore < 75 ? 75 : 100;
  const progressToNext = ((currentScore % 25) / 25) * 100;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl p-8 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Độ Rõ Ràng</h3>
            <p className="text-sm opacity-90">Clarity Score</p>
          </div>
        </div>
        
        {hasImproved && diff > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-green-400 text-white px-3 py-1.5 rounded-full text-sm font-bold"
          >
            <TrendingUp className="w-4 h-4" />
            +{diff}%
          </motion.div>
        )}
      </div>

      {/* Main Score */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-7xl font-bold mb-2"
        >
          {currentScore}%
        </motion.div>
        <div className={`inline-block ${phaseInfo.bg} ${phaseInfo.color} px-4 py-2 rounded-full font-medium`}>
          {phaseInfo.phase} • {phaseInfo.desc}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="opacity-90">Tiến độ tới {nextMilestone}%</span>
          <span className="font-bold">{Math.round(progressToNext)}%</span>
        </div>
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressToNext}%` }}
            transition={{ delay: 0.5, duration: 1 }}
            className="bg-white h-full rounded-full"
          />
        </div>
      </div>

      {/* Next Milestone */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
        <Zap className="w-6 h-6" />
        <div className="flex-1">
          <p className="text-sm opacity-90">Mục tiêu tiếp theo</p>
          <p className="font-bold">
            {nextMilestone === 25 ? '🎯 Hiểu cơ bản về bản thân' :
             nextMilestone === 50 ? '🎊 Xác định được sở thích' :
             nextMilestone === 75 ? '🏆 Có mục tiêu rõ ràng' :
             '⭐ Hoàn toàn sẵn sàng'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}