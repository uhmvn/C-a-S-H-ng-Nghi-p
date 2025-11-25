import React from "react";
import { motion } from "framer-motion";
import { Clock, Star, ArrowRight, Play, Calendar, Eye } from "lucide-react";
import LazyImage from "./LazyImage";

const OptimizedServiceCard = React.memo(({ service, index, ctaConfig, onClick }) => {
  const CTAIcon = ctaConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ scale: 1.03, y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
      onClick={() => onClick(service)}
      className="group bg-white rounded-3xl overflow-hidden shadow-lg will-change-transform cursor-pointer"
    >
      <div className="relative h-64 overflow-hidden">
        <LazyImage
          src={service.image_url}
          alt={service.alt_text || service.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
          {service.price.toLocaleString('vi-VN')}đ
        </div>

        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {service.duration}
        </div>

        {service.featured && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            NỔI BẬT
          </div>
        )}
        
        {service.test_code && (
          <div className="absolute bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Play className="w-3 h-3" />
            Test
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-display text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">
          {service.name}
        </h3>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {service.description}
        </p>

        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-indigo-600 fill-current" />
          ))}
          <span className="text-sm text-gray-500 ml-2">(5.0)</span>
        </div>
        
        <div className="w-full bg-indigo-600/10 text-indigo-600 py-3 rounded-full font-medium group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 group-hover:shadow-lg flex items-center justify-center gap-2">
          <CTAIcon className="w-4 h-4" />
          {ctaConfig.text}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </motion.div>
  );
});

OptimizedServiceCard.displayName = 'OptimizedServiceCard';

export default OptimizedServiceCard;