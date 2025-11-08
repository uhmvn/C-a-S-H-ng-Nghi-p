import React from "react";
import { motion } from "framer-motion";
import { Brain, Target, Lightbulb, TrendingUp, Award, MessageCircle, Sparkles, ArrowRight, BarChart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";
import { createPageUrl } from "@/utils";
import JourneyTimeline from "@/components/JourneyTimeline";
import InsightsCloud from "@/components/InsightsCloud";
import ClarityProgressCard from "@/components/ClarityProgressCard";
import SessionCard from "@/components/SessionCard";

export default function StudentJourneyView() {
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        base44.auth.redirectToLogin(window.location.pathname);
      }
    };
    fetchUser();
  }, []);

  const { data: studentJourney, isLoading: journeyLoading } = useQuery({
    queryKey: ['studentJourney', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      try {
        const journeys = await base44.entities.StudentJourney.filter({ user_id: currentUser.id });
        return journeys?.[0] || null;
      } catch (error) {
        console.error('Error fetching journey:', error);
        return null;
      }
    },
    enabled: !!currentUser?.id,
  });

  const { data: counselingSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['counselingSessions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      try {
        return await base44.entities.AICounselingSession.filter({ user_id: currentUser.id }, '-session_date', 50);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });

  const breadcrumbItems = [
    { label: "Hồ sơ", url: createPageUrl("UserProfile") },
    { label: "Hành trình" }
  ];

  if (!currentUser || journeyLoading) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải hành trình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium">Student Journey</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Hành Trình Tự Nhận Thức</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Timeline ghi lại quá trình phát triển, khám phá bản thân qua các cuộc trò chuyện với AI
          </p>
        </motion.div>

        {studentJourney ? (
          <div className="space-y-8">
            {/* Progress Cards Row */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Clarity Card - Bigger */}
              <div className="md:col-span-2">
                <ClarityProgressCard 
                  currentScore={studentJourney.current_clarity_score || 0}
                  previousScore={studentJourney.milestones?.[0]?.clarity_score || 0}
                />
              </div>

              {/* Stats Cards */}
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200"
                >
                  <Lightbulb className="w-10 h-10 text-green-600 mb-3" />
                  <p className="text-3xl font-bold text-green-600">{studentJourney.total_insights_collected || 0}</p>
                  <p className="text-sm text-gray-600">Insights thu thập</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200"
                >
                  <MessageCircle className="w-10 h-10 text-purple-600 mb-3" />
                  <p className="text-3xl font-bold text-purple-600">{studentJourney.conversation_count || 0}</p>
                  <p className="text-sm text-gray-600">Cuộc trò chuyện</p>
                </motion.div>
              </div>
            </div>

            {/* Insights Cloud */}
            {studentJourney.key_insights && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-8 shadow-lg border-2 border-indigo-200"
              >
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-indigo-600" />
                  Insights Về Bản Thân
                </h3>
                <InsightsCloud insights={studentJourney.key_insights} />
              </motion.div>
            )}

            {/* Timeline */}
            {studentJourney.milestones && studentJourney.milestones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl p-8 shadow-lg"
              >
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                  Timeline Phát Triển ({studentJourney.milestones.length} mốc)
                </h3>
                <JourneyTimeline milestones={studentJourney.milestones} />
              </motion.div>
            )}

            {/* Sessions */}
            {counselingSessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-3xl p-8 shadow-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-indigo-600" />
                    Lịch Sử Tư Vấn ({counselingSessions.length})
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BarChart className="w-4 h-4" />
                    <span>{counselingSessions.filter(s => s.is_completed).length} hoàn tất</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {counselingSessions.map((session, idx) => (
                    <SessionCard key={session.id} session={session} index={idx} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center"
            >
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-3">Tiếp Tục Hành Trình</h3>
              <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
                Mỗi cuộc trò chuyện giúp bạn hiểu rõ hơn về bản thân. Chat ngay để khám phá thêm!
              </p>
              <p className="text-sm text-indigo-200 mb-4">
                💡 Click vào icon Brain ở góc phải dưới màn hình
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 shadow-lg text-center">
            <Brain className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Chưa Bắt Đầu Hành Trình</h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Hành trình tự nhận thức sẽ bắt đầu khi bạn chat với AI Cố Vấn. 
              Mỗi cuộc trò chuyện giúp bạn hiểu rõ hơn về bản thân!
            </p>
            <div className="bg-indigo-50 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
              <h4 className="font-bold text-gray-900 mb-4">AI sẽ giúp bạn:</h4>
              <div className="grid md:grid-cols-2 gap-3 text-left text-sm text-gray-700">
                {['Khám phá sở thích', 'Xác định mục tiêu', 'Hiểu giá trị sống', 'Gợi ý nghề nghiệp'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500">Click icon Brain góc phải dưới để bắt đầu 🧠💜</p>
          </div>
        )}
      </div>
    </div>
  );
}