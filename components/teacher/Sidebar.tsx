'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/teacher/teacherhome', label: 'Trang chủ' },
    { href: '/teacher/categories', label: 'Danh mục câu hỏi' },
    { href: '/teacher/list-exam', label: 'Danh sách bài thi' },   
    { href: '#', label: 'Quản lý câu hỏi' },
    { href: '#', label: 'Quản lý bài thi' },
  ];

  return (
    <aside className="w-56 border-r border-zinc-200 bg-white flex flex-col">
      
      <nav className="flex-1 px-4 py-4 text-sm font-medium text-zinc-700 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 ${
              pathname === item.href
                ? 'bg-zinc-100 text-purple-700 font-semibold'
                : 'hover:bg-zinc-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
