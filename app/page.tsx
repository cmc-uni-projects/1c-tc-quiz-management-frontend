"use client";

import React from "react";
import Link from "next/link";
import { QuestionMarkCircleIcon, CheckBadgeIcon, BoltIcon } from "@heroicons/react/24/solid";

const Footer = () => (
    <footer className="w-full bg-white border-t border-zinc-100 text-center py-6">
        <p className="text-sm text-zinc-600">
            &copy; 2025 QuizzZone. Mọi quyền được bảo lưu.
        </p>
    </footer>
);


export default function Home() {
  const features = [
    {
      title: "Ngân hàng câu hỏi thông minh",
      description:
        "Tạo câu hỏi với nhiều thể loại: một đáp án, nhiều đáp án, đúng/ sai.",
      accentColor: "#A53AEC",
      icon: "?",
    },
    {
      title: "Tạo bài thi chuyên nghiệp",
      description: "Chọn mức độ, đặt thời gian bài thi.",
      accentColor: "#A53AEC",
      icon: "✓",
    },
    {
      title: "Xem kết quả tức thì",
      description:
        "Xem điểm, câu đúng/ sai, phân tích bài làm chi tiết.",
      accentColor: "#A53AEC",
      icon: <BoltIcon className="w-5 h-5 text-white" />,
    },
  ];

  return (
    <>
      <main className="min-h-[calc(100vh-140px)] flex flex-col items-stretch py-0 px-0" style={{ backgroundColor: "#F3F4F6" }}>
        <div className="w-full flex flex-col gap-8">
          <section
            className="w-full shadow-2xl overflow-hidden px-8 lg:px-16 py-10 flex flex-col lg:flex-row items-center gap-10"
            style={{
              backgroundImage: "url('/roles/home.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex-1 text-white max-w-xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Nền tảng Quiz dành cho sinh viên đại học
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-xl">
                Tạo câu hỏi, làm bài thi, xem kết quả tức thì. Tất cả trong một nền
                tảng duy nhất.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-10 py-3 rounded-full bg-white text-[#7A1FA2] font-semibold text-lg shadow-md hover:shadow-lg transition-transform duration-200 hover:scale-[1.02]"
              >
                Khám phá ngay
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 flex flex-col gap-4 border border-zinc-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: feature.accentColor }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}