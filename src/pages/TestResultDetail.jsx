
import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp, Award, Target, Brain, BookOpen, ArrowRight,
  BarChart3, PieChart as PieIcon, Activity, Sparkles, Download,
  MessageCircle, Calendar, CheckCircle, AlertCircle, Lightbulb, Loader2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";
import { createPageUrl } from "@/utils";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function TestResultDetail() {
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get('id');

  // Fetch test result
  const { data: result, isLoading: loadingResult } = useQuery({
    queryKey: ['testResult', resultId],
    queryFn: async () => {
      if (!resultId) return null;
      const results = await base44.entities.TestResult.filter({ id: resultId });
      return results?.[0] || null;
    },
    enabled: !!resultId
  });

  // ✅ FIXED: Better null safety for AI evaluation
  const { data: aiEvaluation, isLoading: loadingAI, refetch: refetchAI } = useQuery({
    queryKey: ['aiEvaluation', result?.user_id, result?.id],
    queryFn: async () => {
      if (!result?.user_id || !result?.id) return null;
      try {
        const evals = await base44.entities.AIEvaluation.filter({
          student_id: result.user_id,
          entity_id: result.id,
          evaluation_type: 'test_result'
        }, '-created_at', 1);
        return evals?.[0] || null;
      } catch (error) {
        console.error('Error fetching AI evaluation:', error);
        return null;
      }
    },
    enabled: !!result?.user_id && !!result?.id,
    refetchInterval: (data) => {
      return !data ? 5000 : false;
    },
    refetchIntervalInBackground: false
  });

  // ✅ FIXED: Fetch academic scores with null safety
  const { data: academicScores = [] } = useQuery({
    queryKey: ['academicScores', result?.user_id],
    queryFn: async () => {
      if (!result?.user_id) return [];
      try {
        const scores = await base44.entities.AcademicScore.filter({ student_id: result.user_id });
        return scores || [];
      } catch (error) {
        console.error('Error fetching academic scores:', error);
        return [];
      }
    },
    enabled: !!result?.user_id
  });

  // ✅ FIXED: Fetch previous results with null safety
  const { data: previousResults = [] } = useQuery({
    queryKey: ['previousResults', result?.user_id, result?.test_id],
    queryFn: async () => {
      if (!result?.user_id || !result?.test_id) return [];
      try {
        const allResults = await base44.entities.TestResult.filter({
          user_id: result.user_id,
          test_id: result.test_id
        }, '-completed_date', 5);
        const filtered = (allResults || []).filter(r => r?.id && r.id !== result.id);
        return filtered;
      } catch (error) {
        console.error('Error fetching previous results:', error);
        return [];
      }
    },
    enabled: !!result?.user_id && !!result?.test_id
  });

  const breadcrumbItems = [
    { label: "Hồ sơ", url: createPageUrl("UserProfile") },
    { label: "Kết quả test" }
  ];

  if (loadingResult) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Đang tải kết quả...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy kết quả</h2>
            <p className="text-gray-600">ID kết quả không hợp lệ hoặc đã bị xóa</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Safe access to arrays
  const hasImprovement = previousResults.length > 0;
  const latestPrevious = hasImprovement ? previousResults[0] : null;
  const topTypes = result.top_types || [];
  const hasTopTypes = topTypes.length > 0;

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">

        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 shadow-lg mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-900">{result.test_name || 'Bài test'}</h1>
                {result.test_version && (
                  <span className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                    Version {result.test_version}
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                Hoàn thành: {result.completed_date ? format(new Date(result.completed_date), 'dd/MM/yyyy HH:mm', { locale: vi }) : 'N/A'}
              </p>
              {result.duration_seconds && (
                <p className="text-sm text-gray-500">
                  Thời gian: {Math.floor(result.duration_seconds / 60)} phút {result.duration_seconds % 60} giây
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
              {aiEvaluation && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Đã phân tích AI</span>
                </div>
              )}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Tải báo cáo
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4 border-t pt-4 mt-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <Award className="w-8 h-8 mb-2 text-indigo-600" />
              <p className="text-2xl font-bold text-gray-900">{result.answers_count || 0}</p>
              <p className="text-sm text-gray-600">Câu trả lời</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <Target className="w-8 h-8 mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">{topTypes.length}</p>
              <p className="text-sm text-gray-600">Xu hướng chính</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <TrendingUp className="w-8 h-8 mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">{previousResults.length + 1}</p>
              <p className="text-sm text-gray-600">Lần làm test</p>
            </div>
          </div>
        </div>

        {/* ✅ Basic Results */}
        {hasTopTypes && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-8 shadow-lg mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              Kết Quả Tính Cách Của Bạn
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {topTypes.slice(0, 3).map((type, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative overflow-hidden rounded-2xl p-6 ${
                    idx === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' :
                    idx === 1 ? 'bg-gradient-to-br from-purple-400 to-pink-500 text-white' :
                    'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
                  }`}
                >
                  <div className="absolute top-2 right-2 text-5xl font-bold opacity-20">
                    #{idx + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{type.name || type.type || 'N/A'}</h3>
                  <p className="text-4xl font-bold mb-1">{type.percentage || 0}%</p>
                  <p className="text-sm opacity-90">Điểm: {type.score?.toFixed(1) || 'N/A'}</p>
                </motion.div>
              ))}
            </div>
            {result.interpretation && (
              <div className="mt-6 bg-indigo-50 rounded-xl p-4">
                <p className="text-gray-700">{result.interpretation}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ✅ AI Analysis Loading/Missing State */}
        {loadingAI ? (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-xl mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-blue-700 font-medium">Đang phân tích AI...</p>
            </div>
            <p className="text-blue-600 text-sm mb-3">
              AI đang phân tích kết quả của bạn. Vui lòng đợi trong giây lát.
            </p>
            <button
              onClick={() => refetchAI()}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Tải lại
            </button>
          </div>
        ) : !aiEvaluation ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl mb-8">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <p className="text-yellow-800 font-medium">AI chưa phân tích</p>
            </div>
            <p className="text-yellow-700 text-sm mb-3">
              Phân tích AI có thể mất 1-2 phút. Bạn có thể tải lại trang sau.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Tải lại trang
            </button>
          </div>
        ) : null}

        {/* ✅ AI Analysis (if available) */}
        {aiEvaluation && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 mb-8 border-2 border-purple-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Phân Tích AI Chuyên Sâu</h2>
                <p className="text-sm text-gray-600">
                  Độ tin cậy: {aiEvaluation.confidence_score || 0}% | Model: {aiEvaluation.ai_model || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Strengths */}
              {aiEvaluation.strengths && Array.isArray(aiEvaluation.strengths) && aiEvaluation.strengths.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Điểm Mạnh
                  </h3>
                  <ul className="space-y-2">
                    {aiEvaluation.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {aiEvaluation.weaknesses && Array.isArray(aiEvaluation.weaknesses) && aiEvaluation.weaknesses.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-orange-700 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Điểm Cần Cải Thiện
                  </h3>
                  <ul className="space-y-2">
                    {aiEvaluation.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            {aiEvaluation.recommendations && Array.isArray(aiEvaluation.recommendations) && aiEvaluation.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-indigo-700 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Khuyến Nghị Phát Triển
                </h3>
                <div className="space-y-3">
                  {aiEvaluation.recommendations.map((rec, idx) => (
                    <div key={idx} className="border-l-4 border-indigo-400 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{rec.title || `Khuyến nghị ${idx + 1}`}</h4>
                        {rec.priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {rec.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{rec.description || ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ✅ Career Recommendations */}
        {aiEvaluation?.analysis?.suggested_careers && Array.isArray(aiEvaluation.analysis.suggested_careers) && aiEvaluation.analysis.suggested_careers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-lg mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              Top Nghề Nghiệp Phù Hợp
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {aiEvaluation.analysis.suggested_careers.map((career, idx) => (
                <div key={idx} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{career.career || `Nghề ${idx + 1}`}</h3>
                    <span className="text-lg font-bold text-indigo-600">{career.match_percentage || 0}%</span>
                  </div>
                  <p className="text-sm text-gray-600">{career.reason || ''}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ✅ Academic Scores Context */}
        {academicScores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-lg mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Kết Hợp Với Kết Quả Học Tập
            </h2>
            <p className="text-gray-600 mb-4">
              Dựa trên {academicScores.length} điểm học tập, AI đã phân tích và đưa ra gợi ý phù hợp.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {academicScores.slice(0, 8).map((score, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">{score.subject_name || 'N/A'}</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {score.average_score ? score.average_score.toFixed(1) : '0.0'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ✅ Progress Comparison */}
        {hasImprovement && latestPrevious && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl p-8 mb-8 border-2 border-green-200"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              Tiến Bộ So Với Lần Trước
            </h2>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-gray-600 mb-4">
                Bạn đã làm {previousResults.length + 1} lần. 
                Lần gần nhất: {latestPrevious.completed_date ? format(new Date(latestPrevious.completed_date), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">Hiện Tại</h3>
                  {topTypes.slice(0, 3).map((type, idx) => (
                    <div key={idx} className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{type.type || type.name || 'N/A'}</span>
                      <span className="font-bold text-green-600">{type.percentage || 0}%</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">Lần Trước</h3>
                  {(latestPrevious.top_types || []).slice(0, 3).map((type, idx) => (
                    <div key={idx} className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{type.type || type.name || 'N/A'}</span>
                      <span className="font-bold text-gray-600">{type.percentage || 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Cần tư vấn chuyên sâu?</h2>
          <p className="text-indigo-100 mb-6">
            Đặt lịch với chuyên gia để phân tích chi tiết và lộ trình phát triển
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
            className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-medium hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Đặt lịch tư vấn
          </button>
        </div>
      </div>
    </div>
  );
}
