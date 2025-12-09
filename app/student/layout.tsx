'use client';

import React from 'react';
import StudentLayout from '@/components/StudentLayout';

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <StudentLayout>
            {children}
        </StudentLayout>
    );
}
