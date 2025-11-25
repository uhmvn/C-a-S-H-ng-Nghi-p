import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, User, Brain, Lightbulb, TrendingUp, Target, Heart, PartyPopper, Zap, Maximize2, Minimize2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MessageFormatter from "@/components/MessageFormatter";
import SmartSuggestions from "@/components/SmartSuggestions";
import useStudentContext from "@/components/hooks/useStudentContext";
import useChatPersistence from "@/components/hooks/useChatPersistence";
import { buildAIContext, buildConversationHistory } from "@/components/utils/buildAIContext";
import SessionHistory from "@/components/chat/SessionHistory";
import useSessionHistory from "@/components/hooks/useSessionHistory";
import { buildEnhancedPrompt, shouldUseInternetContext } from "@/components/utils/enhancedAIPrompts";
import useProgressTracking from "@/components/hooks/useProgressTracking";
import ProgressAlert from "@/components/chat/ProgressAlert";
import { buildProgressContext, generateProactiveSuggestions } from "@/components/utils/smartAnalysis";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [journeyId, setJourneyId] = useState(null);
  const [studentJourney, setStudentJourney] = useState(null);
  
  // ✨ NEW: Use custom hooks for comprehensive data & persistence
  const { context: fullContext, isLoading: contextLoading } = useStudentContext(currentUser, isOpen);
  const { saveInsights, updateJourney: saveJourney, saveSession, closeSession } = useChatPersistence(sessionId, journeyId, userProfile);
  const { sessions, isLoading: sessionsLoading, deleteSession } = useSessionHistory(currentUser?.id, isOpen);
  const { progressData, alerts, isLoading: progressLoading } = useProgressTracking(currentUser?.id, userProfile, extractedInsights, isOpen);
  const [conversationPhase, setConversationPhase] = useState('greeting');
  const [clarityScore, setClarityScore] = useState(0);
  const [lastCelebration, setLastCelebration] = useState(0);
  const [extractedInsights, setExtractedInsights] = useState({
    interests: [],
    goals: [],
    concerns: [],
    favorite_subjects: [],
    personality_traits: [],
    values: []
  });
  const messagesEndRef = useRef(null);

  const debouncedInsights = useDebounce(extractedInsights, 2000);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ ENHANCED: Use new persistence hook
  useEffect(() => {
    if (journeyId && messages.length > 1 && (debouncedInsights.interests.length > 0 || debouncedInsights.goals.length > 0)) {
      console.log('🔄 Auto-saving insights...', debouncedInsights);
      saveInsights(debouncedInsights);
    }
  }, [debouncedInsights, journeyId, messages.length, saveInsights]);

  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        let prof = null;
        if (user) {
          const profs = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profs?.length > 0) {
            prof = profs[0];
            setUserProfile(prof);

            if (prof.role === 'student') {
              // Journey setup
              const journeys = await base44.entities.StudentJourney.filter({ user_id: user.id });
              let journey = null;

              if (journeys && journeys.length > 0) {
                journey = journeys[0];
                setStudentJourney(journey);
                setJourneyId(journey.id);
                setClarityScore(journey.current_clarity_score || 0);
                setLastCelebration(journey.current_clarity_score || 0);

                if (journey.key_insights) {
                  setExtractedInsights({
                    interests: journey.key_insights.interests || [],
                    goals: journey.key_insights.goals || [],
                    concerns: journey.key_insights.concerns || [],
                    favorite_subjects: journey.key_insights.favorite_subjects || [],
                    personality_traits: journey.key_insights.personality_traits || [],
                    values: journey.key_insights.values || []
                  });
                }
              } else {
                const newJourney = await base44.entities.StudentJourney.create({
                  student_id: prof.id,
                  user_id: user.id,
                  journey_start_date: new Date().toISOString(),
                  current_clarity_score: 0,
                  current_emotional_state: 'curious',
                  milestones: [],
                  interest_evolution: [],
                  goal_evolution: [],
                  conversation_count: 0,
                  total_insights_collected: 0,
                  key_insights: {}
                });
                console.log('✅ Created new journey:', newJourney.id);
                setStudentJourney(newJourney);
                setJourneyId(newJourney.id);
              }

              // Session setup - check for uncompleted sessions first
              const existingSessions = await base44.entities.AICounselingSession.filter(
                { user_id: user.id, is_completed: false },
                '-session_date',
                1
              );

              let activeSession;
              if (existingSessions && existingSessions.length > 0) {
                // Continue existing session
                activeSession = existingSessions[0];
                console.log('🔄 Continuing session:', activeSession.id);
                
                // Load conversation history
                if (activeSession.conversation_history?.length > 0) {
                  const loadedMessages = activeSession.conversation_history.map((msg, idx) => ({
                    id: Date.now() + idx,
                    text: msg.content,
                    sender: msg.role === 'user' ? 'user' : 'bot',
                    timestamp: new Date(msg.timestamp)
                  }));
                  setMessages([
                    { id: 1, text: getGreeting(user, prof), sender: "bot", timestamp: new Date() },
                    ...loadedMessages
                  ]);
                }

                // Restore context
                if (activeSession.student_context?.clarity) {
                  setClarityScore(activeSession.student_context.clarity);
                }
              } else {
                // Create new session
                activeSession = await base44.entities.AICounselingSession.create({
                  user_id: user.id,
                  student_profile_id: prof.id,
                  session_date: new Date().toISOString(),
                  conversation_history: [],
                  student_context: { started: true, clarity: 0 },
                  counselor_type: 'ai_chat',
                  is_completed: false,
                  tags: ['ai_companion', 'active'],
                  student_interests: [],
                  student_goals: []
                });
                console.log('✅ Created new session:', activeSession.id);
              }

              setSessionId(activeSession.id);
            }
          }
        }

        // Only set greeting if not already loaded from session
        if (messages.length === 0) {
          setMessages([{ id: 1, text: getGreeting(user, prof), sender: "bot", timestamp: new Date() }]);
        }
      } catch (err) {
        console.error('Init error:', err);
        setMessages([{
          id: 1,
          text: "Xin chào! 👋 Mình là AI Cố Vấn Đồng Hành.\n\n🎓 Tư vấn hướng nghiệp cho học sinh.\n\nĐăng nhập để bắt đầu hành trình! 😊",
          sender: "bot",
          timestamp: new Date()
        }]);
      }
    };
    init();
  }, [isOpen]);

  const getGreeting = (u, p) => {
    if (!u || !p) return "Xin chào! 👋 Mình là AI Cố Vấn Đồng Hành.\n\nMình sẽ lắng nghe, hiểu và đồng hành cùng em khám phá tương lai. Sẵn sàng chưa? 😊";

    const n = u.full_name?.split(' ').slice(-1)[0] || 'em';

    if (p.role === 'student') {
      // ✅ ENHANCED: Use fullContext from hook
      const journey = fullContext?.journey;
      
      if (journey?.conversation_count > 0) {
        const lastInterest = journey.key_insights?.interests?.[0];
        const clarity = journey.current_clarity_score || 0;

        if (clarity >= 70) {
          return `Chào lại ${n}! 🌟\n\nMình thấy em đã rõ ràng hơn rất nhiều (${clarity}%)! Tuyệt vời!\n\nHôm nay em muốn trao đổi thêm về điều gì? 😊`;
        }

        return `Chào lại ${n}! 👋\n\nMình nhớ lần trước chúng ta nói về ${lastInterest || 'định hướng'}.\n\nHôm nay em có suy nghĩ gì mới không? 🌟`;
      }

      return `Chào em ${n}! 🎓\n\nMình là AI Cố Vấn - người bạn đồng hành trong hành trình khám phá bản thân.\n\n✨ Mình sẽ:\n💭 Lắng nghe suy nghĩ, cảm xúc của em\n🎯 Giúp em tìm ước mơ, mục tiêu\n💪 Khám phá điểm mạnh, điểm yếu\n🌈 Hiểu giá trị sống của em\n\nKhông vội, từ từ em kể cho mình nghe nhé. Em đang băn khoăn điều gì? 😊`;
    }

    return `Chào ${n}! 👋 Mình là AI Cố Vấn Đồng Hành.`;
  };

  // ✅ REMOVED: Old functions replaced by hooks
  
  const handleClose = async () => {
    if (sessionId && messages.length > 1) {
      await closeSession(messages);
    }
    setIsOpen(false);
    setIsFullscreen(false);
  };

  const celebrate = useCallback((newClarity) => {
    const milestones = [25, 50, 75, 90];
    const hitMilestone = milestones.find(m => lastCelebration < m && newClarity >= m);

    if (hitMilestone) {
      setLastCelebration(newClarity);

      const celebrations = {
        25: "🎉 Tuyệt vời! Em đã bắt đầu hiểu rõ bản thân hơn rồi!",
        50: "🎊 Xuất sắc! Em đã đi được nửa chặng đường!",
        75: "🏆 Tuyệt vời quá! Em đã rất rõ ràng về hướng đi!",
        90: "⭐ Amazing! Em đã tự tin và sẵn sàng cho tương lai!"
      };

      setTimeout(() => {
        setMessages(p => [...p, {
          id: Date.now() + 999,
          text: celebrations[hitMilestone],
          sender: "bot",
          timestamp: new Date(),
          isCelebration: true
        }]);
      }, 1000);
    }
  }, [lastCelebration]);

  const createAIEvaluation = async (insights, fullMessages, clarity, emotionalStateParam) => {
    if (!currentUser || !userProfile) return;

    try {
      console.log('📊 Creating AI evaluation...');
      const analysisPrompt = `Tạo đánh giá TOÀN DIỆN:

JOURNEY:
- Clarity: ${clarity}%
- Insights: ${JSON.stringify(insights)}
- Scores: ${context?.scores?.map(s => `${s.subject_name}:${s.average_score}`).join(', ') || 'N/A'}
- Messages: ${fullMessages.length}

JSON phân tích:
{
  "strengths": ["3-5 điểm mạnh"],
  "weaknesses": ["2-3 cần cải thiện"],
  "suggested_careers": [
    {"career": "Tên", "match_percentage": 90, "reason": "Lý do"}
  ],
  "suggested_subjects": ["Môn focus"],
  "confidence_score": 80,
  "recommendations": [
    {"title": "Khuyến nghị", "description": "Chi tiết", "priority": "high"}
  ],
  "analysis": {
    "journey_summary": "Từ confused -> clarity",
    "growth_observed": "Sự phát triển",
    "next_steps": ["Bước tiếp theo"],
    "suggested_careers": [{"career": "X", "match_percentage": 85, "reason": "..."}]
  }
}`;

      const evalResult = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            suggested_careers: { type: "array" },
            suggested_subjects: { type: "array", items: { type: "string" } },
            confidence_score: { type: "number" },
            recommendations: { type: "array" },
            analysis: { type: "object" }
          }
        }
      });

      await base44.entities.AIEvaluation.create({
        student_id: userProfile.id,
        evaluation_type: 'career_path',
        input_data: {
          journey_clarity: clarity,
          insights: insights,
          conversation_length: fullMessages.length,
          emotional_state: emotionalStateParam
        },
        analysis: evalResult.analysis || {},
        strengths: evalResult.strengths || [],
        weaknesses: evalResult.weaknesses || [],
        recommendations: evalResult.recommendations || [],
        suggested_careers: (evalResult.suggested_careers || []).map(c => c.career || c),
        suggested_subjects: evalResult.suggested_subjects || [],
        confidence_score: evalResult.confidence_score || clarity,
        ai_model: 'gpt-4o-mini-journey'
      });

      console.log('✅ AI Evaluation created');

      setTimeout(() => {
        setMessages(p => [...p, {
          id: Date.now() + 997,
          text: "✅ Mình đã tạo bản đánh giá toàn diện cho em!\n\nEm có thể xem chi tiết trong Hồ Sơ → Tab Tests 😊",
          sender: "bot",
          timestamp: new Date()
        }]);
      }, 1500);

    } catch (evalErr) {
      console.error('❌ Evaluation error:', evalErr);
    }
  };

  const send = async () => {
    if (!inputText.trim()) return;

    const uMsg = { id: Date.now(), text: inputText, sender: "user", timestamp: new Date() };
    setMessages(p => [...p, uMsg]);
    const txt = inputText;
    setInputText("");
    setIsTyping(true);

    try {
      const insightPrompt = `Phân tích SÂU câu trả lời:

"${txt}"

Trích xuất JSON (CHỈ JSON):
{
  "interests": ["sở thích, hobbies"],
  "goals": ["mục tiêu, ước mơ nghề nghiệp"],
  "concerns": ["lo lắng, băn khoăn"],
  "favorite_subjects": ["môn học yêu thích"],
  "personality_traits": ["tính cách: nhân ái, sáng tạo, lý trí..."],
  "values": ["giá trị sống: gia đình, tự do, ý nghĩa..."],
  "emotional_state": "confused/curious/anxious/excited/confident/determined",
  "clarity_level": 0-100,
  "key_phrases": ["câu nói quan trọng"]
}`;

      let newInsights = { ...extractedInsights };
      let newClarity = clarityScore;
      let emotionalState = 'curious';
      let hasNewInsights = false;

      try {
        const insightRes = await base44.integrations.Core.InvokeLLM({
          prompt: insightPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              interests: { type: "array", items: { type: "string" } },
              goals: { type: "array", items: { type: "string" } },
              concerns: { type: "array", items: { type: "string" } },
              favorite_subjects: { type: "array", items: { type: "string" } },
              personality_traits: { type: "array", items: { type: "string" } },
              values: { type: "array", items: { type: "string" } },
              emotional_state: { type: "string" },
              clarity_level: { type: "number" },
              key_phrases: { type: "array", items: { type: "string" } }
            }
          }
        });

        const mergeArrays = (old, newArr) => [...new Set([...old, ...(newArr || [])])];

        const beforeCount = Object.values(newInsights).reduce((sum, arr) => sum + arr.length, 0);

        newInsights = {
          interests: mergeArrays(newInsights.interests, insightRes.interests),
          goals: mergeArrays(newInsights.goals, insightRes.goals),
          concerns: mergeArrays(newInsights.concerns, insightRes.concerns),
          favorite_subjects: mergeArrays(newInsights.favorite_subjects, insightRes.favorite_subjects),
          personality_traits: mergeArrays(newInsights.personality_traits, insightRes.personality_traits),
          values: mergeArrays(newInsights.values, insightRes.values)
        };

        const afterCount = Object.values(newInsights).reduce((sum, arr) => sum + arr.length, 0);
        hasNewInsights = afterCount > beforeCount;

        console.log(`📊 Insights: ${beforeCount} -> ${afterCount}`, newInsights);

        if (typeof insightRes.clarity_level === 'number') {
          const oldWeight = messages.length > 5 ? 0.7 : 0.5;
          newClarity = Math.round(clarityScore * oldWeight + insightRes.clarity_level * (1 - oldWeight));
          console.log(`📈 Clarity: ${clarityScore}% -> ${newClarity}%`);
          setClarityScore(newClarity);
          celebrate(newClarity);
        }

        emotionalState = insightRes.emotional_state || 'curious';

        setExtractedInsights(newInsights);
      } catch (insightErr) {
        console.log('⚠️ Insight extraction skipped');
      }

      // ✅ ENHANCED: Use enhanced prompts with progress analysis
      let prompt = buildEnhancedPrompt(txt, fullContext, newInsights, messages, newClarity);
      
      // Add progress context
      if (progressData) {
        const progressCtx = buildProgressContext(progressData, alerts, newInsights);
        prompt = prompt.replace('TRẢ LỜI:', `${progressCtx}\n\nTRẢ LỜI:`);
      }

      const useInternet = shouldUseInternetContext(txt, newClarity);
      console.log('🌍 Using internet context:', useInternet);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: useInternet
      });

      const bMsg = { id: Date.now() + 1, text: response, sender: "bot", timestamp: new Date() };
      setMessages(p => [...p, bMsg]);

      if (newClarity < 40) setConversationPhase('discovery');
      else if (newClarity < 70) setConversationPhase('exploration');
      else setConversationPhase('recommendation');

      const newMessages = [...messages, uMsg, bMsg];

      // ✅ ENHANCED: Use new persistence hooks
      if (hasNewInsights) {
        console.log('🔄 Has new insights, updating journey...');
        const updatedJourney = await saveJourney(newInsights, newClarity, emotionalState, newMessages);
        if (updatedJourney) {
          setStudentJourney(prev => ({ ...prev, ...updatedJourney }));
        }
      }

      if (newMessages.length % 3 === 0) {
        console.log('💾 Auto-save every 3 messages...');
        await saveSession(newMessages, newInsights, newClarity, conversationPhase);
      }

      if (messages.length === 15) {
        setTimeout(() => {
          setMessages(p => [...p, {
            id: Date.now() + 998,
            text: "🌟 Chúng ta đã nói chuyện khá nhiều!\n\nEm thấy mình đã thay đổi hoặc hiểu rõ hơn điều gì? 💭",
            sender: "bot",
            timestamp: new Date(),
            isReflection: true
          }]);
        }, 2000);
      }

      if (newMessages.length >= 12 && newClarity > 60 && newInsights.interests.length > 0) {
        console.log('📊 Creating comprehensive evaluation...');
        createAIEvaluation(newInsights, newMessages, newClarity, emotionalState);
      }

    } catch (err) {
      console.error('❌ Chat error:', err);
      setMessages(p => [...p, {
        id: Date.now() + 1,
        text: "Xin lỗi em 🔧\n\n📞 (0254) 3.826.178",
        sender: "bot",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const chatWindowClass = isFullscreen
    ? "fixed inset-4 md:inset-8 w-auto h-auto max-w-6xl mx-auto"
    : "fixed bottom-4 right-4 w-[calc(100%-2rem)] max-w-md h-[82vh] sm:w-[540px] sm:h-[720px]";

  return (
    <>
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl z-40 w-16 h-16 flex items-center justify-center"
        >
          <Brain className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-3 h-3" />
          </div>
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className={`${chatWindowClass} bg-white rounded-3xl shadow-2xl z-50 flex flex-col border-2 border-indigo-300 overflow-hidden`}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center relative">
                  <Brain className="w-6 h-6" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">AI Cố Vấn Đồng Hành</h3>
                  <p className="text-xs opacity-90 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Lắng nghe • Hiểu • Đồng hành
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  title={isFullscreen ? "Thu nhỏ" : "Phóng to"}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleClose}
                  className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {currentUser && userProfile && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <User className="w-4 h-4 text-indigo-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{currentUser.full_name || currentUser.email}</p>
                      <p className="text-xs text-gray-600">
                        {userProfile.class_name ? `Lớp ${userProfile.class_name}` : 'Học sinh'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {clarityScore > 0 && (
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full">
                        <Target className="w-3 h-3 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-600">{clarityScore}%</span>
                      </div>
                    )}
                    {(extractedInsights.interests.length + extractedInsights.goals.length) > 0 && (
                      <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full">
                        <Lightbulb className="w-3 h-3" />
                        <span className="text-xs font-bold">{extractedInsights.interests.length + extractedInsights.goals.length}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Session History Button */}
                <SessionHistory
                  sessions={sessions}
                  currentSessionId={sessionId}
                  onSelectSession={async (session) => {
                    console.log('🔄 Loading session:', session.id);
                    setSessionId(session.id);
                    
                    // Load messages
                    if (session.conversation_history?.length > 0) {
                      const loadedMessages = session.conversation_history.map((msg, idx) => ({
                        id: Date.now() + idx,
                        text: msg.content,
                        sender: msg.role === 'user' ? 'user' : 'bot',
                        timestamp: new Date(msg.timestamp)
                      }));
                      setMessages([
                        { id: 1, text: getGreeting(currentUser, userProfile), sender: "bot", timestamp: new Date() },
                        ...loadedMessages
                      ]);
                    }
                    
                    // Restore clarity
                    if (session.student_context?.clarity) {
                      setClarityScore(session.student_context.clarity);
                    }
                  }}
                  onDeleteSession={deleteSession}
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-3 ${isFullscreen ? 'max-w-[75%]' : 'max-w-[88%]'}`}>
                    {m.sender === 'bot' && (
                      <div className={`${isFullscreen ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
                        m.isCelebration ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        m.isReflection ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                        'bg-gradient-to-br from-indigo-600 to-purple-600'
                      }`}>
                        {m.isCelebration ? <PartyPopper className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-white`} /> :
                         m.isReflection ? <Sparkles className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-white`} /> :
                         <Brain className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />}
                      </div>
                    )}
                    <div className={`${isFullscreen ? 'p-5' : 'p-4'} rounded-2xl shadow-sm ${
                      m.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' :
                      m.isCelebration ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-bl-none' :
                      m.isReflection ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-bl-none' :
                      'bg-white border-2 border-indigo-100 rounded-bl-none'
                    }`}>
                      <div className={`${isFullscreen ? 'text-base' : 'text-sm'} leading-relaxed`}>
                        <MessageFormatter text={m.text} sender={m.sender} />
                      </div>
                      <p className={`text-xs mt-2 ${m.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {m.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {m.sender === 'user' && (
                      <div className={`${isFullscreen ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-purple-600 flex items-center justify-center shadow-md flex-shrink-0`}>
                        <User className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex">
                  <div className="flex items-start gap-3">
                    <div className={`${isFullscreen ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md`}>
                      <Brain className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-white animate-pulse`} />
                    </div>
                    <div className={`bg-white border-2 border-indigo-100 ${isFullscreen ? 'p-5' : 'p-4'} rounded-2xl rounded-bl-none shadow-sm`}>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Progress Alert */}
            {alerts.length > 0 && userProfile?.role === 'student' && (
              <ProgressAlert
                alerts={alerts}
                onAskAbout={async (prompt) => {
                  // Auto-send user message + trigger AI
                  const userMsg = { 
                    id: Date.now(), 
                    text: prompt, 
                    sender: "user", 
                    timestamp: new Date() 
                  };
                  setMessages(prev => [...prev, userMsg]);
                  setIsTyping(true);

                  try {
                    const aiPrompt = buildEnhancedPrompt(prompt, fullContext, extractedInsights, messages, clarityScore);
                    const progressCtx = progressData ? buildProgressContext(progressData, alerts, extractedInsights) : '';
                    const finalPrompt = aiPrompt.replace('TRẢ LỜI:', `${progressCtx}\n\nTRẢ LỜI:`);

                    const response = await base44.integrations.Core.InvokeLLM({
                      prompt: finalPrompt,
                      add_context_from_internet: false
                    });

                    const botMsg = { 
                      id: Date.now() + 1, 
                      text: response, 
                      sender: "bot", 
                      timestamp: new Date() 
                    };
                    setMessages(prev => [...prev, botMsg]);
                  } catch (err) {
                    console.error('❌ Alert prompt error:', err);
                  } finally {
                    setIsTyping(false);
                  }
                }}
              />
            )}

            {/* Smart Suggestions */}
            <SmartSuggestions
              clarityScore={clarityScore}
              insights={extractedInsights}
              academicScores={fullContext?.scores?.raw || []}
              hasTests={fullContext?.stats?.hasTests || false}
              messageCount={messages.length}
              progressData={progressData}
              alerts={alerts}
              onSelect={async (prompt) => {
                // ✅ FIXED: Auto-send user message + trigger AI response
                const userMsg = { 
                  id: Date.now(), 
                  text: prompt, 
                  sender: "user", 
                  timestamp: new Date() 
                };
                setMessages(prev => [...prev, userMsg]);
                setIsTyping(true);

                try {
                  // Build AI prompt
                  const aiPrompt = buildEnhancedPrompt(prompt, fullContext, extractedInsights, [...messages, userMsg], clarityScore);
                  const progressCtx = progressData ? buildProgressContext(progressData, alerts, extractedInsights) : '';
                  const finalPrompt = aiPrompt.replace('TRẢ LỜI:', `${progressCtx}\n\nTRẢ LỜI:`);

                  const response = await base44.integrations.Core.InvokeLLM({
                    prompt: finalPrompt,
                    add_context_from_internet: shouldUseInternetContext(prompt, clarityScore)
                  });

                  const botMsg = { 
                    id: Date.now() + 1, 
                    text: response, 
                    sender: "bot", 
                    timestamp: new Date() 
                  };
                  setMessages(prev => [...prev, botMsg]);

                  // Save session
                  const newMessages = [...messages, userMsg, botMsg];
                  if (newMessages.length % 3 === 0) {
                    await saveSession(newMessages, extractedInsights, clarityScore, conversationPhase);
                  }
                } catch (err) {
                  console.error('❌ Suggestion prompt error:', err);
                  setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: "Xin lỗi em, có lỗi xảy ra 🔧",
                    sender: "bot",
                    timestamp: new Date()
                  }]);
                } finally {
                  setIsTyping(false);
                }
              }}
            />

            <div className="p-4 border-t-2 border-indigo-100 bg-white rounded-b-3xl flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder="Kể cho mình nghe về em..."
                  className={`flex-1 px-4 ${isFullscreen ? 'py-4 text-base' : 'py-3 text-sm'} border-2 border-indigo-200 rounded-full focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100`}
                  disabled={isTyping}
                />
                <button
                  onClick={send}
                  disabled={!inputText.trim() || isTyping}
                  className={`${isFullscreen ? 'w-14 h-14' : 'w-11 h-11'} bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center hover:scale-110 disabled:opacity-50 shadow-lg hover:shadow-indigo-500/50 transition-all flex-shrink-0`}
                >
                  <Send className={`${isFullscreen ? 'w-6 h-6' : 'w-5 h-5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  Đồng Hành 24/7
                </p>
                {clarityScore > 0 && (
                  <p className="text-xs text-indigo-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Rõ ràng: {clarityScore}%
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}