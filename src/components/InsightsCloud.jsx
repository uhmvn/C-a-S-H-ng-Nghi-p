import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Target, Heart, Award, Lightbulb, Users } from "lucide-react";

export default function InsightsCloud({ insights }) {
  if (!insights) return null;

  const sections = [
    { key: 'interests', label: 'Sở thích', icon: Lightbulb, color: 'indigo' },
    { key: 'goals', label: 'Mục tiêu', icon: Target, color: 'green' },
    { key: 'values', label: 'Giá trị', icon: Heart, color: 'purple' },
    { key: 'personality_traits', label: 'Tính cách', icon: Users, color: 'yellow' },
    { key: 'favorite_subjects', label: 'Môn yêu thích', icon: Award, color: 'blue' }
  ];

  const hasAnyInsights = sections.some(s => insights[s.key]?.length > 0);

  if (!hasAnyInsights) {
    return (
      <div className="bg-gray-50 rounded-2xl p-12 text-center">
        <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Chưa có insights nào. Hãy chat với AI để khám phá!</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {sections.map((section, sectionIdx) => {
        const items = insights[section.key] || [];
        if (items.length === 0) return null;

        const Icon = section.icon;
        const colorClasses = {
          indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'text-indigo-600' },
          green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-600' },
          purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-600' },
          yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'text-yellow-600' },
          blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' }
        };
        const colors = colorClasses[section.color];

        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIdx * 0.1 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-gray-200 transition-all"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{section.label}</h4>
                <p className="text-xs text-gray-500">{items.length} mục</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {items.map((item, idx) => (
                <motion.span
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: sectionIdx * 0.1 + idx * 0.05 }}
                  className={`${colors.bg} ${colors.text} px-4 py-2 rounded-full text-sm font-medium border ${colors.border} hover:scale-105 transition-transform cursor-default`}
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}