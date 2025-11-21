"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const PRIMARY_BG = "#6D0446";
const BUTTON_BG = "#A53AEC";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const XIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const Toast = ({ message, type, onClose }) => {
  const baseClasses = "fixed bottom-5 right-5 p-4 rounded-xl shadow-2xl z-[100] flex items-center";
  let typeClasses = "";

  switch (type) {
    case 'success':
      typeClasses = "bg-green-600 text-white";
      break;
    case 'error':
      typeClasses = "bg-red-600 text-white";
      break;
    default:
      typeClasses = "bg-gray-700 text-white";
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);


  return (
    <div className={`${baseClasses} ${typeClasses} transition-all duration-300 transform translate-y-0 opacity-100`}>
      <p className="mr-4 font-semibold">{message}</p>
      <button onClick={onClose} className="ml-4 opacity-75 hover:opacity-100 transition">
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt');
  }
  return null;
};

async function fetchApi(url, options = {}) {
  const token = getAuthToken();
  const defaultHeaders = {
    ...(!options.body || typeof options.body === 'string' || options.body instanceof URLSearchParams ? { 'Content-Type': 'application/json' } : {}),
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
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
        config.body = options.body;
    } else {
        config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
  }

  const response = await fetch(url, config);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  
  if (!response.ok) {
    let errorText = "Lỗi không xác định";
    try {
        const errorData = isJson ? await response.json() : await response.text();
        errorText = errorData.message || errorData.error || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData));
    } catch {
    }
    const errorMessage = errorText.substring(0, 200) || `Lỗi (${response.status}): Không thể thực hiện thao tác.`;
    throw new Error(errorMessage);
  }

  try {
      return isJson ? await response.json() : await response.text();
  } catch (e) {
      return (options.method === 'DELETE' || options.method === 'PUT' || options.method === 'POST') ? "Success" : null;
  }
}


export default function AdminProfilePage() {
  const fileRef = useRef(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [toastState, setToastState] = useState(null); 

  const showToast = useCallback((message, type) => {
    setToastState({ message, type });
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await fetchApi(`${API_URL}/profile`);
        setUsername(data.username || "");
        setEmail(data.email || "");
        setAvatar(data.avatar || null);
      } catch (error) {
        console.error("Error fetching profile:", error);
        showToast("Không thể tải thông tin hồ sơ", 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      if (e.target) e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn tệp hình ảnh", 'error');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      showToast("Ảnh đại diện không được lớn hơn 5MB", 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = "";
  };

  const handleChoose = () => {
    fileRef.current?.click();
  };

  const handleDeleteAvatar = async () => {
    if (!avatar) {
      showToast("Không có ảnh đại diện để xóa", 'error');
      return;
    }

    setSaving(true);
    try {
      await fetchApi(`${API_URL}/profile/delete-avatar`, {
        method: "DELETE",
      });

      setAvatar(null);
      setAvatarFile(null);
      if (fileRef.current) fileRef.current.value = "";
      showToast("Xóa ảnh đại diện thành công", 'success');
      
    } catch (error) {
      console.error("Error deleting avatar:", error);
      showToast(error?.message || "Lỗi khi xóa ảnh đại diện", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast("Tên không được để trống", 'error');
      return;
    }

    setSaving(true);

    try {
      let finalAvatarUrl = avatar;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        
        const uploadData = await fetchApi(`${API_URL}/profile/upload-avatar`, {
          method: "POST",
          body: formData,
        });

        finalAvatarUrl = uploadData.avatarUrl;
        
      } else if (avatar === null && finalAvatarUrl !== null) {
          finalAvatarUrl = null;
      }

      const response = await fetchApi(`${API_URL}/profile`, {
        method: "PUT",
        body: { username: username.trim(), avatar: finalAvatarUrl },
      });

      setAvatar(finalAvatarUrl);
      setAvatarFile(null);
      
      showToast("Cập nhật hồ sơ thành công", 'success');
      
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast(error?.message || "Lỗi khi cập nhật hồ sơ", 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: PRIMARY_BG }}>
        <p className="text-white text-lg">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-0" style={{ color: "#111" }}>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden mt-12 border border-gray-200">
        <div 
            className="p-4 sm:p-8 flex flex-col md:flex-row gap-8 items-start"
        >
          {/* Avatar và chọn file */}
          <div className="flex flex-col items-center w-full md:w-56" style={{ minWidth: 220 }}>
            <div
              className="rounded-full overflow-hidden w-52 h-52 flex items-center justify-center border-4 border-purple-400 shadow-lg"
              style={{ background: "#F7EFFF" }}
            >
              {avatar ? (
                // Sử dụng key để ép React render lại nếu avatar thay đổi (Base64)
                <img key={avatar} src={avatar} alt="Ảnh đại diện" className="w-full h-full object-cover" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-28 h-28 text-purple-700 opacity-60"
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

            <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
              <button
                type="button"
                onClick={handleChoose}
                className="px-4 py-2 text-sm bg-purple-100 text-purple-800 font-semibold rounded-full hover:bg-purple-200 transition shadow-md"
                disabled={saving}
              >
                Chọn ảnh
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-red-100 text-red-700 font-semibold rounded-full hover:bg-red-200 transition disabled:opacity-50 shadow-md"
                >
                  Xóa ảnh đại diện
                </button>
              )}
            </div>
          </div>

          {/* Form thông tin */}
          <form className="flex-1 w-full md:mt-0 mt-8" onSubmit={handleSubmit}>
            {/* Form block */}
            <div className="max-w-xl mx-auto md:mx-0">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Thông tin cá nhân</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div>
                  <input
                    value={email}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg text-sm bg-zinc-100 border border-zinc-200 cursor-not-allowed"
                    title="Email không thể thay đổi"
                  />
                  <div className="mt-1">
                    <span className="text-xs text-red-500 font-medium italic">Email không thể thay đổi.</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm bg-white border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                  placeholder="Nhập tên của bạn"
                  required
                  disabled={saving}
                />
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: BUTTON_BG }}
                  className={`text-white w-full px-6 py-3 rounded-full font-semibold text-lg transition shadow-xl ${
                    saving ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
                  }`}
                >
                  {saving ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toastState && (
          <Toast 
              message={toastState.message} 
              type={toastState.type} 
              onClose={() => setToastState(null)} 
          />
      )}
    </div>
  );
}