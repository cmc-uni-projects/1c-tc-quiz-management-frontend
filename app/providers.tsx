'use client';

import { Toaster } from 'react-hot-toast';
import { UserProvider } from '@/lib/user';
import Navbar from '@/components/Navbar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <Navbar />
      {children}
      <Toaster position="bottom-right" />
    </UserProvider>
  );
}
