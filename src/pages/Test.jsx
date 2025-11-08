import React from "react";
import { useLocation } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import { createPageUrl } from "@/utils";
import { Target, Users, Brain, Sparkles, Loader2, AlertCircle } from "lucide-react";
import DynamicTest from "@/components/DynamicTest";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function Test() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const testCode = urlParams.get('code');

  // Fetch test info from database
  const { data: test, isLoading } = useQuery({
    queryKey: ['test', testCode],
    queryFn: async () => {
      if (!testCode) return null;
      const tests = await base44.entities.Test.filter({ test_code: testCode });
      return tests[0] || null;
    },
    enabled: !!testCode
  });

  // Fetch test type for additional info
  const { data: testType } = useQuery({
    queryKey: ['testType', test?.test_type_id],
    queryFn: async () => {
      if (!test?.test_type_id) return null;
      const types = await base44.entities.TestType.filter({ id: test.test_type_id });
      return types[0] || null;
    },
    enabled: !!test?.test_type_id
  });

  const breadcrumbItems = [
    { label: "Dịch vụ", url: createPageUrl("Services") },
    { label: test?.name || "Trắc nghiệm" }
  ];

  // Icon mapping
  const getIcon = () => {
    if (!testType) return Target;
    const iconMap = {
      holland: Target,
      mbti: Users,
      iq: Brain,
      eq: Sparkles
    };
    return iconMap[testType.type_code] || Target;
  };

  const Icon = getIcon();

  // Loading state
  if (isLoading) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-600">Đang tải bài test...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!testCode || !test) {
    return (
      <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-bold text-red-900">Không tìm thấy bài test</h3>
                <p className="text-red-700">
                  {!testCode ? 'Vui lòng cung cấp mã bài test' : `Không tìm thấy bài test với mã "${testCode}"`}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get color scheme from test type
  const colorScheme = testType?.color_scheme || {
    primary: 'indigo',
    secondary: 'purple'
  };

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        <div className="mb-8 text-center">
          <div className={`inline-flex items-center gap-2 bg-${colorScheme.primary}-600/10 rounded-full px-4 py-2 mb-4`}>
            <Icon className={`w-4 h-4 text-${colorScheme.primary}-600`} />
            <span className={`text-sm font-medium text-${colorScheme.primary}-600`}>
              {testType?.type_name || 'Trắc nghiệm'}
            </span>
          </div>
          
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {test.name}
          </h1>
          
          <p className="text-gray-600 max-w-2xl mx-auto mb-4">
            {test.description}
          </p>

          {test.instructions && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-xl mb-6 text-left max-w-2xl mx-auto">
              <h3 className="font-bold text-blue-900 mb-2">📋 Hướng dẫn làm bài:</h3>
              <p className="text-blue-800 text-sm">{test.instructions}</p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mb-6">
            {test.duration_minutes && (
              <span className="flex items-center gap-1">
                ⏱️ {test.duration_minutes} phút
              </span>
            )}
            {test.question_count && (
              <span className="flex items-center gap-1">
                📝 {test.question_count} câu hỏi
              </span>
            )}
            {test.difficulty_level && (
              <span className="flex items-center gap-1">
                🎯 Độ khó: {
                  test.difficulty_level === 'easy' ? 'Dễ' :
                  test.difficulty_level === 'medium' ? 'Trung bình' :
                  'Khó'
                }
              </span>
            )}
          </div>
        </div>

        <DynamicTest testCode={testCode} />
      </div>
    </div>
  );
}