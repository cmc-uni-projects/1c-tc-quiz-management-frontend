'use client';

import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import Navbar from '@/components/Navbar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* <Navbar /> */}
      {children}
      <Toaster position="bottom-right" />
    </SessionProvider>
  );
}
