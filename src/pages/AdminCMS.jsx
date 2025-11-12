import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Edit2, Trash2, Save, X, Image as ImageIcon, 
  Upload, Eye, Search, Grid3x3, List, Table as TableIcon, Check, AlertCircle,
  ExternalLink, Download, Loader2, CheckCircle
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
  const [viewMode, setViewMode] = useState('grid'); // grid, list, table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPage, setFilterPage] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageInputMode, setImageInputMode] = useState('upload'); // upload, url
  const [imagePreview, setImagePreview] = useState(null);
  
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
    featured: false,
    source_type: 'upload'
  });

  // ✅ Queries
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

  // ✅ Mutations
  const createContentMutation = useMutation({
    mutationFn: (data) => base44.entities.CMSContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsContent'] });
      toast.success('✅ Tạo nội dung thành công!');
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
      toast.success('✅ Cập nhật thành công!');
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
      toast.success('✅ Xóa thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const createImageMutation = useMutation({
    mutationFn: (data) => base44.entities.GalleryImage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      toast.success('✅ Thêm ảnh thành công!');
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
      toast.success('✅ Cập nhật ảnh thành công!');
      setEditingImage(null);
      setImagePreview(null);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id) => base44.entities.GalleryImage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      toast.success('✅ Xóa ảnh thành công!');
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  // ✅ Validate Image URL
  const validateImageUrl = (url) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.includes('unsplash.com') || 
           lowerUrl.includes('images.');
  };

  // ✅ Validate Image File
  const validateImageFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!file) return { valid: false, error: 'Vui lòng chọn file' };
    if (file.size > maxSize) return { valid: false, error: 'File quá lớn (tối đa 5MB)' };
    if (!allowedTypes.includes(file.type)) return { valid: false, error: 'Chỉ hỗ trợ JPG, PNG, GIF, WEBP' };
    
    return { valid: true };
  };

  // ✅ Get Image Dimensions
  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve(null);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const handleUploadImage = async () => {
    if (imageInputMode === 'url') {
      if (!imageForm.image_url || !validateImageUrl(imageForm.image_url)) {
        toast.error('URL ảnh không hợp lệ');
        return;
      }
      toast.success('✅ URL ảnh hợp lệ!');
      return;
    }

    if (!imageFile) {
      toast.error('Vui lòng chọn ảnh');
      return;
    }
    
    const validation = validateImageFile(imageFile);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsUploading(true);
      
      // Get dimensions
      const dimensions = await getImageDimensions(imageFile);
      
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      
      setImageForm({ 
        ...imageForm, 
        image_url: file_url,
        source_type: 'upload',
        file_size: imageFile.size,
        dimensions: dimensions
      });
      setImagePreview(file_url);
      toast.success('✅ Upload ảnh thành công!');
    } catch (error) {
      toast.error(`Lỗi upload: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url) => {
    setImageForm({ ...imageForm, image_url: url, source_type: 'url' });
    if (validateImageUrl(url)) {
      setImagePreview(url);
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
      featured: false,
      source_type: 'upload'
    });
    setImageFile(null);
    setImagePreview(null);
    setImageInputMode('upload');
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

  // ✅ Auto-populate default CMS data
  const handlePopulateDefaults = async () => {
    if (!confirm('Tạo dữ liệu mẫu cho CMS? (Về chúng tôi & Liên hệ)')) return;
    
    try {
      toast.info('Đang tạo dữ liệu mẫu...');
      
      const defaultData = [
        // About Us
        {
          page_key: 'about_us',
          page_name: 'Về chúng tôi',
          section_key: 'header',
          section_type: 'text',
          title: 'Về Dự Án "Cửa Sổ Nghề Nghiệp"',
          content: '<p>Tên gọi <strong>"Cửa Sổ Nghề Nghiệp"</strong> được chọn bởi vì chúng ta – các em học sinh lớp 9 & 12 – như đang đứng trước một cánh cửa mở ra tương lai, nơi có thể nhìn thấy nhiều lựa chọn nghề nghiệp khác nhau ở phía trước.</p><p>Việc "mở cửa sổ" ở đây tượng trưng cho việc <strong>khám phá bản thân</strong>, tiếp cận thông tin ngành nghề và thị trường lao động, từ đó tìm ra hướng đi phù hợp.</p>',
          order: 0,
          is_active: true
        },
        {
          page_key: 'about_us',
          section_key: 'highlights',
          section_type: 'json',
          title: 'Mục tiêu của dự án',
          content: 'Giúp học sinh THCS & THPT xác định nghề nghiệp, hiểu rõ sở thích và năng lực, cũng như nắm bắt nhu cầu nghề nghiệp của xã hội theo Quyết định 522/QĐ-TTg.',
          icon: 'Target',
          order: 1,
          is_active: true
        },
        {
          page_key: 'about_us',
          section_key: 'highlights',
          section_type: 'json',
          title: 'Đối tượng hướng đến',
          content: 'Học sinh THCS & THPT đang đứng trước ngưỡng cửa tương lai, cần định hướng nghề nghiệp và lựa chọn trường học phù hợp.',
          icon: 'Users',
          order: 2,
          is_active: true
        },
        {
          page_key: 'about_us',
          section_key: 'highlights',
          section_type: 'json',
          title: 'Công cụ hỗ trợ',
          content: 'Trắc nghiệm khoa học, phân tích AI, gợi ý nghề nghiệp, tư vấn chọn trường và tổ hợp môn thi phù hợp với năng lực cá nhân.',
          icon: 'BookOpen',
          order: 3,
          is_active: true
        },
        {
          page_key: 'about_us',
          section_key: 'highlights',
          section_type: 'json',
          title: 'Kết nối với thực tế',
          content: 'Cung cấp thông tin ngành nghề cập nhật, xu hướng thị trường lao động để học sinh có cái nhìn thực tế về tương lai nghề nghiệp.',
          icon: 'TrendingUp',
          order: 4,
          is_active: true
        },
        {
          page_key: 'about_us',
          section_key: 'mission',
          section_type: 'rich_text',
          title: 'Sứ Mệnh Của Chúng Tôi',
          content: '<p>Theo Quyết định 522/QĐ-TTg, việc giáo dục hướng nghiệp và phân luồng học sinh là một nhiệm vụ trọng tâm của giáo dục phổ thông, nhằm kết nối giữa năng lực, sở thích cá nhân của học sinh với yêu cầu phát triển kinh tế – xã hội của đất nước.</p><p>Website <strong>"Cửa Sổ Nghề Nghiệp"</strong> chính là một công cụ hỗ trợ để thực hiện mục tiêu này — bằng cách cung cấp thông tin ngành nghề, trắc nghiệm, lời khuyên và hướng dẫn giúp học sinh chuẩn bị cho giai đoạn chuyển tiếp và định hướng nghề nghiệp tương lai.</p>',
          order: 5,
          is_active: true
        },
        // Contact Page
        {
          page_key: 'contact',
          page_name: 'Liên hệ',
          section_key: 'contact_intro',
          section_type: 'text',
          title: 'Liên Hệ Với Chúng Tôi',
          content: 'Trường THCS Nguyễn Du - Nơi nuôi dưỡng ước mơ và định hướng tương lai cho học sinh. Hãy liên hệ với chúng tôi để được tư vấn về hướng nghiệp và giáo dục.',
          order: 0,
          is_active: true
        },
        {
          page_key: 'contact',
          section_key: 'address',
          section_type: 'json',
          title: 'Địa chỉ trường',
          data_json: {
            street: '523, Phạm Hùng',
            ward: 'Phường Bà Rịa',
            city: 'Thành phố Bà Rịa',
            province: 'Tỉnh Bà Rịa - Vũng Tàu'
          },
          icon: 'MapPin',
          order: 1,
          is_active: true
        },
        {
          page_key: 'contact',
          section_key: 'phone',
          section_type: 'json',
          title: 'Điện thoại',
          data_json: {
            number: '(0254) 3.826.178',
            display: '(0254) 3 826 178',
            note: 'Liên hệ trong giờ hành chính'
          },
          icon: 'Phone',
          order: 2,
          is_active: true
        },
        {
          page_key: 'contact',
          section_key: 'email',
          section_type: 'json',
          title: 'Email',
          data_json: {
            address: 'c2nguyendu.baria.bariavungtau@moet.edu.vn',
            note: 'Phản hồi trong vòng 24 giờ'
          },
          icon: 'Mail',
          order: 3,
          is_active: true
        },
        {
          page_key: 'contact',
          section_key: 'hours',
          section_type: 'json',
          title: 'Giờ làm việc',
          data_json: {
            weekdays: 'Thứ 2 - Thứ 6: 7:00 AM - 5:00 PM',
            saturday: 'Thứ 7: 7:00 AM - 12:00 PM',
            sunday: 'Chủ nhật: Nghỉ'
          },
          icon: 'Clock',
          order: 4,
          is_active: true
        },
        {
          page_key: 'contact',
          section_key: 'social',
          section_type: 'json',
          title: 'Mạng xã hội',
          data_json: {
            facebook: '#',
            note: 'Theo dõi chúng tôi'
          },
          icon: 'Facebook',
          order: 5,
          is_active: true
        },
        {
          page_key: 'contact',
          section_key: 'map',
          section_type: 'text',
          title: 'Bản đồ đến trường',
          content: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.8155076862684!2d107.16877631533658!3d10.507668992580858!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175772c1e6e1e0d%3A0x7c9c4e3e4e3e4e3e!2zNTIzIMSQLiBQaOG6oW0gSMO5bmcsIFBoxrDhu51uZyBCw6AgUuG7i2EsIFRow6BuaCBwaOG7kSBC4buRIFLhu4thLCBC4bq5IFLhu4thIC0gVsWpbmcgVMOgdSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1629788888888!5m2!1svi!2s',
          order: 6,
          is_active: true
        }
      ];

      await base44.entities.CMSContent.bulkCreate(defaultData);
      queryClient.invalidateQueries({ queryKey: ['cmsContent'] });
      toast.success('✅ Đã tạo dữ liệu mẫu!');
    } catch (error) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handlePopulateGallery = async () => {
    if (!confirm('Thêm ảnh mẫu vào Gallery?')) return;
    
    try {
      const sampleImages = [
        {
          title: 'Trường THCS Nguyễn Du',
          image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690800a89985178f2ceea9b5/b12dd9b27_image.png',
          alt_text: 'Trường THCS Nguyễn Du - Cơ sở vật chất hiện đại',
          category: 'cơ sở vật chất',
          source_type: 'url',
          order: 0,
          is_active: true,
          featured: true
        },
        {
          title: 'Học sinh khám phá nghề nghiệp',
          image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=90',
          alt_text: 'Học sinh tham gia hoạt động hướng nghiệp',
          category: 'hướng nghiệp',
          source_type: 'url',
          order: 1,
          is_active: true
        },
        {
          title: 'Tư vấn định hướng cá nhân',
          image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=90',
          alt_text: 'Buổi tư vấn định hướng nghề nghiệp cho học sinh',
          category: 'tư vấn',
          source_type: 'url',
          order: 2,
          is_active: true
        },
        {
          title: 'Trắc nghiệm năng lực',
          image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=90',
          alt_text: 'Học sinh làm bài trắc nghiệm đánh giá năng lực',
          category: 'đánh giá',
          source_type: 'url',
          order: 3,
          is_active: true
        },
        {
          title: 'Chọn trường đại học',
          image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=90',
          alt_text: 'Tư vấn chọn trường đại học phù hợp',
          category: 'tuyển sinh',
          source_type: 'url',
          order: 4,
          is_active: true
        },
        {
          title: 'Phân tích kết quả AI',
          image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=90',
          alt_text: 'Công nghệ AI phân tích kết quả test',
          category: 'công nghệ',
          source_type: 'url',
          order: 5,
          is_active: true
        },
        {
          title: 'Tư vấn chọn ngành học',
          image_url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=90',
          alt_text: 'Định hướng chọn ngành học phù hợp',
          category: 'định hướng',
          source_type: 'url',
          order: 6,
          is_active: true
        }
      ];

      await base44.entities.GalleryImage.bulkCreate(sampleImages);
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      toast.success('✅ Đã thêm ảnh mẫu!');
    } catch (error) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

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
            <div className="flex gap-3">
              {cmsContent.length === 0 && (
                <button
                  onClick={handlePopulateDefaults}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700"
                >
                  <Download className="w-5 h-5" />
                  Tạo dữ liệu mẫu
                </button>
              )}
              {activeTab === 'gallery' && galleryImages.length === 0 && (
                <button
                  onClick={handlePopulateGallery}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700"
                >
                  <ImageIcon className="w-5 h-5" />
                  Thêm ảnh mẫu
                </button>
              )}
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
                          {item.icon && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                              Icon: {item.icon}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title || 'Untitled'}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                        {item.data_json && Object.keys(item.data_json).length > 0 && (
                          <div className="mt-2 bg-gray-50 rounded-lg p-2">
                            <pre className="text-xs text-gray-600 overflow-x-auto">
                              {JSON.stringify(item.data_json, null, 2)}
                            </pre>
                          </div>
                        )}
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
                  <div className="flex gap-2 border rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Grid view"
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="List view"
                    >
                      <List className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Table view"
                    >
                      <TableIcon className="w-5 h-5" />
                    </button>
                  </div>
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
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
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
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error';
                            }}
                          />
                          {image.featured && (
                            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              ⭐ Nổi bật
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                            {image.source_type === 'upload' ? '📤 Upload' : '🔗 URL'}
                          </div>
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
                          {image.dimensions && (
                            <p className="text-xs text-gray-500 mt-2">
                              📐 {image.dimensions.width} × {image.dimensions.height}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-3">
                    {filteredImages.map((image, idx) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow flex items-center gap-4"
                      >
                        <img
                          src={image.image_url}
                          alt={image.alt_text}
                          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/96?text=Error';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">{image.title}</h4>
                            {image.featured && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⭐</span>
                            )}
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {image.source_type === 'upload' ? '📤' : '🔗'}
                            </span>
                          </div>
                          <p className="text-xs text-indigo-600 mb-1">{image.category}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{image.description}</p>
                        </div>
                        <div className="flex gap-2">
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
                {viewMode === 'table' && (
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-indigo-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-bold">Preview</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Tiêu đề</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Danh mục</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Nguồn</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Kích thước</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Trạng thái</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredImages.map((image, idx) => (
                          <motion.tr
                            key={image.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="border-t hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <img
                                src={image.image_url}
                                alt={image.alt_text}
                                className="w-16 h-16 rounded-lg object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/64?text=Error';
                                }}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{image.title}</p>
                              {image.featured && <span className="text-xs text-yellow-600">⭐ Nổi bật</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{image.category}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                image.source_type === 'upload' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {image.source_type === 'upload' ? '📤 Upload' : '🔗 URL'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {image.dimensions ? `${image.dimensions.width} × ${image.dimensions.height}` : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                image.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {image.is_active ? '✓' : '✗'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-center">
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
                          </motion.tr>
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
                  <X className="w-6 h-6 text-gray-400" />
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
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="about_us">Về chúng tôi</option>
                      <option value="contact">Liên hệ</option>
                      <option value="gallery">Gallery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Loại *</label>
                    <select
                      value={editingContent ? editingContent.section_type : contentForm.section_type}
                      onChange={(e) => editingContent 
                        ? setEditingContent({...editingContent, section_type: e.target.value})
                        : setContentForm({...contentForm, section_type: e.target.value})
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="text">Text</option>
                      <option value="rich_text">Rich Text (HTML)</option>
                      <option value="image">Image</option>
                      <option value="json">JSON Data</option>
                      <option value="list">List</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Section Key * <span className="text-gray-500 text-xs">(header, mission, address, phone...)</span></label>
                  <input
                    type="text"
                    value={editingContent ? editingContent.section_key : contentForm.section_key}
                    onChange={(e) => editingContent 
                      ? setEditingContent({...editingContent, section_key: e.target.value})
                      : setContentForm({...contentForm, section_key: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="header, mission, highlights, address, phone, email, hours, social, map..."
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
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    rows="8"
                    placeholder="Text hoặc HTML (cho rich_text)"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Icon <span className="text-xs text-gray-500">(Target, Users, MapPin...)</span></label>
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

                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="block text-sm font-medium mb-2">
                    Data JSON <span className="text-xs text-gray-500">(Tùy chọn, cho section phức tạp)</span>
                  </label>
                  <textarea
                    value={editingContent 
                      ? JSON.stringify(editingContent.data_json || {}, null, 2)
                      : JSON.stringify(contentForm.data_json || {}, null, 2)
                    }
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        if (editingContent) {
                          setEditingContent({...editingContent, data_json: parsed});
                        } else {
                          setContentForm({...contentForm, data_json: parsed});
                        }
                      } catch (err) {
                        // Invalid JSON, allow typing
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-xs"
                    rows="5"
                    placeholder='{"key": "value"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">VD: {`{"street": "523 Phạm Hùng", "ward": "Phường Bà Rịa"}`}</p>
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
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-indigo-600" />
                  {editingImage ? 'Chỉnh sửa ảnh' : 'Thêm ảnh mới'}
                </h3>
                <button onClick={() => {
                  setShowAddImageModal(false);
                  setEditingImage(null);
                  resetImageForm();
                }}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image Input Mode Toggle */}
                {!editingImage && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium mb-3">Nguồn ảnh:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setImageInputMode('upload');
                          setImageForm({...imageForm, source_type: 'upload'});
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          imageInputMode === 'upload'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <Upload className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-bold text-sm">Upload File</p>
                        <p className="text-xs text-gray-600">Tải ảnh từ máy</p>
                      </button>
                      <button
                        onClick={() => {
                          setImageInputMode('url');
                          setImageForm({...imageForm, source_type: 'url'});
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          imageInputMode === 'url'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <ExternalLink className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-bold text-sm">URL Link</p>
                        <p className="text-xs text-gray-600">Dùng link ảnh</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Mode */}
                {imageInputMode === 'upload' && !editingImage && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload ảnh <span className="text-xs text-gray-500">(Max 5MB, JPG/PNG/GIF/WEBP)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                      {imagePreview || imageFile ? (
                        <div className="relative">
                          <img
                            src={imagePreview || (imageFile ? URL.createObjectURL(imageFile) : '')}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg"
                          />
                          <div className="mt-3 flex items-center justify-center gap-4">
                            <button
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                                setImageForm({...imageForm, image_url: ''});
                              }}
                              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                              <X className="w-4 h-4" />
                              Xóa
                            </button>
                            {imageFile && (
                              <div className="text-xs text-gray-600">
                                {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1">Click để chọn ảnh</p>
                          <p className="text-xs text-gray-500">hoặc kéo thả file vào đây</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              const validation = validateImageFile(file);
                              if (!validation.valid) {
                                toast.error(validation.error);
                                return;
                              }
                              setImageFile(file);
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
                        className="w-full mt-3 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang upload...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Upload ảnh
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* URL Mode */}
                {imageInputMode === 'url' && !editingImage && (
                  <div>
                    <label className="block text-sm font-medium mb-2">URL ảnh *</label>
                    <input
                      type="url"
                      value={imageForm.image_url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg"
                      placeholder="https://example.com/image.jpg"
                    />
                    {imagePreview && (
                      <div className="mt-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg"
                          onError={() => {
                            toast.error('URL ảnh không hợp lệ');
                            setImagePreview(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Current Image (Edit Mode) */}
                {editingImage?.image_url && (
                  <div className="border-2 border-indigo-200 rounded-xl p-4 bg-indigo-50">
                    <label className="block text-sm font-medium mb-2">Ảnh hiện tại:</label>
                    <img
                      src={editingImage.image_url}
                      alt={editingImage.alt_text}
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-xs text-gray-600 text-center mt-2 break-all">{editingImage.image_url}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Tiêu đề * <span className="text-xs text-gray-500">(Hiển thị trên client)</span></label>
                  <input
                    type="text"
                    value={editingImage ? editingImage.title : imageForm.title}
                    onChange={(e) => editingImage 
                      ? setEditingImage({...editingImage, title: e.target.value})
                      : setImageForm({...imageForm, title: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="VD: Trường THCS Nguyễn Du"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Alt Text (SEO) *</label>
                  <input
                    type="text"
                    value={editingImage ? editingImage.alt_text : imageForm.alt_text}
                    onChange={(e) => editingImage 
                      ? setEditingImage({...editingImage, alt_text: e.target.value})
                      : setImageForm({...imageForm, alt_text: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Mô tả ảnh cho công cụ tìm kiếm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Danh mục *</label>
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
                  <label className="block text-sm font-medium mb-2">Mô tả chi tiết</label>
                  <textarea
                    value={editingImage ? editingImage.description : imageForm.description}
                    onChange={(e) => editingImage 
                      ? setEditingImage({...editingImage, description: e.target.value})
                      : setImageForm({...imageForm, description: e.target.value})
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    rows="3"
                    placeholder="Mô tả chi tiết về ảnh..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Thứ tự hiển thị</label>
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
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
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
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={editingImage ? editingImage.featured : imageForm.featured}
                        onChange={(e) => editingImage 
                          ? setEditingImage({...editingImage, featured: e.target.checked})
                          : setImageForm({...imageForm, featured: e.target.checked})
                        }
                        className="w-5 h-5 text-yellow-600 rounded"
                      />
                      <span className="text-sm">⭐ Nổi bật</span>
                    </label>
                  </div>
                </div>

                {/* Validation Status */}
                {!editingImage && imageForm.image_url && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    validateImageUrl(imageForm.image_url) 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {validateImageUrl(imageForm.image_url) ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">URL hợp lệ ✓</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">URL không hợp lệ</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowAddImageModal(false);
                    setEditingImage(null);
                    resetImageForm();
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
                        toast.error('Vui lòng upload ảnh hoặc nhập URL');
                        return;
                      }
                      if (!imageForm.title) {
                        toast.error('Vui lòng nhập tiêu đề');
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
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(createImageMutation.isPending || updateImageMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
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