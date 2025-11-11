
import React from "react";
import { CheckCircle, Award, Target, Brain, BookOpen, TrendingUp, Sparkles, Calendar, AlertCircle, Lightbulb, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function TestResultPDFTemplate({ result, user, aiEvaluation, academicScores, previousResults }) {
  const topTypes = result.top_types || [];
  const hasImprovement = previousResults && previousResults.length > 0;
  const latestPrevious = hasImprovement ? previousResults[0] : null;
  const studentName = user?.full_name || 'Học sinh';

  return (
    <div className="bg-white p-12" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* 
        This is where the content of your PDF template would be rendered.
        The provided 'current file code' was truncated. This completion makes it a valid React component.
        If there was more content originally, it would be placed here.
      */}
      <h1 className="text-2xl font-bold mb-4">Kết quả bài kiểm tra của {studentName}</h1>
      <p className="text-gray-700">Ngày tạo: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>

      {/* Example of how existing variables could be used */}
      {result && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-2 flex items-center"><Award className="mr-2 text-yellow-500" /> Điểm tổng quát</h2>
          <p>Điểm số: <span className="font-bold">{result.score}</span> / {result.max_score}</p>
          {result.grade && <p>Xếp loại: <span className="font-bold">{result.grade}</span></p>}
        </div>
      )}

      {academicScores && academicScores.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center"><BookOpen className="mr-2 text-blue-500" /> Điểm số học thuật</h2>
          {academicScores.map((score, index) => (
            <div key={index} className="mb-2 p-3 border-b border-gray-200 last:border-b-0">
              <p className="font-medium">{score.subject || 'Môn học'}: <span className="font-bold">{score.score}</span> / {score.max_score}</p>
              {score.feedback && <p className="text-sm text-gray-600">{score.feedback}</p>}
            </div>
          ))}
        </div>
      )}

      {aiEvaluation && (
        <div className="mt-8 p-4 border rounded-lg bg-indigo-50">
          <h2 className="text-xl font-semibold mb-2 flex items-center"><Brain className="mr-2 text-purple-500" /> Đánh giá của AI</h2>
          <p className="text-gray-800">{aiEvaluation.summary}</p>
          {aiEvaluation.strengths && (
            <div className="mt-4">
              <h3 className="font-semibold flex items-center"><CheckCircle className="mr-2 text-green-500" size={18}/> Điểm mạnh</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700">
                {aiEvaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {aiEvaluation.areas_for_improvement && (
            <div className="mt-4">
              <h3 className="font-semibold flex items-center"><Target className="mr-2 text-red-500" size={18}/> Lĩnh vực cần cải thiện</h3>
              <ul className="list-disc list-inside ml-4 text-gray-700">
                {aiEvaluation.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {hasImprovement && latestPrevious && (
        <div className="mt-8 p-4 border rounded-lg bg-green-50">
          <h2 className="text-xl font-semibold mb-2 flex items-center"><TrendingUp className="mr-2 text-green-600" /> So sánh với kết quả trước</h2>
          <p>Bài kiểm tra trước đó vào ngày {format(new Date(latestPrevious.date), 'dd/MM/yyyy', { locale: vi })} đạt điểm: <span className="font-bold">{latestPrevious.score}</span> / {latestPrevious.max_score}</p>
          <p className="text-gray-800">
            {result.score > latestPrevious.score ? "Bạn đã cải thiện đáng kể!" : 
             result.score < latestPrevious.score ? "Cần chú ý cải thiện thêm." : "Kết quả tương tự."}
          </p>
        </div>
      )}

      {topTypes && topTypes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center"><Lightbulb className="mr-2 text-orange-500" /> Các loại câu hỏi/kỹ năng nổi bật</h2>
          <ul className="list-disc list-inside ml-4 text-gray-800">
            {topTypes.map((type, index) => (
              <li key={index} className="mb-1">{type.name}: <span className="font-bold">{type.score}</span> điểm</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-12 text-center text-gray-600 border-t pt-4">
        <p>Báo cáo này được tạo tự động.</p>
        <p>Chúc bạn học tốt và đạt nhiều thành công!</p>
      </div>
    </div>
  );
}
