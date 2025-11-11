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
    <div className="bg-white" style={{ width: '210mm