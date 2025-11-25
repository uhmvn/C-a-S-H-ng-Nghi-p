import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import usePWA from './usePWA';

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, handleInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Don't show if dismissed or already installed
  if (isDismissed || isInstalled || !isInstallable) return null;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const success = await handleInstall();
    if (success) {
      setIsDismissed(true);
    }
    setIsInstalling(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: isMobile ? 100 : -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isMobile ? 100 : -100 }}
        className={`fixed left-0 right-0 z-[100] ${
          isMobile ? 'bottom-0' : 'top-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl ${
            isMobile 
              ? 'rounded-t-3xl' 
              : 'rounded-2xl'
          } overflow-hidden`}>
            <div className="flex items-center gap-4 p-4 md:p-6">
              {/* Icon */}
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                {isMobile ? (
                  <Smartphone className="w-7 h-7" />
                ) : (
                  <Monitor className="w-7 h-7" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">
                  Cài đặt App
                </h3>
                <p className="text-sm text-white/90">
                  {isMobile 
                    ? 'Thêm vào màn hình chính để truy cập nhanh' 
                    : 'Cài đặt ứng dụng để sử dụng offline và truy cập nhanh hơn'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {isInstalling ? 'Đang cài...' : 'Cài đặt'}
                  </span>
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile instruction */}
            {isMobile && (
              <div className="bg-black/20 px-4 py-3 text-xs text-white/80">
                💡 Tip: {/iPhone|iPad|iPod/.test(navigator.userAgent)
                  ? 'Bấm Share → Add to Home Screen'
                  : 'Bấm menu → Add to Home screen'}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}