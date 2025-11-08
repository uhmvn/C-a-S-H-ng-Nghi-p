import React from "react";
import { User, School, BookOpen, Users, Calendar } from "lucide-react";

export default function TeacherDetailCard({ teacher }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-purple-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{teacher.user_code}</h3>
          <p className="text-gray-600">
            {teacher.role === 'homeroom_teacher' ? 'Giáo viên chủ nhiệm' : 'Giáo viên bộ môn'}
          </p>
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
              <p className="font-medium">{teacher.school_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-600">Phân công</p>
              <p className="font-medium">{teacher.teaching_count || 0} lớp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teaching Assignments */}
      <div className="bg-purple-50 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-4">Lớp được phân công</h4>
        {teacher.assignments?.length > 0 ? (
          <div className="space-y-3">
            {teacher.assignments.map((assignment, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-gray-900">{assignment.class_name}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    assignment.role_in_class === 'homeroom' 
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {assignment.role_in_class === 'homeroom' ? 'Chủ nhiệm' : 'Bộ môn'}
                  </span>
                </div>
                {assignment.subject_name && (
                  <p className="text-sm text-gray-600">Môn: {assignment.subject_name}</p>
                )}
                {assignment.lessons_per_week > 0 && (
                  <p className="text-sm text-gray-600">{assignment.lessons_per_week} tiết/tuần</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Chưa có phân công giảng dạy</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 rounded-xl p-4 text-center">
          <BookOpen className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{teacher.teaching_count || 0}</p>
          <p className="text-xs text-gray-600">Lớp dạy</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">1</p>
          <p className="text-xs text-gray-600">Năm học</p>
        </div>
      </div>
    </div>
  );
}