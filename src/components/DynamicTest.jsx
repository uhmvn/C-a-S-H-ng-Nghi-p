import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Loader2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";

export default function DynamicTest({ testCode }) {
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  // Fetch test info
  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ['test', testCode],
    queryFn: async () => {
      const tests = await base44.entities.Test.filter({ test_code: testCode, is_published: true });
      return tests[0];
    },
    enabled: !!testCode
  });

  // Fetch test type
  const { data: testType } = useQuery({
    queryKey: ['testType', test?.test_type_id],
    queryFn: async () => {
      if (!test?.test_type_id) return null;
      const types = await base44.entities.TestType.filter({ id: test.test_type_id });
      return types[0];
    },
    enabled: !!test?.test_type_id
  });

  // ✅ IMPROVED: Fetch questions with better error handling
  const { data: questions = [], isLoading: questionsLoading, error: questionsError } = useQuery({
    queryKey: ['testQuestions', test?.id],
    queryFn: async () => {
      if (!test?.id) return [];
      const qs = await base44.entities.TestQuestion.filter({ test_id: test.id }, 'order');
      console.log(`✅ Loaded ${qs.length} questions for test ${test.id}`);
      return qs;
    },
    enabled: !!test?.id,
    retry: 2,
    retryDelay: 1000
  });

  // Save result mutation
  const saveResultMutation = useMutation({
    mutationFn: async (resultData) => {
      const user = await base44.auth.me();
      if (!user) {
        throw new Error('Bạn cần đăng nhập để lưu kết quả');
      }

      const duration = Math.floor((Date.now() - startTime) / 1000);

      const testResult = await base44.entities.TestResult.create({
        user_id: user.id,
        test_id: test.id,
        test_type: testType?.type_code || 'custom',
        test_name: test.name,
        test_version: test.version,
        results: resultData.results,
        scores: resultData.scores,
        top_types: resultData.topTypes,
        interpretation: resultData.interpretation,
        completed_date: new Date().toISOString(),
        duration_seconds: duration,
        answers_count: Object.keys(resultData.results).length
      });

      // ✅ CRITICAL: Trigger AI evaluation IMMEDIATELY after saving result
      try {
        await triggerAIEvaluation(testResult.id, user.id);
      } catch (aiError) {
        console.error('AI evaluation failed (non-blocking):', aiError);
        // Don't block user flow if AI fails
      }

      return testResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['testResults'] });
      // ✅ Navigate to result page immediately
      window.location.href = createPageUrl(`TestResultDetail?id=${result.id}`);
    },
    onError: (error) => {
      alert(`Lỗi khi lưu kết quả: ${error.message}`);
    }
  });

  const calculateResult = (finalAnswers) => {
    if (!testType || !questions.length) return;

    const dimensionScores = {};

    questions.forEach(q => {
      const answer = finalAnswers[q.id];
      if (!answer) return;

      const dimension = q.dimension;
      if (dimension) {
        if (!dimensionScores[dimension]) {
          dimensionScores[dimension] = { total: 0, count: 0 };
        }
        dimensionScores[dimension].total += answer;
        dimensionScores[dimension].count += 1;
      }
    });

    const dimensionNames = {
      'R': 'Realistic (Thực tế)',
      'I': 'Investigative (Nghiên cứu)',
      'A': 'Artistic (Nghệ thuật)',
      'S': 'Social (Xã hội)',
      'E': 'Enterprising (Tiến thủ)',
      'C': 'Conventional (Truyền thống)'
    };

    const sortedDimensions = Object.entries(dimensionScores)
      .map(([dim, data]) => ({
        type: dim,
        name: dimensionNames[dim] || dim,
        score: testType.scoring_method === 'average' 
          ? data.total / data.count 
          : data.total,
        percentage: Math.round((data.total / (data.count * 5)) * 100)
      }))
      .sort((a, b) => b.score - a.score);

    const resultData = {
      results: finalAnswers,
      scores: dimensionScores,
      topTypes: sortedDimensions.slice(0, 3),
      interpretation: `Nhóm tính cách của bạn: ${sortedDimensions.slice(0, 3).map(d => d.name).join(', ')}`
    };

    saveResultMutation.mutate(resultData);
  };

  // ✅ IMPROVED: AI evaluation with better error handling
  const triggerAIEvaluation = async (testResultId, userId) => {
    try {
      console.log('🤖 Starting AI evaluation for test result:', testResultId);

      // Fetch required data
      const [academicScores, previousResults, profiles] = await Promise.all([
        base44.entities.AcademicScore.filter({ student_id: userId }).catch(() => []),
        base44.entities.TestResult.filter({ 
          user_id: userId,
          test_id: test.id 
        }, '-completed_date', 2).catch(() => []),
        base44.entities.UserProfile.filter({ user_id: userId }).catch(() => [])
      ]);

      const profile = profiles[0];

      console.log('📊 Data collected:', {
        academicScores: academicScores.length,
        previousResults: previousResults.length,
        hasProfile: !!profile
      });

      // Call AI
      const aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Phân tích kết quả trắc nghiệm định hướng nghề nghiệp:

Test: ${test.name} (Version: ${test.version})
Mã test: ${testCode}
Kết quả: ${JSON.stringify(answers)}
Điểm học tập: ${academicScores.length > 0 ? JSON.stringify(academicScores) : 'Không có'}
Thông tin học sinh: ${profile ? JSON.stringify({
  school: profile.school_name,
  grade: profile.grade_level,
  province: profile.province
}) : 'Không có'}
Kết quả lần trước: ${previousResults.length > 1 ? 'Có' : 'Không có'}

Hãy phân tích và đưa ra:
1. Top 3 điểm mạnh cụ thể
2. Top 3 điểm yếu cần cải thiện
3. Top 10 nghề nghiệp phù hợp NHẤT (tên nghề cụ thể, % phù hợp, lý do ngắn gọn)
4. Top 5 tổ hợp môn nên chọn (A00, A01, D01...)
5. 3-5 khuyến nghị cải thiện (có mức độ ưu tiên: high/medium/low)
6. Độ tin cậy phân tích (0-100)`,
        response_json_schema: {
          type: "object",
          properties: {
            strengths: { 
              type: "array", 
              items: { type: "string" },
              description: "Top 3 điểm mạnh"
            },
            weaknesses: { 
              type: "array", 
              items: { type: "string" },
              description: "Top 3 điểm yếu"
            },
            suggested_careers: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  career: { type: "string" },
                  match_percentage: { type: "number" },
                  reason: { type: "string" }
                }
              },
              description: "Top 10 nghề nghiệp phù hợp"
            },
            suggested_subjects: { 
              type: "array", 
              items: { type: "string" },
              description: "Top 5 tổ hợp môn"
            },
            improvement_recommendations: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] }
                }
              },
              description: "3-5 khuyến nghị"
            },
            confidence_score: { 
              type: "number",
              description: "Độ tin cậy 0-100"
            }
          }
        }
      });

      console.log('✅ AI analysis completed:', aiAnalysis);

      // Save AI evaluation
      await base44.entities.AIEvaluation.create({
        student_id: userId,
        evaluation_type: 'test_result',
        entity_id: testResultId,
        input_data: {
          test_result_id: testResultId,
          test_code: testCode,
          test_version: test.version,
          academic_scores: academicScores,
          profile: profile
        },
        analysis: aiAnalysis,
        strengths: aiAnalysis.strengths || [],
        weaknesses: aiAnalysis.weaknesses || [],
        recommendations: aiAnalysis.improvement_recommendations || [],
        suggested_careers: (aiAnalysis.suggested_careers || []).map(c => c.career),
        suggested_subjects: aiAnalysis.suggested_subjects || [],
        confidence_score: aiAnalysis.confidence_score || 75,
        ai_model: 'gpt-4o',
        created_at: new Date().toISOString()
      });

      console.log('✅ AI evaluation saved successfully');

    } catch (error) {
      console.error('❌ AI evaluation error:', error);
      throw error; // Re-throw to be caught by caller
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm('Bạn chưa trả lời hết câu hỏi. Bạn có chắc muốn nộp bài?')) {
        return;
      }
    }
    calculateResult(answers);
  };

  const progress = useMemo(() => {
    return (Object.keys(answers).length / questions.length) * 100;
  }, [answers, questions.length]);

  // ✅ IMPROVED: Loading & Error States
  if (testLoading || questionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">Đang tải bài test...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-bold text-red-900">Không tìm thấy bài test</h3>
            <p className="text-red-700">Bài test không tồn tại hoặc chưa được publish</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ CRITICAL FIX: Show proper message when no questions
  if (questions.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="font-bold text-yellow-900">Bài test chưa sẵn sàng</h3>
            <p className="text-yellow-700">
              {questionsError 
                ? `Lỗi khi tải câu hỏi: ${questionsError.message}`
                : 'Admin cần thêm câu hỏi vào bài test này.'}
            </p>
          </div>
        </div>
        <div className="mt-4 text-sm text-yellow-600">
          <p className="font-medium mb-2">Thông tin bài test:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Tên: {test.name}</li>
            <li>Version: {test.version || 'N/A'}</li>
            <li>Mã test: {testCode}</li>
            <li>Test ID: {test.id}</li>
            <li>Số câu hỏi dự kiến: {test.question_count || 0}</li>
            <li>Số câu hỏi thực tế: {questions.length}</li>
          </ul>
        </div>
        <button
          onClick={() => window.history.back()}
          className="mt-4 bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isAnswered = answers[currentQ?.id] !== undefined;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-600">
            Câu {currentQuestion + 1} / {questions.length}
          </span>
          <span className="text-sm font-medium text-indigo-600">
            {Math.round(progress)}% hoàn thành
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <div className="mb-6">
            <div className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-medium mb-4">
              {currentQ.dimension ? `Nhóm ${currentQ.dimension}` : 'Câu hỏi'}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {currentQ.question_text}
            </h3>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQ.options?.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(currentQ.id, option.score || option.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[currentQ.id] === (option.score || option.value)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQ.id] === (option.score || option.value)
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQ.id] === (option.score || option.value) && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-gray-700">{option.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={previousQuestion}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5" />
          Câu trước
        </button>

        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={saveResultMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg disabled:opacity-50"
          >
            {saveResultMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Xem kết quả
              </>
            )}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            disabled={!isAnswered}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Câu tiếp theo
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}