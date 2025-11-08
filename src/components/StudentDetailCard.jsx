import React from "react";
import { 
  User, Mail, Phone, School, Calendar, BookOpen, 
  TrendingUp, FileText, Award
} from "lucide-react";

export default function StudentDetailCard({ student, testResults = [] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{student.user_code}</h3>
          <p className="text-gray-600">Học sinh</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-4">Thông tin cơ bản</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-600">Trường</p>
              <p className="font-medium">{student.school_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-600">Lớp</p>
              <p className="font-medium">{student.class_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-600">Khối</p>
              <p className="font-medium">Khối {student.grade_level || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-600">SĐT PH</p>
              <p className="font-medium">{student.parent_phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-blue-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900">Kết quả Test</h4>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            {student.test_count || 0}
          </span>
        </div>
        {student.test_count > 0 ? (
          <div className="space-y-2">
            {testResults.slice(0, 3).map((test, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 text-sm">
                <p className="font-medium">{test.test_name}</p>
                <p className="text-gray-600 text-xs">
                  {new Date(test.completed_date).toLocaleDateString('vi-VN')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Chưa có kết quả test</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <FileText className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{student.test_count || 0}</p>
          <p className="text-xs text-gray-600">Bài test</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-600">Chứng chỉ</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">75%</p>
          <p className="text-xs text-gray-600">Hoàn thành</p>
        </div>
      </div>
    </div>
  );
}