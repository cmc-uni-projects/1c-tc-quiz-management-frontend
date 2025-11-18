
'use client';

import React, { createContext, useContext, useCallback } from 'react';
import useSWR from 'swr';
import { fetchApi } from './apiClient';
import { ApiError } from './apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  avatarUrl?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: any;
  mutate: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);


const fetcher = async (url: string): Promise<User | null> => {
  try {
    return await fetchApi(url);
  } catch (error: any) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, error, isLoading, mutate } = useSWR<User | null>(
    '/me',
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  );

  const isAuthenticated = !!data && !error;

  const value = {
    user: data || null,
    isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
    isAuthenticated,
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