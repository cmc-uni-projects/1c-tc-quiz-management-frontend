"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

/* --- Constants (style/colors) --- */
const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api`;
const PAGE_SIZE = 10;
const PAGE_BG = "#F4F2FF";
const HERO_GRADIENT = "linear-gradient(135deg, #FFB6FF 0%, #8A46FF 100%)";
const BUTTON_COLOR = "#9453C9";
const SEARCH_BAR_BG = "#E33AEC";
const TABLE_SHADOW = "0 25px 60px rgba(126, 62, 255, 0.18)";

/* --- fetchApi (reuse the pattern from your categories file) --- */
const getAuthToken = () => {
  if (typeof window !== "undefined") return localStorage.getItem("jwt");
  return null;
};

async function fetchApi(url, options = {}) {
  const token = getAuthToken();
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const config = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: "include",
  };

  if (options.body) {
    config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const isJson = response.headers.get("content-type")?.includes("application/json");

  if (!response.ok) {
    let errorText = "Lỗi không xác định";
    try {
      const parsed = isJson ? await response.json() : null;
      errorText = (parsed && (parsed.message || parsed.error)) || (isJson ? JSON.stringify(parsed) : await response.text());
    } catch {}
    throw new Error(errorText.toString().substring(0, 300));
  }

  try {
    return isJson ? await response.json() : await response.text();
  } catch {
    return null;
  }
}

/* --- Small icons (reused) --- */
const PlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const XIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

/* --- Helper functions --- */
function sentenceCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* --- Difficulty Badge --- */
function DifficultyBadge({ difficulty }) {
  const diff = difficulty?.toUpperCase();
  let colorClass = "bg-gray-100 text-gray-800"; // Default

  switch (diff) {
    case "EASY":
      colorClass = "bg-green-100 text-green-800";
      break;
    case "MEDIUM":
      colorClass = "bg-yellow-100 text-yellow-800";
      break;
    case "HARD":
      colorClass = "bg-red-100 text-red-800";
      break;
    default:
      break;
  }

  // Format lại chữ (Dễ, Trung bình, Khó)
  const text = diff ? sentenceCase(diff.toLowerCase()) : "N/A";

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {text}
    </span>
  );
}

function VisibilityBadge({ visibility }) {
  const vis = visibility?.toUpperCase();
  let colorClass = "bg-gray-100 text-gray-800";

  switch (vis) {
    case "PUBLIC":
      colorClass = "bg-sky-100 text-sky-800";
      break;
    case "PRIVATE":
      colorClass = "bg-orange-100 text-orange-800";
      break;
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {vis ? sentenceCase(vis.toLowerCase()) : "N/A"}
    </span>
  );
}

/* --- Modal component for Create/Edit (internal) --- */
function QuestionModal({ open, onClose, onSubmit, categories = [], editing = null }) {
  const [title, setTitle] = useState(editing?.title || "");
  const [type, setType] = useState(editing?.type || "");
  const [difficulty, setDifficulty] = useState(editing?.difficulty || "");
  const [answers, setAnswers] = useState(editing?.answers || [{ text: "", correct: false }]);
  const [categoryId, setCategoryId] = useState(editing?.categoryId || "");
  const [visibility, setVisibility] = useState(editing?.visibility || "PRIVATE");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // when editing prop changes, sync fields
  useEffect(() => {
    setTitle(editing?.title || "");
    setType(editing?.type || "");
    setDifficulty(editing?.difficulty || "");
    setAnswers(editing?.answers || [{ text: "", correct: false }]);
    setCategoryId(editing?.categoryId || "");
    setVisibility(editing?.visibility || "PRIVATE");
    setError("");
  }, [editing, open]);

  // Handle answer changes
  const handleAnswerTextChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index].text = value;
    setAnswers(newAnswers);
  };

  const handleAnswerCorrectChange = (index, isCorrect) => {
    const newAnswers = [...answers];
    if (type === "SINGLE" || type === "TRUE_FALSE") {
      // For single choice, only one can be correct
      newAnswers.forEach((ans, i) => {
        ans.correct = i === index;
      });
    } else {
      // For multiple choice, toggle this answer
      newAnswers[index].correct = isCorrect;
    }
    setAnswers(newAnswers);
  };

  const addAnswer = () => {
    if (type === "TRUE_FALSE") return; // Don't add more answers for true/false
    setAnswers([...answers, { text: "", correct: false }]);
  };

  const removeAnswer = (index) => {
    if (answers.length <= 2) return; // Keep at least 2 answers
    const newAnswers = answers.filter((_, i) => i !== index);
    setAnswers(newAnswers);
  };

  // Initialize answers when type changes
  useEffect(() => {
    if (type === "TRUE_FALSE") {
      setAnswers([
        { text: "Đúng", correct: false },
        { text: "Sai", correct: false }
      ]);
    } else if (type === "SINGLE" && answers.length < 2) {
      setAnswers([
        { text: "", correct: false },
        { text: "", correct: false }
      ]);
    } else if (type === "MULTIPLE" && answers.length < 2) {
      setAnswers([
        { text: "", correct: false },
        { text: "", correct: false }
      ]);
    }
  }, [type]);

  const validate = () => {
    if (!title.trim()) return "Tiêu đề là bắt buộc";
    if (!type) return "Chọn loại câu hỏi";
    if (!difficulty) return "Chọn độ khó";
    if (!categoryId) return "Chọn danh mục";
    
    // Validate answers
    const validAnswers = answers.filter(ans => ans.text.trim());
    if (validAnswers.length < 2) return "Cần ít nhất 2 đáp án";
    
    const correctAnswers = validAnswers.filter(ans => ans.correct);
    if (correctAnswers.length === 0) return "Cần chọn ít nhất 1 đáp án đúng";
    if (type === "SINGLE" && correctAnswers.length > 1) return "Câu hỏi 1 lựa chọn chỉ có 1 đáp án đúng";
    
    return "";
  };

  const handleSubmit = async () => {
    const v = validate();
    setError(v);
    if (v) return;

    try {
      setLoading(true);
      const validAnswers = answers.filter(ans => ans.text.trim());
      const payload = {
        title: title.trim(),
        type,
        difficulty,
        categoryId,
        visibility,
        answers: validAnswers,
        correctAnswer: validAnswers.find(ans => ans.correct)?.text || "",
      };
      await onSubmit(payload); // parent handles API calls and state update
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setError(e?.message || "Lỗi khi lưu");
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{editing ? "Cập nhật thông tin câu hỏi" : "Thêm câu hỏi mới"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Tiêu đề</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Loại câu hỏi</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">-- Chọn loại --</option>
              <option value="SINGLE">Trắc nghiệm (1 đáp án đúng)</option>
              <option value="MULTIPLE">Trắc nghiệm (nhiều đáp án đúng)</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Độ khó</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">-- Chọn độ khó --</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Đáp án</label>
            <div className="space-y-2">
              {answers.map((answer, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type={type === "MULTIPLE" ? "checkbox" : "radio"}
                    name="correctAnswer"
                    checked={answer.correct}
                    onChange={(e) => handleAnswerCorrectChange(index, e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={answer.text}
                    onChange={(e) => handleAnswerTextChange(index, e.target.value)}
                    placeholder={`Đáp án ${index + 1}`}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    disabled={type === "TRUE_FALSE"}
                  />
                  {type !== "TRUE_FALSE" && answers.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeAnswer(index)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <XIcon />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {type !== "TRUE_FALSE" && (
              <button
                type="button"
                onClick={addAnswer}
                className="mt-2 px-3 py-1 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 text-sm"
              >
                <PlusIcon /> Thêm đáp án
              </button>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {type === "TRUE_FALSE" ? "Câu hỏi đúng/sai có sẵn 2 đáp án." : 
               type === "SINGLE" ? "Chọn 1 đáp án đúng duy nhất." : 
               "Có thể chọn nhiều đáp án đúng."}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Danh mục câu hỏi</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Visibility</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
            </select>
          </div>

          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-xl hover:bg-gray-100" disabled={loading}>Hủy</button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-xl text-white" style={{ backgroundColor: BUTTON_COLOR }} disabled={loading}>
              {loading ? (editing ? "Đang cập nhật..." : "Đang tạo...") : (editing ? "Cập nhật câu hỏi" : "Thêm câu hỏi")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Main Page Component --- */
export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  /* --- Load profile once (optional) --- */
  useEffect(() => {
    (async () => {
      try {
        const profile = await fetchApi(`${API_URL}/me`);
        setCurrentUser(profile);
      } catch {}
    })();
  }, []);

  /* --- Fetch categories and initial questions --- */
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchQuestions(page, keyword, difficultyFilter, typeFilter, categoryFilter, visibilityFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchCategories = async () => {
    try {
      const data = await fetchApi(`${API_URL}/categories/all`);
      const content = Array.isArray(data) ? data : data?.content || [];
      setCategories(content);
    } catch (e) {
      console.error("Load categories failed:", e);
    }
  };

  const fetchQuestions = useCallback(async (pageParam = 0, kw = "", diff = "", type = "", cat = "", vis = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("size", String(PAGE_SIZE));
      params.set("sort", "id,desc");
      if (kw?.trim()) params.set("q", kw.trim());
      if (diff) params.set("difficulty", diff);
      if (type) params.set("type", type);
      if (cat) params.set("categoryId", cat);
      if (vis) params.set("visibility", vis);

      const url = `${API_URL}/questions/search?${params.toString()}`;
      const data = await fetchApi(url);

      // Support both paged response and simple array
      const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : data?.content || [];
      setQuestions(content);

      if (typeof data?.totalPages === "number") setTotalPages(data.totalPages || 1);
      else setTotalPages(1);

      if (typeof data?.totalElements === "number") setTotalElements(data.totalElements || content.length);
      else setTotalElements(content.length);

      setPage(pageParam);
    } catch (e) {
      console.error("Fetch questions error:", e);
      toast.error(e?.message || "Không thể tải câu hỏi");
    } finally {
      setLoading(false);
    }
  }, []);

  /* --- Handlers for filters/search --- */
  const handleSearch = () => {
    setPage(0);
    fetchQuestions(0, keyword, difficultyFilter, typeFilter, categoryFilter, visibilityFilter);
  };

  const filtered = useMemo(() => {
    // keep client-side small filtering for UX on current page
    const kw = keyword.trim().toLowerCase();
    if (!kw) return questions;
    return questions.filter(q => q.title?.toLowerCase().includes(kw) || String(q.correctAnswer || q.answer || "").toLowerCase().includes(kw));
  }, [questions, keyword]);

  /* --- Open modal create --- */
  const openAdd = () => {
    setEditingQuestion(null);
    setModalOpen(true);
  };

  /* --- Open modal edit --- */
  const openEdit = (q) => {
    const category = categories.find(c => c.name === q.categoryName);
    const questionWithCategoryId = {
        ...q,
        categoryId: category ? category.id : null
    };
    setEditingQuestion(questionWithCategoryId);
    setModalOpen(true);
  };

  /* --- Submit create or update (parent handles API call) --- */
  const handleSubmitQuestion = async (payload) => {
    try {
      if (editingQuestion) {
        await fetchApi(`${API_URL}/questions/edit/${editingQuestion.id}`, {
          method: "PATCH",
          body: payload, 
        });
        setQuestions(prev => prev.map(p => p.id === editingQuestion.id ? { ...p, ...payload, answers: payload.answers } : p));
        toast.success("Cập nhật câu hỏi thành công");
      } else {
        const created = await fetchApi(`${API_URL}/questions/create`, {
          method: "POST",
          body: payload,
        });
        toast.success("Tạo câu hỏi thành công");
        await fetchQuestions(0, keyword, difficultyFilter, typeFilter, categoryFilter, visibilityFilter);
      }
      setModalOpen(false);
      setEditingQuestion(null);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Lưu câu hỏi thất bại");
      throw e;
    }
  };

  /* --- Delete --- */
  const handleDelete = (id) => {
    const q = questions.find((x) => x.id === id);
    if (!q) return;
    Swal.fire({
      title: "Xác nhận xóa",
      text: `Bạn có chắc muốn xóa câu hỏi "${q.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await fetchApi(`${API_URL}/questions/delete/${id}`, { method: "DELETE" });
          setQuestions(prev => prev.filter(x => x.id !== id));
          toast.success("Đã xóa câu hỏi");
        } catch (e) {
          console.error(e);
          toast.error(e?.message || "Xóa thất bại");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="w-full min-h-screen py-6 sm:py-10 px-4 sm:px-8" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero + tìm kiếm */}
        <div className="rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden" style={{ background: HERO_GRADIENT }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold drop-shadow">Quản lý Câu hỏi</h1>
              <p className="text-white/80 mt-1 text-sm">Quản lý câu hỏi, lọc và chỉnh sửa nhanh</p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="px-4 py-1 rounded-full bg-white/25 backdrop-blur">Tổng {totalElements} câu hỏi</span>
            </div>
          </div>

          <div className="mt-6 bg-white/95 rounded-2xl p-4 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="flex gap-3 items-center">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Nhập tiêu đề / đáp án..."
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />

                <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-800 text-sm">
                  <option value="">Chọn độ khó</option>
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </select>

                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-800 text-sm">
                  <option value="">Chọn loại câu hỏi</option>
                  <option value="SINGLE">Trắc nghiệm (1 đáp án)</option>
                  <option value="MULTIPLE">Trắc nghiệm (nhiều đáp án)</option>
                  <option value="TRUE_FALSE">Đúng/Sai</option>
                </select>

                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-800 text-sm">
                  <option value="">Chọn danh mục</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-800 text-sm">
                  <option value="">All Visibilities</option>
                  <option value="PRIVATE">Private</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={handleSearch} className="px-6 py-2 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: SEARCH_BAR_BG }} disabled={loading}>
                  Tìm kiếm
                </button>

                <button onClick={openAdd} className="px-6 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: BUTTON_COLOR }} disabled={loading}>
                  <PlusIcon /> Thêm câu hỏi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-white/60 shadow-[0_25px_60px_rgba(131,56,236,0.12)] overflow-hidden" style={{ boxShadow: TABLE_SHADOW }}>
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-white to-purple-50/60">
            <p className="text-sm text-gray-600 font-medium flex flex-wrap items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-white shadow-inner">Trang {page + 1}/{totalPages}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm text-gray-700">
              <thead className="bg-[#F7F4FF] border-b border-gray-100 uppercase text-[0.65rem] tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left w-16">STT</th>
                  <th className="px-4 py-3 text-left">Tiêu đề</th>
                  <th className="px-4 py-3 text-left w-40">Loại câu hỏi</th>
                  <th className="px-4 py-3 text-left w-28">Độ khó</th>
                  <th className="px-4 py-3 text-left w-28">Visibility</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Đáp án</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Người tạo</th>
                  <th className="px-4 py-3 text-left w-40 hidden lg:table-cell">Danh mục</th>
                  <th className="px-4 py-3 text-center w-40">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-500">Không tìm thấy câu hỏi phù hợp</td></tr>
                ) : (
                  filtered.map((q, idx) => (
                    <tr key={q.id} className="hover:bg-purple-50/50 transition">
                      <td className="px-4 py-3">{page * PAGE_SIZE + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">{q.title}</td>
                      <td className="px-4 py-3">{sentenceCase(q.type?.replaceAll("_", " ") || "")}</td>
                      <td className="px-4 py-3"><DifficultyBadge difficulty={q.difficulty} /></td>
                      <td className="px-4 py-3"><VisibilityBadge visibility={q.visibility} /></td>
                      <td className="px-4 py-3 hidden sm:table-cell">{q.correctAnswer || q.answer}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{q.createdBy || "N/A"}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">{q.categoryName || ""}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(q)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition">Sửa</button>
                          <button onClick={() => handleDelete(q.id)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow hover:bg-rose-600 transition">Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalElements > 0 && (
            <div className="p-5 border-t border-gray-100 flex justify-center items-center gap-2 text-sm text-gray-500 bg-white">
              <button onClick={() => { if (page !== 0) setPage(0); }} disabled={page === 0 || loading} className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition">«</button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading} className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition">‹</button>

              {/* Show up to 7 page buttons (centered around current) */}
              {Array.from({ length: totalPages }, (_, i) => i).slice(Math.max(0, page - 3), Math.min(totalPages, page + 4)).map(i => (
                <button key={i} onClick={() => setPage(i)} disabled={loading} className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${page === i ? 'bg-purple-700 text-white shadow-lg' : 'text-gray-600 hover:bg-purple-50'}`}>{i + 1}</button>
              ))}

              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1 || loading} className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition">›</button>
              <button onClick={() => { if (page !== totalPages - 1) setPage(totalPages - 1); }} disabled={page === totalPages - 1 || loading} className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition">»</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create / Edit */}
      <QuestionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingQuestion(null); }}
        onSubmit={async (payload) => {
          // delegate to handler that can use editingQuestion
          await handleSubmitQuestion(payload);
        }}
        categories={categories}
        editing={editingQuestion}
      />
    </div>
  );
}
