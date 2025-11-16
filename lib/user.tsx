'use client';

import React, { createContext, useContext, useCallback } from 'react';
import useSWR from 'swr';
import { fetchApi } from './apiClient';

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

// Fetcher for SWR: handles fetching user data.
const fetcher = async (url: string): Promise<User | null> => {
  try {
    // fetchApi sends cookies automatically.
    return await fetchApi(url);
  } catch (error: any) {
    // If the error is a 401, it means the user is not logged in.
    // This is an expected state, so we return null.
    // This prevents the "error" from being logged to the console.
    if (error.message.includes('401')) {
      return null;
    }
    // For other errors (e.g., 500), we re-throw so SWR can record it.
    throw error;
  }
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, error, isLoading, mutate } = useSWR<User | null>(
    '/me', // API endpoint to get user info
    fetcher,
    {
      shouldRetryOnError: false, // Don't retry on errors like 500
      revalidateOnFocus: false, // Optional: disable re-fetching on window focus
    }
  );

  // The user is authenticated if there is data and no error.
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