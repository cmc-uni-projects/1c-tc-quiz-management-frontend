'use client';

import React from 'react';

interface AccountLockedPopupProps {
  isOpen: boolean;
  onClose: () => void;
  accountType: 'teacher' | 'student';
}

export default function AccountLockedPopup({ isOpen, onClose, accountType }: AccountLockedPopupProps) {
  if (!isOpen) return null;

  const accountTypeText = accountType === 'teacher' ? 'giáo viên' : 'học viên';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Icon Lock */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Tài khoản đã bị khóa
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Tài khoản {accountTypeText} của bạn đã bị khóa bởi quản trị viên.
            Vui lòng liên hệ quản trị viên để biết thêm thông tin chi tiết.
          </p>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-gray-900 mb-2">Thông tin liên hệ:</h4>
            <p className="text-gray-600 text-sm mb-1">
              📧 Email: admin@quiz.edu.vn
            </p>
            <p className="text-gray-600 text-sm mb-1">
              📞 Hotline: 1900-1234
            </p>
            <p className="text-gray-600 text-sm">
              🕐 Giờ làm việc: 8:00 - 17:00 (Thứ 2 - Thứ 6)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Quay lại trang đăng nhập
            </button>
            
            <button
              onClick={() => window.location.href = 'mailto:admin@quiz.edu.vn'}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Gửi email liên hệ
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-4 text-gray-400 hover:text-gray-600 text-sm underline"
          >
            Đóng thông báo
          </button>
        </div>
      </div>
    </div>
  );
}
