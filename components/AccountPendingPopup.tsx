'use client';

import React from 'react';

interface AccountPendingPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccountPendingPopup({ isOpen, onClose }: AccountPendingPopupProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-amber-900/60 to-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20 backdrop-blur-xl transform transition-all duration-300 scale-100 hover:scale-[1.02]">
                <div className="text-center">
                    {/* Icon Clock/Pending */}
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mb-6 shadow-lg animate-pulse">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">
                        Tài khoản đang chờ duyệt
                    </h3>

                    {/* Message */}
                    <p className="text-gray-600 mb-6">
                        Tài khoản giáo viên của bạn đang chờ quản trị viên phê duyệt.
                        Vui lòng kiên nhẫn chờ đợi hoặc liên hệ quản trị viên để được hỗ trợ.
                    </p>

                    {/* Info Box */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 mb-6 text-left border border-amber-200/50">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="h-5 w-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                    {/* Additional Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800 flex items-start">
                            <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                                Quá trình phê duyệt thường mất từ <strong>1-2 ngày làm việc</strong>.
                                Bạn sẽ nhận được email thông báo khi tài khoản được kích hoạt.
                            </span>
                        </p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="mt-6 w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 px-4 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-amber-500/25 transform hover:scale-[1.02] flex items-center justify-center"
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
