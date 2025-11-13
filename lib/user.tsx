'use client';

import React, { createContext, useContext } from 'react';
import useSWR from 'swr';
import { fetchApi } from './apiClient'; // Dùng apiClient đã có

// Định nghĩa kiểu dữ liệu cho User
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

// Định nghĩa kiểu dữ liệu cho Context
interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: any;
  mutate: () => void; // Hàm để trigger việc fetch lại dữ liệu user
}

// Tạo Context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Hàm fetcher cho SWR
const fetcher = (url: string) => fetchApi(url);

// Tạo Provider
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dùng SWR để fetch dữ liệu từ /api/me
  // /api/me là một API route của Next.js mà chúng ta sẽ tạo ở bước tiếp theo
  const { data, error, isLoading, mutate } = useSWR<User>('/me', fetcher, {
    // Tự động fetch lại khi focus vào tab, nhưng không fetch lại khi bị lỗi
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });

  const value = {
    user: data || null,
    isLoading,
    error,
    mutate,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Tạo hook `useUser`
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
