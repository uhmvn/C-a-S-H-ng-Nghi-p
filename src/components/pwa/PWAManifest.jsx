import { useEffect } from 'react';

export default function PWAManifest() {
  useEffect(() => {
    const manifest = {
      name: "Cửa Sổ Nghề Nghiệp - Hướng nghiệp thông minh",
      short_name: "CSNN",
      description: "Nền tảng hướng nghiệp AI cho học sinh THCS & THPT",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#4F46E5",
      orientation: "portrait-primary",
      icons: [
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='50' text-anchor='middle' dominant-baseline='middle' fill='white' font-family='Arial'%3E🎓%3C/text%3E%3C/svg%3E",
          sizes: "192x192",
          type: "image/svg+xml"
        },
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%234F46E5' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='50' text-anchor='middle' dominant-baseline='middle' fill='white' font-family='Arial'%3E🎓%3C/text%3E%3C/svg%3E",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable"
        }
      ],
      categories: ["education", "productivity", "lifestyle"],
      shortcuts: [
        {
          name: "Chat với AI",
          short_name: "Chat AI",
          description: "Tư vấn hướng nghiệp với AI",
          url: "/?open-chat=true",
          icons: [
            {
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%239333EA' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='50' text-anchor='middle' dominant-baseline='middle' fill='white' font-family='Arial'%3E💭%3C/text%3E%3C/svg%3E",
              sizes: "96x96"
            }
          ]
        },
        {
          name: "Tổ hợp môn",
          short_name: "Tổ hợp",
          description: "Xem tổ hợp môn thi",
          url: "/SubjectCombinations",
          icons: [
            {
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2306B6D4' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='50' text-anchor='middle' dominant-baseline='middle' fill='white' font-family='Arial'%3E📚%3C/text%3E%3C/svg%3E",
              sizes: "96x96"
            }
          ]
        },
        {
          name: "Hồ sơ",
          short_name: "Hồ sơ",
          description: "Xem hồ sơ cá nhân",
          url: "/UserProfile",
          icons: [
            {
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2310B981' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='50' text-anchor='middle' dominant-baseline='middle' fill='white' font-family='Arial'%3E👤%3C/text%3E%3C/svg%3E",
              sizes: "96x96"
            }
          ]
        }
      ]
    };

    // Create and inject manifest
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);

    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestURL;

    // Add theme color meta
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      document.head.appendChild(themeColor);
    }
    themeColor.content = '#4F46E5';

    // Add apple touch icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%234F46E5' width='100' height='100' rx='20'/%3E%3Ctext x='50' y='50' font-size='50' text-anchor='middle' dominant-baseline='middle' fill='white' font-family='Arial'%3E🎓%3C/text%3E%3C/svg%3E";

    console.log('✅ PWA Manifest injected');

    // Register service worker via backend function
    if ('serviceWorker' in navigator) {
      const swUrl = window.location.origin.includes('localhost')
        ? 'http://localhost:54321/functions/v1/serviceWorker'
        : `${window.location.origin}/api/functions/serviceWorker`;
      
      navigator.serviceWorker
        .register(swUrl, { scope: '/' })
        .then(registration => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch(error => {
          console.log('❌ Service Worker registration failed:', error);
        });
    }

    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, []);

  return null;
}