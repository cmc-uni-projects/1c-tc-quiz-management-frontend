"use client";

import React, { useState, useRef, ChangeEvent } from "react";

const PRIMARY_BG = "#6D0446";
const BUTTON_BG = "#A53AEC";
const INPUT_BG = "#ffffff";

export default function AdminProfilePage() {
  const [displayName, setDisplayName] = useState("Admin");
  const [email] = useState("Admin@gmail.com"); // giữ nguyên như ví dụ
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Hiển thị preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const handleChoose = () => {
    fileRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Ở đây chỉ mô phỏng - nếu có API, gọi API update profile
      await new Promise((r) => setTimeout(r, 800));
      setMessage("Cập nhật thông tin thành công.");
    } catch (err) {
      setMessage("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto" style={{ color: "#111" }}>
      <div className="bg-white rounded-md shadow-md overflow-hidden mt-12">
        <div className="flex p-8 gap-8 items-start">
          {/* Avatar và chọn file */}
          <div className="flex flex-col items-center" style={{ minWidth: 220 }}>
            <div
              className="rounded-full overflow-hidden w-52 h-52 flex items-center justify-center border-2 border-purple-200"
              style={{ background: "#F7EFFF" }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-28 h-28 text-purple-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleChoose}
              className="mt-4 px-4 py-2 text-sm bg-zinc-200 rounded-md"
            >
              Chọn tệp
            </button>
          </div>

          {/* Form thông tin */}
          <form className="flex-1" onSubmit={handleSubmit}>
            {/* Right-aligned narrower form block */}
            <div className="max-w-xl ml-auto">
              <div className="mb-4">
                <label className="block text-sm text-zinc-600 mb-1">Email</label>
                <div>
                  <input
                    value={email}
                    readOnly
                    className="w-full px-4 py-3 rounded-md text-sm bg-zinc-100 border border-zinc-200"
                  />
                  <div className="mt-2">
                    <span className="text-sm text-red-400">Không thể thay đổi email</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-zinc-600 mb-1">Tên hiển thị</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-sm bg-white border border-zinc-200"
                  placeholder="Nhập tên hiển thị"
                />
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: BUTTON_BG }}
                  className={`text-white px-6 py-3 rounded-full font-semibold transition ${
                    saving ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
                  }`}
                >
                  {saving ? "Đang cập nhật..." : "Cập nhật"}
                </button>

                {message && (
                  <div className="text-sm text-green-600 text-center" role="status">
                    {message}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer is provided by the admin layout; removed duplicate footer here */}
      </div>
    </div>
  );
}
