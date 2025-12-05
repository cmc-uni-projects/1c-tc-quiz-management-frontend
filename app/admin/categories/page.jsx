"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const PRIMARY_COLOR = "#6A1B9A";
const LOGO_TEXT_COLOR = "#E33AEC";
const MAIN_CONTENT_BG = "#6D0446";
const SEARCH_BAR_BG = "#E33AEC";
const BUTTON_COLOR = "#9453C9";
const PAGE_BG = "#F4F2FF";
const HERO_GRADIENT = "linear-gradient(135deg, #FFB6FF 0%, #8A46FF 100%)";
const TABLE_SHADOW = "0 25px 60px rgba(126, 62, 255, 0.18)";


const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt');
  }
  return null;
};

async function fetchApi(url, options = {}) {
  const token = getAuthToken();
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const config = {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: "include",
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const isJson = response.headers.get('content-type')?.includes('application/json');

  if (!response.ok) {
    let errorText = "Lỗi không xác định";
    try {
      errorText = isJson ? (await response.json()).message || (await response.json()).error : await response.text();
    } catch {
    }
    const errorMessage = errorText.substring(0, 200) || `Lỗi (${response.status}): Không thể thực hiện thao tác.`;
    throw new Error(errorMessage);
  }

  try {
    return isJson ? await response.json() : await response.text();
  } catch (e) {
    return options.method === 'DELETE' || options.method === 'PUT' ? "Success" : null;
  }
}


const PlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </svg>
);

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
  </svg>
);

const XIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

function sentenceCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCreatorBadgeRole(createdBy, currentUser) {
  const v = (createdBy || "").toLowerCase();
  if (currentUser) {
    const u = (currentUser.username || "").toLowerCase();
    const e = (currentUser.email || "").toLowerCase();
    if (v && (v === u || v === e)) {
      return (currentUser.role || "").toLowerCase();
    }
  }
  return v.includes("admin") ? "admin" : "teacher";
}


// --- Component Chính ---
export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [keyword, setKeyword] = useState("");
  // State cho Modal Thêm/Sửa
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Phân trang phía backend
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // State cho form (Create/Edit)
  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // Badge màu theo người tạo
  const creatorBadgeClass = (role) => {
    switch ((role || "").toUpperCase()) {
      case "ADMIN":
        return "bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200";
      case "TEACHER":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  // Load profile once
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await fetchApi(`${API_URL}/me`); // Assuming /api/me gives profile details
        setCurrentUser(profile);
      } catch (e) {
        console.error("Error fetching user profile:", e);
      }
    };
    fetchProfile();
  }, []);

  // Fetch categories from backend with pagination + optional search
  const fetchCategories = useCallback(async (pageParam = page, keywordParam = keyword) => {
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
        url = `${API_URL}/categories/search?${params.toString()}`;
      } else {
        const params = new URLSearchParams({
          name: q,
          page: String(pageParam),
          size: String(PAGE_SIZE),
          sort: "id,desc",
        });
        url = `${API_URL}/categories/search?${params.toString()}`;
      }

      const data = await fetchApi(url);
      const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      setCategories(content);

      // Cập nhật thông tin phân trang
      if (typeof data.totalPages === "number") setTotalPages(data.totalPages || 1);
      if (typeof data.totalElements === "number") setTotalElements(data.totalElements || content.length);
      else if (content.length > 0 && typeof data.totalPages !== "number") {
        // Fallback cho API không trả về totalPages/totalElements (coi như 1 trang)
        setTotalPages(1);
        setTotalElements(content.length);
      } else {
        setTotalPages(1);
        setTotalElements(0);
      }
      setPage(pageParam); 

    } catch (e) {
      console.error("Error fetching categories:", e);
      toast.error(e?.message || "Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  }, [keyword, page]);

  // Load khi page thay đổi
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Tìm kiếm: reset về trang 0 và gọi lại fetchCategories với keyword hiện tại
  const handleSearch = () => {
    if (page === 0) {
      fetchCategories(0, keyword); 
    } else {
      setPage(0); 
    }
  };

  const filtered = useMemo(() => {
    // Vẫn giữ lọc client để người dùng gõ thấy hiệu ứng trong danh sách trang hiện tại
    const kw = keyword.trim().toLowerCase();
    if (!kw) return categories;
    return categories.filter((c) => c.name?.toLowerCase().includes(kw));
  }, [categories, keyword]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || "" });
    setFormError("");
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
    setFormError(err);
    if (err) return;

    try {
      setLoading(true);
      if (editing) {
        // Update
        const body = { id: editing.id, name: form.name.trim(), description: form.description?.trim() || "" };
        await fetchApi(`${API_URL}/categories/edit/${editing.id}`, {
          method: "PATCH",
          body: body,
        });

        // Cập nhật local state sau khi thành công
        setCategories((prev) => prev.map((c) =>
          (c.id === editing.id
            ? { ...c, name: form.name.trim(), description: form.description?.trim() || "" }
            : c
          )
        ));
        toast.success("Cập nhật danh mục thành công");
      } else {
        // Create
        const body = { name: form.name.trim(), description: form.description?.trim() || "" };
        // API call to create, note: the response may contain the new object
        await fetchApi(`${API_URL}/categories/create`, {
          method: "POST",
          body: body,
        });

        toast.success("Tạo danh mục thành công");

        // Sau khi tạo thành công, reset về trang 0 và load lại danh sách
        setPage(0);
        await fetchCategories(0, keyword);
      }
      setModalOpen(false);

    } catch (e) {
      console.error(e);
      setFormError(e?.message || "Có lỗi xảy ra");
      toast.error(e?.message || "Lưu danh mục thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;

    Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa danh mục "${cat.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      background: '#fff',
      customClass: {
        confirmButton: 'px-4 py-2 rounded-md',
        cancelButton: 'px-4 py-2 rounded-md'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        (async () => {
          try {
            setLoading(true);
            await fetchApi(`${API_URL}/categories/delete/${id}`, { method: "DELETE" });

            // Xóa khỏi local state
            setCategories((prev) => prev.filter((c) => c.id !== id));
            toast.success("Đã xóa danh mục thành công");
          } catch (e) {
            console.error(e);
            toast.error(e?.message || "Không thể xóa danh mục");
          } finally {
            setLoading(false);
          }
        })();
      }
    });
  };


  return (
    <div className="w-full min-h-screen py-6 sm:py-10 px-4 sm:px-8" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero + tìm kiếm */}
        <div
          className="rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden"
          style={{ background: HERO_GRADIENT }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold drop-shadow">Quản lý Danh mục</h1>
              <p className="text-white/80 mt-1 text-sm">Quản lý danh mục môn học và nội dung quiz</p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="px-4 py-1 rounded-full bg-white/25 backdrop-blur">Tổng {totalElements} danh mục</span>
            </div>
          </div>

          <div className="mt-6 bg-white/95 rounded-2xl p-4 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              {/* Tìm kiếm */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Tìm kiếm danh mục</label>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Nhập tên danh mục..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Nút tìm kiếm và thêm mới */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={openAdd}
                  className="px-6 py-2 rounded-xl text-white text-sm font-semibold shadow-lg hover:brightness-110 transition whitespace-nowrap flex items-center gap-2"
                  style={{ backgroundColor: BUTTON_COLOR }}
                  disabled={loading}
                >
                  <PlusIcon className="w-4 h-4" /> Thêm danh mục
                </button>
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 rounded-xl text-white text-sm font-semibold shadow-lg hover:brightness-110 transition whitespace-nowrap"
                  style={{ backgroundColor: SEARCH_BAR_BG }}
                  disabled={loading}
                >
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bảng danh sách */}
        <div
          className="bg-white rounded-2xl border border-white/60 shadow-[0_25px_60px_rgba(131,56,236,0.12)] overflow-hidden"
          style={{ boxShadow: TABLE_SHADOW }}
        >
          {/* Tiêu đề bảng */}
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-white to-purple-50/60">
            <p className="text-sm text-gray-600 font-medium flex flex-wrap items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-white shadow-inner">
                Trang {page + 1}/{totalPages}
              </span>
            </p>
          </div>

          {/* Bảng */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm text-gray-700">
              <thead className="bg-[#F7F4FF] border-b border-gray-100 uppercase text-[0.65rem] tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left w-16">STT</th>
                  <th className="px-4 py-3 text-left">Tên danh mục</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Mô tả</th>
                  <th className="px-4 py-3 text-left w-32 hidden md:table-cell">Người tạo</th>
                  <th className="px-4 py-3 text-center w-40">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      Không tìm thấy danh mục phù hợp
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-purple-50/50 transition">
                      <td className="px-4 py-3">{page * PAGE_SIZE + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-700 hidden sm:table-cell max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {c.description}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {(() => {
                          const role = ((c.createdByRole || (currentUser && ((c.createdBy || "").toLowerCase() === ((currentUser.email || "").toLowerCase()) || (c.createdBy || "").toLowerCase() === ((currentUser.username || "").toLowerCase())) ? (currentUser.role || "").toLowerCase() : null)) || getCreatorBadgeRole(c.createdBy, currentUser));
                          return (
                            <span
                              title={c.createdBy}
                              className={`px-3 py-1.5 rounded-full text-[0.7rem] font-semibold inline-flex items-center justify-center ${creatorBadgeClass(role)}`}
                            >
                              {sentenceCase(role) || "N/A"}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition disabled:opacity-50 flex items-center gap-1"
                            disabled={loading}
                          >
                            <EditIcon className="w-3 h-3 flex-shrink-0" /> Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow hover:bg-rose-600 transition disabled:opacity-50 flex items-center gap-1"
                            disabled={loading}
                          >
                            <TrashIcon className="w-3 h-3 flex-shrink-0" /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalElements > 0 && (
            <div className="p-5 border-t border-gray-100 flex justify-center items-center gap-2 text-sm text-gray-500 bg-white">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0 || loading}
                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                «
              </button>

              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  disabled={loading}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors
                    ${
                      page === i
                        ? 'bg-purple-700 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-purple-50'
                    }
                  `}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1 || loading}
                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ›
              </button>

              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page === totalPages - 1 || loading}
                className="px-3 py-1 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                »
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4 border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900">{editing ? "Sửa danh mục" : "Thêm danh mục"}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <XIcon className="w-5 h-5"/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
                <input
                  value={form.name}
                  onChange={onChangeName}
                  placeholder="Nhập tên danh mục..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={onChangeDesc}
                  rows={3}
                  placeholder="Mô tả ngắn gọn..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                  disabled={loading}
                />
              </div>

              {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition" disabled={loading}>
                    Hủy
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-purple-700 text-white rounded-xl hover:bg-purple-800 font-semibold transition shadow-md disabled:opacity-50"
                    disabled={loading}
                >
                  {loading ? (editing ? "Đang cập nhật..." : "Đang tạo...") : (editing ? "Lưu thay đổi" : "Thêm mới")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
  );
}