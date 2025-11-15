"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

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

  // Load tất cả danh mục lần đầu
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        // Load profile for correct role labeling of current user's items
        try {
          const p = await fetch(`/api/profile`, { credentials: "include" });
          if (p.ok) {
            const profile = await p.json();
            setCurrentUser(profile);
          }
        } catch {}
        // Load categories
        const res = await fetch(`/categories`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Tìm kiếm trên backend (không đổi UI phần input)
  const handleSearch = async () => {
    const q = keyword.trim();
    try {
      setLoading(true);
      if (!q) {
        // nếu trống -> lấy tất cả
        const res = await fetch(`/categories`, { credentials: "include" });
        const all = await res.json();
        setCategories(Array.isArray(all) ? all : []);
      } else {
        const params = new URLSearchParams({ name: q, page: "0", size: "50", sort: "id,asc" });
        const res = await fetch(`/categories/search?${params.toString()}`, { credentials: "include" });
        if (!res.ok) throw new Error("Search failed");
        const page = await res.json();
        // Spring Page object: content, number, totalElements,...
        setCategories(Array.isArray(page?.content) ? page.content : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    // vẫn giữ lọc client để người dùng gõ thấy hiệu ứng, nhưng nguồn là dữ liệu backend hiện tại
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
        const res = await fetch(`/categories/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        const updated = await res.json();
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success("Cập nhật danh mục thành công");
      } else {
        // Create
        const body = { name: form.name.trim(), description: form.description?.trim() || "" };
        const res = await fetch(`/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        const created = await res.json();
        // Enrich with role for correct badge if this user is the creator
        let createdByRole = undefined;
        if (currentUser) {
          const u = (currentUser.username || "").toLowerCase();
          const e = (currentUser.email || "").toLowerCase();
          const v = (created.createdBy || "").toLowerCase();
          if (v && (v === u || v === e)) {
            createdByRole = (currentUser.role || "").toLowerCase();
          }
        }
        setCategories((prev) => [...prev, { ...created, ...(createdByRole ? { createdByRole } : {}) }]);
        toast.success("Tạo danh mục thành công");
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
    try {
      setLoading(true);
      const res = await fetch(`/categories/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
      // Có thể hiển thị toast/alert sau
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
                    <td className="px-4 py-3">{idx + 1}</td>
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

        {/* Phân trang giả lập */}
        <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-100 text-xs text-gray-600">
          <button className="px-2 py-1 rounded hover:bg-gray-100">«</button>
          <button className="px-2 py-1 rounded bg-purple-100 text-purple-700">1</button>
          <button className="px-2 py-1 rounded hover:bg-gray-100">2</button>
          <button className="px-2 py-1 rounded hover:bg-gray-100">»</button>
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
