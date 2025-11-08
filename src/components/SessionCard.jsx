import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, ChevronUp, Calendar, MessageCircle, Lightbulb, Target, CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function SessionCard({ session, index = 0 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const messageCount = session.conversation_history?.length || 0;
  const insightCount = (session.student_interests?.length || 0) + (session.student_goals?.length || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border-2 border-gray-100 hover:border-indigo-200 transition-all overflow-hidden"
    >
      {/* Header - Always visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              session.is_completed ? 'bg-green-50' : 'bg-blue-50'
            }`}>
              <Brain className={`w-6 h-6 ${session.is_completed ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-gray-900 truncate">
                  {session.counseling_summary || 'AI Chat Session'}
                </h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  session.is_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {session.is_completed ? 'Hoàn tất' : 'Đang diễn ra'}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(session.session_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {messageCount} tin nhắn
                </span>
                {insightCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    {insightCount} insights
                  </span>
                )}
              </div>
            </div>
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        {/* Quick preview - insights */}
        {!isExpanded && (session.student_interests?.length > 0 || session.student_goals?.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {session.student_interests?.slice(0, 3).map((interest, i) => (
              <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-200">
                {interest}
              </span>
            ))}
            {session.student_goals?.slice(0, 2).map((goal, i) => (
              <span key={i} className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-200">
                🎯 {goal}
              </span>
            ))}
            {insightCount > 5 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{insightCount - 5} nữa
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t-2 border-gray-100"
          >
            <div className="p-5 bg-gradient-to-br from-gray-50 to-indigo-50 space-y-4">
              {/* All Insights */}
              {session.student_interests?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Sở thích đã khám phá:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {session.student_interests.map((interest, i) => (
                      <span key={i} className="bg-white text-indigo-700 px-3 py-1.5 rounded-full text-sm border border-indigo-200 font-medium">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {session.student_goals?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Mục tiêu đã xác định:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {session.student_goals.map((goal, i) => (
                      <span key={i} className="bg-white text-green-700 px-3 py-1.5 rounded-full text-sm border border-green-200 font-medium">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Context snapshot */}
              {session.student_context?.clarity_score && (
                <div className="bg-white rounded-xl p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-600">Độ rõ ràng lúc đó:</p>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-indigo-600">{session.student_context.clarity_score}%</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${session.student_context.clarity_score}%` }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full"
                    />
                  </div>
                </div>
              )}

              {/* Completion info */}
              {session.is_completed && session.completion_date && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>
                    Hoàn thành: {format(new Date(session.completion_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}