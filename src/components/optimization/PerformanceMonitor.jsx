import { useEffect } from 'react';

/**
 * ✨ PerformanceMonitor - Track Web Vitals
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    // Track FCP (First Contentful Paint)
    const perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          console.log('⚡ FCP:', entry.startTime.toFixed(2), 'ms');
        }
      }
    });

    perfObserver.observe({ entryTypes: ['paint'] });

    // Track LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('⚡ LCP:', lastEntry.startTime.toFixed(2), 'ms');
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Track CLS (Cumulative Layout Shift)
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      }
      console.log('⚡ CLS:', clsScore.toFixed(4));
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });

    return () => {
      perfObserver.disconnect();
      lcpObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  return null;
}