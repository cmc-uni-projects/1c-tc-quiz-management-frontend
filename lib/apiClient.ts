import { getCookie } from './utils';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api';
const ROOT_URL = process.env.NEXT_PUBLIC_API_URL ? API_BASE_URL.replace('/api', '') : 'http://localhost:8082';

interface FetchApiOptions extends RequestInit {
  body?: any;
  omitCredentials?: boolean;
}

/**
 * @param endpoint Đường dẫn API (ví dụ: '/products', '/me')
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
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body,
    credentials: options.omitCredentials ? 'omit' : 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Yêu cầu thất bại với status ${response.status}` }));
    throw new ApiError(errorData.message || `Yêu cầu thất bại với status ${response.status}`, response.status);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response;
}

/**
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

        if (response.status === 401) {
             throw new Error("Thông tin đăng nhập không hợp lệ.");
        }

        if (!response.ok) {
            throw new Error(`Đăng nhập thất bại: ${response.status} - ${response.statusText}`);
        }

        return { success: true };

    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        throw error;
    }
}