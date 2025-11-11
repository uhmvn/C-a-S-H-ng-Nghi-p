import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Trophy, TrendingUp, Target, Award, Download, Share2, RotateCcw, Home } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Breadcrumb from "@/components/Breadcrumb";
import { createPageUrl } from "@/utils";

const GROUP_LABELS = {
  self_awareness: "Nhận thức bản thân",
  career_knowledge: "Hiểu biết nghề nghiệp",
  confidence: "Tự tin & quyết định",
  action_plan: "Kế hoạch hành động",
  motivation: "Lan tỏa & cảm hứng"
};

const GROUP_SUGGESTIONS = {
  self_awareness: {
    high: "Bạn có khả năng tự nhận thức tốt! Hãy tiếp tục khám phá bản thân qua các hoạt động thực tế và trải nghiệm mới.",
    medium: "Bạn đã bắt đầu hiểu về bản thân. Hãy dành thời gian suy ngẫm về sở thích và điểm mạnh của mình.",
    low: "Hãy thử làm các bài trắc nghiệm Holland hoặc MBTI để hiểu rõ hơn về tính cách và sở thích của bạn."
  },
  career_knowledge: {
    high: "Bạn có hiểu biết tốt về các nghề nghiệp! Tiếp tục tìm hiểu sâu về ngành nghề mình quan tâm.",
    medium: "Hãy tìm hiểu thêm về các ngành nghề từ thầy cô và tham gia các buổi hướng nghiệp.",
    low: "Nên tham gia các buổi tư vấn nghề nghiệp và tìm hiểu về tổ hợp môn phù hợp với từng ngành."
  },
  confidence: {
    high: "Bạn tự tin trong việc ra quyết định! Hãy giúp đỡ bạn bè cùng tìm hướng đi phù hợp.",
    medium: "Hãy tham khảo ý kiến từ thầy cô và gia đình để tăng thêm sự tự tin.",
    low: "Đừng lo lắng! Hãy bắt đầu với những quyết định nhỏ và từng bước xây dựng sự tự tin."
  },
  action_plan: {
    high: "Bạn có kế hoạch rõ ràng! Hãy thực hiện từng bước một cách kiên định.",
    medium: "Hãy viết ra kế hoạch cụ thể với timeline và các mốc kiểm tra tiến độ.",
    low: "Bắt đầu bằng việc đặt ra 2-3 mục tiêu nhỏ cho 3 tháng tới và lập kế hoạch thực hiện."
  },
  motivation: {
    high: "Bạn là nguồn cảm hứng cho người khác! Hãy tiếp tục chia sẻ và lan tỏa niềm đam mê.",
    medium: "Hãy thử chia sẻ trải nghiệm của mình với bạn bè để cùng nhau phát triển.",
    low: "Mỗi người đều có giá trị riêng. Hãy tự tin chia sẻ suy nghĩ và cảm nhận của bạn!"
  }
};

export default function SurveyResult() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const resultId = urlParams.get('id');

  const { data: result, isLoading } = useQuery({
    queryKey: ['surveyResult', resultId],
    queryFn: async () => {
      if (!resultId) return null;
      const results = await base44.entities.SurveyResult.filter({ id: resultId });
      return results[0] || null;
    },
    enabled: !!resultId
  });

  const radarData = useMemo(() => {
    if (!result?.group_scores) return [];
    return Object.entries(result.group_scores).map(([key, value]) => ({
      subject: GROUP_LABELS[key] || key,
      score: value.toFixed(1),
      fullMark: 5
    }));
  }, [result]);

  const barData = useMemo(() => {
    if (!result?.group_scores) return [];
    return Object.entries(result.group_scores).map(([key, value]) => ({
      name: GROUP_LABELS[key] || key,
      điểm: parseFloat(value.toFixed(2))
    }));
  }, [result]);

  const getLevel = (score) => {
    if (score >= 4.0) return { text: "Cao", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 3.0) return { text: "Trung bình", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { text: "Cần cải thiện", color: "text-red-600", bg: "bg-red-100" };
  };

  const getSuggestion = (group, score) => {
    if (score >= 4.0) return GROUP_SUGGESTIONS[group]?.high;
    if (score >= 3.0) return GROUP_SUGGESTIONS[group]?.medium;
    return GROUP_SUGGESTIONS[group]?.low;
  };

  const handleExport = () => {
    if (!result) return;

    const csvContent = [
      ['Học sinh', result.student_name || 'N/A'],
      ['Lớp', result.class_name || 'N/A'],
      ['Loại khảo sát', result.test_type === 'pre' ? 'Pre-test' : 'Post-test'],
      ['Thời gian hoàn thành', new Date(result.completed_at).toLocaleString('vi-VN')],
      ['Thời lượng (giây)', result.duration_seconds],
      [''],
      ['Nhóm năng lực', 'Điểm', 'Mức độ'],
      ...Object.entries(result.group_scores).map(([key, value]) => {
        const level = getLevel(value);
        return [GROUP_LABELS[key], value.toFixed(2), level.text];
      }),
      [''],
      ['Điểm tổng', result.overall_score],
      ['Nhóm cao nhất', result.highest_group],
      ['Nhóm thấp nhất', result.lowest_group]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ket-qua-khao-sat-${result.student_name}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const breadcrumbItems = [
    { label: "Game Khảo Sát", url: createPageUrl("CareerSurveyGame") },
    { label: "Kết quả" }
  ];

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy kết quả</h2>
            <a
              href={createPageUrl("CareerSurveyGame")}
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
            >
              Làm khảo sát mới
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl p-12 mb-8 text-center shadow-2xl"
        >
          <Trophy className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">🎉 Kết Quả Khảo Sát Của Bạn</h1>
          <p className="text-xl opacity-90 mb-2">{result.student_name}</p>
          {result.class_name && (
            <p className="text-lg opacity-80">Lớp: {result.class_name}</p>
          )}
          <div className="mt-6 flex items-center justify-center gap-4">
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm">
              {result.test_type === 'pre' ? '🌱 Pre-test' : '🎯 Post-test'}
            </span>
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm">
              ⏱️ {Math.floor(result.duration_seconds / 60)} phút {result.duration_seconds % 60} giây
            </span>
          </div>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 mb-8 shadow-lg text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Điểm Tổng Hợp</h2>
          <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl mb-6">
            <div>
              <div className="text-6xl font-bold">{result.overall_score.toFixed(1)}</div>
              <div className="text-sm opacity-90">/ 5.0</div>
            </div>
          </div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Bạn đang nổi bật ở nhóm <strong className="text-indigo-600">{result.highest_group}</strong>.
            Hãy phát huy điểm mạnh này và củng cố thêm <strong className="text-orange-600">{result.lowest_group}</strong> để định hướng tương lai hiệu quả hơn!
          </p>
        </motion.div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🕸️ Biểu Đồ Năng Lực</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <Radar name="Điểm" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">📊 Điểm Chi Tiết</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} style={{ fontSize: '10px' }} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="điểm" fill="#4F46E5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Detailed Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-8 shadow-lg mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📋 Bảng Tổng Hợp Chi Tiết</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-indigo-200">
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Nhóm năng lực</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700">Điểm TB</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700">Mức độ</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Gợi ý phát triển</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.group_scores).map(([key, value], idx) => {
                  const level = getLevel(value);
                  const suggestion = getSuggestion(key, value);
                  return (
                    <tr key={key} className="border-t hover:bg-indigo-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-gray-900">{GROUP_LABELS[key]}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">
                          {value.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-3 py-1 ${level.bg} ${level.color} rounded-full font-medium text-sm`}>
                          {level.text}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{suggestion}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <a
            href={createPageUrl("CareerSurveyGame")}
            className="bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-xl font-medium hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Chơi lại khảo sát
          </a>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Tải kết quả CSV
          </button>
          <a
            href={createPageUrl("Services")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2"
          >
            <Target className="w-5 h-5" />
            Khám phá dịch vụ
          </a>
        </motion.div>
      </div>
    </div>
  );
}