import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, Target, Trash2, CheckCircle, PlayCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function SessionCard({ session, isActive, onSelect, onDelete }) {
  const messageCount = session.conversation_history?.length || 0;
  const clarity = session.student_context?.clarity || 0;
  const sessionDate = new Date(session.session_date);
  const timeAgo = formatDistanceToNow(sessionDate, { addSuffix: true, locale: vi });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
        isActive
          ? 'border-indigo-600 bg-indigo-50'
          : 'border-gray-200 hover:border-indigo-400 bg-white'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          session.is_completed ? 'bg-gray-100' : 'bg-green-100'
        }`}>
          {session.is_completed ? (
            <CheckCircle className="w-5 h-5 text-gray-600" />
          ) : (
            <PlayCircle className="w-5 h-5 text-green-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-gray-900">
              {format(sessionDate, 'dd/MM/yyyy HH:mm')}
            </p>
            {!session.is_completed && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                Đang chat
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </p>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <MessageCircle className="w-3 h-3" />
              <span>{messageCount} tin nhắn</span>
            </div>
            {clarity > 0 && (
              <div className="flex items-center gap-1 text-indigo-600">
                <Target className="w-3 h-3" />
                <span>{clarity}% rõ ràng</span>
              </div>
            )}
          </div>

          {session.student_interests?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {session.student_interests.slice(0, 2).map((interest, idx) => (
                <span key={idx} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"
          title="Xóa session"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}