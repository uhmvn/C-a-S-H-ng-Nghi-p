import React from "react";
import { CheckCircle, Award, Target, Brain, BookOpen, TrendingUp, Sparkles, Calendar, AlertCircle, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function TestResultPDFTemplate({ result, user, aiEvaluation, academicScores, previousResults }) {
  const topTypes = result.top_types || [];
  const hasImprovement = previousResults && previousResults.length > 0;
  const latestPrevious = hasImprovement ? previousResults[0] : null;

  return (
    <div className="bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '20mm', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-