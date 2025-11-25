import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, X, Target, Info } from 'lucide-react';

export default function ProgressAlert({ alerts, onDismiss, onAskAbout }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) return null;

  // Show top 2 alerts
  const topAlerts = alerts.slice(0, 2);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 border-t border-orange-200"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              📊 Phân tích tiến độ học tập
            </p>
            
            <div className="space-y-2">
              {topAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-sm ${
                    alert.type === 'warning'
                      ? 'bg-orange-100 border border-orange-300'
                      : 'bg-green-100 border border-green-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {alert.type === 'warning' ? (
                      <TrendingDown className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        alert.type === 'warning' ? 'text-orange-900' : 'text-green-900'
                      }`}>
                        {alert.message}
                      </p>
                      <p className={`text-xs mt-1 ${
                        alert.type === 'warning' ? 'text-orange-700' : 'text-green-700'
                      }`}>
                        💡 {alert.action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {alerts.length > 2 && (
              <p className="text-xs text-gray-600 mt-2">
                +{alerts.length - 2} thông báo khác
              </p>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  const prompt = `Mình thấy có ${alerts.length} thông báo về điểm của em. Em muốn nói chuyện về điều này không?`;
                  onAskAbout(prompt);
                  setDismissed(true);
                }}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Tư vấn ngay
              </button>
              <button
                onClick={() => {
                  setDismissed(true);
                  if (onDismiss) onDismiss();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Để sau
              </button>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}