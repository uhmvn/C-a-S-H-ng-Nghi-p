import { useState, useEffect } from 'react';

/**
 * ✨ usePWA Hook
 * Detects PWA install capability and manages install prompt
 */
export default function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
      console.log('✅ PWA installable');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('✅ PWA installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('✅ User accepted install');
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      } else {
        console.log('❌ User dismissed install');
        return false;
      }
    } catch (err) {
      console.error('❌ Install error:', err);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    handleInstall
  };
}