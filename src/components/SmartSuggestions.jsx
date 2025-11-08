import React from "react";
import { motion } from "framer-motion";
import { Lightbulb, Target, Brain, BookOpen, TrendingUp, Zap, Heart, Award } from "lucide-react";

export default function SmartSuggestions({ 
  clarityScore = 0, 
  insights = {}, 
  academicScores = [], 
  hasTests = false,
  messageCount = 0,
  onSelect 
}) {
  const generateSuggestions = () => {
    const suggestions = [];
    const hasInterests = insights.interests?.length > 0;
    const hasGoals = insights.goals?.length > 0;
    const hasConcerns = insights.concerns?.length > 0;
    const hasScores = academicScores.length > 0;
    
    // PHASE 1: DISCOVERY (<40%)
    if (clarityScore < 40) {
      if (!hasInterests) {
        suggestions.push({
          icon: '💭',
          label: 'Sở thích',
          prompt: 'Em thích làm gì khi rảnh? Điều gì khiến em hạnh phúc và hào hứng?',
          color: 'from-blue-400 to-indigo-500'
        });
      }
      
      if (!hasGoals) {
        suggestions.push({
          icon: '🎯',
          label: 'Ước mơ',
          prompt: 'Em mơ ước trở thành gì trong tương lai? Em muốn làm nghề gì?',
          color: 'from-purple-400 to-pink-500'
        });
      }
      
      if (!hasConcerns) {
        suggestions.push({
          icon: '💬',
          label: 'Băn khoăn',
          prompt: 'Em đang lo lắng hoặc băn khoăn điều gì về tương lai?',
          color: 'from-orange-400 to-red-500'
        });
      }
      
      suggestions.push({
        icon: '💪',
        label: 'Điểm mạnh',
        prompt: 'Em thấy mình giỏi về gì? Những việc em làm tốt nhất?',
        color: 'from-green-400 to-emerald-500'
      });
    }
    
    // PHASE 2: EXPLORATION (40-70%)
    else if (clarityScore < 70) {
      if (hasInterests && !hasGoals) {
        suggestions.push({
          icon: '🎯',
          label: 'Kết nối',
          prompt: `Em thích ${insights.interests[0]}, vậy em có muốn làm nghề liên quan không?`,
          color: 'from-indigo-500 to-purple-600'
        });
      }
      
      if (hasScores) {
        suggestions.push({
          icon: '📊',
          label: 'Môn mạnh',
          prompt: 'Dựa vào điểm của em, môn nào em tự tin nhất? Tại sao?',
          color: 'from-blue-500 to-cyan-600'
        });
      }
      
      suggestions.push({
        icon: '🔍',
        label: 'Khám phá',
        prompt: 'Em đã tìm hiểu về những ngành nghề nào? Có ngành nào em quan tâm?',
        color: 'from-purple-500 to-pink-600'
      });
      
      suggestions.push({
        icon: '🏫',
        label: 'Tổ hợp môn',
        prompt: 'Em nghĩ mình phù hợp với tổ hợp môn nào? A00, B00, C00 hay D01?',
        color: 'from-yellow-500 to-orange-600'
      });
    }
    
    // PHASE 3: RECOMMENDATION (>70%)
    else {
      suggestions.push({
        icon: '📚',
        label: 'Chọn trường',
        prompt: 'Em muốn học trường nào? Mình có thể tư vấn trường phù hợp với em.',
        color: 'from-indigo-600 to-blue-700'
      });
      
      suggestions.push({
        icon: '🗺️',
        label: 'Lộ trình',
        prompt: 'Mình tạo lộ trình cụ thể để em đạt mục tiêu nhé?',
        color: 'from-green-600 to-teal-700'
      });
      
      suggestions.push({
        icon: '⚡',
        label: 'Hành động',
        prompt: 'Em cần làm gì ngay bây giờ để tiến gần đến ước mơ?',
        color: 'from-orange-600 to-red-700'
      });
      
      suggestions.push({
        icon: '🎓',
        label: 'Tổng kết',
        prompt: 'Tóm tắt toàn bộ phân tích và lộ trình cho em nhé!',
        color: 'from-purple-600 to-pink-700'
      });
    }
    
    // Special: Near milestones (reflection)
    const nearMilestone = [25, 50, 75, 100].find(m => 
      clarityScore >= m - 5 && clarityScore < m
    );
    if (nearMilestone && messageCount > 5) {
      suggestions.unshift({
        icon: '✨',
        label: 'Nhìn lại',
        prompt: 'Em có cảm thấy mình hiểu rõ hơn về bản thân không? Đã thay đổi gì?',
        color: 'from-pink-500 to-rose-600',
        special: true
      });
    }
    
    return suggestions.slice(0, 4);
  };

  const suggestions = generateSuggestions();

  return (
    <div className="px-4 py-3 border-t bg-white">
      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <Zap className="w-3 h-3" />
        {clarityScore < 40 ? 'Khám phá bản thân:' : 
         clarityScore < 70 ? 'Kết nối và tìm hiểu:' : 
         'Lên kế hoạch:'}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(s.prompt)}
            className={`px-4 py-2 bg-gradient-to-r ${s.color} text-white text-xs rounded-full whitespace-nowrap hover:scale-105 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-1.5 ${s.special ? 'ring-2 ring-yellow-300 animate-pulse' : ''}`}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </motion.button>
        ))}
      </div>
      {clarityScore > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          💡 Gợi ý thay đổi theo độ rõ ràng ({clarityScore}%)
        </p>
      )}
    </div>
  );
}