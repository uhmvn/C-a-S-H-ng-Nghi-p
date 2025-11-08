import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, PartyPopper, Lightbulb, Target, Heart, TrendingUp, Sparkles } from "lucide-react";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function JourneyTimeline({ milestones = [] }) {
  if (milestones.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-12 text-center">
        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Chưa có milestones nào. Hãy bắt đầu chat để tạo hành trình!</p>
      </div>
    );
  }

  const getIcon = (type) => {
    const icons = {
      celebration: PartyPopper,
      insight_discovery: Lightbulb,
      goal_set: Target,
      reflection: Sparkles
    };
    return icons[type] || CheckCircle;
  };

  const getColor = (type) => {
    const colors = {
      celebration: 'from-yellow-400 to-orange-500',
      insight_discovery: 'from-green-400 to-blue-500',
      goal_set: 'from-indigo-500 to-purple-600',
      reflection: 'from-purple-400 to-pink-500'
    };
    return colors[type] || 'from-indigo-500 to-purple-600';
  };

  const reversed = milestones.slice().reverse();

  return (
    <div className="space-y-6 relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200"></div>
      
      {reversed.map((milestone, idx) => {
        const Icon = getIcon(milestone.type);
        const colorClass = getColor(milestone.type);
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.5 }}
            className="flex gap-6 items-start relative"
          >
            <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-lg ring-4 ring-white`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.08 + 0.2 }}
              className="flex-1 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-lg text-gray-900 flex-1">{milestone.description}</h4>
                {milestone.clarity_score && (
                  <div className="flex items-center gap-2 ml-3">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-indigo-600">
                        {milestone.clarity_score}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all"
                          style={{ width: `${milestone.clarity_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                <span className="text-indigo-600">📅</span>
                {format(new Date(milestone.date), 'dd MMMM yyyy • HH:mm', { locale: vi })}
              </p>
              
              {milestone.emotional_state && (
                <div className="flex items-center gap-2 mt-3">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="text-sm bg-white px-3 py-1.5 rounded-full border-2 border-pink-200 text-pink-700 font-medium">
                    {milestone.emotional_state}
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}