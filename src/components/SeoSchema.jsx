import React from 'react';

// This component injects advanced, SEO-friendly structured data into the page head.
export default function SeoSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HealthAndBeautyBusiness",
        "@id": "https://www.serenitysalon.in/#organization",
        "name": "SERENITY Luxury Spa & Salon",
        "url": "https://www.serenitysalon.in/",
        "logo": "https://www.serenitysalon.in/logo.png", // Placeholder URL, should be replaced with actual logo URL
        "description": "Discover SERENITY, Kolkata's #1 luxury organic spa and salon in Tangra. We offer world-class, state-of-the-art equipment and highly skilled, certified professionals for premium organic spa treatments, therapeutic massages, and advanced beauty services. Your ultimate wellness sanctuary.",
        "image": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/831601306_14.jpg",
        "telephone": "+91-98765-43210",
        "priceRange": "₹₹ - ₹₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "P-145, Sector A, Metropolitan Co-Operative Housing Society Limited, Tangra",
          "addressLocality": "Kolkata",
          "postalCode": "700105",
          "addressRegion": "West Bengal",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "22.5413", // Approximate coordinates for Tangra, Kolkata
          "longitude": "88.3833"
        },
        "openingHoursSpecification": [
          { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "10:00", "closes": "20:00" },
          { "@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "09:00", "closes": "19:00" },
          { "@type": "OpeningHoursSpecification", "dayOfWeek": "Sunday", "opens": "10:00", "closes": "18:00" }
        ],
        "sameAs": [
            "https://www.facebook.com/serenitykolkata", // Placeholder
            "https://www.instagram.com/serenitykolkata" // Placeholder
        ],
        "hasOffer": [
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Japanese Head Spa" }, "price": "3500", "priceCurrency": "INR" },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Deep Tissue Massage" }, "price": "3500", "priceCurrency": "INR" },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Microblading" }, "price": "6500", "priceCurrency": "INR" }
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://www.serenitysalon.in/#website",
        "url": "https://www.serenitysalon.in/",
        "name": "SERENITY Luxury Spa & Salon",
        "publisher": { "@id": "https://www.serenitysalon.in/#organization" },
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.serenitysalon.in/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Review",
        "itemReviewed": { "@id": "https://www.serenitysalon.in/#organization" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "author": { "@type": "Person", "name": "Priya Sharma" },
        "reviewBody": "SERENITY has completely transformed my beauty routine. As the best luxury spa in Kolkata, their highly skilled professionals and premium equipment deliver results that exceed expectations."
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}