'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/lib/user';

const AuthRedirect = () => {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && pathname === '/') {
      switch (user.role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'TEACHER':
          router.push('/teacher/teacherhome');
          break;
        case 'STUDENT':
          router.push('/student/studenthome');
          break;
        default:
          // Optional: handle unknown roles, maybe redirect to a generic dashboard or home
          break;
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname]);

  return null; // This component does not render anything
};

export default AuthRedirect;
