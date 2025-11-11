import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, ArrowRight, Volume2, VolumeX, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import Breadcrumb from "@/components/Breadcrumb";

// ✅ Custom Confetti with fireworks effect
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
          initial={{ 
            y: -20, 
            x: `${piece.left}vw`, 
            opacity: 1, 
            rotate: 0,
            scale: 1
          }}
          animate={{ 
            y: '120vh', 
            rotate: [0, 180, 360, 540],
            opacity: [1, 1, 0.5, 0],
            scale: [1, 1.2, 0.8, 0.5]
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeIn"
          }}
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

// ✅ 10 câu hỏi
const QUESTIONS = [
  {
    id: 1,
    text: "Tôi hiểu rõ điểm mạnh, điểm yếu và sở thích cá nhân của mình.",
    character: "👨‍🏫",
    characterName: "Thầy Hướng Nghiệp",
    group: "self_awareness"
  },
  {
    id: 2,
    text: "Tôi biết rõ những hoạt động học tập hoặc công việc khiến tôi cảm thấy hứng thú.",
    character: "🎨",
    characterName: "Cô Nghệ Thuật",
    group: "self_awareness"
  },
  {
    id: 3,
    text: "Tôi có thể mô tả loại môi trường học tập/làm việc mà mình mong muốn trong tương lai.",
    character: "👩‍💼",
    characterName: "Chị Tư Vấn",
    group: "career_knowledge"
  },
  {
    id: 4,
    text: "Tôi hiểu các nhóm ngành/nghề khác nhau và yêu cầu học tập của chúng.",
    character: "👨‍🔬",
    characterName: "Anh Khoa Học",
    group: "career_knowledge"
  },
  {
    id: 5,
    text: "Tôi biết tổ hợp môn học nào phù hợp với định hướng nghề nghiệp của bản thân.",
    character: "👩‍🎓",
    characterName: "Cô Giáo Chủ Nhiệm",
    group: "career_knowledge"
  },
  {
    id: 6,
    text: "Tôi cảm thấy tự tin khi ra quyết định về học tập và nghề nghiệp cho mình.",
    character: "💪",
    characterName: "Anh Tự Tin",
    group: "confidence"
  },
  {
    id: 7,
    text: "Tôi biết cách sử dụng kết quả trắc nghiệm Holland (RIASEC) để chọn hướng học phù hợp.",
    character: "📊",
    characterName: "Chị Phân Tích",
    group: "confidence"
  },
  {
    id: 8,
    text: "Sau khi sử dụng nền tảng 'Cửa Sổ Nghề Nghiệp', tôi hiểu rõ hơn về nhóm nghề phù hợp với mình.",
    character: "🚀",
    characterName: "Anh Công Nghệ",
    group: "action_plan"
  },
  {
    id: 9,
    text: "Tôi có kế hoạch cụ thể cho việc học và phát triển bản thân trong 6–12 tháng tới.",
    character: "📅",
    characterName: "Chị Kế Hoạch",
    group: "action_plan"
  },
  {
    id: 10,
    text: "Tôi cảm thấy hứng thú và sẵn sàng chia sẻ kết quả hướng nghiệp với bạn bè hoặc giáo viên.",
    character: "🌟",
    characterName: "Anh Chia Sẻ",
    group: "motivation"
  }
];

export default function CareerSurveyGame() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeWindow, setActiveWindow] = useState(null);
  const [completedWindows, setCompletedWindows] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testType, setTestType] = useState('pre');
  const [showIntro, setShowIntro] = useState(true);
  const [openingWindow, setOpeningWindow] = useState(null);

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
  }, []);

  const handleWindowClick = (questionId) => {
    if (completedWindows.includes(questionId)) return;
    setOpeningWindow(questionId);
    if (soundEnabled) playSound('open');
    
    setTimeout(() => {
      setActiveWindow(questionId);
      setOpeningWindow(null);
    }, 600);
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setCompletedWindows(prev => [...prev, questionId]);
    setActiveWindow(null);
    if (soundEnabled) playSound('select');
  };

  const playSound = (type) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'open') {
        oscillator.frequency.value = 523.25;
        gainNode.gain.value = 0.15;
      } else if (type === 'select') {
        oscillator.frequency.value = 659.25;
        gainNode.gain.value = 0.15;
      } else if (type === 'complete') {
        oscillator.frequency.value = 783.99;
        gainNode.gain.value = 0.25;
      }
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const saveSurveyMutation = useMutation({
    mutationFn: async (surveyData) => {
      return await base44.entities.SurveyResult.create(surveyData);
    },
    onSuccess: (result) => {
      navigate(createPageUrl(`SurveyResult?id=${result.id}`));
    },
    onError: (error) => {
      alert('Lỗi lưu kết quả: ' + error.message);
    }
  });

  useEffect(() => {
    if (completedWindows.length === 10 && !showCelebration) {
      setShowCelebration(true);
      if (soundEnabled) {
        playSound('complete');
        setTimeout(() => playSound('complete'), 200);
        setTimeout(() => playSound('complete'), 400);
      }
      
      setTimeout(() => {
        const groupScores = {
          self_awareness: (answers[1] + answers[2]) / 2,
          career_knowledge: (answers[3] + answers[4] + answers[5]) / 3,
          confidence: (answers[6] + answers[7]) / 2,
          action_plan: (answers[8] + answers[9]) / 2,
          motivation: answers[10]
        };
        
        const overallScore = Object.values(answers).reduce((sum, val) => sum + val, 0) / 10;
        
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
          answers: Object.values(answers),
          group_scores: groupScores,
          overall_score: parseFloat(overallScore.toFixed(2)),
          highest_group: groupNames[sortedGroups[0][0]],
          lowest_group: groupNames[sortedGroups[sortedGroups.length - 1][0]],
          completed_at: new Date().toISOString(),
          duration_seconds: Math.floor((Date.now() - startTime) / 1000),
          test_type: testType
        };
        
        saveSurveyMutation.mutate(surveyData);
      }, 4000);
    }
  }, [completedWindows.length]);

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

          <div className="bg-blue-50 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-lg mb-4 text-gray-900">📋 Hướng dẫn:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">1️⃣</span>
                <span>Click vào từng cửa sổ để gặp nhân vật</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">2️⃣</span>
                <span>Trả lời câu hỏi bằng cách chọn mức độ đồng ý (1-5)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">3️⃣</span>
                <span>Hoàn thành 10 cửa sổ để xem kết quả</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">⏱️</span>
                <span>Thời gian dự kiến: 5-7 phút</span>
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

  const allCompleted = completedWindows.length === 10;

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🏢 Tòa Nhà Hướng Nghiệp</h1>
            <p className="text-gray-600">
              Đã hoàn thành: <strong>{completedWindows.length}/10</strong> cửa sổ
            </p>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6 text-indigo-600" /> : <VolumeX className="w-6 h-6 text-gray-400" />}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedWindows.length / 10) * 100}%` }}
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
              />
            </div>
            <span className="font-bold text-indigo-600">{Math.round((completedWindows.length / 10) * 100)}%</span>
          </div>
        </div>

        {/* ✅ Building with glowing effect when completed */}
        <div className={`relative rounded-3xl p-8 shadow-2xl transition-all duration-1000 ${
          allCompleted 
            ? 'bg-gradient-to-b from-yellow-100 via-orange-100 to-pink-100 shadow-[0_0_60px_rgba(251,191,36,0.6)]' 
            : 'bg-gradient-to-b from-indigo-100 to-purple-100'
        }`}>
          <AnimatePresence>
            {showCelebration && (
              <>
                <CustomConfetti />
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm rounded-3xl"
                >
                  <div className="bg-white rounded-3xl p-12 text-center shadow-2xl max-w-md">
                    <motion.div
                      animate={{ 
                        rotate: [0, 15, -15, 15, 0],
                        scale: [1, 1.1, 1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 0.8,
                        repeat: 3
                      }}
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
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="w-3 h-3 bg-indigo-600 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-3 h-3 bg-purple-600 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-3 h-3 bg-pink-600 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {[4, 3, 2, 1, 0].map((floorIndex) => (
              <div key={floorIndex} className="grid grid-cols-2 gap-6">
                {[0, 1].map((windowIndex) => {
                  const questionIndex = floorIndex * 2 + windowIndex;
                  const question = QUESTIONS[questionIndex];
                  const isCompleted = completedWindows.includes(question.id);
                  const isOpening = openingWindow === question.id;

                  return (
                    <motion.div
                      key={question.id}
                      whileHover={!isCompleted ? { scale: 1.03, y: -5 } : {}}
                      className="relative"
                    >
                      <button
                        onClick={() => handleWindowClick(question.id)}
                        disabled={isCompleted}
                        className={`w-full aspect-square rounded-2xl border-4 transition-all duration-500 relative overflow-hidden ${
                          isCompleted
                            ? 'bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 border-yellow-500 shadow-lg shadow-yellow-400/50 animate-pulse'
                            : isOpening
                            ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400 shadow-xl'
                            : 'bg-gradient-to-br from-blue-100 to-indigo-100 border-indigo-300 hover:border-indigo-500 hover:shadow-xl cursor-pointer'
                        }`}
                      >
                        {/* ✅ Window opening animation */}
                        <AnimatePresence>
                          {isOpening && (
                            <>
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                exit={{ scaleX: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 bg-yellow-200 origin-left"
                              />
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 0.6, times: [0, 0.5, 1] }}
                                className="absolute inset-0 bg-white"
                              />
                            </>
                          )}
                        </AnimatePresence>

                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div 
                            className="text-6xl"
                            animate={isCompleted ? {
                              scale: [1, 1.2, 1],
                              rotate: [0, 10, -10, 0]
                            } : {}}
                            transition={{ duration: 0.5 }}
                          >
                            {isCompleted ? '✨' : isOpening ? '💫' : '🪟'}
                          </motion.div>
                        </div>

                        {/* ✅ Glowing effect for completed */}
                        {isCompleted && (
                          <>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2 shadow-lg"
                            >
                              <Trophy className="w-5 h-5" />
                            </motion.div>
                            <motion.div
                              animate={{ 
                                opacity: [0.3, 0.7, 0.3],
                                scale: [1, 1.05, 1]
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: Infinity
                              }}
                              className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-2xl"
                            />
                          </>
                        )}

                        {/* Lightning bolt effect when opening */}
                        {isOpening && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Zap className="w-20 h-20 text-yellow-400" />
                          </motion.div>
                        )}

                        <div className="absolute bottom-2 left-2 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center font-bold text-indigo-600 shadow-md">
                          {question.id}
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around py-8">
            {[5, 4, 3, 2, 1].map((floor) => (
              <div key={floor} className="text-xs font-bold text-indigo-600 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                T{floor}
              </div>
            ))}
          </div>
        </div>

        {/* Question Modal */}
        <AnimatePresence>
          {activeWindow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setActiveWindow(null)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 50, rotateX: -15 }}
                animate={{ scale: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.8, y: 50, rotateX: 15 }}
                transition={{ type: "spring", duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
              >
                <motion.div 
                  className="text-center mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="text-8xl mb-4"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {QUESTIONS[activeWindow - 1].character}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {QUESTIONS[activeWindow - 1].characterName}
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {QUESTIONS[activeWindow - 1].text}
                  </p>
                </motion.div>

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
                        onClick={() => handleAnswer(activeWindow, value)}
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="aspect-square rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-3xl hover:from-purple-600 hover:to-indigo-500 transition-all shadow-lg hover:shadow-2xl"
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}