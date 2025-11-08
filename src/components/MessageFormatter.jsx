import React from "react";
import { Target, Briefcase, School, BookOpen, GraduationCap, Wrench } from "lucide-react";

// Common careers list for detection
const CAREERS = [
  'Kỹ sư', 'Bác sĩ', 'Giáo viên', 'Luật sư', 'Kiến trúc sư', 'Dược sĩ', 'Nhà thiết kế',
  'Lập trình viên', 'Designer', 'Developer', 'Game Designer', 'Nghệ sĩ', 'Nhà văn',
  'Biên tập viên', 'Phóng viên', 'Marketing', 'Kế toán', 'Ngân hàng', 'Tài chính',
  'Nhà khoa học', 'Nhà nghiên cứu', 'Kỹ thuật viên', 'Thiết kế đồ họa', 'UI/UX',
  'Họa sĩ', 'Nhạc sĩ', 'Ca sĩ', 'Diễn viên', 'Đạo diễn', 'Nhà quản lý', 'CEO',
  'Doanh nhân', 'Startup', 'Kinh doanh', 'Bán hàng', 'Tư vấn', 'Chuyên gia',
  'Nhà tâm lý học', 'Y tế', 'Điều dưỡng', 'Dược', 'Nha sĩ', 'Thú y',
  'Công nghệ thông tin', 'AI Engineer', 'Data Scientist', 'Cyber Security',
  'Mỹ thuật', 'Nghệ thuật', 'Thiết kế nội thất', 'Kiến trúc', 'Xây dựng',
  'Cơ khí', 'Điện tử', 'Tự động hóa', 'Robot', 'IoT', 'Blockchain'
];

export default function MessageFormatter({ text, sender }) {
  if (sender === 'user') {
    return <p className="leading-relaxed whitespace-pre-wrap break-words">{text}</p>;
  }

  const formatLine = (line, lineIdx) => {
    if (!line.trim()) return <br key={lineIdx} />;

    let processedLine = line;
    const elements = [];
    let lastIndex = 0;

    // All patterns with priority order
    const patterns = [
      // 1. Tổ hợp môn: A00, B00, C00, D01...
      { 
        regex: /\b([A-D]\d{2})\b/gi, 
        type: 'combination',
        render: (match) => (
          <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md mx-1 my-0.5 whitespace-nowrap">
            <BookOpen className="w-3.5 h-3.5" />
            {match}
          </span>
        )
      },
      // 2. Môn học đơn
      { 
        regex: /\b(Toán|Văn|Lý|Hóa|Sinh|Sử|Địa|Anh|GDCD|Tin học|Công nghệ|Vật lý|Hóa học|Sinh học|Lịch sử|Địa lý|Tiếng Anh)\b/g,
        type: 'subject',
        render: (match) => (
          <span className="inline-flex items-center gap-1.5 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md mx-1 my-0.5 whitespace-nowrap">
            <GraduationCap className="w-3.5 h-3.5" />
            {match}
          </span>
        )
      },
      // 3. Nghề nghiệp trong **text**
      {
        regex: /\*\*([^*]+)\*\*/g,
        type: 'career_bold',
        render: (match, fullMatch) => {
          const content = match.replace(/\*\*/g, '');
          // Check if it's a career/field
          if (CAREERS.some(c => content.toLowerCase().includes(c.toLowerCase())) || 
              /thiết kế|lập trình|kỹ thuật|công việc|ngành|chuyên/.test(content.toLowerCase())) {
            return (
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg mx-1 my-0.5">
                <Briefcase className="w-3.5 h-3.5" />
                {content}
              </span>
            );
          }
          return <strong>{content}</strong>;
        }
      },
      // 4. Direct career names
      {
        regex: new RegExp(`\\b(${CAREERS.join('|')})\\b`, 'gi'),
        type: 'career_direct',
        render: (match) => (
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md mx-1 my-0.5 whitespace-nowrap">
            <Briefcase className="w-3.5 h-3.5" />
            {match}
          </span>
        )
      },
      // 5. Trường học
      { 
        regex: /\b(Đại học|ĐH|Cao đẳng|Trường)\s+([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s]+)/g,
        type: 'school',
        render: (match) => (
          <span className="inline-flex items-center gap-1.5 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md mx-1 my-0.5">
            <School className="w-3.5 h-3.5" />
            {match}
          </span>
        )
      }
    ];

    // Find all matches
    const allMatches = [];
    patterns.forEach((pattern) => {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      while ((match = regex.exec(line)) !== null) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          content: match[0],
          pattern: pattern
        });
      }
    });

    // Sort by position and remove overlaps
    allMatches.sort((a, b) => a.index - b.index);
    const filteredMatches = [];
    let lastEnd = -1;
    
    allMatches.forEach(match => {
      if (match.index >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.index + match.length;
      }
    });

    // Build elements
    filteredMatches.forEach((match, idx) => {
      // Add text before match
      if (match.index > lastIndex) {
        elements.push(
          <span key={`text-${lineIdx}-${idx}`}>
            {line.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add formatted element
      elements.push(
        <span key={`match-${lineIdx}-${idx}`}>
          {match.pattern.render(match.content)}
        </span>
      );
      
      lastIndex = match.index + match.length;
    });

    // Add remaining text
    if (lastIndex < line.length) {
      elements.push(
        <span key={`text-${lineIdx}-end`}>
          {line.substring(lastIndex)}
        </span>
      );
    }

    // Render based on line type
    const isListItem = /^[•\-\*]\s/.test(line) || /^\d+\.\s/.test(line);
    const isHeading = /^[🎯💭📊✨🎓💡🌟🔥📚🏆👉]/u.test(line);
    
    if (isListItem) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 ml-4 my-2">
          <span className="text-indigo-600 font-bold mt-1">•</span>
          <div className="flex-1 flex flex-wrap items-center leading-relaxed">
            {elements.length > 0 ? elements : <span>{line}</span>}
          </div>
        </div>
      );
    }
    
    if (isHeading) {
      return (
        <div key={lineIdx} className="font-bold text-base mt-4 mb-2 flex flex-wrap items-center text-gray-900">
          {elements.length > 0 ? elements : <span>{line}</span>}
        </div>
      );
    }

    return (
      <div key={lineIdx} className="flex flex-wrap items-center leading-relaxed my-1">
        {elements.length > 0 ? elements : <span>{line}</span>}
      </div>
    );
  };

  const lines = text.split('\n');
  
  return (
    <div className="space-y-0">
      {lines.map((line, idx) => formatLine(line, idx))}
    </div>
  );
}