'use client';

import React, { createContext, useContext } from 'react';
import useSWR from 'swr';
import { fetchApi } from './apiClient'; // Dùng apiClient đã có

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: any;
  mutate: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const fetcher = (url: string) => fetchApi(url);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, error, isLoading, mutate } = useSWR<User>('/me', fetcher, {
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

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
