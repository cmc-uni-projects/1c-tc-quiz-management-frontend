"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button, Chip } from "@nextui-org/react";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; // Required for StudentAuthGuard
import { useUser } from '@/lib/user'; // Required for StudentAuthGuard and StudentTopBar
import ProfileDropdown from '@/components/ProfileDropdown'; // Required for StudentTopBar
import { logout } from "@/lib/utils"; // Required for ProfileDropdown, indirectly for StudentTopBar

const LOGO_TEXT_COLOR = "#E33AEC";

/**
 * StudentAuthGuard (Copied from studenthome/page.tsx)
 * A component that guards student pages, ensuring the user is authenticated and has the 'STUDENT' role.
 * It shows a loading state and handles redirection with toasts.
 * @param {{ children: React.ReactNode }} props
 */
const StudentAuthGuard = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();
  
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading || isRedirecting) {
      return;
    }

    let redirectPath = null;
    let toastMessage = null;

    if (!isAuthenticated) {
      redirectPath = "/auth/login";
      toastMessage = "Bạn cần đăng nhập để truy cập trang này.";
    } else if (user?.role !== "STUDENT") {
      toastMessage = "Bạn không có quyền truy cập vào khu vực học sinh.";
      redirectPath = "/";
    }

    if (redirectPath) {
        setIsRedirecting(true);
        if (toastMessage) {
            toast.error(toastMessage);
        }
        router.push(redirectPath);
    }

  }, [user, isLoading, isAuthenticated, router, isRedirecting]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-green-600 border-b-2"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải dữ liệu người dùng...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "STUDENT") {
    return null;
  }

  return <>{children}</>;
};

/**
 * StudentTopBar (Copied from studenthome/page.tsx)
 * @type {React.FC}
 */
const StudentTopBar = () => {
  return (
    <header className="w-full border-b border-zinc-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2 px-4 py-3 md:px-6">
        <a
          href="/student/studenthome"
          className="shrink-0 text-3xl font-black tracking-tighter"
          style={{ color: LOGO_TEXT_COLOR }}
        >
          QuizzZone
        </a>
        <nav className="flex flex-1 items-center justify-center text-lg font-medium text-zinc-600">
          <a href="/student/studenthome" className="hover:text-zinc-900 transition duration-150">
            Trang chủ
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-3 relative">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};


const StartExamContent = () => { // Renamed from StartExamPage to fit the content pattern
    const router = useRouter();

    // Placeholder data for the exam - this would typically be fetched from an API
    const examDetails = {
        title: "Bài kiểm tra giữa kỳ môn Toán",
        startTime: "08:00 - 03/12/2025",
        endTime: "09:00 - 03/12/2025",
        duration: "45 phút",
        questionCount: 20,
        difficulty: "Dễ",
    };

    const handleStartExam = () => {
        // Navigate to the exam page (you can replace '/student/exam-taking' with the actual route)
        // router.push('/student/exam-taking');
        console.log("Bắt đầu làm bài...");
    };

    return (
        <div className="bg-white flex flex-col" style={{ minHeight: 'calc(100vh - 65px)'}}>
            <main className="flex-grow flex items-center justify-center p-8">
                <Card className="w-full max-w-4xl shadow-lg">
                    <CardHeader className="flex flex-col items-start px-10 pt-8">
                        <h1 className="text-3xl font-bold text-gray-800">{examDetails.title}</h1>
                    </CardHeader>
                    <CardBody className="px-10 py-8">
                        <div className="space-y-5 text-lg text-gray-600">
                            <p><strong>Thời gian bắt đầu:</strong> {examDetails.startTime}</p>
                            <p><strong>Thời gian kết thúc:</strong> {examDetails.endTime}</p>
                            <p><strong>Thời gian làm bài:</strong> {examDetails.duration}</p>
                            <p><strong>Số lượng câu hỏi:</strong> {examDetails.questionCount}</p>
                            <div className="flex items-center">
                                <p className="mr-2"><strong>Mức độ:</strong></p>
                                <Chip color="success" variant="flat">{examDetails.difficulty}</Chip>
                            </div>
                        </div>
                        <div className="text-center my-6">
                            <p className="text-2xl font-semibold text-gray-700">Bạn có chắc chắn muốn làm bài?</p>
                        </div>
                        <div className="flex justify-center mt-8">
                            <Button
                                size="lg"
                                className="font-bold bg-[#E33AEC] text-white rounded-full transition hover:opacity-90"
                                onClick={handleStartExam}
                            >
                                Bắt đầu làm bài
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </main>
            <footer className="mt-16 border-t border-zinc-100 bg-white py-6 text-center">
                <p className="text-sm text-zinc-600">
                  &copy; 2025 QuizzZone. Mọi quyền được bảo lưu.
                </p>
            </footer>
        </div>
    );
};

export default function StartExamPage() { // The default export will now wrap the content with auth and top bar
    return (
        <StudentAuthGuard>
            <StudentTopBar />
            <StartExamContent />
        </StudentAuthGuard>
    );
}
