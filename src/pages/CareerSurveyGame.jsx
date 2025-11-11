import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, ArrowRight, Volume2, VolumeX, Lock, Lightbulb, RotateCcw, Save, Heart, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import Breadcrumb from "@/components/Breadcrumb";

// ✅ Enhanced Confetti
const CustomConfetti = () => {
  const confettiPieces = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ['#4F46E5', '#9333EA', '#EC4899', '#F59E0B', '#10B981', '#FBBF24'][Math.floor(Math.random() * 6)],
    size: 8 + Math.random() * 8
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -20, x: `${piece.left}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ 
            y: '120vh', 
            rotate: [0, 180, 360, 540],
            opacity: [1, 1, 0.5, 0],
            scale: [1, 1.2, 0.8, 0.5]
          }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "easeIn" }}
          className="absolute rounded-full"
          style={{ 
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            boxShadow: `0 0 20px ${piece.color}`
          }}
        />
      ))}
    </div>
  );
};

// ✅ 10 câu hỏi với hints
const QUESTIONS = [
  {
    id: 1,
    text: "Tôi hiểu rõ điểm mạnh, điểm yếu và sở thích cá nhân của mình.",
    character: "👨‍🏫",
    characterName: "Thầy Hướng Nghiệp",
    group: "self_awareness",
    hint: "Hãy nghĩ về những việc bạn làm tốt nhất và những gì bạn thích làm trong thời gian rảnh."
  },
  {
    id: 2,
    text: "Tôi biết rõ những hoạt động học tập hoặc công việc khiến tôi cảm thấy hứng thú.",
    character: "🎨",
    characterName: "Cô Nghệ Thuật",
    group: "self_awareness",
    hint: "Môn học nào khiến bạn cảm thấy hào hứng? Hoạt động ngoại khóa nào bạn mong chờ?"
  },
  {
    id: 3,
    text: "Tôi có thể mô tả loại môi trường học tập/làm việc mà mình mong muốn trong tương lai.",
    character: "👩‍💼",
    characterName: "Chị Tư Vấn",
    group: "career_knowledge",
    hint: "Bạn thích làm việc một mình hay theo nhóm? Trong văn phòng hay ngoài trời?"
  },
  {
    id: 4,
    text: "Tôi hiểu các nhóm ngành/nghề khác nhau và yêu cầu học tập của chúng.",
    character: "👨‍🔬",
    characterName: "Anh Khoa Học",
    group: "career_knowledge",
    hint: "Bạn có biết ngành Y cần học gì? Ngành IT cần kỹ năng gì không?"
  },
  {
    id: 5,
    text: "Tôi biết tổ hợp môn học nào phù hợp với định hướng nghề nghiệp của bản thân.",
    character: "👩‍🎓",
    characterName: "Cô Giáo Chủ Nhiệm",
    group: "career_knowledge",
    hint: "Tổ hợp A00, B00, C00... bạn đã tìm hiểu chưa?"
  },
  {
    id: 6,
    text: "Tôi cảm thấy tự tin khi ra quyết định về học tập và nghề nghiệp cho mình.",
    character: "💪",
    characterName: "Anh Tự Tin",
    group: "confidence",
    hint: "Khi phải chọn hướng đi, bạn cảm thấy chắc chắn hay còn phân vân?"
  },
  {
    id: 7,
    text: "Tôi biết cách sử dụng kết quả trắc nghiệm Holland (RIASEC) để chọn hướng học phù hợp.",
    character: "📊",
    characterName: "Chị Phân Tích",
    group: "confidence",
    hint: "RIASEC giúp xác định nhóm nghề phù hợp với tính cách bạn."
  },
  {
    id: 8,
    text: "Sau khi sử dụng nền tảng 'Cửa Sổ Nghề Nghiệp', tôi hiểu rõ hơn về nhóm nghề phù hợp với mình.",
    character: "🚀",
    characterName: "Anh Công Nghệ",
    group: "action_plan",
    hint: "Nền tảng đã giúp bạn khám phá điều gì mới về bản thân?"
  },
  {
    id: 9,
    text: "Tôi có kế hoạch cụ thể cho việc học và phát triển bản thân trong 6–12 tháng tới.",
    character: "📅",
    characterName: "Chị Kế Hoạch",
    group: "action_plan",
    hint: "Bạn có mục tiêu rõ ràng cho năm học tới không?"
  },
  {
    id: 10,
    text: "Tôi cảm thấy hứng thú và sẵn sàng chia sẻ kết quả hướng nghiệp với bạn bè hoặc giáo viên.",
    character: "🌟",
    characterName: "Anh Chia Sẻ",
    group: "motivation",
    hint: "Chia sẻ giúp bạn nhận được góp ý và động viên từ mọi người."
  }
];

export default function CareerSurveyGame() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testType, setTestType] = useState('pre');
  const [showIntro, setShowIntro] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [reactions, setReactions] = useState({});
  const [savedProgress, setSavedProgress] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log('User not logged in');
      }
    };
    fetchUser();
    setStartTime(Date.now());
    
    // Load saved progress
    const saved = localStorage.getItem('survey_progress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSavedProgress(data);
      } catch (error) {
        console.error('Error parsing saved progress:', error);
        localStorage.removeItem('survey_progress');
      }
    }
  }, []);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Emoji reaction based on answer
    const reactionEmojis = {
      1: "😟",
      2: "😐", 
      3: "🙂",
      4: "😊",
      5: "🤩"
    };
    setReactions(prev => ({ ...prev, [questionId]: reactionEmojis[value] }));
    
    if (soundEnabled) playSound('select');
    
    // Auto-save progress
    saveProgress(questionId, value);
    
    // Move to next question after animation
    setTimeout(() => {
      if (questionId < 10) {
        setCurrentQuestion(questionId + 1);
        setShowHint(false); // Reset hint for next question
      } else {
        // All done
        setShowCelebration(true);
        if (soundEnabled) {
          playSound('complete');
          setTimeout(() => playSound('complete'), 200);
          setTimeout(() => playSound('complete'), 400);
        }
        
        setTimeout(() => {
          calculateAndSave();
        }, 4000);
      }
    }, 800);
  };

  const handleUndo = () => {
    if (currentQuestion > 1) {
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      const newAnswers = { ...answers };
      delete newAnswers[currentQuestion];
      setAnswers(newAnswers);
      setShowHint(false);
      if (soundEnabled) playSound('undo');
    }
  };

  const saveProgress = (questionId, value) => {
    try {
      const progress = {
        answers: { ...answers, [questionId]: value },
        currentQuestion: questionId < 10 ? questionId + 1 : questionId,
        testType,
        timestamp: Date.now()
      };
      localStorage.setItem('survey_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const loadSavedProgress = () => {
    if (savedProgress && savedProgress.answers) {
      setAnswers(savedProgress.answers);
      setCurrentQuestion(savedProgress.currentQuestion || 1);
      setTestType(savedProgress.testType || 'pre');
      setSavedProgress(null);
      localStorage.removeItem('survey_progress');
    }
  };

  const playSound = (type) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'select') {
        oscillator.frequency.value = 659.25;
        gainNode.gain.value = 0.15;
      } else if (type === 'complete') {
        oscillator.frequency.value = 783.99;
        gainNode.gain.value = 0.25;
      } else if (type === 'undo') {
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.1;
      }
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const calculateAndSave = () => {
    try {
      // ✅ FIX: Ensure all answers exist and are valid numbers
      const validAnswers = {};
      for (let i = 1; i <= 10; i++) {
        if (answers[i] && typeof answers[i] === 'number' && !isNaN(answers[i])) {
          validAnswers[i] = answers[i];
        } else {
          console.warn(`Missing or invalid answer for question ${i}`);
          // Don't proceed if any answer is missing
          alert(`Vui lòng trả lời đầy đủ tất cả 10 câu hỏi. Câu ${i} chưa có câu trả lời hợp lệ.`);
          return;
        }
      }

      // Calculate group scores with null safety
      const groupScores = {
        self_awareness: ((validAnswers[1] || 0) + (validAnswers[2] || 0)) / 2,
        career_knowledge: ((validAnswers[3] || 0) + (validAnswers[4] || 0) + (validAnswers[5] || 0)) / 3,
        confidence: ((validAnswers[6] || 0) + (validAnswers[7] || 0)) / 2,
        action_plan: ((validAnswers[8] || 0) + (validAnswers[9] || 0)) / 2,
        motivation: validAnswers[10] || 0
      };
      
      // Calculate overall score
      const answerValues = Object.values(validAnswers);
      const sum = answerValues.reduce((acc, val) => acc + val, 0);
      const overallScore = sum / 10;
      
      // ✅ FIX: Add validation
      if (isNaN(overallScore) || overallScore === null || overallScore === undefined) {
        console.error('Invalid overall score:', overallScore);
        alert('Lỗi tính điểm. Vui lòng thử lại.');
        return;
      }
      
      const groupNames = {
        self_awareness: "Nhận thức bản thân",
        career_knowledge: "Hiểu biết nghề nghiệp",
        confidence: "Tự tin & ra quyết định",
        action_plan: "Kế hoạch hành động",
        motivation: "Lan tỏa & cảm hứng"
      };
      
      const sortedGroups = Object.entries(groupScores).sort((a, b) => b[1] - a[1]);
      
      const surveyData = {
        user_id: currentUser?.id || 'guest',
        student_name: currentUser?.full_name || 'Học sinh',
        answers: answerValues,
        group_scores: groupScores,
        overall_score: parseFloat(overallScore.toFixed(2)),
        highest_group: groupNames[sortedGroups[0][0]],
        lowest_group: groupNames[sortedGroups[sortedGroups.length - 1][0]],
        completed_at: new Date().toISOString(),
        duration_seconds: Math.floor((Date.now() - startTime) / 1000),
        test_type: testType
      };
      
      console.log('Saving survey data:', surveyData);
      saveSurveyMutation.mutate(surveyData);
    } catch (error) {
      console.error('Error calculating results:', error);
      alert('Có lỗi xảy ra khi tính kết quả. Vui lòng thử lại.');
    }
  };

  const saveSurveyMutation = useMutation({
    mutationFn: async (surveyData) => {
      return await base44.entities.SurveyResult.create(surveyData);
    },
    onSuccess: (result) => {
      localStorage.removeItem('survey_progress');
      navigate(createPageUrl(`SurveyResult?id=${result.id}`));
    },
    onError: (error) => {
      console.error('Save error:', error);
      alert('Lỗi lưu kết quả: ' + error.message);
    }
  });

  const breadcrumbItems = [
    { label: "Game Khảo Sát Hướng Nghiệp" }
  ];

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 md:p-12 max-w-2xl shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🏢 Tòa Nhà Hướng Nghiệp</h1>
            <p className="text-xl text-gray-600 mb-6">
              Khám phá 10 cửa sổ để tìm hiểu về bản thân và nghề nghiệp!
            </p>
          </div>

          {savedProgress && savedProgress.answers && Object.keys(savedProgress.answers).length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Save className="w-6 h-6 text-yellow-600" />
                <h3 className="font-bold text-yellow-900">Tiếp tục bài làm trước?</h3>
              </div>
              <p className="text-sm text-yellow-800 mb-4">
                Bạn đã trả lời {Object.keys(savedProgress.answers).length}/10 câu. 
                Tiếp tục từ câu {savedProgress.currentQuestion || 1}?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={loadSavedProgress}
                  className="flex-1 bg-yellow-600 text-white py-2 rounded-xl font-medium hover:bg-yellow-700"
                >
                  Tiếp tục
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('survey_progress');
                    setSavedProgress(null);
                  }}
                  className="flex-1 border-2 border-yellow-600 text-yellow-600 py-2 rounded-xl font-medium hover:bg-yellow-50"
                >
                  Làm mới
                </button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-lg mb-4 text-gray-900">✨ Tính năng mới:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                <span><strong>Gợi ý thông minh:</strong> Nhấn 💡 để xem hint</span>
              </li>
              <li className="flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600 mt-0.5" />
                <span><strong>Hoàn tác:</strong> Quay lại câu trước nếu muốn</span>
              </li>
              <li className="flex items-start gap-2">
                <Save className="w-4 h-4 text-blue-600 mt-0.5" />
                <span><strong>Lưu tự động:</strong> Thoát ra vẫn giữ tiến độ</span>
              </li>
              <li className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-blue-600 mt-0.5" />
                <span><strong>Phản hồi ngay:</strong> Emoji theo câu trả lời</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5" />
                <span><strong>Làm tuần tự:</strong> Từng câu một, tập trung hơn</span>
              </li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại khảo sát:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTestType('pre')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  testType === 'pre' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                }`}
              >
                <div className="font-bold mb-1">🌱 Pre-test</div>
                <div className="text-xs">Khảo sát đầu vào</div>
              </button>
              <button
                onClick={() => setTestType('post')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  testType === 'post' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                }`}
              >
                <div className="font-bold mb-1">🎯 Post-test</div>
                <div className="text-xs">Khảo sát sau trải nghiệm</div>
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowIntro(false)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            Bắt đầu khám phá
            <ArrowRight className="w-6 h-6" />
          </button>
        </motion.div>
      </div>
    );
  }

  const totalAnswered = Object.keys(answers).length;
  const currentQ = QUESTIONS[currentQuestion - 1];

  // ✅ Safety check
  if (!currentQ) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Đang tải câu hỏi...</p>
          <button
            onClick={() => setCurrentQuestion(1)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl"
          >
            Quay lại câu 1
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        {/* Header with controls */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🏢 Tòa Nhà Hướng Nghiệp</h1>
            <p className="text-gray-600">
              Câu <strong>{currentQuestion}/10</strong> • Đã trả lời: <strong>{totalAnswered}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {currentQuestion > 1 && (
              <button
                onClick={handleUndo}
                className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <RotateCcw className="w-5 h-5 text-orange-600" />
                <span className="hidden md:inline">Quay lại</span>
              </button>
            )}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
            >
              {soundEnabled ? <Volume2 className="w-6 h-6 text-indigo-600" /> : <VolumeX className="w-6 h-6 text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Enhanced Progress Bar with mini previews */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(totalAnswered / 10) * 100}%` }}
                className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
              />
            </div>
            <span className="font-bold text-indigo-600 text-lg">{Math.round((totalAnswered / 10) * 100)}%</span>
          </div>
          
          {/* Mini question tracker */}
          <div className="flex gap-2 justify-center flex-wrap">
            {QUESTIONS.map((q) => (
              <div
                key={q.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  answers[q.id] ? 'bg-green-500 text-white scale-110' :
                  q.id === currentQuestion ? 'bg-indigo-600 text-white animate-pulse' :
                  q.id < currentQuestion ? 'bg-gray-300 text-gray-600' :
                  'bg-gray-100 text-gray-400 opacity-50'
                }`}
              >
                {answers[q.id] ? '✓' : q.id}
              </div>
            ))}
          </div>
        </div>

        {/* Main Question Card - Centered */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {showCelebration ? (
              <motion.div
                key="celebration"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
              >
                <CustomConfetti />
                <div className="bg-white rounded-3xl p-12 text-center shadow-2xl max-w-md">
                  <motion.div
                    animate={{ 
                      rotate: [0, 15, -15, 15, 0],
                      scale: [1, 1.1, 1, 1.1, 1]
                    }}
                    transition={{ duration: 0.8, repeat: 3 }}
                  >
                    <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    🎉 Xuất sắc!
                  </h2>
                  <p className="text-xl text-gray-600 mb-2">
                    Bạn đã hoàn thành khảo sát!
                  </p>
                  <p className="text-gray-500 text-sm">Đang tính toán kết quả của bạn...</p>
                  <div className="mt-6 flex justify-center gap-2">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-3 h-3 bg-indigo-600 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-3 h-3 bg-purple-600 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-3 h-3 bg-pink-600 rounded-full" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 100, rotateY: -15 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -100, rotateY: 15 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-indigo-100"
              >
                {/* Character */}
                <motion.div 
                  className="text-center mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="text-9xl mb-4"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {currentQ.character}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentQ.characterName}
                  </h3>
                  <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-medium mb-4">
                    Câu {currentQuestion}/10
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
                    {currentQ.text}
                  </p>
                </motion.div>

                {/* Hint button */}
                <div className="flex justify-center mb-6">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-xl transition-all text-sm font-medium"
                  >
                    <Lightbulb className="w-4 h-4" />
                    {showHint ? 'Ẩn gợi ý' : 'Hiện gợi ý'}
                  </button>
                </div>

                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6"
                    >
                      <p className="text-sm text-yellow-800">
                        💡 <strong>Gợi ý:</strong> {currentQ.hint}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Answer buttons */}
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-center text-sm text-gray-600 mb-4 font-medium">
                    Chọn mức độ đồng ý của bạn:
                  </p>
                  <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <motion.button
                        key={value}
                        onClick={() => handleAnswer(currentQuestion, value)}
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className={`aspect-square rounded-2xl font-bold text-3xl transition-all shadow-lg hover:shadow-2xl ${
                          value === 1 ? 'bg-gradient-to-br from-red-400 to-red-600 text-white' :
                          value === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                          value === 3 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                          value === 4 ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
                          'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        }`}
                      >
                        {value}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 px-2 pt-2">
                    <span>Rất không đồng ý</span>
                    <span className="font-medium">Trung lập</span>
                    <span>Rất đồng ý</span>
                  </div>
                </motion.div>

                {/* Real-time reaction */}
                {reactions[currentQuestion - 1] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mt-6 text-6xl"
                  >
                    {reactions[currentQuestion - 1]}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Locked windows preview */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-center text-sm font-medium text-gray-500 mb-4">Các câu tiếp theo:</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 justify-center">
            {QUESTIONS.filter(q => q.id > currentQuestion && q.id <= currentQuestion + 3).map((q) => (
              <div
                key={q.id}
                className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center opacity-50"
              >
                <Lock className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Câu {q.id}</span>
                <span className="text-2xl">{q.character}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}