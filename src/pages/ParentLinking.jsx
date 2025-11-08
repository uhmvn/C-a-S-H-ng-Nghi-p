
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, UserCheck, AlertCircle, CheckCircle, Loader2, Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Breadcrumb from "@/components/Breadcrumb";

export default function ParentLinking() {
  const [currentUser, setCurrentUser] = useState(null);
  const [parentProfile, setParentProfile] = useState(null);
  const [studentCode, setStudentCode] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [relationship, setRelationship] = useState('mother');
  const [isLoading, setIsLoading] = useState(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profiles && profiles.length > 0) {
            setParentProfile(profiles[0]);
          } else {
            // Auto-create parent profile
            const newProfile = await base44.entities.UserProfile.create({
              user_id: user.id,
              role: 'parent',
              status: 'active',
              linked_student_codes: []
            });
            setParentProfile(newProfile);
          }
        } else {
          base44.auth.redirectToLogin(window.location.pathname);
        }
      } catch (error) {
        console.error('Init error:', error);
        toast.error('Lỗi tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const linkMutation = useMutation({
    mutationFn: async ({ studentCode, secretCode, relationship }) => {
      console.log('🔗 Linking student:', studentCode);

      // Step 1: Find student by user_code
      const students = await base44.entities.UserProfile.filter({ 
        user_code: studentCode,
        role: 'student'
      });

      if (!students || students.length === 0) {
        throw new Error('Không tìm thấy học sinh với mã này');
      }

      const student = students[0];
      console.log('✅ Found student:', student);

      // Step 2: Verify secret code from CodeInventory
      const codes = await base44.entities.CodeInventory.filter({
        user_code: studentCode,
        secret_code: secretCode
      });

      if (!codes || codes.length === 0) {
        throw new Error('Mã bí mật không đúng');
      }

      console.log('✅ Secret code verified');

      // Step 3: Get User info (Safe access to User entity)
      let parentName = currentUser.email;
      try {
        const users = await base44.entities.User.filter({ id: currentUser.id });
        if (users && users.length > 0) {
          parentName = users[0]?.full_name || currentUser.email;
        }
      } catch (error) {
        console.warn('Cannot fetch User name, using email');
      }

      // Step 4: Link parent to student (Safe array access)
      const existingLinks = Array.isArray(parentProfile.linked_student_codes) 
        ? parentProfile.linked_student_codes 
        : [];
      
      // Check if already linked
      if (existingLinks.some(l => l && l.student_code === studentCode)) {
        throw new Error('Đã liên kết với học sinh này rồi');
      }

      const newLink = {
        student_code: studentCode,
        student_name: student.full_name || studentCode,
        student_id: student.id,
        relationship: relationship,
        verified: true,
        linked_at: new Date().toISOString()
      };

      await base44.entities.UserProfile.update(parentProfile.id, {
        linked_student_codes: [...existingLinks, newLink]
      });

      console.log('✅ Linked successfully');

      return { student, parentName };
    },
    onSuccess: ({ student }) => {
      queryClient.invalidateQueries({ queryKey: ['parentProfile'] });
      toast.success(`✅ Đã liên kết với ${student.full_name || student.user_code}!`);
      setStudentCode('');
      setSecretCode('');
      // Reload profile
      setTimeout(async () => {
        const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
        if (profiles && profiles.length > 0) {
          setParentProfile(profiles[0]);
        }
      }, 500);
    },
    onError: (error) => {
      console.error('❌ Link error:', error);
      toast.error(error.message || 'Lỗi liên kết');
    }
  });

  const unlinkMutation = useMutation({
    mutationFn: async (studentCode) => {
      const existingLinks = Array.isArray(parentProfile.linked_student_codes) 
        ? parentProfile.linked_student_codes 
        : [];
      const newLinks = existingLinks.filter(l => l && l.student_code !== studentCode);

      await base44.entities.UserProfile.update(parentProfile.id, {
        linked_student_codes: newLinks
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parentProfile'] });
      toast.success('✅ Đã hủy liên kết!');
      setTimeout(async () => {
        const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
        if (profiles && profiles.length > 0) {
          setParentProfile(profiles[0]);
        }
      }, 500);
    },
    onError: (error) => {
      toast.error('Lỗi hủy liên kết');
    }
  });

  const breadcrumbItems = [
    { label: "Liên kết học sinh" }
  ];

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Safe access to linked students
  const linkedStudents = Array.isArray(parentProfile?.linked_student_codes) 
    ? parentProfile.linked_student_codes 
    : [];

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Link2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Liên Kết Với Con</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nhập mã học sinh và mã bí mật để liên kết tài khoản phụ huynh với học sinh
          </p>
        </div>

        {/* Linking Form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-lg border-2 border-indigo-200 mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            Liên Kết Học Sinh Mới
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mã học sinh *</label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder="VD: HS-NDU-2025-9-001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mã bí mật *</label>
              <input
                type="password"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                placeholder="12 ký tự"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mã bí mật được cấp cùng với mã học sinh
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quan hệ *</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none"
              >
                <option value="father">Cha</option>
                <option value="mother">Mẹ</option>
                <option value="guardian">Người giám hộ</option>
                <option value="sibling">Anh/Chị/Em</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">🔒 Bảo mật thông tin</p>
                  <p className="text-blue-700">
                    Mã bí mật chỉ được cấp cho học sinh. Phụ huynh cần hỏi con để có mã này.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => linkMutation.mutate({ studentCode, secretCode, relationship })}
              disabled={!studentCode || !secretCode || linkMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {linkMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  Liên Kết
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Linked Students */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Danh Sách Con Đã Liên Kết ({linkedStudents.length})
          </h2>

          {linkedStudents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Chưa liên kết với học sinh nào</p>
              <p className="text-sm text-gray-500 mt-2">
                Liên kết để xem thông tin và kết quả học tập của con
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {linkedStudents.map((link, idx) => {
                if (!link) return null; // Handle potential null/undefined links
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border-2 border-gray-200 rounded-2xl p-6 hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            {link.student_name || link.student_code}
                            {link.verified && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Mã: {link.student_code} • Quan hệ: {
                              link.relationship === 'father' ? 'Cha' :
                              link.relationship === 'mother' ? 'Mẹ' :
                              link.relationship === 'guardian' ? 'Người giám hộ' :
                              link.relationship === 'sibling' ? 'Anh/Chị/Em' : 'Khác'
                            }
                          </p>
                          {link.linked_at && ( // Conditionally display linked_at
                            <p className="text-xs text-gray-500">
                              Liên kết: {new Date(link.linked_at).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`/parent-dashboard?student=${link.student_code}`}
                          className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 text-sm font-medium"
                        >
                          Xem Chi Tiết
                        </a>
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc muốn hủy liên kết?')) {
                              unlinkMutation.mutate(link.student_code);
                            }
                          }}
                          className="border-2 border-red-600 text-red-600 px-5 py-2 rounded-xl hover:bg-red-50 text-sm font-medium"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
