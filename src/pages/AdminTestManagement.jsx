
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Search, Plus, Edit2, Trash2, Eye, Settings,
  BarChart3, PlayCircle, PauseCircle, CheckCircle, X, Loader2, ArrowLeft
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import { SkeletonTable } from "@/components/SkeletonLoader";

function AdminTestManagementContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // ✅ SIMPLIFIED STATE
  const [activeView, setActiveView] = useState("types"); // types | tests | questions
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});

  // Fetch data
  const { data: testTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['testTypes'],
    queryFn: () => base44.entities.TestType.list('order'),
    initialData: []
  });

  const { data: tests = [], isLoading: loadingTests } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const result = await base44.entities.Test.list('-created_date');
      console.log('✅ Tests loaded:', result.length);
      return result;
    },
    initialData: []
  });

  const { data: questions = [], isLoading: loadingQuestions, error: questionsError } = useQuery({
    queryKey: ['testQuestions', selectedTest?.id],
    queryFn: async () => {
      if (!selectedTest) {
        console.log('⚠️ No test selected');
        return [];
      }
      console.log('🔍 Fetching questions for test:', selectedTest.id);
      try {
        const result = await base44.entities.TestQuestion.filter({ test_id: selectedTest.id }, 'order');
        console.log('✅ Questions loaded:', result.length);
        return result;
      } catch (error) {
        console.error('❌ Error fetching questions:', error);
        throw error;
      }
    },
    enabled: !!selectedTest,
    initialData: []
  });

  // Stats
  const stats = useMemo(() => ({
    types: testTypes.length,
    tests: tests.length,
    published: tests.filter(t => t.is_published).length,
    questions: questions.length
  }), [testTypes, tests, questions]);

  // ✅ IMPROVED: Filtered tests based on selected type
  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      const matchesSearch = !searchTerm ||
        test.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.test_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !selectedType || test.test_type_id === selectedType.id;
      return matchesSearch && matchesType;
    });
  }, [tests, searchTerm, selectedType]);

  // Mutations
  const createTestTypeMutation = useMutation({
    mutationFn: (data) => base44.entities.TestType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testTypes'] });
      toast.success('Tạo loại test thành công!');
      setIsCreateModalOpen(false);
      setFormData({});
    },
    onError: (error) => toast.error(`Lỗi: ${error.message}`)
  });

  const createTestMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🚀 Creating test with data:', data);
      
      // Check if test_code already exists
      const existingTests = await base44.entities.Test.filter({ test_code: data.test_code });
      if (existingTests.length > 0) {
        throw new Error(`Test với mã "${data.test_code}" đã tồn tại!`);
      }
      
      const result = await base44.entities.Test.create(data);
      console.log('✅ Test created:', result);
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Tạo bài test thành công!');
      setIsCreateModalOpen(false);
      setFormData({});
    },
    onError: (error) => {
      console.error('❌ Error:', error);
      toast.error(error.message || 'Lỗi tạo bài test');
    }
  });

  const createQuestionMutation = useMutation({
    mutationFn: (data) => {
      console.log('🚀 Creating question:', data);
      return base44.entities.TestQuestion.create(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['testQuestions', selectedTest?.id] });
      toast.success('Tạo câu hỏi thành công!');
      setIsCreateModalOpen(false);
      setFormData({});
    },
    onError: (error) => {
      console.error('❌ Error:', error);
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const updateTestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Test.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Cập nhật thành công!');
      setIsEditModalOpen(false);
      setEditingItem(null);
      setFormData({});
    },
    onError: (error) => toast.error(`Lỗi: ${error.message}`)
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TestQuestion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testQuestions', selectedTest.id] });
      toast.success('Cập nhật câu hỏi thành công!');
      setIsEditModalOpen(false);
      setEditingItem(null);
      setFormData({});
    },
    onError: (error) => toast.error(`Lỗi: ${error.message}`)
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => base44.entities.TestQuestion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testQuestions', selectedTest.id] });
      toast.success('Xóa câu hỏi thành công!');
    },
    onError: (error) => toast.error(`Lỗi: ${error.message}`)
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, is_published }) => base44.entities.Test.update(id, { is_published: !is_published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Cập nhật trạng thái thành công!');
    },
    onError: (error) => toast.error(`Lỗi: ${error.message}`)
  });

  const deleteTestMutation = useMutation({
    mutationFn: (id) => base44.entities.Test.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Xóa bài test thành công!');
    },
    onError: (error) => toast.error(`Lỗi: ${error.message}`)
  });

  // ✅ HANDLERS
  const handleSelectType = (type) => {
    setSelectedType(type);
    setActiveView('tests'); // Auto switch to tests view
    setSearchTerm(''); // Reset search
  };

  const handleSelectTest = (test, e) => {
    // ✅ FIX: Stop event propagation
    if (e) {
      e.stopPropagation();
    }
    console.log('📝 Selected test:', test);
    setSelectedTest(test);
    setActiveView('questions'); // Auto switch to questions view
  };

  const handleBackToTests = () => {
    setSelectedTest(null);
    setActiveView('tests');
  };

  const handleBackToTypes = () => {
    setSelectedType(null);
    setSelectedTest(null);
    setActiveView('types');
  };

  const handleEdit = (item, type, e) => {
    // ✅ FIX: Stop event propagation
    if (e) {
      e.stopPropagation();
    }
    setEditingItem(item);
    setModalType(type);
    setFormData({ ...item });
    setIsEditModalOpen(true);
  };

  const handleViewDetail = (item, type, e) => {
    // ✅ FIX: Stop event propagation
    if (e) {
      e.stopPropagation();
    }
    setEditingItem(item);
    setModalType(type + '-detail');
    setIsDetailModalOpen(true);
  };

  const handleCreateClick = () => {
    setFormData({});
    if (activeView === 'types') {
      setModalType('test-type');
      setFormData({ 
        type_code: '', 
        type_name: '', 
        description: '', 
        category: 'personality',
        scoring_method: 'dimension',
        is_active: true,
        order: testTypes.length + 1
      });
    } else if (activeView === 'tests') {
      setModalType('test');
      setFormData({
        test_type_id: selectedType?.id || '',
        test_code: '',
        name: '',
        version: '1.0',
        description: '',
        duration_minutes: 30,
        question_count: 0,
        difficulty_level: 'medium',
        is_published: false,
        is_active: true,
        instructions: ''
      });
    } else if (activeView === 'questions' && selectedTest) {
      setModalType('question');
      setFormData({
        test_id: selectedTest.id,
        question_number: questions.length + 1,
        question_text: '',
        question_type: 'scale',
        options: [
          {label: '1', value: '1', score: 1},
          {label: '2', value: '2', score: 2},
          {label: '3', value: '3', score: 3},
          {label: '4', value: '4', score: 4},
          {label: '5', value: '5', score: 5}
        ],
        dimension: '',
        weight: 1,
        is_required: true,
        order: questions.length + 1
      });
    }
    setIsCreateModalOpen(true);
  };

  const handleSubmitCreate = () => {
    if (modalType === 'test-type') {
      if (!formData.type_code || !formData.type_name) {
        toast.warning('Vui lòng điền đầy đủ thông tin!');
        return;
      }
      createTestTypeMutation.mutate(formData);
    } else if (modalType === 'test') {
      if (!formData.test_code || !formData.name || !formData.test_type_id) {
        toast.warning('Vui lòng điền đầy đủ thông tin!');
        return;
      }
      createTestMutation.mutate(formData);
    } else if (modalType === 'question') {
      if (!formData.question_text) {
        toast.warning('Vui lòng nhập nội dung câu hỏi!');
        return;
      }
      createQuestionMutation.mutate(formData);
    }
  };

  const handleSubmitEdit = () => {
    if (modalType === 'test' && editingItem) {
      if (!formData.test_code || !formData.name || !formData.test_type_id) {
        toast.warning('Vui lòng điền đầy đủ thông tin!');
        return;
      }
      updateTestMutation.mutate({ id: editingItem.id, data: formData });
    } else if (modalType === 'question' && editingItem) {
      if (!formData.question_text) {
        toast.warning('Vui lòng nhập nội dung câu hỏi!');
        return;
      }
      updateQuestionMutation.mutate({ id: editingItem.id, data: formData });
    }
  };

  const addOption = () => {
    const newOptions = [...(formData.options || []), { label: '', value: '', score: 0 }];
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index][field] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            {activeView === 'tests' && (
              <button onClick={handleBackToTypes} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {activeView === 'questions' && (
              <button onClick={handleBackToTests} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {activeView === 'types' && 'Loại Test'}
                {activeView === 'tests' && (selectedType ? `Bài Test - ${selectedType.type_name}` : 'Bài Test')}
                {activeView === 'questions' && (selectedTest ? `Câu Hỏi - ${selectedTest.name}` : 'Câu Hỏi')}
              </h1>
              <p className="text-gray-600">
                {activeView === 'types' && 'Quản lý các loại trắc nghiệm'}
                {activeView === 'tests' && 'Quản lý bài test và cấu hình'}
                {activeView === 'questions' && 'Quản lý câu hỏi trong bài test'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <p className="text-2xl font-bold text-indigo-600">{stats.types}</p>
            <p className="text-xs text-gray-600">Loại test</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <p className="text-2xl font-bold text-blue-600">{stats.tests}</p>
            <p className="text-xs text-gray-600">Bài test</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            <p className="text-xs text-gray-600">Đã publish</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <p className="text-2xl font-bold text-purple-600">{stats.questions}</p>
            <p className="text-xs text-gray-600">Câu hỏi (test hiện tại)</p>
          </div>
        </div>

        {/* ✅ VIEW: TEST TYPES */}
        {activeView === 'types' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm loại test..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl"
                />
              </div>
              <button
                onClick={handleCreateClick}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Thêm loại test
              </button>
            </div>

            {loadingTypes ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : testTypes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Chưa có loại test"
                description="Tạo loại test đầu tiên để bắt đầu"
                actionLabel="Thêm loại test"
                onAction={handleCreateClick}
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testTypes.map(type => (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleSelectType(type)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                        {tests.filter(t => t.test_type_id === type.id).length} bài test
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{type.type_name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{type.description}</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {type.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        type.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ✅ VIEW: TESTS */}
        {activeView === 'tests' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm bài test..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl"
                />
              </div>
              <button
                onClick={handleCreateClick}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Thêm bài test
              </button>
            </div>

            {selectedType && (
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-xl mb-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-indigo-900">Đang lọc: {selectedType.type_name}</p>
                  <p className="text-sm text-indigo-700">{filteredTests.length} bài test</p>
                </div>
                <button
                  onClick={handleBackToTypes}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {loadingTests ? (
              <SkeletonTable rows={5} cols={6} />
            ) : filteredTests.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Chưa có bài test"
                description={selectedType ? `Tạo bài test đầu tiên cho ${selectedType.type_name}` : "Tạo bài test đầu tiên"}
                actionLabel="Thêm bài test"
                onAction={handleCreateClick}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Bài test</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Loại</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Câu hỏi</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Thời gian</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Trạng thái</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredTests.map(test => {
                      const testType = testTypes.find(t => t.id === test.test_type_id);
                      return (
                        <tr key={test.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{test.name}</p>
                              <p className="text-xs text-gray-500">{test.test_code}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {testType?.type_name || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">{test.question_count || 0}</td>
                          <td className="px-6 py-4 text-sm">{test.duration_minutes || 'N/A'} phút</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {test.is_published ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <PauseCircle className="w-4 h-4 text-gray-400" />
                              )}
                              <span className={`text-xs ${test.is_published ? 'text-green-600' : 'text-gray-500'}`}>
                                {test.is_published ? 'Published' : 'Draft'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => handleViewDetail(test, 'test', e)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleEdit(test, 'test', e)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleSelectTest(test, e)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Quản lý câu hỏi"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePublishMutation.mutate({ id: test.id, is_published: test.is_published });
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title={test.is_published ? 'Unpublish' : 'Publish'}
                              >
                                {test.is_published ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Xóa bài test "${test.name}"?\n\n⚠️ Cảnh báo: Tất cả câu hỏi và kết quả test liên quan sẽ bị xóa!`)) {
                                    deleteTestMutation.mutate(test.id);
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ✅ VIEW: QUESTIONS */}
        {activeView === 'questions' && (
          <div>
            {!selectedTest ? (
              <EmptyState
                icon={FileText}
                title="Chọn bài test"
                description="Vui lòng chọn một bài test để xem câu hỏi"
              />
            ) : (
              <div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedTest.name}</h3>
                      <p className="text-gray-600">{selectedTest.description}</p>
                    </div>
                    <button
                      onClick={handleCreateClick}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
                    >
                      <Plus className="w-5 h-5" />
                      Thêm câu hỏi
                    </button>
                  </div>
                </div>

                {loadingQuestions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : questionsError ? (
                  <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-xl">
                    <p className="text-red-800 font-medium">❌ Lỗi tải câu hỏi</p>
                    <p className="text-red-600 text-sm mt-1">{questionsError.message}</p>
                  </div>
                ) : questions.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="Chưa có câu hỏi"
                    description="Thêm câu hỏi đầu tiên cho bài test này"
                    actionLabel="Thêm câu hỏi"
                    onAction={handleCreateClick}
                  />
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, index) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-indigo-600">{q.question_number}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-3">{q.question_text}</p>
                            {q.options && q.options.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {q.options.map((opt, idx) => (
                                  <div key={idx} className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                    <span className="font-medium">{opt.label}:</span>
                                    <span>{opt.value}</span>
                                    {opt.score !== undefined && <span className="ml-auto text-indigo-600">+{opt.score}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2 items-center">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {q.question_type}
                              </span>
                              {q.dimension && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                  Dimension: {q.dimension}
                                </span>
                              )}
                              <div className="ml-auto flex gap-2">
                                <button
                                  onClick={() => handleEdit(q, 'question')}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Sửa"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Xóa câu hỏi "${q.question_text}"?`)) {
                                      deleteQuestionMutation.mutate(q.id);
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalType === 'test-type' && 'Tạo Loại Test'}
                {modalType === 'test' && 'Tạo Bài Test'}
                {modalType === 'question' && 'Tạo Câu Hỏi'}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Test Type Form */}
              {modalType === 'test-type' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mã loại test *</label>
                    <input
                      type="text"
                      value={formData.type_code || ''}
                      onChange={(e) => setFormData({...formData, type_code: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                      placeholder="holland, mbti, iq..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên loại test *</label>
                    <input
                      type="text"
                      value={formData.type_name || ''}
                      onChange={(e) => setFormData({...formData, type_name: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                    <select
                      value={formData.category || 'personality'}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                    >
                      <option value="personality">Tính cách</option>
                      <option value="intelligence">Trí tuệ</option>
                      <option value="aptitude">Năng khiếu</option>
                      <option value="skill">Kỹ năng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phương pháp tính điểm</label>
                    <select
                      value={formData.scoring_method || 'dimension'}
                      onChange={(e) => setFormData({...formData, scoring_method: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                    >
                      <option value="sum">Tổng điểm</option>
                      <option value="average">Trung bình</option>
                      <option value="dimension">Theo chiều đo</option>
                      <option value="type_matching">Khớp nhóm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* Test Form */}
              {modalType === 'test' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại test *</label>
                    <select
                      value={formData.test_type_id || ''}
                      onChange={(e) => setFormData({...formData, test_type_id: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                    >
                      <option value="">Chọn loại test</option>
                      {testTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.type_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mã bài test *</label>
                      <input
                        type="text"
                        value={formData.test_code || ''}
                        onChange={(e) => setFormData({...formData, test_code: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
                      <input
                        type="text"
                        value={formData.version || '1.0'}
                        onChange={(e) => setFormData({...formData, version: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên bài test *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hướng dẫn làm bài</label>
                    <textarea
                      value={formData.instructions || ''}
                      onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-xl"
                      placeholder="Hướng dẫn chi tiết cho người làm bài..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian (phút)</label>
                      <input
                        type="number"
                        value={formData.duration_minutes || 30}
                        onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
                      <select
                        value={formData.difficulty_level || 'medium'}
                        onChange={(e) => setFormData({...formData, difficulty_level: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl"
                      >
                        <option value="easy">Dễ</option>
                        <option value="medium">Trung bình</option>
                        <option value="hard">Khó</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Question Form */}
              {modalType === 'question' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số thứ tự</label>
                    <input
                      type="number"
                      value={formData.question_number || 1}
                      onChange={(e) => setFormData({...formData, question_number: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung câu hỏi *</label>
                    <textarea
                      value={formData.question_text || ''}
                      onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-xl"
                      placeholder="Nhập câu hỏi..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loại câu hỏi</label>
                      <select
                        value={formData.question_type || 'scale'}
                        onChange={(e) => setFormData({...formData, question_type: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl"
                      >
                        <option value="multiple_choice">Nhiều lựa chọn</option>
                        <option value="scale">Thang điểm</option>
                        <option value="binary">Đúng/Sai</option>
                        <option value="text">Văn bản</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chiều đo</label>
                      <input
                        type="text"
                        value={formData.dimension || ''}
                        onChange={(e) => setFormData({...formData, dimension: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl"
                        placeholder="R, I, A, S, E, C..."
                      />
                    </div>
                  </div>

                  {/* Options Builder */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Các lựa chọn</label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm lựa chọn
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(formData.options || []).map((option, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <input
                            type="text"
                            value={option.label || ''}
                            onChange={(e) => updateOption(index, 'label', e.target.value)}
                            placeholder="Nhãn"
                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={option.value || ''}
                            onChange={(e) => updateOption(index, 'value', e.target.value)}
                            placeholder="Giá trị"
                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          />
                          <input
                            type="number"
                            value={option.score || 0}
                            onChange={(e) => updateOption(index, 'score', parseInt(e.target.value) || 0)}
                            placeholder="Điểm"
                            className="w-20 px-3 py-2 border rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 border py-3 rounded-xl hover:bg-gray-50"
                disabled={createTestTypeMutation.isPending || createTestMutation.isPending || createQuestionMutation.isPending}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitCreate}
                disabled={createTestTypeMutation.isPending || createTestMutation.isPending || createQuestionMutation.isPending}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(createTestTypeMutation.isPending || createTestMutation.isPending || createQuestionMutation.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Tạo
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsEditModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalType === 'test' && 'Chỉnh sửa Bài Test'}
                {modalType === 'question' && 'Chỉnh sửa Câu Hỏi'}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Test Form (Edit) */}
              {modalType === 'test' && editingItem && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại test *</label>
                    <select
                      value={formData.test_type_id || ''}
                      onChange={(e) => setFormData({...formData, test_type_id: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                    >
                      <option value="">Chọn loại test</option>
                      {testTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.type_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mã bài test *</label>
                      <input
                        type="text"
                        value={formData.test_code || ''}
                        onChange={(e) => setFormData({...formData, test_code: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
                      <input
                        type="text"
                        value={formData.version || '1.0'}
                        onChange={(e) => setFormData({...formData, version: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên bài test *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hướng dẫn làm bài</label>
                    <textarea
                      value={formData.instructions || ''}
                      onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-xl"
                      placeholder="Hướng dẫn chi tiết cho người làm bài..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian (phút)</label>
                      <input
                        type="number"
                        value={formData.duration_minutes || 30}
                        onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
                      <select
                        value={formData.difficulty_level || 'medium'}
                        onChange={(e) => setFormData({...formData, difficulty_level: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl"
                      >
                        <option value="easy">Dễ</option>
                        <option value="medium">Trung bình</option>
                        <option value="hard">Khó</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Question Form (Edit) */}
              {modalType === 'question' && editingItem && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số thứ tự</label>
                    <input
                      type="number"
                      value={formData.question_number || 1}
                      onChange={(e) => setFormData({...formData, question_number: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung câu hỏi *</label>
                    <textarea
                      value={formData.question_text || ''}
                      onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-xl"
                      placeholder="Nhập câu hỏi..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loại câu hỏi</label>
                      <select
                        value={formData.question_type || 'scale'}
                        onChange={(e) => setFormData({...formData, question_type: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl"
                      >
                        <option value="multiple_choice">Nhiều lựa chọn</option>
                        <option value="scale">Thang điểm</option>
                        <option value="binary">Đúng/Sai</option>
                        <option value="text">Văn bản</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chiều đo</label>
                      <input
                        type="text"
                        value={formData.dimension || ''}
                        onChange={(e) => setFormData({...formData, dimension: e.target.value})}
                        className="w-full px-4 py-3 border rounded-xl"
                        placeholder="R, I, A, S, E, C..."
                      />
                    </div>
                  </div>

                  {/* Options Builder */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Các lựa chọn</label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm lựa chọn
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(formData.options || []).map((option, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <input
                            type="text"
                            value={option.label || ''}
                            onChange={(e) => updateOption(index, 'label', e.target.value)}
                            placeholder="Nhãn"
                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={option.value || ''}
                            onChange={(e) => updateOption(index, 'value', e.target.value)}
                            placeholder="Giá trị"
                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          />
                          <input
                            type="number"
                            value={option.score || 0}
                            onChange={(e) => updateOption(index, 'score', parseInt(e.target.value) || 0)}
                            placeholder="Điểm"
                            className="w-20 px-3 py-2 border rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 border py-3 rounded-xl hover:bg-gray-50"
                disabled={updateTestMutation.isPending || updateQuestionMutation.isPending}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitEdit}
                disabled={updateTestMutation.isPending || updateQuestionMutation.isPending}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(updateTestMutation.isPending || updateQuestionMutation.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Lưu
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalType === 'test-detail' && `Chi tiết Bài Test: ${editingItem?.name}`}
              </h2>
              <button onClick={() => setIsDetailModalOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-gray-700">
              {modalType === 'test-detail' && editingItem && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mã bài test</p>
                    <p className="text-lg font-semibold">{editingItem.test_code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Loại test</p>
                    <p className="text-lg">{testTypes.find(t => t.id === editingItem.test_type_id)?.type_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mô tả</p>
                    <p className="text-lg">{editingItem.description || 'Không có mô tả'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Hướng dẫn</p>
                    <p className="text-lg whitespace-pre-wrap">{editingItem.instructions || 'Không có hướng dẫn'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Thời gian làm bài</p>
                      <p className="text-lg">{editingItem.duration_minutes} phút</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Độ khó</p>
                      <p className="text-lg capitalize">{editingItem.difficulty_level}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Số câu hỏi</p>
                      <p className="text-lg">{editingItem.question_count}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                      <p className="text-lg flex items-center gap-2">
                        {editingItem.is_published ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <PauseCircle className="w-5 h-5 text-gray-400" />
                        )}
                        {editingItem.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="border py-3 px-6 rounded-xl hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminTestManagement() {
  return (
    <ToastProvider>
      <AdminTestManagementContent />
    </ToastProvider>
  );
}
