'use client';

import React, { createContext, useContext, useCallback } from 'react';
import useSWR from 'swr';
import { fetchApi, ApiError } from './apiClient';

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
    // Check if JWT exists before making the request
    const token = localStorage.getItem('jwt');
    if (!token) {
      return null; // No token, so no authenticated user
    }
    return await fetchApi(url);
  } catch (error: any) {
    if (error instanceof ApiError && error.status === 401) {
      // Token might be expired or invalid, fetchApi already handles clearing and redirecting
      return null;
    }
    throw error;
  }
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, error, isLoading, mutate } = useSWR<User | null>(
    '/me', // Endpoint to fetch user data
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      // Revalidate if token changes (e.g., after login/logout)
      revalidateIfStale: true,
      revalidateOnMount: true,
    }
  );

  // Determine authentication status based on data presence and error absence
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
