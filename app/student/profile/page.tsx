'use client';

import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchApi } from '@/lib/apiClient';
import StudentLayout from '@/components/StudentLayout';
import { useUser } from '@/lib/user';

const PRIMARY_BG = '#6D0446';
const BUTTON_BG = '#A53AEC';
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const StudentProfileContent = () => {
  const { mutate } = useUser();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await fetchApi('/profile');
        setUsername(data.name || data.username || '');
        setEmail(data.email || '');
        setAvatar(data.avatar || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Không thể tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      if (e.target) e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Ảnh đại diện không được lớn hơn 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleChoose = () => {
    fileRef.current?.click();
  };

  const handleDeleteAvatar = () => {
    if (!avatar) {
      toast.error('Không có ảnh đại diện để xóa');
      return;
    }

    setAvatar(null);
    setAvatarFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Tên không được để trống');
      return;
    }

    setSaving(true);

    try {
      let finalAvatarUrl = avatar;

      // Trường hợp 1: Upload ảnh mới
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const uploadData = await fetchApi('/profile/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        finalAvatarUrl = uploadData.avatarUrl;
      }
      // Trường hợp 2: Xóa ảnh (avatar là null và không có file mới)
      else if (avatar === null) {
        try {
          await fetchApi('/profile/delete-avatar', {
            method: 'DELETE',
          });
        } catch (deleteError) {
          console.error('Error deleting avatar:', deleteError);
        }
        finalAvatarUrl = null;
      }
      // Trường hợp 3: Không thay đổi ảnh (giữ nguyên)

      await fetchApi('/profile/update', {
        method: 'PATCH',
        body: { username: username.trim(), avatar: finalAvatarUrl },
      });

      setAvatar(finalAvatarUrl);
      setAvatarFile(null);

      // Cập nhật lại user global để header nhận avatar mới
      await mutate();

      toast.success('Cập nhật hồ sơ thành công');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error((error as any)?.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-0" style={{ color: '#111' }}>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden mt-8 border border-gray-200">
        <div className="p-4 sm:p-8 flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar và chọn file */}
          <div className="flex flex-col items-center w-full md:w-56" style={{ minWidth: 220 }}>
            <div
              className="rounded-full overflow-hidden w-52 h-52 flex items-center justify-center border-4 border-purple-400 shadow-lg"
              style={{ background: '#F7EFFF' }}
            >
              {avatar ? (
                <img
                  key={avatar}
                  src={avatar}
                  alt="Ảnh đại diện"
                  className="w-full h-full object-cover"
                />
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
                    <span className="text-xs text-red-500 font-medium italic">
                      Email không thể thay đổi.
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên người dùng
                </label>
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
                  className={`text-white w-full px-6 py-3 rounded-full font-semibold text-lg transition shadow-xl ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110'
                    }`}
                >
                  {saving ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileContent;
