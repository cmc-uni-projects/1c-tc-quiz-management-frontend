"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import toast, { Toast } from "react-hot-toast";
import { fetchApi, ApiError } from '@/lib/apiClient';
import Swal from "sweetalert2";

// Custom toast hook to prevent duplicate toasts
const useToast = () => {
  const toastRef = useRef(null);

  const showError = (message) => {
    if (toastRef.current) {
      toast.dismiss(toastRef.current);
    }
    toastRef.current = toast.error(message);
    return toastRef.current;
  };

  const showSuccess = (message) => {
    if (toastRef.current) {
      toast.dismiss(toastRef.current);
    }
    toastRef.current = toast.success(message);
    return toastRef.current;
  };

  const dismiss = () => {
    if (toastRef.current) {
      toast.dismiss(toastRef.current);
      toastRef.current = null;
    }
  };

  return { showError, showSuccess, dismiss };
};

/* --- Constants (style/colors) --- */
const PAGE_BG = "#F4F2FF";
const HERO_GRADIENT = "linear-gradient(135deg, #FFB6FF 0%, #8A46FF 100%)";
const BUTTON_COLOR = "#9453C9";
const SEARCH_BAR_BG = "#E33AEC";
const TABLE_SHADOW = "0 25px 60px rgba(126, 62, 255, 0.18)";
const PRIMARY_PURPLE_BG = "#9453C9";

// Icon nhỏ dùng cho nút
const PlusIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const TrashIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

// Hàm viết hoa chữ cái đầu câu
function sentenceCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function TeacherCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null: thêm mới, object: đang sửa
  const [currentUser, setCurrentUser] = useState(null); // Added currentUser state

  // Phân trang phía backend: 20 danh mục/trang như yêu cầu
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // State cho form
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  /* --- Load profile once --- */
  useEffect(() => {
    (async () => {
      try {
        const profile = await fetchApi(`/me`); // Use imported fetchApi
        setCurrentUser(profile);
      } catch {
        console.error("Failed to load user profile");
      }
    })();
  }, []);

  // Fetch categories from backend with pagination + optional search
  const fetchCategories = async (pageParam = page, keywordParam = keyword, showError = true) => {
    try {
      setLoading(true);
      const q = keywordParam.trim();
      let url;
      if (!q) {
        const params = new URLSearchParams({
          page: String(pageParam),
          size: String(PAGE_SIZE),
          sort: "id,desc",
        });
        url = `/categories/search?${params.toString()}`;
      } else {
        const params = new URLSearchParams({
          name: q,
          page: String(pageParam),
          size: String(PAGE_SIZE),
          sort: "id,desc",
        });
        url = `/categories/search?${params.toString()}`;
      }
      const data = await fetchApi(url);
      const content = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
          ? data
          : [];
      setCategories(content);
      if (typeof data.totalPages === "number") setTotalPages(data.totalPages || 1);
      if (typeof data.totalElements === "number") setTotalElements(data.totalElements || content.length);
      return { success: true };
    } catch (e) {
      console.error('Fetch categories error:', e);
      if (showError) {
        showError(e?.message || "Không thể tải danh sách danh mục");
      }
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  };

  // Load khi page thay đổi
  useEffect(() => {
    let isMounted = true;
    let toastId;

    const loadCategories = async () => {
      const { success, error } = await fetchCategories(page, keyword, false);
      if (!success && error && isMounted) {
        // Dismiss any existing error toast before showing a new one
        if (toastId) {
          toast.dismiss(toastId);
        }
        toastId = toast.error(error?.message || "Không thể tải danh sách danh mục");
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
      // Clean up any pending toasts when component unmounts
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Tìm kiếm: reset về trang 0 và gọi lại fetchCategories với keyword hiện tại
  const handleSearch = async () => {
    setPage(0);
    const { success, error } = await fetchCategories(0, keyword, true);
    if (!success && error) {
      console.error('Search error:', error);
    }
  };

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return categories;
    return categories.filter((c) => c.name?.toLowerCase().includes(kw));
  }, [categories, keyword]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || "" });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const onChangeName = (e) => {
    const next = sentenceCase(e.target.value);
    setForm((f) => ({ ...f, name: next }));
  };

  const onChangeDesc = (e) => {
    const next = sentenceCase(e.target.value);
    setForm((f) => ({ ...f, description: next }));
  };

  const validate = () => {
    const name = form.name.trim();
    if (!name) {
      return "Tên danh mục là bắt buộc";
    }
    return "";
  };

  const handleSave = async () => {
    const err = validate();
    setError(err);
    if (err) return;

    try {
      setLoading(true);
      if (editing) {
        // Update
        const body = {
          id: editing.id,
          name: form.name.trim(),
          description: form.description?.trim() || "",
        };
        const updated = await fetchApi(`/categories/edit/${editing.id}`, {
          method: "PATCH",
          body,
        });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showSuccess("Cập nhật danh mục thành công");
      } else {
        // Create
        const body = { name: form.name.trim(), description: form.description?.trim() || "" };
        await fetchApi(`/categories/create`, {
          method: "POST",
          body,
        });
        showSuccess("Tạo danh mục thành công");
        setModalOpen(false);
        setPage(0);
        await fetchCategories(0, keyword);
        return;
      }
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const cat = categories.find((c) => c.id === id);

    if (!cat) {
      showError("Không tìm thấy danh mục để xóa.");
      return;
    }

    if ((cat?.createdByRole || "").toLowerCase() === "admin") {
      showError("Bạn không có quyền xóa danh mục này");
      return;
    }
    
    if (!currentUser.authorities.some(auth => auth.authority === "ROLE_ADMIN")) {
        if (cat.createdBy?.toLowerCase()?.trim() !== currentUser.username?.toLowerCase()?.trim()) {
            showError("Bạn không có quyền xóa danh mục này.");
            return;
        }
    }

    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: `Bạn có chắc chắn muốn xóa danh mục "${cat.name}" không?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await fetchApi(`/categories/${id}`, {
        method: "DELETE",
      });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showSuccess("Đã xóa danh mục thành công");
    } catch (e) {
      console.error(e);
      showError(e?.message || "Không thể xóa danh mục");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen py-6 sm:py-10 px-4 sm:px-8" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Hero Section */}
        <div className="rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden" style={{ background: HERO_GRADIENT }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold drop-shadow">Danh mục câu hỏi</h1>
              <p className="text-white/80 mt-1 text-sm">
                Quản lý danh mục câu hỏi dùng cho các bài thi
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="px-4 py-1 rounded-full bg-white/25 backdrop-blur">Tổng {totalElements} danh mục</span>
            </div>
          </div>

          <div className="mt-6 bg-white/95 rounded-2xl p-4 shadow-inner">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo tên danh mục..."
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 rounded-xl text-white text-sm font-semibold"
                    style={{ backgroundColor: SEARCH_BAR_BG }}
                  >
                    Tìm kiếm
                  </button>

                  <button
                    onClick={openAdd}
                    className="px-6 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
                    style={{ backgroundColor: BUTTON_COLOR }}
                  >
                    <PlusIcon /> Thêm mới
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div
          className="bg-white rounded-2xl border border-white/60 shadow-[0_25px_60px_rgba(131,56,236,0.12)] overflow-hidden"
          style={{ boxShadow: TABLE_SHADOW }}
        >
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-white to-purple-50/60">
            <p className="text-sm text-gray-600 font-medium flex flex-wrap items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-white shadow-inner">
                Trang {page + 1}/{totalPages}
              </span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-gray-700">
              <thead className="bg-[#F7F4FF] border-b border-gray-100 uppercase text-[0.65rem] tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left w-16">STT</th>
                  <th className="px-4 py-3 text-left">Tên danh mục</th>
                  <th className="px-4 py-3 text-left">Mô tả</th>
                  <th className="px-4 py-3 text-left w-32">Số câu hỏi</th>
                  <th className="px-4 py-3 text-left w-40">Người tạo</th>
                  <th className="px-4 py-3 text-center w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      Không có danh mục nào
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat, index) => (
                    <tr key={cat.id} className="hover:bg-purple-50/50 transition">
                      <td className="px-4 py-3 text-gray-600">{page * PAGE_SIZE + index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={cat.description}>{cat.description || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{cat.questions?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${(cat.createdByRole || "").toUpperCase() === "ADMIN"
                          ? "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200"
                          : "bg-emerald-100 text-emerald-700 border-emerald-200"
                          }`}>
                          {sentenceCase(cat.createdByName) || 'Không rõ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {currentUser && (
                            (cat.createdBy?.toLowerCase()?.trim() === currentUser.username?.toLowerCase()?.trim() || currentUser.authorities.some(auth => auth.authority === "ROLE_ADMIN")) && (
                            <>
                              <button
                                onClick={() => openEdit(cat)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition"
                                title="Sửa"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(cat.id)}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-full transition"
                                title="Xóa"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </>
                          ))}
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
              <button
                onClick={() => { if (page !== 0) setPage(0); }}
                disabled={page === 0}
                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                «
              </button>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i).slice(Math.max(0, page - 3), Math.min(totalPages, page + 4)).map(i => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${page === i ? 'bg-purple-700 text-white shadow-lg' : 'text-gray-600 hover:bg-purple-50'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ›
              </button>
              <button
                onClick={() => { if (page !== totalPages - 1) setPage(totalPages - 1); }}
                disabled={page === totalPages - 1}
                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                »
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-0 mb-4 bg-white rounded-t-2xl z-10 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? "Cập nhật danh mục" : "Thêm danh mục mới"}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="space-y-4 px-6 overflow-y-auto flex-1 pb-2">
              <div>
                <label className="text-sm font-medium block mb-1 text-gray-700">Tên danh mục</label>
                <input
                  value={form.name}
                  onChange={onChangeName}
                  placeholder="Nhập tên danh mục..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1 text-gray-700">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={onChangeDesc}
                  rows={3}
                  placeholder="Mô tả danh mục..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            </div>

            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-100 bg-white rounded-b-2xl shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100 text-sm font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: BUTTON_COLOR }}
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



