
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AdminLayout from "@/components/AdminLayout";
import { 
  User, Search, Edit2, Save, X, Phone, MapPin, Users,
  Calendar, Heart, AlertCircle, Briefcase, Home, Mail, ArrowLeft, Camera
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

export default function AdminStudentInfo() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const studentIdFromUrl = searchParams.get('student');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students-info'],
    queryFn: async () => {
      const all = await base44.entities.UserProfile.list('-created_date', 500);
      return (all || []).filter(p => p.role === 'student');
    },
    initialData: []
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await base44.entities.User.list('-created_date', 500) || [];
      } catch (error) {
        return [];
      }
    },
    enabled: students.length > 0,
    throwOnError: false,
    initialData: []
  });

  useEffect(() => {
    if (studentIdFromUrl && students && students.length > 0 && !selectedStudent) {
      const student = students.find(s => s && s.id === studentIdFromUrl);
      if (student) {
        setSelectedStudent(student);
      }
    }
  }, [studentIdFromUrl, students, selectedStudent]);

  // ✅ NEW STRATEGY: Get full_name from UserProfile directly
  useEffect(() => {
    if (selectedStudent && !isEditing) {
      console.log('🔄 [AdminStudentInfo] Setting formData (NEW: full_name from UserProfile)');
      console.log('👤 Student data:', selectedStudent);
      setFormData({
        ...selectedStudent,
        full_name: selectedStudent.full_name || '' // ✅ From UserProfile
      });
    }
  }, [selectedStudent, isEditing]);

  // ✅ NEW STRATEGY: Update mutation - full_name goes to UserProfile
  const updateMutation = useMutation({
    mutationFn: async ({ profileData, fullName, avatarUrl }) => {
      console.log('🔄 [AdminStudentInfo] Mutation START (NEW STRATEGY)');
      console.log('📝 Full name:', fullName);
      console.log('📦 Profile data:', profileData);
      
      if (!fullName || fullName.trim() === '') {
        throw new Error('Họ và tên không được để trống');
      }
      
      // ✅ NEW: Update UserProfile with full_name included
      const updateData = { 
        ...profileData,
        full_name: fullName // ✅ Save to UserProfile
      };
      
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }
      
      console.log('📝 Updating UserProfile (WITH full_name):', updateData);
      try {
        const result = await base44.entities.UserProfile.update(selectedStudent.id, updateData);
        console.log('✅ UserProfile updated (with full_name):', result);
        return result;
      } catch (error) {
        console.error('❌ Failed to update UserProfile:', error);
        throw new Error('Không thể cập nhật profile: ' + error.message);
      }
    },
    onSuccess: async (updatedProfile) => {
      console.log('✅ [AdminStudentInfo] Mutation SUCCESS');
      console.log('📦 Updated profile:', updatedProfile);
      
      try {
        await queryClient.invalidateQueries({ queryKey: ['students-info'] });
        await queryClient.invalidateQueries({ queryKey: ['studentProfiles'] });
        
        // ✅ Update selectedStudent immediately
        console.log('✅ Updating selectedStudent with new full_name:', updatedProfile.full_name);
        setSelectedStudent(updatedProfile);
        
        // ✅ Update formData if not editing
        if (!isEditing) {
          setFormData({
            ...updatedProfile,
            full_name: updatedProfile.full_name || ''
          });
        }
        
        console.log('✅ All updates completed');
        toast.success('✅ Đã cập nhật thông tin!');
        setIsEditing(false);
        setAvatarFile(null);
      } catch (error) {
        console.error('❌ Error refreshing data:', error);
        toast.error('⚠️ Đã lưu nhưng không thể làm mới. Vui lòng reload trang.');
      }
    },
    onError: (error) => {
      console.error('❌ [AdminStudentInfo] Mutation ERROR:', error);
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  });

  const filteredStudents = (students || []).filter(s => {
    if (!s) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const user = (users || []).find(u => u && u.id === s.user_id);
    const name = user?.full_name || s.user_code || '';
    return name.toLowerCase().includes(search) || 
           s.user_code?.toLowerCase().includes(search) ||
           s.class_name?.toLowerCase().includes(search);
  });

  const handleEdit = (student) => {
    // const user = (users || []).find(u => u && u.id === student.user_id); // Removed from original logic
    setSelectedStudent(student);
    setFormData({
      ...student,
      full_name: student.full_name || '' // Use student.full_name directly
    });
    setIsEditing(true);
    setAvatarFile(null);
  };

  const handleSave = async () => {
    try {
      console.log('🔄 [AdminStudentInfo] Starting save process...');
      console.log('📦 Form data:', formData);
      
      if (!formData.full_name || formData.full_name.trim() === '') {
        toast.error('❌ Họ và tên không được để trống');
        return;
      }
      
      let avatarUrl = selectedStudent.avatar_url;
      
      // Upload avatar if changed
      if (avatarFile) {
        toast.loading('Đang tải ảnh...', { id: 'avatar' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
        avatarUrl = file_url;
        console.log('✅ Avatar uploaded:', file_url);
        toast.success('Tải ảnh thành công!', { id: 'avatar' });
      }
      
      // ✅ CRITICAL: Separate full_name and clean built-in fields
      const { 
        full_name, user_id, id, created_date, updated_date, created_by, 
        ...profileData 
      } = formData;
      
      console.log('📝 Full name to save:', full_name);
      console.log('📝 Profile data to save:', profileData);
      
      updateMutation.mutate({
        profileData,
        fullName: full_name,
        avatarUrl
      });
    } catch (error) {
      console.error('❌ Save error:', error);
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  };

  // ✅ NEW: Get full_name from UserProfile directly
  const getStudentName = (student) => {
    if (!student) return 'N/A';
    // ✅ Priority: UserProfile.full_name > User.full_name (fallback)
    return student.full_name || 
           (users || []).find(u => u && u.id === student.user_id)?.full_name || 
           student.user_code || 'N/A';
  };

  const calculateCompletion = (student) => {
    if (!student) return 0;
    const fields = [
      'date_of_birth', 'gender', 'phone', 'address',
      'father_name', 'father_phone', 'mother_name', 'mother_phone'
    ];
    const filled = fields.filter(f => student[f]).length;
    return Math.round((filled / fields.length) * 100);
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="p-6 lg:p-8">
        
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to={createPageUrl("StudentManagement")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👨‍👩‍👧‍👦 Thông Tin Học Sinh & Phụ Huynh</h1>
          <p className="text-gray-600">Quản lý thông tin cá nhân và gia đình học sinh (đồng bộ với UserProfile)</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Student List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm học sinh..."
                    className="w-full pl-10 pr-4 py-2.5 border-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>Không tìm thấy</p>
                  </div>
                ) : (
                  filteredStudents.map((student, idx) => {
                    if (!student) return null;
                    const completion = calculateCompletion(student);
                    const isSelected = selectedStudent?.id === student.id;
                    
                    return (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsEditing(false);
                        }}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-50 border-2 border-indigo-600' 
                            : 'border-2 border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}>
                            <User className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{getStudentName(student)}</p>
                            <p className="text-xs text-gray-600">{student.user_code || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{student.class_name || 'Chưa có lớp'}</span>
                          <span className={`px-2 py-1 rounded-full ${
                            completion >= 80 ? 'bg-green-100 text-green-700' :
                            completion >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {completion}%
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Student Detail */}
          <div className="lg:col-span-2">
            {!selectedStudent ? (
              <div className="bg-white rounded-2xl shadow-sm border p-16 text-center">
                <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chọn học sinh</h3>
                <p className="text-gray-600">Chọn một học sinh từ danh sách để xem và chỉnh sửa thông tin</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Header with Avatar */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        {avatarFile ? (
                          <img
                            src={URL.createObjectURL(avatarFile)}
                            alt="Preview"
                            className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100"
                          />
                        ) : selectedStudent.avatar_url ? (
                          <img
                            src={selectedStudent.avatar_url}
                            alt={getStudentName(selectedStudent)}
                            className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border-4 border-indigo-100">
                            <User className="w-10 h-10 text-indigo-600" />
                          </div>
                        )}
                        {isEditing && (
                          <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-indigo-700">
                            <Camera className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setAvatarFile(e.target.files[0])}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.full_name || ''}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className="text-2xl font-bold border-2 border-indigo-600 rounded-lg px-3 py-1 mb-2"
                            placeholder="Họ và tên"
                          />
                        ) : (
                          <h2 className="text-2xl font-bold">{getStudentName(selectedStudent)}</h2>
                        )}
                        <p className="text-gray-600">{selectedStudent.user_code || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              // const user = (users || []).find(u => u && u.id === selectedStudent.user_id); // Original logic
                              setFormData({
                                ...selectedStudent,
                                full_name: selectedStudent.full_name || '' // Use selectedStudent.full_name
                              });
                              setAvatarFile(null);
                            }}
                            className="flex items-center gap-2 border-2 border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50"
                          >
                            <X className="w-5 h-5" />
                            Hủy
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <Save className="w-5 h-5" />
                            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(selectedStudent)}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
                        >
                          <Edit2 className="w-5 h-5" />
                          Chỉnh sửa
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-600">Lớp:</span>
                      <span className="font-medium">{selectedStudent.class_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-600">Khối:</span>
                      <span className="font-medium">{selectedStudent.grade_level || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-600">Hoàn thành:</span>
                      <span className="font-medium">{calculateCompletion(selectedStudent)}%</span>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    Thông Tin Cá Nhân
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {[
                      { key: 'date_of_birth', label: '📅 Ngày sinh', type: 'date' },
                      { key: 'gender', label: '👤 Giới tính', type: 'select', options: [
                        { value: 'male', label: 'Nam' },
                        { value: 'female', label: 'Nữ' },
                        { value: 'other', label: 'Khác' }
                      ]},
                      { key: 'ethnicity', label: '🌐 Dân tộc', type: 'text' },
                      { key: 'religion', label: '☪ Tôn giáo', type: 'text' },
                      { key: 'phone', label: '📱 SĐT', type: 'tel' },
                      { key: 'emergency_contact', label: '🚨 SĐT khẩn cấp', type: 'tel' },
                      { key: 'address', label: '🏠 Địa chỉ thường trú', type: 'text', colSpan: 2 },
                      { key: 'current_address', label: '📍 Địa chỉ tạm trú', type: 'text', colSpan: 2 },
                      { key: 'province', label: '🏙 Tỉnh/TP', type: 'text' },
                      { key: 'district', label: '🗺 Quận/Huyện', type: 'text' },
                      { key: 'ward', label: '📌 Phường/Xã', type: 'text' }
                    ].map(field => (
                      <div key={field.key} className={field.colSpan === 2 ? 'md:col-span-2' : ''}>
                        <label className="block text-gray-600 mb-1">{field.label}</label>
                        {isEditing ? (
                          field.type === 'select' ? (
                            <select
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg"
                            >
                              <option value="">Chọn</option>
                              {field.options?.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg"
                              placeholder={`Nhập ${field.label.split(' ')[1] || field.label}`}
                            />
                          )
                        ) : (
                          <p className="font-medium">
                            {field.key === 'gender' ? (
                              selectedStudent[field.key] === 'male' ? 'Nam' :
                              selectedStudent[field.key] === 'female' ? 'Nữ' :
                              selectedStudent[field.key] || 'Chưa có'
                            ) : selectedStudent[field.key] || 'Chưa có'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Family Info */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Thông Tin Phụ Huynh
                  </h3>

                  {/* Father */}
                  <div className="mb-6 pb-6 border-b">
                    <p className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                      👨 Cha
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {['father_name', 'father_phone', 'father_email', 'father_job', 'father_workplace'].map(field => (
                        <div key={field}>
                          <label className="block text-gray-600 mb-1">
                            {field === 'father_name' ? 'Họ tên' :
                             field === 'father_phone' ? '📱 SĐT' :
                             field === 'father_email' ? '📧 Email' :
                             field === 'father_job' ? '💼 Nghề nghiệp' :
                             field === 'father_workplace' ? '🏢 Nơi làm việc' : field}
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData[field] || ''}
                              onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          ) : (
                            <p className="font-medium">{selectedStudent[field] || 'Chưa có'}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mother */}
                  <div className="mb-6 pb-6 border-b">
                    <p className="font-bold text-pink-700 mb-3 flex items-center gap-2">
                      👩 Mẹ
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {['mother_name', 'mother_phone', 'mother_email', 'mother_job', 'mother_workplace'].map(field => (
                        <div key={field}>
                          <label className="block text-gray-600 mb-1">
                            {field === 'mother_name' ? 'Họ tên' :
                             field === 'mother_phone' ? '📱 SĐT' :
                             field === 'mother_email' ? '📧 Email' :
                             field === 'mother_job' ? '💼 Nghề nghiệp' :
                             field === 'mother_workplace' ? '🏢 Nơi làm việc' : field}
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData[field] || ''}
                              onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          ) : (
                            <p className="font-medium">{selectedStudent[field] || 'Chưa có'}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guardian */}
                  <div>
                    <p className="font-bold text-green-700 mb-3 flex items-center gap-2">
                      👤 Người Giám Hộ (nếu có)
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {['guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relationship'].map(field => (
                        <div key={field}>
                          <label className="block text-gray-600 mb-1">
                            {field === 'guardian_name' ? 'Họ tên' :
                             field === 'guardian_phone' ? '📱 SĐT' :
                             field === 'guardian_email' ? '📧 Email' :
                             field === 'guardian_relationship' ? '👥 Quan hệ' : field}
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData[field] || ''}
                              onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          ) : (
                            <p className="font-medium">{selectedStudent[field] || 'Chưa có'}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Circumstances */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-indigo-600" />
                    Hoàn Cảnh & Sức Khỏe
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">Tình trạng gia đình</label>
                      {isEditing ? (
                        <select
                          value={formData.family_status || ''}
                          onChange={(e) => setFormData({...formData, family_status: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">Chọn</option>
                          <option value="complete">Đầy đủ</option>
                          <option value="single_parent">Cha/Mẹ đơn thân</option>
                          <option value="orphan">Mồ côi</option>
                          <option value="other">Khác</option>
                        </select>
                      ) : (
                        <p className="font-medium">
                          {selectedStudent.family_status === 'complete' ? 'Đầy đủ' :
                           selectedStudent.family_status === 'single_parent' ? 'Cha/Mẹ đơn thân' :
                           selectedStudent.family_status === 'orphan' ? 'Mồ côi' :
                           selectedStudent.family_status || 'Chưa có'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Hoàn cảnh kinh tế</label>
                      {isEditing ? (
                        <select
                          value={formData.economic_status || ''}
                          onChange={(e) => setFormData({...formData, economic_status: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">Chọn</option>
                          <option value="poor">Nghèo</option>
                          <option value="near_poor">Cận nghèo</option>
                          <option value="average">Trung bình</option>
                          <option value="good">Khá giả</option>
                        </select>
                      ) : (
                        <p className="font-medium">
                          {selectedStudent.economic_status === 'poor' ? 'Nghèo' :
                           selectedStudent.economic_status === 'near_poor' ? 'Cận nghèo' :
                           selectedStudent.economic_status === 'average' ? 'Trung bình' :
                           selectedStudent.economic_status === 'good' ? 'Khá giả' :
                           'Chưa có'}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-600 mb-1">Hoàn cảnh đặc biệt</label>
                      {isEditing ? (
                        <textarea
                          value={formData.special_circumstances || ''}
                          onChange={(e) => setFormData({...formData, special_circumstances: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={2}
                        />
                      ) : (
                        <p className="font-medium">{selectedStudent.special_circumstances || 'Không'}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-600 mb-1">Ghi chú sức khỏe / Dị ứng</label>
                      {isEditing ? (
                        <textarea
                          value={formData.health_notes || ''}
                          onChange={(e) => setFormData({...formData, health_notes: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={2}
                          placeholder="Ghi chú sức khỏe, dị ứng, thuốc men..."
                        />
                      ) : (
                        <p className="font-medium">{selectedStudent.health_notes || 'Không'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Linked Parents */}
                {selectedStudent.parent_codes && selectedStudent.parent_codes.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h3 className="font-bold text-lg mb-4">👨‍👩‍👧 Phụ Huynh Đã Liên Kết</h3>
                    <div className="space-y-2">
                      {selectedStudent.parent_codes.map((code, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                          Mã PH: {code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
