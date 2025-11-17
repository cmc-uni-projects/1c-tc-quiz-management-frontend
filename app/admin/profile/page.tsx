"use client";

import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";

const PRIMARY_BG = "#6D0446";
const BUTTON_BG = "#A53AEC";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

export default function AdminProfilePage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username || "");
          setEmail(data.email || "");
          setAvatar(data.avatar || null);
        } else {
          toast.error("Không thể tải thông tin hồ sơ");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Lỗi khi tải thông tin hồ sơ");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      // reset value so selecting the same file later still triggers onChange
      if (e.target) e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }

    // Validate file size (5MB)
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Ảnh đại diện không được lớn hơn 5MB");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);

    // Clear value so choosing the same file again will fire onChange
    if (e.target) e.target.value = "";
  };

  const handleChoose = () => {
    fileRef.current?.click();
  };

  const handleDeleteAvatar = async () => {
    if (!avatar) {
      toast.error("Không có ảnh đại diện để xóa");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setAvatar(null);
        setAvatarFile(null);
        if (fileRef.current) fileRef.current.value = "";
        toast.success("Xóa ảnh đại diện thành công");
      } else {
        const errorData = await response.text();
        toast.error(errorData || "Xóa ảnh đại diện thất bại");
      }
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast.error("Lỗi khi xóa ảnh đại diện");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    setSaving(true);

    try {
      let avatarUrl = avatar;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadResponse = await fetch("/api/profile/upload-avatar", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          const text = await uploadResponse.text();
          throw new Error(text || "Tải ảnh đại diện thất bại");
        }
        const uploadData = await uploadResponse.json();
        avatarUrl = uploadData.avatarUrl;
      }

      // Update profile
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatar: avatarUrl }),
      });

      if (response.ok) {
        toast.success("Cập nhật hồ sơ thành công");
        setAvatarFile(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Cập nhật hồ sơ thất bại");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Lỗi khi cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: PRIMARY_BG }}>
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

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

            <div className="flex flex-col gap-2 mt-4 w-full">
              <button
                type="button"
                onClick={handleChoose}
                className="px-4 py-2 text-sm bg-zinc-200 rounded-md hover:bg-zinc-300 transition"
              >
                Choose Photo
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-red-200 text-red-700 rounded-md hover:bg-red-300 transition disabled:opacity-50"
                >
                  Delete Photo
                </button>
              )}
            </div>
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
                    <span className="text-sm text-red-400">Email cannot be changed</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-zinc-600 mb-1">Name</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-sm bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Enter your name"
                  required
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
                  {saving ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
