import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Edit2, Trash2, Save, X, Image as ImageIcon, 
  Upload, Eye, Search, Filter, Check, AlertCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { ToastProvider, useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";

function AdminCMSContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('content'); // content, gallery
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPage, setFilterPage] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [contentForm, setContentForm] = useState({
    page_key: 'about_us',
    page_name: 'Về chúng tôi',
    section_key: '',
    section_type: 'text',
    title: '',
    content: '',
    data_json: {},
    icon: '',
    order: 0,
    is_active: true
  });

  const [imageForm, setImageForm] = useState({
    title: '',
    image_url: '',
    alt_text: '',
    category: 'hoạt động khác',
    description: '',
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
      toast.success('Tạo nội dung thành công!');
      setShowAddContentModal(false);
      resetContentForm();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const updateContentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CMSContent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsContent'] });
      toast.success('Cập nhật thành công!');
      setEditingContent(null);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const deleteContentMutation = useMutation({
    mutationFn: (id) => base44.entities.CMSContent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsContent'] });
      toast.success('Xóa thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const createImageMutation = useMutation({
    mutationFn: (data) => base44.entities.GalleryImage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      toast.success('Thêm ảnh thành công!');
      setShowAddImageModal(false);
      resetImageForm();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GalleryImage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      toast.success('Cập nhật ảnh thành công!');
      setEditingImage(null);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id) => base44.entities.GalleryImage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      toast.success('Xóa ảnh thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const handleUploadImage = async () => {
    if (!imageFile) {
      toast.error('Vui lòng chọn ảnh');
      return;
    }
    
    try {
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      setImageForm({ ...imageForm, image_url: file_url });
      toast.success('Upload ảnh thành công!');
    } catch (error) {
      toast.error(`Lỗi upload: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetContentForm = () => {
    setContentForm({
      page_key: 'about_us',
      page_name: 'Về chúng tôi',
      section_key: '',
      section_type: 'text',
      title: '',
      content: '',
      data_json: {},
      icon: '',
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
      order: 0,
      is_active: true,
      featured: false
    });
    setImageFile(null);
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
        img.alt_text?.toLowerCase().includes(searchTerm.toLowerCase());
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
                      className="w-full pl-10 pr-4 py-3 border rounded-xl"
                    />
                  </div>
                  <select
                    value={filterPage}
                    onChange={(e) => setFilterPage(e.target.value)}
                    className="px-4 py-3 border rounded-xl"
                  >
                    <option value="all">Tất cả trang</option>
                    <option value="about_us">Về chúng tôi</option>
                    <option value="contact">Liên hệ</option>
                    <option value="gallery">Gallery</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowAddContentModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 ml-4"
                >
                  <Plus className="w-5 h-5" />
                  Thêm nội dung
                </button>
              </div>
            </div>

            {loadingContent ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
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
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title || 'Untitled'}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingContent(item)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Xóa nội dung này?')) {
                              deleteContentMutation.mutate(item.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                      className="w-full pl-10 pr-4 py-3 border rounded-xl"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-3 border rounded-xl"
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
                </div>
                <button
                  onClick={() => setShowAddImageModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 ml-4"
                >
                  <Plus className="w-5 h-5" />
                  Thêm ảnh
                </button>
              </div>
            </div>

            {loadingImages ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : filteredImages.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="Chưa có ảnh"
                description="Thêm ảnh mới vào gallery"
              />
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {filteredImages.map((image, idx) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg border hover:shadow-xl transition-all"
                  >
                    <div className="relative h-48">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || image.title}
                        className="w-full h-full object-cover"
                      />
                      {image.featured && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          ⭐ Nổi bật
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingImage(image)}
                            className="p-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Xóa ảnh này?')) {
                                deleteImageMutation.mutate(image.id);
                              }
                            }}
                            className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 mb-1">{image.title}</h4>
                      <p className="text-xs text-indigo-600 mb-2">{image.category}</p>
                      {image.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{image.description}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
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
              className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-xl font-bold">
                  {editingContent ? 'Chỉnh sửa nội dung' : 'Thêm nội dung mới'}
                </h3>
                <button onClick={() => {
                  setShowAddContentModal(false);
                  setEditingContent(null);
                }}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Trang</label>
                    <select
                      value={editingContent ? editingContent.page_key : contentForm.page_key}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, page_key: e.target.value})
                        : setContentForm({...contentForm, page_key: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="about_us">Về chúng tôi</option>
                      <option value="contact">Liên hệ</option>
                      <option value="gallery">Gallery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Loại</label>
                    <select
                      value={editingContent ? editingContent.section_type : contentForm.section_type}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, section_type: e.target.value})
                        : setContentForm({...contentForm, section_type: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="text">Text</option>
                      <option value="rich_text">Rich Text</option>
                      <option value="image">Image</option>
                      <option value="json">JSON</option>
                      <option value="list">List</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Section Key</label>
                  <input
                    type="text"
                    value={editingContent ? editingContent.section_key : contentForm.section_key}
                    onChange={(e) => editingContent 
                      ? setEditingContent({...editingContent, section_key: e.target.value})
                      : setContentForm({...contentForm, section_key: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="header, mission, highlights..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={editingContent ? editingContent.title : contentForm.title}
                    onChange={(e) => editingContent 
                      ? setEditingContent({...editingContent, title: e.target.value})
                      : setContentForm({...contentForm, title: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nội dung</label>
                  <textarea
                    value={editingContent ? editingContent.content : contentForm.content}
                    onChange={(e) => editingContent 
                      ? setEditingContent({...editingContent, content: e.target.value})
                      : setContentForm({...contentForm, content: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    rows="6"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Icon</label>
                    <input
                      type="text"
                      value={editingContent ? editingContent.icon : contentForm.icon}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, icon: e.target.value})
                        : setContentForm({...contentForm, icon: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Target, Users..."
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
                      className="w-full px-4 py-2 border rounded-lg"
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
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editingContent ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add/Edit Image Modal */}
        {(showAddImageModal || editingImage) && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddImageModal(false);
              setEditingImage(null);
              setImageFile(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-xl font-bold">
                  {editingImage ? 'Chỉnh sửa ảnh' : 'Thêm ảnh mới'}
                </h3>
                <button onClick={() => {
                  setShowAddImageModal(false);
                  setEditingImage(null);
                  setImageFile(null);
                }}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image Upload */}
                {!editingImage && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload ảnh</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                      {imageFile ? (
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(imageFile)}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <button
                            onClick={() => setImageFile(null)}
                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1">Click để chọn ảnh</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    {imageFile && !imageForm.image_url && (
                      <button
                        onClick={handleUploadImage}
                        disabled={isUploading}
                        className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isUploading ? 'Đang upload...' : 'Upload ảnh'}
                      </button>
                    )}
                  </div>
                )}

                {editingImage?.image_url && (
                  <div className="border rounded-xl p-4">
                    <img
                      src={editingImage.image_url}
                      alt={editingImage.alt_text}
                      className="max-h-48 mx-auto rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Tiêu đề *</label>
                  <input
                    type="text"
                    value={editingImage ? editingImage.title : imageForm.title}
                    onChange={(e) => editingImage 
                      ? setEditingImage({...editingImage, title: e.target.value})
                      : setImageForm({...imageForm, title: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Alt Text (SEO)</label>
                  <input
                    type="text"
                    value={editingImage ? editingImage.alt_text : imageForm.alt_text}
                    onChange={(e) => editingImage 
                      ? setEditingImage({...editingImage, alt_text: e.target.value})
                      : setImageForm({...imageForm, alt_text: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Danh mục</label>
                  <select
                    value={editingImage ? editingImage.category : imageForm.category}
                    onChange={(e) => editingImage 
                      ? setEditingImage({...editingImage, category: e.target.value})
                      : setImageForm({...imageForm, category: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
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
                  <label className="block text-sm font-medium mb-2">Mô tả</label>
                  <textarea
                    value={editingImage ? editingImage.description : imageForm.description}
                    onChange={(e) => editingImage 
                      ? setEditingImage({...editingImage, description: e.target.value})
                      : setImageForm({...imageForm, description: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Thứ tự</label>
                    <input
                      type="number"
                      value={editingImage ? editingImage.order : imageForm.order}
                      onChange={(e) => editingImage 
                        ? setEditingImage({...editingImage, order: parseInt(e.target.value) || 0})
                        : setImageForm({...imageForm, order: parseInt(e.target.value) || 0})
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
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
                      <span className="text-sm">Hiển thị</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingImage ? editingImage.featured : imageForm.featured}
                        onChange={(e) => editingImage 
                          ? setEditingImage({...editingImage, featured: e.target.checked})
                          : setImageForm({...imageForm, featured: e.target.checked})
                        }
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <span className="text-sm">Nổi bật</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowAddImageModal(false);
                    setEditingImage(null);
                    setImageFile(null);
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (editingImage) {
                      const { id, created_date, updated_date, created_by, ...data } = editingImage;
                      updateImageMutation.mutate({ id, data });
                    } else {
                      if (!imageForm.image_url) {
                        toast.error('Vui lòng upload ảnh trước');
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
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editingImage ? 'Cập nhật' : 'Tạo mới'}
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