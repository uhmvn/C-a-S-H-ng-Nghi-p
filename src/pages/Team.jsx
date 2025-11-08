
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Award, Users, Trophy, GraduationCap } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

const studentTeam = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    title: "Lập trình viên chính",
    grade: "Học sinh lớp 9",
    bio: "Đam mê công nghệ và lập trình, An là người phát triển chính của website Cửa Sổ Nghề Nghiệp, chịu trách nhiệm xây dựng giao diện và tính năng.",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=90",
    specialties: ["Frontend Development", "UI/UX Design", "React"]
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    title: "Nhà thiết kế UX/UI",
    grade: "Học sinh lớp 9",
    bio: "Với khiếu thẩm mỹ và sự sáng tạo, Bình đã thiết kế giao diện thân thiện, dễ sử dụng cho website hướng nghiệp của chúng em.",
    image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=90",
    specialties: ["UI/UX Design", "Figma", "User Research"]
  },
  {
    id: 3,
    name: "Lê Minh Cường",
    title: "Chuyên viên nội dung",
    grade: "Học sinh lớp 9",
    bio: "Cường nghiên cứu và biên soạn nội dung về các nghề nghiệp, ngành học và thông tin tuyển sinh cho website.",
    image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=90",
    specialties: ["Content Writing", "Research", "SEO"]
  },
  {
    id: 4,
    name: "Phạm Thu Dung",
    title: "Chuyên viên kiểm thử",
    grade: "Học sinh lớp 9",
    bio: "Dung chịu trách nhiệm kiểm tra, thử nghiệm các tính năng của website để đảm bảo trải nghiệm người dùng tốt nhất.",
    image_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=90",
    specialties: ["Testing", "Quality Assurance", "User Testing"]
  }
];

const teachers = [
  {
    id: 1,
    name: "Thầy Nguyễn Văn Minh",
    title: "Giáo viên Tin học",
    role: "Giáo viên hướng dẫn chính",
    bio: "Thầy Minh là người trực tiếp hướng dẫn nhóm em phát triển kỹ năng lập trình, thiết kế website và quản lý dự án công nghệ.",
    image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=90"
  },
  {
    id: 2,
    name: "Cô Trần Thị Hương",
    title: "Giáo viên Tư vấn Học đường",
    role: "Cố vấn hướng nghiệp",
    bio: "Cô Hương hỗ trợ nhóm em về kiến thức hướng nghiệp, nội dung trắc nghiệm và phương pháp tư vấn cho học sinh.",
    image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=90"
  }
];

const achievements = [
  {
    icon: Trophy,
    title: "Cuộc thi Công nghệ Học đường",
    description: "Dự án Cửa Sổ Nghề Nghiệp tham gia cuộc thi Khoa học Công nghệ cấp trường năm học 2024-2025"
  },
  {
    icon: Users,
    title: "Làm việc nhóm",
    description: "Nhóm 4 học sinh cùng hợp tác phát triển dự án từ ý tưởng đến thành phẩm hoàn chỉnh"
  },
  {
    icon: GraduationCap,
    title: "Học hỏi & Phát triển",
    description: "Áp dụng kiến thức công nghệ, thiết kế và hướng nghiệp vào dự án thực tế"
  }
];

export default function Team() {
  const breadcrumbItems = [
    { label: "Đội ngũ" }
  ];

  return (
    <div className="pt-32 pb-24 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <Breadcrumb items={breadcrumbItems} />

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-indigo-600 font-medium">Đội Ngũ Dự Án</span>
          </div>
          <h1 className="font-display font-medium text-[length:var(--font-h1)] text-gray-900 mb-6 leading-tight">
            Đội Ngũ Phát Triển
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-[1.618]">
            Gặp gỡ nhóm học sinh và thầy cô đã cùng nhau xây dựng nền tảng hướng nghiệp "Cửa Sổ Nghề Nghiệp"
          </p>
        </motion.div>

        {/* Achievements Section */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-8 text-center">Về Dự Án</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
                className="bg-white p-8 rounded-3xl shadow-lg border border-indigo-600/20 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mb-4">
                  <achievement.icon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{achievement.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Student Team Section */}
        <section className="mb-16">
          <h2 className="font-display text-3xl text-center font-bold text-gray-900 mb-12">Nhóm Học Sinh</h2>
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
            {studentTeam.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
                className="group"
              >
                <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={member.image_url}
                      alt={`${member.name} - ${member.title}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white rounded-full px-3 py-1 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span className="text-xs font-medium">{member.grade}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-indigo-600 font-medium mb-4 text-sm">{member.title}</p>
                    <p className="text-gray-600 leading-relaxed mb-4 text-sm line-clamp-3">{member.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {member.specialties.map((specialty, idx) => (
                        <span key={idx} className="bg-indigo-600/10 text-indigo-600 px-3 py-1 rounded-full text-xs font-medium">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Teachers Section */}
        <section className="mb-16">
          <h2 className="font-display text-3xl text-center font-bold text-gray-900 mb-12">Giáo Viên Hướng Dẫn</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {teachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.2, ease: "easeOut" }}
                className="group"
              >
                <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                  <div className="relative h-96 overflow-hidden">
                    <img
                      src={teacher.image_url}
                      alt={`${teacher.name} - ${teacher.title}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-8">
                    <h3 className="font-display text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                      {teacher.name}
                    </h3>
                    <p className="text-indigo-600 font-medium mb-1">{teacher.title}</p>
                    <p className="text-gray-500 text-sm mb-4">{teacher.role}</p>
                    <p className="text-gray-600 leading-relaxed">{teacher.bio}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* School Image Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-16"
        >
          <h2 className="font-display text-3xl text-center font-bold text-gray-900 mb-8">Trường THCS Nguyễn Du</h2>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690800a89985178f2ceea9b5/b12dd9b27_image.png"
              alt="Trường THCS Nguyễn Du - Bà Rịa Vũng Tàu"
              className="w-full h-auto"
            />
          </div>
        </motion.div>

        {/* School Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl text-center"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
            Thông Tin Liên Hệ
          </h2>
          <div className="text-lg space-y-2 max-w-2xl mx-auto">
            <p>Địa chỉ: 523, Phạm Hùng, Phường Bà Rịa</p>
            <p>Thành phố Bà Rịa, Tỉnh Bà Rịa - Vũng Tàu</p>
            <p className="mt-4">Điện thoại: <a href="tel:02543826178" className="font-bold hover:underline">(0254) 3.826.178</a></p>
            <p>Email: <a href="mailto:c2nguyendu.baria.bariavungtau@moet.edu.vn" className="font-bold hover:underline">c2nguyendu.baria.bariavungtau@moet.edu.vn</a></p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
