import React from 'react';
import { motion } from 'framer-motion';

const partners = [
  { name: 'Bộ Giáo dục & Đào tạo', logo: '🎓' },
  { name: 'Sở Giáo dục', logo: '📚' },
  { name: 'Trường THCS', logo: '🏫' },
  { name: 'Trường THPT', logo: '🎯' },
  { name: 'Đại học Quốc gia', logo: '🏛️' },
  { name: 'Viện Nghiên cứu', logo: '🔬' },
  { name: 'Chuyên gia Tư vấn', logo: '👨‍🏫' },
  { name: 'Tổ chức Giáo dục', logo: '📖' }
];

export default function BrandPartners() {
  const extendedPartners = [...partners, ...partners];

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      viewport={{ once: true }}
      className="py-12 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-gray-500 mb-12">
          Được Hỗ Trợ & Tin Dùng Bởi Các Tổ Chức Giáo Dục
        </h3>
        <div className="relative w-full overflow-hidden group">
          <style jsx>{`
            .marquee-container {
              display: flex;
              width: fit-content;
              animation: marquee 120s linear infinite;
            }
            .group:hover .marquee-container {
              animation-play-state: paused;
            }
            @keyframes marquee {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            
            /* Mobile optimization */
            @media (max-width: 768px) {
              .partner-item {
                width: calc(100vw / 3 - 2rem);
                min-width: calc(100vw / 3 - 2rem);
                margin: 0 1rem;
              }
            }
          `}</style>
          <div className="marquee-container">
            {extendedPartners.map((partner, index) => (
              <div 
                key={index} 
                className="partner-item flex-shrink-0 w-48 mx-8 lg:mx-12 flex flex-col items-center justify-center h-24"
              >
                <div className="text-5xl mb-2">{partner.logo}</div>
                <p className="text-xs text-gray-600 font-medium text-center">
                  {partner.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}