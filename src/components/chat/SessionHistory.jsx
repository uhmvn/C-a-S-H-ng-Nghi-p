import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Trash2, MessageCircle, Clock, Target, Sparkles } from 'lucide-react';
import SessionCard from './SessionCard';
import { format, isAfter, subDays } from 'date-fns';

export default function SessionHistory({ sessions, onSelectSession, onDeleteSession, currentSessionId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, recent, old

  const now = new Date();
  const tenDaysAgo = subDays(now, 10);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'recent') return isAfter(new Date(s.session_date), tenDaysAgo);
    if (filter === 'old') return !isAfter(new Date(s.session_date), tenDaysAgo);
    return true;
  });

  const activeSessions = filteredSessions.filter(s => !s.is_completed);
  const completedSessions = filteredSessions.filter(s => s.is_completed);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-indigo-200 rounded-xl hover:border-indigo-600 transition-colors"
        title="Lịch sử chat"
      >
        <History className="w-5 h-5 text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Lịch sử</span>
        {sessions.length > 0 && (
          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
            {sessions.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <History className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Lịch Sử Chat</h3>
                      <p className="text-white/80 text-sm">{sessions.length} cuộc trò chuyện</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'Tất cả', count: sessions.length },
                    { value: 'recent', label: 'Gần đây', count: sessions.filter(s => isAfter(new Date(s.session_date), tenDaysAgo)).length },
                    { value: 'old', label: '>10 ngày', count: sessions.filter(s => !isAfter(new Date(s.session_date), tenDaysAgo)).length }
                  ].map(({ value, label, count }) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === value
                          ? 'bg-white text-indigo-600'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {label} {count > 0 && `(${count})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeSessions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      Đang tiếp tục ({activeSessions.length})
                    </h4>
                    <div className="space-y-2">
                      {activeSessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          isActive={session.id === currentSessionId}
                          onSelect={() => {
                            onSelectSession(session);
                            setIsOpen(false);
                          }}
                          onDelete={() => onDeleteSession(session.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {completedSessions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Đã hoàn thành ({completedSessions.length})
                    </h4>
                    <div className="space-y-2">
                      {completedSessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          isActive={session.id === currentSessionId}
                          onSelect={() => {
                            onSelectSession(session);
                            setIsOpen(false);
                          }}
                          onDelete={() => onDeleteSession(session.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredSessions.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có lịch sử chat</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}