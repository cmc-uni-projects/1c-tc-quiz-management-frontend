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

// Màu tím nhạt giống các trang Admin/Teacher
const PRIMARY_PURPLE_BG = "#E33AEC7A";

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
        const updated = await fetchApi(`/categories/${editing.id}`, {
          method: "PUT",
          body,
        });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showSuccess("Cập nhật danh mục thành công");
      } else {
        // Create
        const body = { name: form.name.trim(), description: form.description?.trim() || "" };
        await fetchApi(`/categories`, {
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
    <div className="min-h-screen bg-gray-50 flex-1 p-4 sm:p-8 font-sans">
        {/* Thanh tiêu đề + tìm kiếm */}
        <div
          className="p-4 sm:p-6 mb-6 rounded-xl shadow-lg"
          style={{ backgroundColor: PRIMARY_PURPLE_BG }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Danh mục câu hỏi</h1>
              <p className="text-white/80 mt-1 text-sm">
                Quản lý danh mục câu hỏi dùng cho các bài thi
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên danh mục..."
                className="w-full sm:w-72 px-4 py-2 bg-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-white text-purple-700 font-semibold rounded-lg shadow hover:bg-purple-50"
                >
                  Tìm kiếm
                </button>
                <button
                  onClick={openAdd}
                  className="px-4 py-2 bg-purple-700 text-white font-semibold rounded-lg shadow hover:bg-purple-800 flex items-center gap-2"
                >
                  <PlusIcon /> Thêm danh mục
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bảng danh mục */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Tên danh mục</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Mô tả</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Số câu hỏi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Người tạo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500 text-sm"
                    >
                      Không có danh mục nào
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat, index) => (
                    <tr key={cat.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-gray-700">
                        {page * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {cat.description || "Không có mô tả"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {cat.questions?.length ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {cat.createdByName || 'Không rõ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(cat)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 text-xs"
                          >
                            <EditIcon /> Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-1 text-xs"
                          >
                            <TrashIcon /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang thực (backend) */}
          <div className="flex items-center justify-center gap-1 py-3 border-t border-gray-100 text-xs text-gray-600">
            {/* Về trang đầu */}
            <button
className="px-2 py-1 rounded border border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              onClick={() => setPage(0)}
              disabled={page === 0}
            >
              «
            </button>
            {/* Trang trước */}
            <button
              className="px-2 py-1 rounded border border-transparent text-gray-400 hover:bg-gray-50 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ‹
            </button>
            {/* Số trang */}
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                  ${
                    i === page
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                {i + 1}
              </button>
            ))}
            {/* Trang tiếp */}
            <button
              className="px-2 py-1 rounded border border-transparent text-gray-400 hover:bg-gray-50 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              ›
            </button>
            {/* Về trang cuối */}
            <button
              className="px-2 py-1 rounded border border-transparent text-gray-400 hover:bg-gray-50 disabled:opacity-40"
              onClick={() => setPage(totalPages - 1)}
              disabled={page === totalPages - 1}
            >
              »
            </button>
          </div>
        </div>

        {/* Modal Thêm/Sửa */}
        {modalOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4 border-b pb-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {editing ? "Sửa danh mục" : "Thêm danh mục"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên danh mục
                  </label>
                  <input
                    value={form.name}
                    onChange={onChangeName}
                    placeholder="Nhập tên danh mục..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={form.description}
                    onChange={onChangeDesc}
                    rows={3}
                    placeholder="Mô tả ngắn gọn..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 font-semibold"
                    disabled={loading}
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}



