"use client";

import { useMemo, useState } from "react";

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

export default function CategoriesPage() {
  // Dữ liệu giả (chỉ hiển thị)
  const [categories, setCategories] = useState([
    { id: 1, name: "Toán học", description: "Các chủ đề về Đại số, Hình học, Giải tích" },
    { id: 2, name: "Ngôn ngữ", description: "Tiếng Anh, Tiếng Việt, Ngôn ngữ học" },
    { id: 3, name: "Khoa học", description: "Vật lý, Hóa học, Sinh học" },
  ]);

  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null: thêm mới, object: đang sửa

  // State cho form
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(kw));
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
    const exists = categories.some(
      (c) => c.name.toLowerCase() === name.toLowerCase() && (!editing || c.id !== editing.id)
    );
    if (exists) return "Tên danh mục đã tồn tại";
    return "";
  };

  const handleSave = () => {
    const err = validate();
    setError(err);
    if (err) return;

    if (editing) {
      // Cập nhật UI tại chỗ (chưa cần gọi API)
      setCategories((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
    } else {
      const nextId = Math.max(0, ...categories.map((c) => c.id)) + 1;
      setCategories((prev) => [...prev, { id: nextId, ...form }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    // Xóa trên UI (chỉ hiển thị)
    setCategories((prev) => prev.filter((c) => c.id !== id));
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
              <button className="px-4 py-2 bg-white text-purple-700 font-semibold rounded-lg shadow hover:bg-purple-50">
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
                <th className="px-4 py-3 text-center w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
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
                <button onClick={handleSave} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 font-semibold">
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
