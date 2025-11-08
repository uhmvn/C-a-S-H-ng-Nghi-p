import React from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { createPageUrl } from "@/utils";
import { Users } from "lucide-react";
import DynamicTest from "@/components/DynamicTest";

export default function TestMBTI() {
  const breadcrumbItems = [
    { label: "Dịch vụ", url: createPageUrl("Services") },
    { label: "Trắc nghiệm MBTI" }
  ];

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-600/10 rounded-full px-4 py-2 mb-4">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">Trắc nghiệm MBTI - 16 Personalities</span>
          </div>
          
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Khám Phá Nhóm Tính Cách Của Bạn
          </h1>
          
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trả lời các câu hỏi để tìm ra 1 trong 16 nhóm tính cách MBTI của bạn
          </p>
        </div>

        <DynamicTest testCode="mbti_16p" />
      </div>
    </div>
  );
}