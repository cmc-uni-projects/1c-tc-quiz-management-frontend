// components/Footer.tsx
import React from 'react';

const Footer = () => {
  return (
    // Footer màu trắng, cố định ở dưới cùng
    <footer className="fixed bottom-0 left-0 z-40 w-full bg-white py-3 border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 text-center">
        {/* Chữ bản quyền */}
        <p className="text-sm font-medium text-zinc-600">
          © 2025 QuizzZone. Mọi quyền được bảo lưu.
        </p>
      </div>
    </footer>
  );
};

export default Footer;