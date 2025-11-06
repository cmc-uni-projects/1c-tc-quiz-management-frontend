// app/page.tsx
import Link from "next/link"; 

// Component Card Môn học
const SubjectCard = ({ title, color, image }: { title: string, color: string, image: string }) => (
    <div 
        className="w-full h-60 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 relative cursor-pointer"
        style={{ backgroundColor: color }} // Màu nền chính của thẻ
    >
        {/* Hình ảnh môn học (chiếm phần lớn diện tích thẻ) */}
        <div className="w-full h-4/5 relative">
            <img 
                // Sử dụng thuộc tính loading="lazy" để tối ưu hiệu suất
                loading="lazy"
                src={image} 
                alt={title} 
                className="w-full h-full object-cover" // object-cover để hình ảnh không bị méo
            />
        </div>
        
        {/* Tiêu đề môn học (đặt ở dưới cùng) */}
        <div className="absolute bottom-0 left-0 w-full h-1/5 flex items-center justify-center p-2 text-center" style={{ backgroundColor: '#00000080' }}> {/* Nền đen trong suốt để chữ nổi bật */}
            <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
        </div>
        
        {/* Góc trên phải (Giống Quizizz) */}
        <span className="absolute top-2 right-2 text-white opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        </span>
    </div>
);


export default function Home() {
    
    // Dữ liệu 3 môn học SỬ DỤNG ĐƯỜNG DẪN NỘI BỘ
    const subjects = [
        // Đường dẫn: /public/roles/Math.jpg
        { title: "Toán học", color: "#FBC02D", image: "/roles/Math.jpg" }, 
        
        // Đường dẫn: /public/roles/English.jpg
        { title: "Tiếng Anh", color: "#689F38", image: "/roles/English.jpg" }, 
        
        // Đường dẫn: /public/roles/Physics.jpg
        { title: "Vật lý", color: "#7B1FA2", image: "/roles/Physics.jpg" }, 
    ];
    
  return (
    // Màu nền toàn trang: #6D0446
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-start pt-28 pb-10 px-4">
      
      {/* Khối chính giữa màn hình */}
      <div className="w-full max-w-6xl"> 
        
        {/* Phần Title và Slogan */}
        <section className="text-center mb-16">
            <h1 
                className="text-5xl md:text-6xl font-extrabold tracking-tighter text-white" 
            > 
                QuizzZone
            </h1>
            <p className="mt-4 text-xl font-medium text-white opacity-90"> 
                Hãy thử thách trí tuệ, khám phá kiến thức và học tập thú vị cùng mọi người.
            </p>
        </section>

        {/* Thanh Nhập Mã Phòng - Nổi bật */}
        <div className="mx-auto max-w-2xl bg-white p-6 rounded-2xl shadow-2xl border-t-4 mb-20" style={{ borderColor: 'var(--quiz-action-neon)' }}>
            <p className="text-lg font-semibold text-zinc-700 mb-4">Tham gia một phòng học / trò chơi</p>
            <div className="flex w-full items-center gap-4">
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Nhập mã phòng (Ví dụ: 123 456)"
                    className="flex-1 px-5 py-3 text-lg border-2 rounded-lg focus:outline-none focus:ring-4 transition duration-200"
                    style={{ 
                        '--tw-ring-color': 'var(--quiz-primary-dark)', 
                        borderColor: 'var(--quiz-primary-light)', 
                    }}
                />
                <button 
                    className="flex items-center justify-center rounded-lg px-6 py-3 text-lg font-bold text-white shadow-lg hover:shadow-xl transition duration-200" 
                    aria-label="Tìm phòng"
                    style={{ backgroundColor: '#A53AEC', color: 'white' }}
                >
                    Tham gia
                </button>
            </div>
        </div>
        
        {/* PHẦN THƯ VIỆN/MÔN HỌC */}
        <div className="w-full text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Khám phá Thư viện Môn học</h2>
            
            {/* Grid hiển thị 3 môn học, dùng grid-cols-3 trên màn hình lớn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {subjects.map((subject, index) => (
                    <SubjectCard 
                        key={index}
                        title={subject.title} 
                        color={subject.color}
                        image={subject.image} 
                    />
                ))}
            </div>
        </div>
        

      </div>
      
    </div>
  );
}