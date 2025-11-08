
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, User, Brain, Lightbulb, TrendingUp, Target, Heart, PartyPopper, Zap, Maximize2, Minimize2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MessageFormatter from "@/components/MessageFormatter";
import SmartSuggestions from "@/components/SmartSuggestions";

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
  const [context, setContext] = useState(null);
  const [studentJourney, setStudentJourney] = useState(null);
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

  useEffect(() => {
    if (journeyId && messages.length > 1 && (debouncedInsights.interests.length > 0 || debouncedInsights.goals.length > 0)) {
      console.log('🔄 Auto-saving insights...', debouncedInsights);
      quickSaveInsights(debouncedInsights);
    }
  }, [debouncedInsights, journeyId, messages.length]);

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
              const scores = await base44.entities.AcademicScore.filter({ student_id: prof.id });
              const tests = await base44.entities.TestResult.filter({ user_id: user.id });
              const sessions = await base44.entities.AICounselingSession.filter({ user_id: user.id }, '-session_date', 10);

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

              setContext({
                scores: scores || [],
                tests: tests || [],
                previousSessions: sessions || [],
                journey: journey,
                profile: prof
              });

              const newSession = await base44.entities.AICounselingSession.create({
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
              console.log('✅ Created session:', newSession.id);
              setSessionId(newSession.id);
            }
          }
        }

        setMessages([{ id: 1, text: getGreeting(user, prof), sender: "bot", timestamp: new Date() }]);
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
      if (context?.journey?.conversation_count > 0) {
        const lastInterest = context.journey.key_insights?.interests?.[0];
        const clarity = context.journey.current_clarity_score || 0;

        if (clarity >= 70) {
          return `Chào lại ${n}! 🌟\n\nMình thấy em đã rõ ràng hơn rất nhiều (${clarity}%)! Tuyệt vời!\n\nHôm nay em muốn trao đổi thêm về điều gì? 😊`;
        }

        return `Chào lại ${n}! 👋\n\nMình nhớ lần trước chúng ta nói về ${lastInterest || 'định hướng'}.\n\nHôm nay em có suy nghĩ gì mới không? 🌟`;
      }

      return `Chào em ${n}! 🎓\n\nMình là AI Cố Vấn - người bạn đồng hành trong hành trình khám phá bản thân.\n\n✨ Mình sẽ:\n💭 Lắng nghe suy nghĩ, cảm xúc của em\n🎯 Giúp em tìm ước mơ, mục tiêu\n💪 Khám phá điểm mạnh, điểm yếu\n🌈 Hiểu giá trị sống của em\n\nKhông vội, từ từ em kể cho mình nghe nhé. Em đang băn khoăn điều gì? 😊`;
    }

    return `Chào ${n}! 👋 Mình là AI Cố Vấn Đồng Hành.`;
  };

  const quickSaveInsights = useCallback(async (insights) => {
    if (!journeyId || !insights) return;

    try {
      const totalInsights = Object.values(insights).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      console.log('💾 Saving insights to journey:', journeyId, 'Total:', totalInsights);

      await base44.entities.StudentJourney.update(journeyId, {
        key_insights: insights,
        total_insights_collected: totalInsights,
        last_updated: new Date().toISOString()
      });
      console.log('✅ Quick saved insights successfully');
    } catch (err) {
      console.error('❌ Quick save error:', err);
    }
  }, [journeyId]);

  const updateJourney = async (newInsights, conversationMsgs, newClarity, emotionalState) => {
    if (!journeyId || !userProfile) return;

    try {
      console.log('📝 Full journey update...', journeyId);
      const journey = studentJourney || {};

      const oldInterests = journey.key_insights?.interests || [];
      const oldGoals = journey.key_insights?.goals || [];
      const newInterestsList = newInsights.interests || [];
      const newGoalsList = newInsights.goals || [];

      const interestChanges = newInterestsList.filter(i => !oldInterests.includes(i));
      const goalChanges = newGoalsList.filter(g => !oldGoals.includes(g));

      let newMilestones = journey.milestones || [];
      let newInterestEvolution = journey.interest_evolution || [];
      let newGoalEvolution = journey.goal_evolution || [];
      let newObservations = journey.ai_observations || [];

      if (interestChanges.length > 0 || goalChanges.length > 0) {
        newMilestones.push({
          date: new Date().toISOString(),
          type: 'insight_discovery',
          description: `Khám phá mới: ${[...interestChanges, ...goalChanges].slice(0, 2).join(', ')}`,
          emotional_state: emotionalState,
          clarity_score: newClarity
        });
        console.log('✅ Added milestone:', newMilestones[newMilestones.length - 1]);
      }

      if (interestChanges.length > 0) {
        newInterestEvolution.push({
          date: new Date().toISOString(),
          interests: newInterestsList,
          confidence: newClarity
        });
      }

      if (goalChanges.length > 0) {
        goalChanges.forEach(goal => {
          newGoalEvolution.push({
            date: new Date().toISOString(),
            goal: goal,
            reason: 'Discovered through conversation',
            confidence: newClarity
          });
        });
      }

      const oldClarity = journey.current_clarity_score || 0;
      if (oldClarity < 25 && newClarity >= 25) {
        newMilestones.push({
          date: new Date().toISOString(),
          type: 'celebration',
          description: '🎉 Đạt 25% - Bắt đầu hiểu bản thân!',
          emotional_state: emotionalState,
          clarity_score: newClarity
        });
      }
      if (oldClarity < 50 && newClarity >= 50) {
        newMilestones.push({
          date: new Date().toISOString(),
          type: 'celebration',
          description: '🎊 Đạt 50% - Rõ ràng hơn rồi!',
          emotional_state: emotionalState,
          clarity_score: newClarity
        });
      }
      if (oldClarity < 75 && newClarity >= 75) {
        newMilestones.push({
          date: new Date().toISOString(),
          type: 'celebration',
          description: '🏆 Đạt 75% - Đã xác định được hướng đi!',
          emotional_state: emotionalState,
          clarity_score: newClarity
        });
      }

      newObservations.push({
        date: new Date().toISOString(),
        observation: `Conv ${conversationMsgs.length} msgs. Clarity: ${oldClarity}% -> ${newClarity}%. New: ${interestChanges.length + goalChanges.length}`,
        significance: newClarity > 60 ? 'high' : newClarity > 30 ? 'medium' : 'low'
      });

      const updateData = {
        current_clarity_score: newClarity,
        current_emotional_state: emotionalState,
        conversation_count: (journey.conversation_count || 0) + 1,
        total_insights_collected: Object.values(newInsights).reduce((sum, arr) => sum + (arr?.length || 0), 0),
        milestones: newMilestones,
        interest_evolution: newInterestEvolution,
        goal_evolution: newGoalEvolution,
        key_insights: newInsights,
        ai_observations: newObservations.slice(-20),
        last_updated: new Date().toISOString()
      };

      console.log('💾 Updating journey with data:', updateData);
      await base44.entities.StudentJourney.update(journeyId, updateData);

      setStudentJourney({
        ...journey,
        ...updateData
      });

      console.log('✅ Journey fully updated');
    } catch (err) {
      console.error('❌ Journey update error:', err);
    }
  };

  const saveSessionIncremental = useCallback(async (msgs, insights = null) => {
    if (!sessionId || !currentUser || !userProfile) return;

    try {
      const currentInsights = insights || extractedInsights;

      const updateData = {
        conversation_history: msgs.slice(-50).map(m => ({
          role: m.sender,
          content: m.text,
          timestamp: m.timestamp.toISOString()
        })),
        student_interests: currentInsights.interests || [],
        student_goals: currentInsights.goals || [],
        student_context: {
          clarity: clarityScore,
          phase: conversationPhase,
          insights_count: Object.values(currentInsights).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        },
        counseling_summary: `AI Companion - ${msgs.length} msgs - Clarity: ${clarityScore}% - Phase: ${conversationPhase}`,
        tags: ['ai_companion', conversationPhase, userProfile.role || 'student']
      };

      console.log('💾 Saving session:', sessionId, updateData);
      await base44.entities.AICounselingSession.update(sessionId, updateData);

      console.log('✅ Session saved');
    } catch (err) {
      console.error('❌ Session save error:', err);
    }
  }, [sessionId, currentUser, userProfile, extractedInsights, clarityScore, conversationPhase]);

  const handleClose = async () => {
    if (sessionId && messages.length > 1) {
      try {
        console.log('🔒 Closing session:', sessionId);
        await base44.entities.AICounselingSession.update(sessionId, {
          is_completed: true,
          completion_date: new Date().toISOString(),
          conversation_history: messages.map(m => ({
            role: m.sender,
            content: m.text,
            timestamp: m.timestamp.toISOString()
          }))
        });
        console.log('✅ Session closed');
      } catch (err) {
        console.error('❌ Close error:', err);
      }
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

      let ctx = "";

      if (currentUser && userProfile) {
        ctx += `\n=== HỌC SINH ===\n`;
        ctx += `Tên: ${currentUser.full_name || 'N/A'}\n`;
        if (userProfile.class_name) ctx += `Lớp: ${userProfile.class_name}\n`;

        if (studentJourney) {
          ctx += `\n=== HÀNH TRÌNH ===\n`;
          ctx += `Lần chat: ${studentJourney.conversation_count || 0}\n`;
          ctx += `Độ rõ ràng: ${newClarity}% (${emotionalState})\n`;

          if (studentJourney.milestones && studentJourney.milestones.length > 0) {
            const recentMilestones = studentJourney.milestones.slice(-2);
            ctx += `Milestones gần đây:\n`;
            recentMilestones.forEach(m => ctx += `- ${m.description}\n`);
          }
        }

        if (context?.scores && context.scores.length > 0) {
          const v = context.scores.filter(s => typeof s.average_score === 'number');
          if (v.length > 0) {
            const gpa = (v.reduce((a, s) => a + s.average_score, 0) / v.length).toFixed(2);
            ctx += `\n=== HỌC BẠ ===\n`;
            ctx += `GPA: ${gpa}\n`;
            const sorted = [...v].sort((a, b) => b.average_score - a.average_score);
            ctx += `Mạnh: ${sorted.slice(0, 3).map(s => `${s.subject_name}(${s.average_score.toFixed(1)})`).join(', ')}\n`;
          }
        }

        if (newInsights.interests.length > 0 || newInsights.goals.length > 0) {
          ctx += `\n=== INSIGHTS ===\n`;
          if (newInsights.interests.length > 0) ctx += `🎨 ${newInsights.interests.join(', ')}\n`;
          if (newInsights.goals.length > 0) ctx += `🎯 ${newInsights.goals.join(', ')}\n`;
          if (newInsights.values.length > 0) ctx += `💎 ${newInsights.values.join(', ')}\n`;
          if (newInsights.concerns.length > 0) ctx += `💭 ${newInsights.concerns.join(', ')}\n`;
          if (newInsights.personality_traits.length > 0) ctx += `⭐ ${newInsights.personality_traits.join(', ')}\n`;
        }
      }

      const hist = messages.slice(-10).map(m => `${m.sender === 'user' ? 'Em' : 'Mình'}: ${m.text}`).join('\n\n');

      const prompt = `BỐI CẢNH: AI Cố Vấn Đồng Hành - thấu hiểu, động viên, hướng dẫn học sinh.

TRIẾT LÝ: LẮNG NGHE → THẤU HIỂU → DẪN DẮT (không áp đặt)

${ctx}

CUỘC TRUYỆN:
${hist}

TIN NHẮN MỚI: "${txt}"

PHÂN TÍCH PHASE:
${newClarity < 40 ? '**DISCOVERY** - Thu thập insights, xây rapport, hỏi sâu' :
        newClarity < 70 ? '**EXPLORATION** - Kết nối insights với reality, challenge nhẹ' :
          '**RECOMMENDATION** - Gợi ý cụ thể, action plan'}

QUY TẮC:

**Discovery (<40%):**
- Hỏi MỞ: "Em kể thêm...", "Điều gì khiến em..."
- Dig deeper: "Tại sao?", "Em cảm thấy sao?"
- Validate: "Mình hiểu em đang..."
- Encourage: "Tuyệt!", "Cứ kể tiếp"

**Exploration (40-70%):**
- Connect: "Em thích X và giỏi Y, em thấy sao về Z?"
- Challenge: "Nếu..., em sẽ...?"
- Options: "Còn A, B, C?"

**Recommendation (>70%):**
- Analyze: Điểm + Insights
- Suggest: 3-5 nghề + LÝ DO
- Plan: Tổ hợp môn + Trường

**NGOÀI CHỦ ĐỀ:**
→ "Em ơi, mình chỉ tư vấn hướng nghiệp 😊"

**STYLE:** Thân thiện, empathy, 150-400 từ, emoji 💭🎯💡✨

TRẢ LỜI:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      const bMsg = { id: Date.now() + 1, text: response, sender: "bot", timestamp: new Date() };
      setMessages(p => [...p, bMsg]);

      if (newClarity < 40) setConversationPhase('discovery');
      else if (newClarity < 70) setConversationPhase('exploration');
      else setConversationPhase('recommendation');

      const newMessages = [...messages, uMsg, bMsg];

      if (hasNewInsights) {
        console.log('🔄 Has new insights, updating journey...');
        await updateJourney(newInsights, newMessages, newClarity, emotionalState);
      }

      if (newMessages.length % 3 === 0) {
        console.log('💾 Auto-save every 3 messages...');
        saveSessionIncremental(newMessages, newInsights);
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
                <div className="flex items-center justify-between">
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

            {/* Smart Suggestions */}
            <SmartSuggestions
              clarityScore={clarityScore}
              insights={extractedInsights}
              academicScores={context?.scores || []}
              hasTests={context?.tests?.length > 0}
              messageCount={messages.length}
              onSelect={setInputText}
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
