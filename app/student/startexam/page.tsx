"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button, Chip } from "@nextui-org/react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/lib/user";
import ProfileDropdown from "@/components/ProfileDropdown";
import { logout } from "@/lib/utils";

const LOGO_TEXT_COLOR = "#E33AEC";



/* ------------------------------ MAIN CONTENT ------------------------------ */
import { fetchApi } from "@/lib/apiClient";

/* ------------------------------ MAIN CONTENT ------------------------------ */
const StartExamContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Unified on 'examId' as passed from list-exams
  const examId = searchParams.get("examId") || searchParams.get("subjectId");
  const [loading, setLoading] = useState(true);
  const [examDetails, setExamDetails] = useState<any>(null);

  useEffect(() => {
    if (!examId) return;

    const fetchExamDetails = async () => {
      try {
        const data = await fetchApi(`/student/exams/${examId}`);

        // Format timestamps
        const formatTime = (timeStr: string) => {
          if (!timeStr) return "N/A";
          return new Date(timeStr).toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
          });
        };

        setExamDetails({
          id: data.examId,
          title: data.title,
          startTime: formatTime(data.startTime),
          endTime: formatTime(data.endTime),
          duration: `${data.durationMinutes} phút`,
          questionCount: data.questionCount || 0,
          difficulty: data.examLevel || "Trung bình", // Default if missing
        });
      } catch (error) {
        console.error("Failed to fetch exam details:", error);
        toast.error("Không thể tải thông tin bài thi.");
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId]);

  const handleStartExam = () => {
    if (!examId) {
      toast.error("Không tìm thấy bài thi");
      return;
    }
    // Pass examId to do-exam page
    router.push(`/student/do-exam?examId=${examId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-green-600 border-b-2" />
          <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải thông tin bài thi...</p>
        </div>
      </div>
    );
  }

  if (!examDetails) {
    return <div className="text-center p-8">Không tìm thấy bài thi.</div>;
  }

  return (
    <div className="bg-white flex flex-col" style={{ minHeight: "calc(100vh - 65px)" }}>
      <main className="flex-grow flex items-center justify-center p-8">
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader className="flex flex-col items-start px-10 pt-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {examDetails.title}
            </h1>
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
              <p className="text-2xl font-semibold text-gray-700">
                Bạn có chắc chắn muốn làm bài?
              </p>
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

/* ------------------------------ PAGE WRAPPER ------------------------------ */
export default function StartExamPage() {
  return (
    <StartExamContent />
  );
}
