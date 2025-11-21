"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
// Màu tím nhạt giống các trang Admin
const PRIMARY_PURPLE_BG = "#E33AEC7A";

// Icon nhỏ dùng cho nút
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

// Hàm viết hoa chữ cái đầu câu (ví dụ: "this is" -> "This is")
function sentenceCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Helper: phân loại hiển thị người tạo theo email (không đổi UI)
function getCreatorBadgeRole(createdBy, currentUser) {
  const v = (createdBy || "").toLowerCase();
  // Ưu tiên: nếu trùng người dùng hiện tại thì dùng đúng role từ profile
  if (currentUser) {
    const u = (currentUser.username || "").toLowerCase();
    const e = (currentUser.email || "").toLowerCase();
    if (v && (v === u || v === e)) {
      return (currentUser.role || "").toLowerCase();
    }
  }
  // Fallback: đoán theo chuỗi (giữ nguyên UI nếu thiếu thông tin)
  return v.includes("admin") ? "admin" : "teacher";
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null: thêm mới, object: đang sửa

  // Phân trang phía backend
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // State cho form
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);



  // Badge màu theo người tạo
  const creatorBadgeClass = (role) => {
    switch ((role || "").toLowerCase()) {
      case "admin":
        // Admin: sắc hồng/tím nổi bật
        return "bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200";
      case "teacher":
        // Giáo viên: sắc xanh lá dễ phân biệt
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  // Load profile once
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await fetchApi(`/api/me`); // Assuming /api/me gives profile details
        setCurrentUser(profile);
      } catch (e) {
        console.error(e);
      }
    };
    fetchProfile();
  }, []);

  // Fetch categories from backend with pagination + optional search
  const fetchCategories = async (pageParam = page, keywordParam = keyword) => {
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
        url = `/api/categories/search?${params.toString()}`;
      } else {
        const params = new URLSearchParams({
          name: q,
          page: String(pageParam),
          size: String(PAGE_SIZE),
          sort: "id,desc",
        });
        url = `/api/categories/search?${params.toString()}`;
      }
      const data = await fetchApi(url);
      const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      setCategories(content);
      if (typeof data.totalPages === "number") setTotalPages(data.totalPages || 1);
      if (typeof data.totalElements === "number") setTotalElements(data.totalElements || content.length);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  // Load khi page hoặc keyword thay đổi
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Tìm kiếm: reset về trang 0 và gọi lại fetchCategories với keyword hiện tại
  const handleSearch = async () => {
    setPage(0);
    await fetchCategories(0, keyword);
  };

  const filtered = useMemo(() => {
    // vẫn giữ lọc client để người dùng gõ thấy hiệu ứng trong danh sách trang hiện tại
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
        const body = { id: editing.id, name: form.name.trim(), description: form.description?.trim() || "" };
        await fetchApi(`/api/categories/${editing.id}`, {
          method: "PUT",
          body: body,
        });
        setCategories((prev) => prev.map((c) => (c.id === editing.id ? { ...editing, name: form.name.trim(), description: form.description?.trim() || "" } : c)));
        toast.success("Cập nhật danh mục thành công");
      } else {
        // Create
        const body = { name: form.name.trim(), description: form.description?.trim() || "" };
        await fetchApi(`/api/categories`, {
          method: "POST",
          body: body,
        });
        toast.success("Tạo danh mục thành công");
        setModalOpen(false);
        setPage(0);
        await fetchCategories(0, keyword);
        return;
      }
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      setError(typeof e === "string" ? e : e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const cat = categories.find((c) => c.id === id);
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: cat ? `Bạn có chắc chắn muốn xóa danh mục "${cat.name}"?` : "Bạn có chắc chắn muốn xóa danh mục này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      background: "#fff",
      customClass: {
        confirmButton: "px-4 py-2 rounded-md",
        cancelButton: "px-4 py-2 rounded-md",
      },
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await fetchApi(`/api/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Đã xóa danh mục thành công");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Không thể xóa danh mục");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 font-sans">
      {/* Thanh tiêu đề + tìm kiếm */}
      <div className="p-4 sm:p-6 mb-6 rounded-xl shadow-lg" style={{ backgroundColor: PRIMARY_PURPLE_BG }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Danh mục</h1>
            <p className="text-white/80 mt-1 text-sm">Quản lý danh mục môn học/nội dung</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên danh mục..."
              className="w-full sm:w-72 px-4 py-2 bg-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <div className="flex gap-2">
              <button onClick={handleSearch} className="px-4 py-2 bg-white text-purple-700 font-semibold rounded-lg shadow hover:bg-purple-50">
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
                <th className="px-4 py-3 text-left w-16">STT</th>
                <th className="px-4 py-3 text-left">Tên danh mục</th>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-left w-32">Người tạo</th>
                <th className="px-4 py-3 text-center w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    Không tìm thấy danh mục phù hợp
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{page * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-700">{c.description}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const role = ((c.createdByRole || (currentUser && ((c.createdBy||"").toLowerCase()===((currentUser.email||"").toLowerCase()) || (c.createdBy||"").toLowerCase()===((currentUser.username||"").toLowerCase())) ? (currentUser.role||"").toLowerCase() : null)) || getCreatorBadgeRole(c.createdBy, currentUser));
                        return (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-block ${creatorBadgeClass(role)}`}>
                            {role === "teacher" ? "Giáo viên" : "Admin"}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                        >
                          <EditIcon /> Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-1"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4 border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900">{editing ? "Sửa danh mục" : "Thêm danh mục"}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
                <input
                  value={form.name}
                  onChange={onChangeName}
                  placeholder="Nhập tên danh mục..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
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
                <button onClick={closeModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                <button onClick={handleSave} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 font-semibold" disabled={loading}>
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
