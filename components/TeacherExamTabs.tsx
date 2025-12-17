'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TeacherExamTabs() {
  const pathname = usePathname();
  const isOffline = pathname.startsWith('/teacher/exam-offline');
  const isOnline = pathname.startsWith('/teacher/exam-online');

  return (
    <div className="flex justify-start gap-6 border-b border-gray-300 mb-6">
      <Link href="/teacher/exam-offline">
        <button className={
          `pb-2 font-medium ${isOffline ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-200'}`
        }>
          Bài thi Offline
        </button>
      </Link>
      <Link href="/teacher/exam-online">
        <button className={
          `pb-2 font-medium ${isOnline ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-200'}`
        }>
          Bài thi Online
        </button>
      </Link>
    </div>
  );
}
