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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20 backdrop-blur-xl transform transition-all duration-300 scale-100 hover:scale-[1.02]">
        <div className="text-center">
          {/* Icon Lock */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 mb-6 shadow-lg animate-pulse">
            <svg
              className="h-10 w-10 text-white"
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
          <h3 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Tài khoản đã bị khóa
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Tài khoản {accountTypeText} của bạn đã bị khóa bởi quản trị viên.
            Vui lòng liên hệ quản trị viên để biết thêm thông tin chi tiết.
          </p>

          {/* Contact Info */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 mb-6 text-left border border-gray-200/50">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Thông tin liên hệ:
            </h4>
            <div className="space-y-2">
              <p className="text-gray-700 text-sm flex items-center">
                <span className="mr-2">📧</span>
                <span className="font-medium">Email:</span> admin@gmail.com
              </p>
              <p className="text-gray-700 text-sm flex items-center">
                <span className="mr-2">📞</span>
                <span className="font-medium">Hotline:</span> 1900-1234
              </p>
              <p className="text-gray-700 text-sm flex items-center">
                <span className="mr-2">🕐</span>
                <span className="font-medium">Giờ làm việc:</span> 8:00 - 17:00 (Thứ 2 - Thứ 6)
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-6 w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-medium shadow-lg hover:shadow-gray-500/25 transform hover:scale-[1.02] flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Đóng thông báo
          </button>
        </div>
      </div>
    </div>
  );
}
