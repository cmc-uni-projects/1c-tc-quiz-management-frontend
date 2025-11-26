"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from '@/lib/apiClient'; // Import fetchApi
import { toastError } from '@/lib/toast'; // Import toastError

// TYPES

interface Option {
  id: number | string;
  name: string;
}

type Answer = {
  id: number;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: number;
  title: string;
  questionType: string;
  category: string;
  difficulty: string;
  answers: Answer[];
};

// API Endpoints
const ENDPOINTS = {
    types: '/api/questions/question-types',
    difficulties: '/api/questions/difficulties',
    categories: '/api/categories',
};

// Helper function to fetch data
const fetchOptions = async (url: string, fallback: Option[] = []) => {
  try {
    const res = await fetchApi(url);
    // Assuming the API returns an array of objects with 'id' and 'name'
    const data = Array.isArray(res) ? res.map((item: any) => ({ id: item.id || item.name, name: item.name })) : fallback;
    return data;
  } catch (error) {
    console.error(`Error fetching options from ${url}:`, error);
    toastError(`Failed to load options from ${url.split('/').pop()}.`);
    return fallback;
  }
};


// COMPONENT CHÍNH

export default function CreateExamPage() {
  // ======= STATE BÀI THI =======
  const [examTitle, setExamTitle] = useState("");
  const [questionCount, setQuestionCount] = useState<number | "">("");
  const [examType, setExamType] = useState(""); // This will store difficulty ID/name for the exam
  const [duration, setDuration] = useState<number | "">(0);
  const [startTime, setStartTime] = useState("00:00");
  const [startDate, setStartDate] = useState("");
  const [endTime, setEndTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");

  // ======= STATE CHO CÁC TÙY CHỌN ĐỘNG =======
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [difficultyOptions, setDifficultyOptions] = useState<Option[]>([]);
  const [questionTypeOptions, setQuestionTypeOptions] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch dynamic options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      const [categories, difficulties, types] = await Promise.all([
        fetchOptions(ENDPOINTS.categories),
        fetchOptions(ENDPOINTS.difficulties),
        fetchOptions(ENDPOINTS.types),
      ]);
      setCategoryOptions(categories);
      setDifficultyOptions(difficulties);
      setQuestionTypeOptions(types);
      setLoadingOptions(false);
    };
    loadOptions();
  }, []);


  // ======= STATE CÂU HỎI =======
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      title: "",
      questionType: "",
      category: "",
      difficulty: "",
      answers: [
        { id: 1, text: "", isCorrect: false },
        { id: 2, text: "", isCorrect: true }, 
      ],
    },
  ]);


  // XỬ LÝ CÂU HỎI

  const addQuestion = () => {
    const newId = questions.length > 0 ? questions[questions.length - 1].id + 1 : 1;
    setQuestions([
      ...questions,
      {
        id: newId,
        title: "",
        questionType: "",
        category: "",
        difficulty: "",
        answers: [
          { id: 1, text: "", isCorrect: false },
          { id: 2, text: "", isCorrect: false },
        ],
      },
    ]);
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
    field: keyof Question,
    value: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
              ...q,
              [field]: value,
            }
          : q
      )
    );
  };

  const addAnswer = (qid: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qid) {
          const newAnswerId = q.answers.length > 0 ? q.answers[q.answers.length - 1].id + 1 : 1;
          return {
            ...q,
            answers: [
              ...q.answers,
              { id: newAnswerId, text: "", isCorrect: false },
            ],
          };
        }
        return q;
      })
    );
  };

  const removeAnswer = (qid: number, aid: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
              ...q,
              answers: q.answers.length > 2 ? q.answers.filter((a) => a.id !== aid) : q.answers, // Keep at least 2 answers
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

  return (
    <div className="min-h-screen flex bg-[#F5F5F5] text-gray-900">

      {/* ====================== SIDEBAR ====================== */}
      <aside className="w-56 bg-[#F8F5FB] border-r border-gray-200 flex flex-col">
        <nav className="flex-1 py-4 text-sm">
          <ul className="space-y-1">
            <li>
              <a href="#" className="block px-6 py-2 hover:bg-white">
                Trang chủ
              </a>
            </li>
            <li>
              <a href="#" className="block px-6 py-2 hover:bg-white">
                Danh mục câu hỏi
              </a>
            </li>
            <li>
              <a href="#" className="block px-6 py-2 hover:bg-white">
                Quản lý câu hỏi
              </a>
            </li>
            <li>
              <a href="#" className="block px-6 py-2 hover:bg-white">
                Quản lý bài thi
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* ====================== MAIN ====================== */}
      <div className="flex-1 flex flex-col">

        

        {/* ====================== CONTENT ====================== */}
        <main className="flex-1 overflow-y-auto px-10 py-8">

          {/* ================== FORM TẠO BÀI THI ================== */}
          <section className="bg-white rounded-2xl shadow p-8 mb-6">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Tạo bài thi offline - Admin
            </h2>

            {/* Các input đầu */}
            <div className="space-y-4 mb-6">
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
                  onChange={(e) =>
                    setQuestionCount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Loại đề thi</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md bg-white"
                  disabled={loadingOptions}
                >
                  <option value="">{loadingOptions ? "Đang tải..." : "Chọn độ khó"}</option>
                  {difficultyOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
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
                  <span>Minute</span>
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

          {/* ================== THÊM CÂU HỎI ================== */}
          <section className="bg-white rounded-2xl shadow p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thêm câu hỏi</h3>
              <button
                onClick={addQuestion}
                className="px-5 py-2 bg-[#A53AEC] text-white rounded-full"
              >
                Thêm câu hỏi
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={q.id} className="p-4">

                  {/* Header */}
                  {/* Input câu hỏi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Nhập tiêu đề..."
                      value={q.title}
                      onChange={(e) =>
                        updateQuestionField(q.id, "title", e.target.value)
                      }
                      className="border px-3 py-2 rounded-md"
                    />

                    <select
                      value={q.questionType}
                      onChange={(e) =>
                        updateQuestionField(q.id, "questionType", e.target.value)
                      }
                      className="border px-3 py-2 rounded-md bg-white"
                      disabled={loadingOptions}
                    >
                      <option value="">{loadingOptions ? "Đang tải..." : "Loại câu hỏi"}</option>
                      {questionTypeOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Danh mục + độ khó */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <select
                      value={q.category}
                      onChange={(e) =>
                        updateQuestionField(q.id, "category", e.target.value)
                      }
                      className="border px-3 py-2 rounded-md bg-white"
                      disabled={loadingOptions}
                    >
                      <option value="">{loadingOptions ? "Đang tải..." : "Danh mục câu hỏi"}</option>
                      {categoryOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>

                    <select
                      value={q.difficulty}
                      onChange={(e) =>
                        updateQuestionField(q.id, "difficulty", e.target.value)
                      }
                      className="border px-3 py-2 rounded-md bg-white"
                      disabled={loadingOptions}
                    >
                      <option value="">{loadingOptions ? "Đang tải..." : "Độ khó"}</option>
                      {difficultyOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Danh sách đáp án */}
                  <div className="space-y-2 mb-4">
                    {q.answers.map((a) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={a.isCorrect}
                          onChange={() => setCorrectAnswer(q.id, a.id)}
                        />

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
                  <div className="flex gap-3">
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

            <button className="px-6 py-2 bg-purple-700 text-white rounded-md">
              Đăng bài
            </button>
          </div>
        </main>

        {/* ====================== FOOTER ====================== */}
        <footer className="h-12 bg-white border-t border-gray-200 flex items-center justify-center text-sm text-gray-500">
          © 2025 QuizzZone. Mọi quyền được bảo lưu.
        </footer>
      </div>
    </div>
  );
}
