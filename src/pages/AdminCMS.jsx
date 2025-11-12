import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Edit2, Trash2, Save, X, Image as ImageIcon, 
  Upload, Eye, Search, Grid3x3, List, Table2, Link as LinkIcon,
  AlertCircle, Check, Loader2, Copy, Download
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";

function AdminCMSContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('content');
  const [galleryViewMode, setGalleryViewMode] = useState('grid'); // grid, list, table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPage, setFilterPage] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file'); // file, url
  const [validationErrors, setValidationErrors] = useState([]);
  
  const [contentForm, setContentForm] = useState({
    page_key: 'about_us',
    page_name: 'Về chúng tôi',
    section_key: '',
    section_type: 'text',
    title: '',
    subtitle: '',
    content: '',
    content_lines: [],
    data_json: {},
    icon: '',
    link_url: '',
    link_text: '',
    background_style: '',
    order: 0,
    is_active: true
  });

  const [imageForm, setImageForm] = useState({
    title: '',
    image_url: '',
    alt_text: '',
    category: 'hoạt động khác',
    description: '',
    tags: [],
    order: 0,
    is_active: true,
    featured: false
  });

  // Queries
  const { data: cmsContent = [], isLoading: loadingContent } = useQuery({
    queryKey: ['cmsContent'],
    queryFn: () => base44.entities.CMSContent.list('order'),
    initialData: []
  });

  const { data: galleryImages = [], isLoading: loadingImages } = useQuery({
    queryKey: ['galleryImages'],
    queryFn: () => base44.entities.GalleryImage.list('order'),
    initialData: []
  });

  // Mutations
  const createContentMutation = useMutation({
    mutationFn: (data) => base44.entities.CMSContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsContent'] });
      toast.success('✅ Tạo nội dung thành công!');
      setShowAddContentModal(false);
      resetContentForm();
    },
    onError: (error) => {
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  });

  const updateContentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CMSContent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsContent'] });
      toast.success('✅ Cập nhật thành công!');
      setEditingContent(null);
    },
    onError: (error) => {
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  });

  const deleteContentMutation = useMutation({
    mutationFn: (id) => base44.entities.CMSContent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsContent'] });
      toast.success('✅ Xóa thành công!');
    },
    onError: (error) => {
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  });

  const createImageMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return await base44.entities.GalleryImage.create({
        ...data,
        uploaded_by: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      toast.success('✅ Thêm ảnh thành công!');
      setShowAddImageModal(false);
      resetImageForm();
    },
    onError: (error) => {
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GalleryImage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      toast.success('✅ Cập nhật ảnh thành công!');
      setEditingImage(null);
    },
    onError: (error) => {
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id) => base44.entities.GalleryImage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      toast.success('✅ Xóa ảnh thành công!');
    },
    onError: (error) => {
      toast.error(`❌ Lỗi: ${error.message}`);
    }
  });

  // ✅ ENHANCED: Image validation
  const validateImage = (file) => {
    const errors = [];
    
    // File type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      errors.push('Chỉ chấp nhận file JPG, PNG, WebP, GIF');
    }
    
    // File size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`Kích thước file tối đa 5MB (file này: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    // Min size (10KB)
    const minSize = 10 * 1024;
    if (file.size < minSize) {
      errors.push('File quá nhỏ, có thể bị hỏng');
    }
    
    return errors;
  };

  // ✅ ENHANCED: URL validation
  const validateImageUrl = (url) => {
    const errors = [];
    
    if (!url) {
      errors.push('URL không được để trống');
      return errors;
    }
    
    try {
      const urlObj = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('URL phải bắt đầu với http:// hoặc https://');
      }
      
      // Check image extensions
      const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const hasValidExt = validExts.some(ext => url.toLowerCase().includes(ext));
      if (!hasValidExt) {
        errors.push('URL phải là link ảnh (.jpg, .png, .webp, .gif)');
      }
    } catch (e) {
      errors.push('URL không hợp lệ');
    }
    
    return errors;
  };

  const handleUploadImage = async () => {
    setValidationErrors([]);
    
    if (uploadMethod === 'file') {
      if (!imageFile) {
        toast.error('Vui lòng chọn ảnh');
        return;
      }
      
      const errors = validateImage(imageFile);
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error('❌ File không hợp lệ');
        return;
      }
      
      try {
        setIsUploading(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
        
        // Get image dimensions
        const img = new Image();
        img.src = URL.createObjectURL(imageFile);
        await new Promise((resolve) => { img.onload = resolve; });
        
        setImageForm({ 
          ...imageForm, 
          image_url: file_url,
          file_size: imageFile.size,
          file_type: imageFile.type,
          width: img.width,
          height: img.height
        });
        toast.success('✅ Upload ảnh thành công!');
      } catch (error) {
        toast.error(`❌ Lỗi upload: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    } else {
      // URL method
      const errors = validateImageUrl(imageUrlInput);
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error('❌ URL không hợp lệ');
        return;
      }
      
      setImageForm({ ...imageForm, image_url: imageUrlInput });
      toast.success('✅ Đã thêm URL ảnh!');
    }
  };

  const resetContentForm = () => {
    setContentForm({
      page_key: 'about_us',
      page_name: 'Về chúng tôi',
      section_key: '',
      section_type: 'text',
      title: '',
      subtitle: '',
      content: '',
      content_lines: [],
      data_json: {},
      icon: '',
      link_url: '',
      link_text: '',
      background_style: '',
      order: 0,
      is_active: true
    });
  };

  const resetImageForm = () => {
    setImageForm({
      title: '',
      image_url: '',
      alt_text: '',
      category: 'hoạt động khác',
      description: '',
      tags: [],
      order: 0,
      is_active: true,
      featured: false
    });
    setImageFile(null);
    setImageUrlInput('');
    setValidationErrors([]);
    setUploadMethod('file');
  };

  const filteredContent = useMemo(() => {
    return cmsContent.filter(item => {
      const matchSearch = !searchTerm || 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPage = filterPage === 'all' || item.page_key === filterPage;
      return matchSearch && matchPage;
    });
  }, [cmsContent, searchTerm, filterPage]);

  const filteredImages = useMemo(() => {
    return galleryImages.filter(img => {
      const matchSearch = !searchTerm || 
        img.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === 'all' || img.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [galleryImages, searchTerm, filterCategory]);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Quản Lý Nội Dung (CMS)</h1>
              <p className="text-gray-600">
                Chỉnh sửa nội dung trang Về chúng tôi, Liên hệ, Gallery
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b mb-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`pb-3 px-4 font-medium transition-colors relative ${
                activeTab === 'content' ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Nội dung ({cmsContent.length})
              {activeTab === 'content' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`pb-3 px-4 font-medium transition-colors relative ${
                activeTab === 'gallery' ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <ImageIcon className="w-5 h-5 inline mr-2" />
              Gallery ({galleryImages.length})
              {activeTab === 'gallery' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          </div>
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <select
                    value={filterPage}
                    onChange={(e) => setFilterPage(e.target.value)}
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Tất cả trang</option>
                    <option value="about_us">Về chúng tôi</option>
                    <option value="contact">Liên hệ</option>
                    <option value="gallery">Gallery</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowAddContentModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 ml-4 shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Thêm nội dung
                </button>
              </div>
            </div>

            {loadingContent ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
              </div>
            ) : filteredContent.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Chưa có nội dung"
                description="Thêm nội dung mới cho các trang"
              />
            ) : (
              <div className="space-y-4">
                {filteredContent.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.page_key === 'about_us' ? 'bg-blue-100 text-blue-700' :
                            item.page_key === 'contact' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {item.page_name || item.page_key}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.is_active ? '✓ Active' : '✗ Hidden'}
                          </span>
                          <span className="text-xs text-gray-500">#{item.order}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title || 'Untitled'}</h3>
                        {item.subtitle && <p className="text-sm text-indigo-600 mb-2">{item.subtitle}</p>}
                        <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                        {item.icon && (
                          <p className="text-xs text-gray-500 mt-2">Icon: {item.icon}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingContent(item)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Xóa nội dung này?')) {
                              deleteContentMutation.mutate(item.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm ảnh..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Tất cả danh mục</option>
                    <option value="cơ sở vật chất">Cơ sở vật chất</option>
                    <option value="hướng nghiệp">Hướng nghiệp</option>
                    <option value="tư vấn">Tư vấn</option>
                    <option value="đánh giá">Đánh giá</option>
                    <option value="tuyển sinh">Tuyển sinh</option>
                    <option value="công nghệ">Công nghệ</option>
                    <option value="định hướng">Định hướng</option>
                    <option value="hoạt động khác">Hoạt động khác</option>
                  </select>
                  
                  {/* View Mode Toggle */}
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setGalleryViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        galleryViewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600'
                      }`}
                      title="Grid View"
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setGalleryViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        galleryViewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600'
                      }`}
                      title="List View"
                    >
                      <List className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setGalleryViewMode('table')}
                      className={`p-2 rounded-lg transition-colors ${
                        galleryViewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600'
                      }`}
                      title="Table View"
                    >
                      <Table2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddImageModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 ml-4 shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Thêm ảnh
                </button>
              </div>
            </div>

            {loadingImages ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
              </div>
            ) : filteredImages.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="Chưa có ảnh"
                description="Thêm ảnh mới vào gallery"
              />
            ) : (
              <>
                {/* Grid View */}
                {galleryViewMode === 'grid' && (
                  <div className="grid md:grid-cols-3 gap-6">
                    {filteredImages.map((image, idx) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-2xl overflow-hidden shadow-lg border hover:shadow-xl transition-all group"
                      >
                        <div className="relative h-48">
                          <img
                            src={image.image_url}
                            alt={image.alt_text || image.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {image.featured && (
                            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                              ⭐ Nổi bật
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => setEditingImage(image)}
                                className="flex-1 p-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-1"
                              >
                                <Edit2 className="w-4 h-4" />
                                <span className="text-sm">Sửa</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Xóa ảnh này?')) {
                                    deleteImageMutation.mutate(image.id);
                                  }
                                }}
                                className="flex-1 p-2 bg-white text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm">Xóa</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-gray-900 mb-1 truncate">{image.title}</h4>
                          <p className="text-xs text-indigo-600 mb-2">{image.category}</p>
                          {image.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{image.description}</p>
                          )}
                          {image.width && image.height && (
                            <p className="text-xs text-gray-500 mt-2">
                              {image.width} × {image.height}px
                              {image.file_size && ` • ${(image.file_size / 1024).toFixed(0)}KB`}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {galleryViewMode === 'list' && (
                  <div className="space-y-4">
                    {filteredImages.map((image, idx) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-all flex items-center gap-4"
                      >
                        <img
                          src={image.image_url}
                          alt={image.alt_text}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 truncate">{image.title}</h4>
                            {image.featured && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⭐</span>
                            )}
                          </div>
                          <p className="text-xs text-indigo-600 mb-1">{image.category}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{image.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {image.width && <span>{image.width}×{image.height}px</span>}
                            {image.file_size && <span>{(image.file_size / 1024).toFixed(0)}KB</span>}
                            <span>#{image.order}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => window.open(image.image_url, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Xem ảnh"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingImage(image)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Xóa ảnh này?')) {
                                deleteImageMutation.mutate(image.id);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Table View */}
                {galleryViewMode === 'table' && (
                  <div className="bg-white rounded-2xl shadow-lg border overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Preview</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Tiêu đề</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Danh mục</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Kích thước</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Trạng thái</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredImages.map((image) => (
                          <tr key={image.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <img
                                src={image.image_url}
                                alt={image.alt_text}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-gray-900">{image.title}</p>
                                <p className="text-xs text-gray-500">{image.alt_text}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                                {image.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {image.width && <p>{image.width}×{image.height}px</p>}
                              {image.file_size && <p className="text-gray-500">{(image.file_size / 1024).toFixed(0)}KB</p>}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className={`text-xs px-2 py-1 rounded-full w-fit ${
                                  image.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {image.is_active ? '✓ Active' : '✗ Hidden'}
                                </span>
                                {image.featured && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full w-fit">
                                    ⭐ Featured
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => window.open(image.image_url, '_blank')}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingImage(image)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Xóa ảnh này?')) {
                                      deleteImageMutation.mutate(image.id);
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Add/Edit Content Modal */}
        {(showAddContentModal || editingContent) && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddContentModal(false);
              setEditingContent(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-xl font-bold">
                  {editingContent ? 'Chỉnh sửa nội dung' : 'Thêm nội dung mới'}
                </h3>
                <button onClick={() => {
                  setShowAddContentModal(false);
                  setEditingContent(null);
                }}>
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Trang *</label>
                    <select
                      value={editingContent ? editingContent.page_key : contentForm.page_key}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, page_key: e.target.value})
                        : setContentForm({...contentForm, page_key: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="about_us">Về chúng tôi</option>
                      <option value="contact">Liên hệ</option>
                      <option value="gallery">Gallery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Section Key *</label>
                    <input
                      type="text"
                      value={editingContent ? editingContent.section_key : contentForm.section_key}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, section_key: e.target.value})
                        : setContentForm({...contentForm, section_key: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="header, mission, highlights, government_banner..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Loại *</label>
                    <select
                      value={editingContent ? editingContent.section_type : contentForm.section_type}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, section_type: e.target.value})
                        : setContentForm({...contentForm, section_type: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="text">Text</option>
                      <option value="rich_text">Rich Text</option>
                      <option value="image">Image</option>
                      <option value="json">JSON</option>
                      <option value="list">List</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Icon (lucide-react)</label>
                    <input
                      type="text"
                      value={editingContent ? editingContent.icon : contentForm.icon}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, icon: e.target.value})
                        : setContentForm({...contentForm, icon: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Target, Users, BookOpen..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tiêu đề</label>
                    <input
                      type="text"
                      value={editingContent ? editingContent.title : contentForm.title}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, title: e.target.value})
                        : setContentForm({...contentForm, title: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phụ đề</label>
                    <input
                      type="text"
                      value={editingContent ? editingContent.subtitle : contentForm.subtitle}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, subtitle: e.target.value})
                        : setContentForm({...contentForm, subtitle: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Subtitle (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nội dung</label>
                  <textarea
                    value={editingContent ? editingContent.content : contentForm.content}
                    onChange={(e) => editingContent 
                      ? setEditingContent({...editingContent, content: e.target.value})
                      : setContentForm({...contentForm, content: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows="6"
                    placeholder="Nhập nội dung HTML hoặc text..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Link URL</label>
                    <input
                      type="url"
                      value={editingContent ? editingContent.link_url : contentForm.link_url}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, link_url: e.target.value})
                        : setContentForm({...contentForm, link_url: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Link Text</label>
                    <input
                      type="text"
                      value={editingContent ? editingContent.link_text : contentForm.link_text}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, link_text: e.target.value})
                        : setContentForm({...contentForm, link_text: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Xem văn bản chính thức..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Background Style</label>
                    <input
                      type="text"
                      value={editingContent ? editingContent.background_style : contentForm.background_style}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, background_style: e.target.value})
                        : setContentForm({...contentForm, background_style: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="from-indigo-600 to-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Thứ tự</label>
                    <input
                      type="number"
                      value={editingContent ? editingContent.order : contentForm.order}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, order: parseInt(e.target.value) || 0})
                        : setContentForm({...contentForm, order: parseInt(e.target.value) || 0})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingContent ? editingContent.is_active : contentForm.is_active}
                        onChange={(e) => editingContent 
                          ? setEditingContent({...editingContent, is_active: e.target.checked})
                          : setContentForm({...contentForm, is_active: e.target.checked})
                        }
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <span className="text-sm font-medium">Hiển thị</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowAddContentModal(false);
                    setEditingContent(null);
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (editingContent) {
                      const { id, created_date, updated_date, created_by, ...data } = editingContent;
                      updateContentMutation.mutate({ id, data });
                    } else {
                      createContentMutation.mutate(contentForm);
                    }
                  }}
                  disabled={createContentMutation.isPending || updateContentMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(createContentMutation.isPending || updateContentMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingContent ? 'Cập nhật' : 'Tạo mới'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add/Edit Image Modal - ENHANCED */}
        {(showAddImageModal || editingImage) && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddImageModal(false);
              setEditingImage(null);
              resetImageForm();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-xl font-bold">
                  {editingImage ? 'Chỉnh sửa ảnh' : 'Thêm ảnh mới'}
                </h3>
                <button onClick={() => {
                  setShowAddImageModal(false);
                  setEditingImage(null);
                  resetImageForm();
                }}>
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Upload Method Toggle */}
                {!editingImage && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
                    <label className="block text-sm font-medium mb-3">Chọn phương thức thêm ảnh:</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setUploadMethod('file')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          uploadMethod === 'file'
                            ? 'border-indigo-600 bg-white shadow-md'
                            : 'border-gray-200 bg-white/50'
                        }`}
                      >
                        <Upload className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                        <p className="font-bold text-sm">Upload File</p>
                        <p className="text-xs text-gray-600">JPG, PNG, WebP, GIF</p>
                      </button>
                      <button
                        onClick={() => setUploadMethod('url')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          uploadMethod === 'url'
                            ? 'border-indigo-600 bg-white shadow-md'
                            : 'border-gray-200 bg-white/50'
                        }`}
                      >
                        <LinkIcon className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                        <p className="font-bold text-sm">Dùng URL</p>
                        <p className="text-xs text-gray-600">Unsplash, CDN...</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h4 className="font-bold text-red-800">Lỗi validation:</h4>
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {validationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Image Upload - File Method */}
                {!editingImage && uploadMethod === 'file' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload ảnh *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                      {imageFile ? (
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(imageFile)}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg shadow-lg"
                          />
                          <div className="mt-3 flex items-center justify-center gap-4 text-sm text-gray-600">
                            <span>{imageFile.name}</span>
                            <span>•</span>
                            <span>{(imageFile.size / 1024).toFixed(0)}KB</span>
                            <span>•</span>
                            <span>{imageFile.type}</span>
                          </div>
                          <button
                            onClick={() => {
                              setImageFile(null);
                              setValidationErrors([]);
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600 mb-2">Click để chọn ảnh hoặc kéo thả vào đây</p>
                          <p className="text-xs text-gray-500">
                            JPG, PNG, WebP, GIF • Tối đa 5MB • Tối thiểu 800×600px
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const errors = validateImage(file);
                                setValidationErrors(errors);
                                if (errors.length === 0) {
                                  setImageFile(file);
                                } else {
                                  toast.error('File không hợp lệ');
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    {imageFile && !imageForm.image_url && (
                      <button
                        onClick={handleUploadImage}
                        disabled={isUploading}
                        className="w-full mt-3 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-md"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang upload...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Upload ảnh lên server
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Image Upload - URL Method */}
                {!editingImage && uploadMethod === 'url' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">URL ảnh *</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                      <button
                        onClick={handleUploadImage}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Thêm
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Tip: Dùng Unsplash cho ảnh chất lượng cao miễn phí
                    </p>
                    {imageUrlInput && (
                      <div className="mt-3 border rounded-lg p-3 bg-gray-50">
                        <p className="text-xs text-gray-600 mb-2">Preview:</p>
                        <img
                          src={imageUrlInput}
                          alt="URL Preview"
                          className="max-h-48 mx-auto rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            toast.error('URL ảnh không hợp lệ hoặc không tải được');
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Current Image Display (Edit mode) */}
                {editingImage?.image_url && (
                  <div className="border-2 border-indigo-200 rounded-xl p-4 bg-indigo-50">
                    <p className="text-sm font-medium mb-2">Ảnh hiện tại:</p>
                    <img
                      src={editingImage.image_url}
                      alt={editingImage.alt_text}
                      className="max-h-64 mx-auto rounded-lg shadow-lg"
                    />
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(editingImage.image_url);
                          toast.success('Đã copy URL');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy URL
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        onClick={() => window.open(editingImage.image_url, '_blank')}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Xem full
                      </button>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tiêu đề * (hiển thị trên ảnh)</label>
                    <input
                      type="text"
                      value={editingImage ? editingImage.title : imageForm.title}
                      onChange={(e) => editingImage 
                        ? setEditingImage({...editingImage, title: e.target.value})
                        : setImageForm({...imageForm, title: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Trường THCS Nguyễn Du..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Alt Text (SEO - mô tả ảnh) *</label>
                    <input
                      type="text"
                      value={editingImage ? editingImage.alt_text : imageForm.alt_text}
                      onChange={(e) => editingImage 
                        ? setEditingImage({...editingImage, alt_text: e.target.value})
                        : setImageForm({...imageForm, alt_text: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Hình ảnh trường THCS Nguyễn Du - Cửa Sổ Nghề Nghiệp"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Danh mục *</label>
                      <select
                        value={editingImage ? editingImage.category : imageForm.category}
                        onChange={(e) => editingImage 
                          ? setEditingImage({...editingImage, category: e.target.value})
                          : setImageForm({...imageForm, category: e.target.value})
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="cơ sở vật chất">Cơ sở vật chất</option>
                        <option value="hướng nghiệp">Hướng nghiệp</option>
                        <option value="tư vấn">Tư vấn</option>
                        <option value="đánh giá">Đánh giá</option>
                        <option value="tuyển sinh">Tuyển sinh</option>
                        <option value="công nghệ">Công nghệ</option>
                        <option value="định hướng">Định hướng</option>
                        <option value="hoạt động khác">Hoạt động khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Thứ tự hiển thị</label>
                      <input
                        type="number"
                        value={editingImage ? editingImage.order : imageForm.order}
                        onChange={(e) => editingImage 
                          ? setEditingImage({...editingImage, order: parseInt(e.target.value) || 0})
                          : setImageForm({...imageForm, order: parseInt(e.target.value) || 0})
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Mô tả chi tiết</label>
                    <textarea
                      value={editingImage ? editingImage.description : imageForm.description}
                      onChange={(e) => editingImage 
                        ? setEditingImage({...editingImage, description: e.target.value})
                        : setImageForm({...imageForm, description: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      rows="3"
                      placeholder="Mô tả chi tiết về ảnh..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingImage ? editingImage.is_active : imageForm.is_active}
                          onChange={(e) => editingImage 
                            ? setEditingImage({...editingImage, is_active: e.target.checked})
                            : setImageForm({...imageForm, is_active: e.target.checked})
                          }
                          className="w-5 h-5 text-indigo-600 rounded"
                        />
                        <span className="text-sm font-medium">Hiển thị trên trang</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingImage ? editingImage.featured : imageForm.featured}
                          onChange={(e) => editingImage 
                            ? setEditingImage({...editingImage, featured: e.target.checked})
                            : setImageForm({...imageForm, featured: e.target.checked})
                          }
                          className="w-5 h-5 text-yellow-600 rounded"
                        />
                        <span className="text-sm font-medium">⭐ Ảnh nổi bật</span>
                      </label>
                    </div>

                    {/* Image Info (if uploaded) */}
                    {(imageForm.width || editingImage?.width) && (
                      <div className="bg-blue-50 p-4 rounded-lg text-sm">
                        <p className="font-medium text-blue-900 mb-2">Thông tin ảnh:</p>
                        <div className="space-y-1 text-blue-800">
                          <p>📐 {editingImage?.width || imageForm.width} × {editingImage?.height || imageForm.height}px</p>
                          {(editingImage?.file_size || imageForm.file_size) && (
                            <p>💾 {((editingImage?.file_size || imageForm.file_size) / 1024).toFixed(0)}KB</p>
                          )}
                          {(editingImage?.file_type || imageForm.file_type) && (
                            <p>🖼️ {editingImage?.file_type || imageForm.file_type}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowAddImageModal(false);
                    setEditingImage(null);
                    resetImageForm();
                  }}
                  className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (editingImage) {
                      const { id, created_date, updated_date, created_by, uploaded_by, ...data } = editingImage;
                      updateImageMutation.mutate({ id, data });
                    } else {
                      if (!imageForm.image_url) {
                        toast.error('Vui lòng upload ảnh hoặc thêm URL trước');
                        return;
                      }
                      if (!imageForm.title || !imageForm.alt_text) {
                        toast.error('Vui lòng điền tiêu đề và alt text');
                        return;
                      }
                      createImageMutation.mutate(imageForm);
                    }
                  }}
                  disabled={
                    createImageMutation.isPending || 
                    updateImageMutation.isPending || 
                    (!editingImage && !imageForm.image_url)
                  }
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-md flex items-center justify-center gap-2"
                >
                  {(createImageMutation.isPending || updateImageMutation.isPending) ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingImage ? 'Cập nhật' : 'Tạo mới'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminCMS() {
  return (
    <ToastProvider>
      <AdminCMSContent />
    </ToastProvider>
  );
}