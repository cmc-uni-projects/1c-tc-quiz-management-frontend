"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";

/* --- Constants (style/colors) --- */
const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/`;
const PAGE_SIZE = 10;
const PAGE_BG = "#F4F2FF";
const HERO_GRADIENT = "linear-gradient(135deg, #FFB6FF 0%, #8A46FF 100%)";
const BUTTON_COLOR = "#9453C9";
const SEARCH_BAR_BG = "#E33AEC";
const TABLE_SHADOW = "0 25px 60px rgba(126, 62, 255, 0.18)";

/* --- fetchApi --- */
const getAuthToken = () => typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

async function fetchApi(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) };
  const config = { method: options.method || "GET", headers: { ...headers, ...(options.headers || {}) }, credentials: "include" };
  if (options.body) config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
  const response = await fetch(API_URL + cleanEndpoint, config);
  const isJson = response.headers.get("content-type")?.includes("application/json");

  if (!response.ok) {
    let errorText = "Lỗi không xác định";
    try {
      const parsed = isJson ? await response.json() : null;
      errorText = (parsed && (parsed.message || parsed.error)) || (isJson ? JSON.stringify(parsed) : await response.text());
    } catch {}
    throw new Error(errorText.toString().substring(0, 300));
  }

  try { return isJson ? await response.json() : await response.text(); } catch { return null; }
}

/* --- Icons --- */
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
const FilterIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
  </svg>
);
const InfoIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
);

/* --- Toast --- */
function ToastNotification({ message, type, onClose }) {
  const color = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  if (!message) return null;
  useEffect(() => { const timer = setTimeout(onClose, 5000); return () => clearTimeout(timer); }, [message, onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[100] p-4 rounded-xl text-white shadow-lg ${color} transition-opacity duration-300`}>
      <div className="flex items-center gap-2">
        <InfoIcon className="w-4 h-4" />
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 opacity-75 hover:opacity-100"><XIcon className="w-3 h-3"/></button>
      </div>
    </div>
  );
}

/* --- Helpers --- */
function sentenceCase(value) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : ""; }
function DifficultyBadge({ difficulty }) {
  const diff = difficulty?.toUpperCase();
  let colorClass = "bg-gray-100 text-gray-800";
  switch (diff) { case "EASY": colorClass="bg-green-100 text-green-800"; break; case "MEDIUM": colorClass="bg-yellow-100 text-yellow-800"; break; case "HARD": colorClass="bg-red-100 text-red-800"; break; default: break; }
  const text = diff ? sentenceCase(diff.toLowerCase()) : "N/A";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{text}</span>;
}

/* --- QuestionModal --- */
function QuestionModal({ open, onClose, onSubmit, categories = [], editing = null }) {
  const [title, setTitle] = useState(editing?.title || "");
  const [type, setType] = useState(editing?.type || "");
  const [difficulty, setDifficulty] = useState(editing?.difficulty || "");
  const [answer, setAnswer] = useState(editing?.answer || "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(editing?.title || "");
    setType(editing?.type || "");
    setDifficulty(editing?.difficulty || "");
    setAnswer(editing?.answer || "");
    setCategoryId(editing?.categoryId || "");
    setError("");
  }, [editing, open]);

  const validate = () => {
    if (!title.trim()) return "Tiêu đề là bắt buộc";
    if (!type) return "Chọn loại câu hỏi";
    if (!difficulty) return "Chọn độ khó";
    if (!answer.trim()) return "Chọn/nhập đáp án";
    if (!categoryId) return "Chọn danh mục";
    return "";
  };

  const handleSubmit = async () => {
    const v = validate(); setError(v); if (v) return;
    try { setLoading(true); await onSubmit({ title: title.trim(), type, difficulty, answer: answer.trim(), categoryId: Number(categoryId) }); setLoading(false); }
    catch (e) { setLoading(false); setError(e?.message || "Lỗi khi lưu"); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{editing ? "Cập nhật câu hỏi" : "Thêm câu hỏi mới"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon /></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-sm font-medium block mb-1">Tiêu đề</label><input value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg"/></div>
          <div><label className="text-sm font-medium block mb-1">Loại câu hỏi</label>
            <select value={type} onChange={e=>setType(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">-- Chọn loại --</option>
              <option value="SINGLE">Trắc nghiệm (1 đáp án đúng)</option>
              <option value="MULTIPLE">Trắc nghiệm (nhiều đáp án đúng)</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
            </select>
          </div>
          <div><label className="text-sm font-medium block mb-1">Độ khó</label>
            <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">-- Chọn độ khó --</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>
          <div><label className="text-sm font-medium block mb-1">Đáp án</label>
            <input value={answer} onChange={e=>setAnswer(e.target.value)} className="w-full px-3 py-2 border rounded-lg"/>
            <p className="text-xs text-gray-500 mt-1">Ví dụ: Đúng/Sai hoặc A/B/C/D</p>
          </div>
          <div><label className="text-sm font-medium block mb-1">Danh mục</label>
            <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">-- Chọn danh mục --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-xl hover:bg-gray-100" disabled={loading}>Hủy</button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-xl text-white" style={{ backgroundColor: BUTTON_COLOR }} disabled={loading}>
              {loading ? (editing ? "Đang cập nhật..." : "Đang tạo...") : (editing ? "Cập nhật" : "Thêm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- ConfirmationModal --- */
function ConfirmationModal({ open, onClose, onConfirm, title, text }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-orange-600 flex items-center gap-2">{title}</h3>
          <p className="text-gray-700">{text}</p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-xl hover:bg-gray-100">Hủy</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700">Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Main Page --- */
export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [mineOnly, setMineOnly] = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  /* --- Debounce keyword --- */
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  /* --- Load profile --- */
  useEffect(() => { (async () => { try { const profile = await fetchApi('me'); setCurrentUser(profile); } catch (e) { console.error(e); } })(); }, []);

  /* --- Load categories --- */
  useEffect(() => { (async () => { try { const data = await fetchApi('categories'); setCategories(Array.isArray(data) ? data : data?.content || []); } catch (e) { console.error(e); } })(); }, []);

  /* --- Fetch questions --- */
  const fetchQuestions = useCallback(async (pageParam = 0) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", pageParam);
      params.set("size", PAGE_SIZE);
      params.set("sort", "id,desc");
      if (debouncedKeyword.trim()) params.set("q", debouncedKeyword.trim());
      if (difficultyFilter) params.set("difficulty", difficultyFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      if (mineOnly && currentUser?.username) params.set("createdBy", currentUser.username);
      else if (mineOnly && !currentUser?.username) { setLoading(false); return; }

      const data = await fetchApi(`questions/search?${params.toString()}`);
      const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : data?.content || [];
      setQuestions(content);
      setTotalPages(typeof data?.totalPages === "number" ? data.totalPages : 1);
      setTotalElements(typeof data?.totalElements === "number" ? data.totalElements : content.length);
      setPage(pageParam);
    } catch (e) { console.error(e); setNotification({ message: e?.message || "Không thể tải câu hỏi", type: 'error' }); }
    finally { setLoading(false); }
  }, [debouncedKeyword, difficultyFilter, typeFilter, categoryFilter, mineOnly, currentUser]);

  useEffect(() => { fetchQuestions(0); }, [fetchQuestions]);

  /* --- Handlers --- */
  const handleSearch = () => fetchQuestions(0);
  const handleMineOnlyToggle = () => setMineOnly(prev => !prev);
  const openAdd = () => { setEditingQuestion(null); setModalOpen(true); };
  const openEdit = (q) => { setEditingQuestion(q); setModalOpen(true); };
  const canModify = (q) => currentUser?.role === 'ADMIN' || q.createdBy === currentUser?.username;

  const handleSubmitQuestion = async (payload) => {
    try {
      if (editingQuestion) await fetchApi(`questions/${editingQuestion.id}`, { method: "PATCH", body: payload });
      else await fetchApi(`questions`, { method: "POST", body: payload });
      setNotification({ message: editingQuestion ? "Cập nhật thành công" : "Tạo thành công", type: 'success' });
      setModalOpen(false); setEditingQuestion(null);
      fetchQuestions(0);
    } catch (e) { setNotification({ message: e?.message || "Lưu thất bại", type: 'error' }); throw e; }
  };

  const handleDeleteConfirmed = async () => {
    const id = confirmingDelete; if (!id) return;
    try { setLoading(true); await fetchApi(`questions/${id}`, { method: "DELETE" }); setNotification({ message: "Đã xóa", type: 'success' }); fetchQuestions(page); }
    catch (e) { setNotification({ message: e?.message || "Xóa thất bại", type: 'error' }); }
    finally { setLoading(false); setConfirmingDelete(null); }
  };

  const filtered = useMemo(() => {
    const kw = debouncedKeyword.trim().toLowerCase();
    if (!kw) return questions;
    return questions.filter(q => q.title?.toLowerCase().includes(kw) || String(q.answer || "").toLowerCase().includes(kw));
  }, [questions, debouncedKeyword]);

  /* --- Render --- */
return (
  <div className="w-full min-h-screen py-6 sm:py-10 px-4 sm:px-8" style={{ backgroundColor: PAGE_BG }}>
    <ToastNotification message={notification.message} type={notification.type} onClose={() => setNotification({ message:'', type:'' })} />

    {/* Hero + Filters */}
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden" style={{ background: HERO_GRADIENT }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold drop-shadow">Quản lý Câu hỏi</h1>
            <p className="text-white/80 mt-1 text-sm">Tạo và quản lý câu hỏi của bạn</p>
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
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={handleSearch} className="px-6 py-2 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: SEARCH_BAR_BG }} disabled={loading}>
                <FilterIcon /> Tìm kiếm
              </button>

              <button onClick={openAdd} className="px-6 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: BUTTON_COLOR }} disabled={loading}>
                <PlusIcon /> Thêm câu hỏi
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="mineOnly"
              checked={mineOnly}
              onChange={handleMineOnlyToggle}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="mineOnly" className="text-sm text-gray-700 cursor-pointer">
              Chỉ hiển thị câu hỏi của tôi
            </label>
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
                <th className="px-4 py-3 text-left hidden sm:table-cell">Đáp án</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Người tạo</th>
                <th className="px-4 py-3 text-left w-40 hidden lg:table-cell">Danh mục</th>
                <th className="px-4 py-3 text-center w-40">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">Không tìm thấy câu hỏi phù hợp</td></tr>
              ) : (
                filtered.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-purple-50/50 transition">
                    <td className="px-4 py-3">{page * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">{q.title}</td>
                    <td className="px-4 py-3">{sentenceCase(q.type?.replaceAll("_", " ") || "")}</td>
                    <td className="px-4 py-3"><DifficultyBadge difficulty={q.difficulty} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell">{q.answer}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{q.createdBy || "N/A"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{q.categoryName || ""}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {canModify(q) && (
                          <>
                            <button onClick={() => openEdit(q)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition">Sửa</button>
                            <button onClick={() => setConfirmingDelete(q.id)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow hover:bg-rose-600 transition">Xóa</button>
                          </>
                        )}
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
            <button onClick={() => setPage(0)} disabled={page === 0 || loading} className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition">«</button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading} className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition">‹</button>

            {Array.from({ length: totalPages }, (_, i) => i).slice(Math.max(0, page - 3), Math.min(totalPages, page + 4)).map(i => (
              <button key={i} onClick={() => setPage(i)} disabled={loading} className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${page === i ? 'bg-purple-700 text-white shadow-lg' : 'text-gray-600 hover:bg-purple-50'}`}>{i + 1}</button>
            ))}

            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1 || loading} className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition">›</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1 || loading} className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition">»</button>
          </div>
        )}
      </div>
    </div>

    {/* Modals */}
    <QuestionModal
      open={modalOpen}
      onClose={() => { setModalOpen(false); setEditingQuestion(null); }}
      onSubmit={handleSubmitQuestion}
      categories={categories}
      editing={editingQuestion}
    />

    <ConfirmationModal
      open={confirmingDelete !== null}
      onClose={() => setConfirmingDelete(null)}
      onConfirm={handleDeleteConfirmed}
      title="Xác nhận xóa"
      text="Bạn có chắc muốn xóa câu hỏi này?"
    />
  </div>
);
}