
import React from "react";
import { motion } from "framer-motion";

const RotatingText = () => (
  <motion.div
    className="absolute inset-0 w-full h-full"
    animate={{ rotate: 360 }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path
        id="textPath"
        d="M 50, 50 m -42, 0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0"
        fill="transparent"
      />
      <text 
        fill="#4F46E5" 
        className="uppercase"
        style={{ 
          fontSize: '6px',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: '600',
          letterSpacing: '0.1em'
        }}
      >
        <textPath xlinkHref="#textPath" textLength="264" lengthAdjust="spacingAndGlyphs">
          * KHÁM PHÁ * ĐỊNH HƯỚNG * TƯƠNG LAI * KHÁM PHÁ * ĐỊNH HƯỚNG * TƯƠNG LAI
        </textPath>
      </text>
    </svg>
  </motion.div>
);

export default function TransitionCircle() {
  return (
    <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 z-30">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative w-[140px] h-[140px] md:w-[160px] md:h-[160px] lg:w-[180px] lg:h-[180px]"
      >
        {/* Outer Circle */}
        <div 
          className="absolute inset-0 rounded-full shadow-xl p-3 md:p-4 lg:p-5 bg-white"
        >
          {/* Inner Circle with Logo */}
          <div 
            className="w-full h-full rounded-full flex flex-col items-center justify-center bg-white overflow-hidden"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690800a89985178f2ceea9b5/3b4021aeb_image.png"
              alt="Cửa Sổ Nghề Nghiệp Logo"
              className="w-full h-full object-contain p-2"
            />
          </div>
        </div>

        {/* Rotating Text */}
        <RotatingText />
        
      </motion.div>
    </div>
  );
}
