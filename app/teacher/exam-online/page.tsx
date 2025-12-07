"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { useRouter } from 'next/router'; // Next.js 12 (hoặc next/navigation nếu là Next.js 13+);
import Link from 'next/link';


// TYPES
type Category = {
  id: number;
  name: string;
};

type QuestionTypeOption = { id: string; name: string };
type DifficultyOption = { id: string; name: string };

type Answer = {
  id: number;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: number;
  title: string;
  questionType: 'single' | 'multi' | 'true_false'; // Align with local representation
  categoryId: string; // Store category ID as string
  categoryName?: string; // Optional: for display if we fetch the name
  difficulty: string;
  answers: Answer[];
};

// --- NEW TYPES for QuestionForm compatibility ---
interface QuestionFormData {
  title: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | '';
  difficulty: string;
  categoryId: string;
  answers: {
    tempId: number;
    content: string;
    isCorrect: boolean;
  }[];
}


// COMPONENT CHÍNH

export default function CreateExamPage() {

  // ======= STATE BÀI THI =======
  const [examCategory, setExamCategory] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [questionCount, setQuestionCount] = useState<number | "">("");
  const [examType, setExamType] = useState("");
  const [duration, setDuration] = useState<number | "">(0);
  const [startTime, setStartTime] = useState("00:00");
  const [startDate, setStartDate] = useState("");
  const [endTime, setEndTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");
  const [openLibrary, setOpenLibrary] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [participantLimit, setParticipantLimit] = useState<number | "">("");


  // New state for question creation form
  const [showCreateQuestionForm, setShowCreateQuestionForm] = useState(false);
  const [isQuestionFormLoading, setIsQuestionFormLoading] = useState(false);

  // === THÊM STATE CHO MODAL THÔNG TIN BÀI THI ===
  const [showExamInfoModal, setShowExamInfoModal] = useState(false);
  const [examInfo, setExamInfo] = useState({
    title: "",
    examCode: "",
    inviteLink: "",
    qrCodeUrl: "",
  });
  // ===========================================

  // States for Question Library Modal
  const [libraryQuestions, setLibraryQuestions] = useState<Question[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryFilters, setLibraryFilters] = useState({
    search: '',
    difficulty: '',
    type: '',
    categoryId: '',
  });
  const [libraryCurrentPage, setLibraryCurrentPage] = useState(1);
  const [libraryTotalPages, setLibraryTotalPages] = useState(1);
  const [libraryTotalCount, setLibraryTotalCount] = useState(0);

  const [libraryQuestionTypes, setLibraryQuestionTypes] = useState<QuestionTypeOption[]>([]);
  const [libraryDifficulties, setLibraryDifficulties] = useState<DifficultyOption[]>([]);

  const fetchLibraryQuestions = async () => {
    setLibraryLoading(true);
    const pageIndex = libraryCurrentPage - 1; // Backend is 0-indexed

    const searchParams = new URLSearchParams({
      page: pageIndex.toString(),
      size: '10', // Assuming 10 items per page for library
    });

    if (libraryFilters.search) searchParams.append('search', libraryFilters.search);
    if (libraryFilters.difficulty) searchParams.append('difficulty', libraryFilters.difficulty);
    if (libraryFilters.type) searchParams.append('type', libraryFilters.type);
    if (libraryFilters.categoryId) searchParams.append('categoryId', libraryFilters.categoryId);


    try {
      const data: { content: any[], totalElements: number, totalPages: number } = await fetchApi(`/questions/all?${searchParams.toString()}`);
      setLibraryQuestions(data.content.map(q => ({
        id: q.id,
        title: q.title,
        questionType: q.type === 'SINGLE' ? 'single' : (q.type === 'MULTIPLE' ? 'multi' : (q.type === 'TRUE_FALSE' ? 'true_false' : 'single')),
        categoryId: q.category.id.toString(),
        categoryName: q.category.name,
        difficulty: q.difficulty,
        answers: q.answers.map((a: any) => ({
          id: a.id,
          text: a.content,
          isCorrect: a.correct,
        })),
      })));
      setLibraryTotalCount(data.totalElements);
      setLibraryTotalPages(data.totalPages);
    } catch (error) {
      toastError("Không thể tải câu hỏi từ thư viện.");
      console.error("Failed to fetch library questions:", error);
    } finally {
      setLibraryLoading(false);
    }
  };

  // Fetch categories, question types, and difficulties on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [categoriesRes, typesRes, difficultiesRes] = await Promise.all([
          fetchApi('/categories/all'),
          fetchApi('/questions/question-types'), // Returns ["SINGLE", "MULTIPLE", "TRUE_FALSE"]
          fetchApi('/questions/difficulties'), // Returns ["Easy", "Medium", "Hard"]
        ]);

        setCategories(categoriesRes);

        // Format question types for dropdown
        const formattedTypes = typesRes.map((t: string) => {
          const typeMap: { [key: string]: string } = {
            'SINGLE': 'single',
            'MULTIPLE': 'multi',
            'TRUE_FALSE': 'true_false'
          };
          return { id: typeMap[t] || t, name: t.replace('_', ' ') };
        });
        setLibraryQuestionTypes(formattedTypes);

        // Format difficulties for dropdown
        const formattedDifficulties = difficultiesRes.map((d: string) => ({ id: d, name: d }));
        setLibraryDifficulties(formattedDifficulties);

      } catch (error) {
        toastError("Không thể tải các tùy chọn.");
        console.error("Failed to fetch dropdown options:", error);
      } finally {
        setCategoriesLoading(false); // Only for exam categories
      }
    };
    fetchDropdownData();
  }, []); // Empty dependency array means it runs once on mount

  useEffect(() => {
    if (openLibrary) {
      fetchLibraryQuestions();
    }
  }, [openLibrary, libraryFilters, libraryCurrentPage]);


  // ======= STATE CÂU HỎI =======
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      title: "",
      questionType: 'single', // Default to 'single'
      categoryId: categories.length > 0 ? categories[0].id.toString() : "", // Dùng category đầu tiên nếu có
      difficulty: "Easy",
      answers: [
        { id: 1, text: "", isCorrect: false },
        { id: 2, text: "", isCorrect: true },
        { id: 3, text: "", isCorrect: false },
      ],
    },
  ]);




  // XỬ LÝ CÂU HỎI
  const addQuestion = (newQuestion: Question) => {
    setQuestions([
      ...questions,
      {
        ...newQuestion,
        id: questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1, // Ensure unique ID
      },
    ]);
  };

  const handleCreateNewQuestionSubmit = async (formData: QuestionFormData) => {
    setIsQuestionFormLoading(true);
    try {
      // Map formData to the local Question type
      const categoryObj = categories.find(cat => cat.id.toString() === formData.categoryId);

      const newQuestion: Question = {
        id: 0, // Temporary ID, will be replaced by addQuestion
        title: formData.title,
        questionType: formData.type === 'SINGLE_CHOICE' ? 'single' : (formData.type === 'MULTIPLE_CHOICE' ? 'multi' : (formData.type === 'TRUE_FALSE' ? 'true_false' : 'single')),
        categoryId: formData.categoryId,
        categoryName: categoryObj ? categoryObj.name : undefined, // Look up category name
        difficulty: formData.difficulty,
        answers: formData.answers.map(ans => ({
          id: ans.tempId,
          text: ans.content,
          isCorrect: ans.isCorrect,
        })),
      };

      addQuestion(newQuestion);
      toastSuccess("Tạo câu hỏi thành công và đã thêm vào bài thi.");
      setShowCreateQuestionForm(false); // Hide form after successful submission
    } catch (error) {
      console.error('Error adding new question:', error);
      toastError("Lỗi khi thêm câu hỏi.");
    } finally {
      setIsQuestionFormLoading(false);
    }
  };

  const removeQuestion = (questionId: number) => {
    if (questions.length === 1) {
      alert("Phải có ít nhất 1 câu hỏi");
      return;
    }
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const updateQuestionField = (
    qid: number,
    field: 'title' | 'questionType' | 'categoryId' | 'difficulty',
    value: string
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qid) {
          if (field === 'categoryId') {
            const categoryObj = categories.find(cat => cat.id.toString() === value);
            return {
              ...q,
              categoryId: value,
              categoryName: categoryObj ? categoryObj.name : undefined,
            };
          }
          return {
            ...q,
            [field]: value,
          };
        }
        return q;
      })
    );
  };

  const addAnswer = (qid: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            answers: [
              ...q.answers,
              { id: q.answers.length + 1, text: "", isCorrect: false },
            ],
          }
          : q
      )
    );
  };

  const removeAnswer = (qid: number, aid: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            answers: q.answers.length > 1 ? q.answers.filter((a) => a.id !== aid) : q.answers,
          }
          : q
      )
    );
  };

  const updateAnswerText = (qid: number, aid: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            answers: q.answers.map((a) =>
              a.id === aid ? { ...a, text: value } : a
            ),
          }
          : q
      )
    );
  };

  const setCorrectAnswer = (qid: number, aid: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            answers: q.answers.map((a) => ({
              ...a,
              isCorrect: a.id === aid,
            })),
          }
          : q
      )
    );
  };
  const toggleCorrectAnswer = (qid: number, aid: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            answers: q.answers.map((a) =>
              a.id === aid ? { ...a, isCorrect: !a.isCorrect } : a
            ),
          }
          : q
      )
    );
  };


  const handleSubmitExam = async () => {
    // Basic validation
    if (!examTitle.trim()) {
      toastError("Tên bài thi không được để trống.");
      return;
    }
    if (!examCategory) {
      toastError("Vui lòng chọn danh mục bài thi.");
      return;
    }
    if (duration <= 0) {
      toastError("Thời gian làm bài phải lớn hơn 0.");
      return;
    }
    if (questions.length === 0) {
      toastError("Vui lòng thêm ít nhất một câu hỏi.");
      return;
    }

    // =========================================================================
    // PHẦN NÀY ĐÃ ĐƯỢC CHỈNH SỬA: TẠM THỜI MOCK (GIẢ LẬP) THÀNH CÔNG VỚI DỮ LIỆU CỨNG
    // (Bỏ qua toàn bộ logic gọi API thật để test UI)
    // =========================================================================

    // Giả lập độ trễ tạo bài thi (tùy chọn)
    await new Promise(resolve => setTimeout(resolve, 500));

    const hardcodedCode = "ABCD12"; // Mã cứng 6 ký tự/số
    const inviteLink = `https://mock-domain.com/join/${hardcodedCode}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}`;

    setExamInfo({
      title: examTitle, // Lấy tên bài thi từ input
      examCode: hardcodedCode,
      inviteLink: inviteLink,
      qrCodeUrl: qrCodeUrl,
    });

    toastSuccess("Tạo bài thi thành công! (Dữ liệu giả lập)");
    setShowExamInfoModal(true); // Hiển thị Modal

    // >>> BỎ QUA TOÀN BỘ LOGIC GỌI API THẬT PHÍA DƯỚI CHO VIỆC TEST <<<
    /*
    const createdQuestionIds: number[] = [];

    // Validate and create each question individually
    for (const q of questions) {
      console.log(`Validating question ID: ${q.id}, Title: ${q.title}`);
      if (!q.title.trim()) {
        toastError("Tiêu đề câu hỏi không được để trống.");
        return;
      }
      if (!q.questionType) {
        toastError("Loại câu hỏi không được để trống.");
        return;
      }
      if (!q.difficulty) {
        toastError("Độ khó không được để trống.");
        return;
      }
      if (q.answers.length === 0) {
        toastError("Vui lòng thêm ít nhất một đáp án cho mỗi câu hỏi.");
        return;
      }
      const hasCorrectAnswer = q.answers.some(a => a.isCorrect);
      if (!hasCorrectAnswer) {
        toastError("Mỗi câu hỏi phải có ít nhất một đáp án đúng.");
        return;
      }
      for (const a of q.answers) {
        console.log(`  Answer ID: ${a.id}, Text: "${a.text}", isCorrect: ${a.isCorrect}`);
        if (!(a.text || '').trim()) {
          toastError("Nội dung đáp án không được để trống.");
          return;
        }
      }

      // Prepare payload for individual question creation
      const questionPayload = {
        title: q.title,
        type: q.questionType.toUpperCase(), // Convert 'single' to 'SINGLE'
        difficulty: q.difficulty.toUpperCase(), // Convert 'easy' to 'EASY'
        categoryId: parseInt(q.categoryId),
        answers: q.answers.map(a => {
          const content = (a.text || '').toString().trim();
          const isCorrect = Boolean(a.isCorrect);
          console.log(`    Mapping Answer: content="${content}", isCorrect=${isCorrect}`);
          return { content, isCorrect };
        })
      };

      try {
        const createdQuestion = await fetchApi('/questions/create', {
          method: 'POST',
          body: questionPayload,
        });
        createdQuestionIds.push(createdQuestion.id);
      } catch (error: any) {
        console.error("Failed to create question:", questionPayload, error);
        toastError(error.message || "Tạo câu hỏi thất bại. Không thể tạo bài thi.");
        return; // Stop exam creation if any question fails
      }
    }

    // Format dates and times
    const startDateTime = `${startDate}T${startTime}:00`;
    const endDateTime = `${endDate}T${endTime}:00`;

    // Construct exam payload with collected question IDs
    const examPayload = {
      title: examTitle,
      categoryId: parseInt(examCategory),
      questionCount: questionCount === "" ? createdQuestionIds.length : questionCount,
      examType: examType,
      duration: duration,
      startTime: startDateTime,
      endTime: endDateTime,
      questionIds: createdQuestionIds, // Use collected IDs
    };

    console.log("Exam Payload:", examPayload);

    try {
      const response = await fetchApi('/exams', {
        method: 'POST',
        body: examPayload,
      });
      toastSuccess("Tạo bài thi thành công!");
      // Optionally redirect or clear form
    } catch (error: any) {
      console.error("Failed to create exam:", error);
      toastError(error.message || "Tạo bài thi thất bại.");
    }
    */
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F5] text-gray-900">

      {/* ====================== MAIN ====================== */}
      <div className="flex-1 flex flex-col">



        {/* ====================== CONTENT ====================== */}
        <main className="flex-1 overflow-y-auto px-10 py-8">

          {/* ================== FORM TẠO BÀI THI ================== */}
          <section className="bg-white rounded-2xl shadow p-8 mb-6">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Tạo bài thi online
            </h2>
            <div className="flex justify-start gap-6 border-b border-gray-300 mb-8">
              {/* Nút Bài thi Offline */}
              <a href="/teacher/exam-offline">
                <button
                  className="pb-2 font-medium text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-200"
                >
                  Bài thi Offline
                </button>
              </a>

              {/* Nút Bài thi Online */}
              <a href="/teacher/exam-online">
                <button
                  className="pb-2 font-medium border-b-2 border-black" // Nút ONLINE ACTIVE
                >
                  Bài thi Online
                </button>
              </a>
            </div>

            {/* Các input đầu */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-1">Danh mục bài thi</label>
                <Autocomplete
                  allowsCustomValue

                  defaultItems={categories}
                  onSelectionChange={(key) => setExamCategory(key as string)}
                  onInputChange={(value) => setExamCategory(value)}
                  className="w-full"
                  isLoading={categoriesLoading}
                  label={examCategory ? "" : (categoriesLoading ? "Đang tải danh mục..." : "Chọn danh mục")}
                  inputProps={{
                    classNames: {
                      base: "h-auto",
                      inputWrapper: "border px-3 py-2 rounded-md bg-white h-auto",
                      input: "text-sm",
                    },
                  }}
                  popoverProps={{
                    classNames: {
                      content: "bg-white" // Đặt nền trắng cho phần xổ xuống
                    }
                  }}
                >
                  {(item) => <AutocompleteItem key={item.id} value={item.name}>{item.name}</AutocompleteItem>}
                </Autocomplete>
              </div>
              <div>
                <label className="block text-sm mb-1">Tên bài thi</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Số lượng câu hỏi</label>
                <input
                  type="number"
                  value={questionCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setQuestionCount(value === "" ? "" : Number(value));
                    }
                  }}
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">
                  Giới hạn số người tham gia
                  <span className="text-gray-500 text-xs ml-1"></span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={participantLimit}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setParticipantLimit(value === "" ? "" : Number(value));
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg 
               focus:border-purple-600 focus:ring-4 focus:ring-purple-100 
               focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Loại đề thi</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md bg-white"
                >
                  <option value="">Chọn loại</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
            </div>

            {/* Thời gian nộp bài */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Thời gian nộp bài
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-sm">Khoảng thời gian:</span>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) =>
                      setDuration(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-20 border px-2 py-1 rounded-md"
                  />
                  <span>Phút</span>
                </div>
              </div>

              {/* Bắt đầu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1">Thời gian bắt đầu:</p>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-32 border px-2 py-1 rounded-md"
                    />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border px-2 py-1 rounded-md"
                    />
                  </div>
                </div>

                {/* Kết thúc */}
                <div>
                  <p className="text-sm mb-1">Thời gian kết thúc:</p>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-32 border px-2 py-1 rounded-md"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border px-2 py-1 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {showCreateQuestionForm && (
            <section className="bg-white rounded-2xl shadow p-8 mb-6">
              <h2 className="text-2xl font-semibold text-center mb-8">Tạo câu hỏi mới</h2>
              <QuestionForm
                isEdit={false}
                onSubmit={handleCreateNewQuestionSubmit}
                isLoading={isQuestionFormLoading}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowCreateQuestionForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md"
                >
                  Hủy
                </button>
              </div>
            </section>
          )}

          {/* ================== THÊM CÂU HỎI ================== */}
          <section className="bg-white rounded-2xl shadow p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Các câu hỏi đã tạo</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpenLibrary(true)}
                  className="px-5 py-2 border-2 border-[#A53AEC] text-[#A53AEC] bg-white rounded-full"
                >
                  Thêm từ thư viện
                </button>
                <button
                  onClick={() => setShowCreateQuestionForm(true)}
                  className="px-5 py-2 bg-[#A53AEC] text-white rounded-full"
                >
                  Tạo câu hỏi mới
                </button>
              </div>
            </div>
            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={q.id} className="p-4 border rounded-lg shadow-sm bg-gray-50 relative">
                  <h4 className="text-md font-semibold mb-3">Câu hỏi {index + 1}</h4>

                  {/* Input câu hỏi */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Nhập tiêu đề câu hỏi..."
                      value={q.title}
                      onChange={(e) => updateQuestionField(q.id, "title", e.target.value)}
                      className="border px-3 py-2 rounded-md w-full"
                    />
                  </div>

                  {/* Question Type + Difficulty + Category */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {/* Loại câu hỏi */}
                    <select
                      value={q.questionType}
                      onChange={(e) => updateQuestionField(q.id, "questionType", e.target.value)}
                      className="border px-3 py-2 rounded-md bg-white"
                    >
                      <option value="">Loại câu hỏi</option>
                      <option value="single">Chọn 1 đáp án</option>
                      <option value="multi">Chọn nhiều đáp án</option>
                      <option value="true_false">Đúng/Sai</option>
                    </select>

                    {/* Độ khó */}
                    <select
                      value={q.difficulty}
                      onChange={(e) => updateQuestionField(q.id, "difficulty", e.target.value)}
                      className="border px-3 py-2 rounded-md bg-white"
                    >
                      <option value="">Độ khó</option>
                      <option value="Easy">Dễ</option>
                      <option value="Medium">Trung bình</option>
                      <option value="Hard">Khó</option>
                    </select>

                    {/* Danh mục */}
                    <select
                      value={q.categoryId}
                      onChange={(e) => updateQuestionField(q.id, "categoryId", e.target.value)}
                      className="border px-3 py-2 rounded-md bg-white"
                    >
                      <option value="">Danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Danh sách đáp án */}
                  <div className="space-y-2 mb-4">
                    {q.answers.map((a) => (
                      <div key={a.id} className="flex items-center gap-2">

                        {q.questionType === "multi" ? (
                          <input
                            type="checkbox"
                            checked={a.isCorrect}
                            onChange={() => toggleCorrectAnswer(q.id, a.id)}
                            className="form-checkbox h-4 w-4 text-purple-600 border-gray-300 rounded"
                          />
                        ) : (
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            checked={a.isCorrect}
                            onChange={() => setCorrectAnswer(q.id, a.id)}
                          />
                        )}
                        <input
                          type="text"
                          value={a.text}
                          placeholder={`Đáp án ${a.id}`}
                          onChange={(e) =>
                            updateAnswerText(q.id, a.id, e.target.value)
                          }
                          className="flex-1 border px-3 py-2 rounded-md"
                        />
                        <button
                          onClick={() => removeAnswer(q.id, a.id)}
                          className="p-2 hover:bg-gray-200 rounded-md"
                        >
                          🗑
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => addAnswer(q.id)}
                      className="px-4 py-1.5 border border-purple-500 text-purple-600 rounded-md"
                    >
                      Thêm đáp án
                    </button>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="px-4 py-1.5 border border-red-500 text-red-600 rounded-md"
                    >
                      Xóa câu hỏi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* NÚT LƯU – ĐĂNG BÀI */}
          <div className="mt-6 flex justify-end gap-4">
            <button className="px-6 py-2 border border-purple-700 text-purple-700 rounded-md">
              Lưu
            </button>

            <button
              onClick={handleSubmitExam}
              className="px-6 py-2 bg-purple-700 text-white rounded-md"
            >
              Đăng bài
            </button>
          </div>
          {/* ================== MODAL THƯ VIỆN ================== */}
          {openLibrary && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

              <div className="bg-white rounded-xl p-6 relative w-[95%] max-w-[1350px] min-h-[80vh] max-h-[90vh] flex flex-col">


                {/* Nút đóng */}
                <button
                  onClick={() => setOpenLibrary(false)}
                  className="absolute top-3 right-4 text-gray-500 text-lg hover:text-black"
                >
                  x
                </button>

                <h3 className="text-xl font-semibold mb-4">Thư viện câu hỏi</h3>

                {/* ===== FILTER ===== */}
                <div className="flex flex-wrap gap-3 mb-4 items-center">

                  <input
                    placeholder="Nhập tiêu đề / đáp án..."
                    className="w-[300px] h-[40px] rounded-full border border-gray-300 px-4 text-sm"
                    value={libraryFilters.search}
                    onChange={(e) => setLibraryFilters(prev => ({ ...prev, search: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && setLibraryCurrentPage(1)}
                  />

                  <select
                    className="h-[40px] px-4 rounded-full border border-gray-300 text-sm"
                    value={libraryFilters.difficulty}
                    onChange={(e) => setLibraryFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                  >
                    <option value="">Chọn độ khó</option>
                    {libraryDifficulties.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                  </select>

                  <select
                    className="h-[40px] px-4 rounded-full border border-gray-300 text-sm"
                    value={libraryFilters.type}
                    onChange={(e) => setLibraryFilters(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="">Chọn loại câu hỏi</option>
                    {libraryQuestionTypes.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                  </select>

                  <select
                    className="h-[40px] px-4 rounded-full border border-gray-300 text-sm"
                    value={libraryFilters.categoryId}
                    onChange={(e) => setLibraryFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>)}
                  </select>

                  <button
                    onClick={() => setLibraryCurrentPage(1)} // Reset to first page on filter apply
                    className="bg-[#A53AEC] text-white px-5 py-2 rounded-full text-sm"
                    disabled={libraryLoading}
                  >
                    Tìm kiếm
                  </button>
                </div>

                {/* ===== TABLE ===== */}
                <div className="border border-gray-200 rounded-lg overflow-hidden flex-grow relative">
                  {libraryLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                      <p className="text-gray-600">Đang tải câu hỏi...</p>
                    </div>
                  )}
                  <table className="w-full border-collapse text-center text-sm">
                    <thead className="border-b bg-gray-50 sticky top-0">
                      <tr>
                        <th className="py-2 border-r">STT</th>
                        <th className="border-r">Tiêu đề</th>
                        <th className="border-r">Loại câu hỏi</th>
                        <th className="border-r">Độ khó</th>
                        <th className="border-r">Danh mục</th>
                        <th className="border-r">Người tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {libraryQuestions.length === 0 && !libraryLoading && (
                        <tr>
                          <td colSpan={7} className="py-8 text-gray-500">
                            Không tìm thấy câu hỏi nào.
                          </td>
                        </tr>
                      )}
                      {libraryQuestions.map((q, index) => (
                        <tr key={q.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 border-r">{index + 1 + (libraryCurrentPage - 1) * 10}</td>
                          <td className="border-r text-left px-2">{q.title}</td>
                          <td className="border-r">{q.questionType}</td>
                          <td className="border-r">{q.difficulty}</td>
                          <td className="border-r">{q.categoryName || q.categoryId}</td>
                          <td className="border-r">TBD</td>
                          <td>
                            <button
                              onClick={() => addQuestion(q)}
                              className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600"
                            >
                              Thêm
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ===== PAGINATION ===== */}
                {libraryTotalPages > 1 && (
                  <div className="flex justify-center gap-3 mt-4">
                    <button
                      onClick={() => setLibraryCurrentPage(1)}
                      disabled={libraryCurrentPage === 1 || libraryLoading}
                      className="border border-blue-500 text-blue-500 px-2 py-1 rounded-md"
                    >
                      ≪
                    </button>
                    <button
                      onClick={() => setLibraryCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={libraryCurrentPage === 1 || libraryLoading}
                      className="border border-blue-500 text-blue-500 px-2 py-1 rounded-md"
                    >
                      ‹
                    </button>

                    <span className="px-4 py-1 bg-purple-600 text-white font-bold rounded-md shadow-md">
                      {libraryCurrentPage} / {libraryTotalPages}
                    </span>

                    <button
                      onClick={() => setLibraryCurrentPage(prev => Math.min(libraryTotalPages, prev + 1))}
                      disabled={libraryCurrentPage === libraryTotalPages || libraryLoading}
                      className="border border-blue-500 text-blue-500 px-2 py-1 rounded-md"
                    >
                      ›
                    </button>
                    <button
                      onClick={() => setLibraryCurrentPage(libraryTotalPages)}
                      disabled={libraryCurrentPage === libraryTotalPages || libraryLoading}
                      className="border border-blue-500 text-blue-500 px-2 py-1 rounded-md"
                    >
                      ≫
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ================== MODAL THÔNG TIN BÀI THI (DÙNG DỮ LIỆU CỨNG) ================== */}
          {showExamInfoModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 relative w-[90%] max-w-lg shadow-2xl">
                {/* Nút đóng */}
                <button
                  onClick={() => setShowExamInfoModal(false)}
                  className="absolute top-4 right-4 text-gray-500 text-2xl hover:text-black"
                >
                  &times;
                </button>

                <h3 className="text-2xl font-bold text-center mb-6 text-purple-700">

                </h3>
                <p className="text-center text-gray-600 mb-6">
                  Sử dụng các thông tin sau để chia sẻ bài thi của bạn.
                </p>

                <div className="space-y-4">
                  {/* Tên bài thi */}
                  <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <p className="font-semibold text-sm text-purple-700">Tên bài thi</p>
                    <p className="text-lg font-medium text-gray-800">{examInfo.title}</p>
                  </div>

                  {/* Mã 6 số */}
                  <div className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-indigo-700">Mã Tham Dự (6 số)</p>
                      <p className="text-2xl font-extrabold tracking-widest text-indigo-800">
                        {examInfo.examCode}
                      </p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(examInfo.examCode)}
                      className="text-xs bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition"
                    >
                      Sao chép
                    </button>
                  </div>

                  {/* Link Tham gia */}
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <p className="font-semibold text-sm text-green-700">Link Tham gia</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={examInfo.inviteLink}
                        className="flex-1 p-1 bg-white border border-gray-300 rounded text-sm overflow-x-scroll"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(examInfo.inviteLink)}
                        className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition whitespace-nowrap"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>

                  {/* Mã QR */}
                  <div className="text-center pt-4">
                    <p className="font-semibold text-gray-700 mb-2">Quét Mã QR để tham gia</p>
                    <img
                      src={examInfo.qrCodeUrl}
                      alt="Mã QR tham gia bài thi"
                      className="w-36 h-36 mx-auto border-4 border-gray-200 p-1 rounded-lg"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setShowExamInfoModal(false)}
                    className="px-6 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 transition"
                  >
                    Bắt đầu
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>

        {/* ====================== FOOTER ====================== */}
        <footer className="h-12 bg-white border-t border-gray-200 flex items-center justify-center text-sm text-gray-500">
          © 2025 QuizzZone. Mọi quyền được bảo lưu.
        </footer>
      </div>
    </div>
  );
}