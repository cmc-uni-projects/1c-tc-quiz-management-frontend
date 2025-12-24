'use client';

import React from 'react';
import TeacherLayout from '@/components/TeacherLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TeacherLayout>
      {children}
    </TeacherLayout>
  );
}
