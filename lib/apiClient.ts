// lib/apiClient.ts

import { getCookie } from './utils';

// Custom Error class to include status code
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Đảm bảo NEXT_PUBLIC_API_URL được sử dụng
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api';
const ROOT_URL = process.env.NEXT_PUBLIC_API_URL ? API_BASE_URL.replace('/api', '') : 'http://localhost:8082';


interface FetchApiOptions extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
}

/**
 * [HÀM 1] fetchApi (Không có Bearer Token)
 * Dùng cho các API công khai hoặc dùng CSRF/Cookie (ví dụ: /register, các API data).
 * @param endpoint Đường dẫn API (ví dụ: '/products')
 * @param options Các tùy chọn cho fetch
 */
export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
  const xsrfToken = getCookie('XSRF-TOKEN');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const method = options.method?.toUpperCase();
  if (xsrfToken && method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['X-XSRF-TOKEN'] = xsrfToken;
  }

  let body = options.body;
  if (body && typeof body === 'object' && headers['Content-Type'] === 'application/json') {
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body,
    credentials: 'include',
  });

  if (!response.ok) {
    const defaultMessage = `Yêu cầu thất bại với status ${response.status}`;
    try {
      const errorData = await response.json();
      throw new ApiError(errorData.message || defaultMessage, response.status);
    } catch (e) {
      // If response.json() fails or it's already an ApiError, create a new one.
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(defaultMessage, response.status);
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    // Handle empty JSON response
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return response;
}

/**
 * [HÀM 2] loginApi (Sử dụng Form Data)
 * Dùng riêng cho endpoint /api/login để tương thích với Spring Security mặc định.
 * @param username Tên đăng nhập hoặc Email.
 * @param password Mật khẩu.
 */
export async function loginApi(username: string, password?: string) {
    const loginData = new URLSearchParams();
    loginData.append('username', username);

    if (password) {
        loginData.append('password', password);
    }

    try {
        const response = await fetch(`${ROOT_URL}/api/login`, {
            method: 'POST',
            body: loginData,
            credentials: 'include',
        });

        if (!response.ok) {
            // Use ApiError for consistency
            throw new ApiError(
              response.status === 401 ? "Thông tin đăng nhập không hợp lệ." : `Đăng nhập thất bại: ${response.status}`,
              response.status
            );
        }
        
        // Login successful, try to get user data from the response if it exists
        try {
          return await response.json();
        } catch {
          // If no body, return success
          return { success: true };
        }

    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        throw error;
    }
}
