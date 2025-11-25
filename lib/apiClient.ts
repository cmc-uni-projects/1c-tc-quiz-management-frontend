export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api';

interface FetchApiOptions extends RequestInit {
  body?: any;
}

const isClient = typeof window !== 'undefined';

/**
 * @param endpoint
 * @param options
 */
export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
  let token: string | null = null;

  if (isClient) {
    token = localStorage.getItem('jwt');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
     if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
     } else {
       body = JSON.stringify(body);
     }
  }


  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (isClient) {
        localStorage.removeItem('jwt');
        window.location.href = '/auth/login';
      }

      throw new ApiError('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', response.status);
    }

    const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
    throw new ApiError(errorData.message || `Request failed with status ${response.status}`, response.status);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response;
}