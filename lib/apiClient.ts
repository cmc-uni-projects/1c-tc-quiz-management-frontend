export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api';

interface FetchApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string;
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

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`[fetchApi] ${options.method || 'GET'} ${fullUrl}`, {
    headers,
    hasToken: !!token,
    body: body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined,
  });

  const response = await fetch(fullUrl, {
    method: options.method,
    headers,
    body: body as BodyInit | null | undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // 401 Unauthorized: Token hết hạn hoặc không hợp lệ
      if (isClient) {
        localStorage.removeItem('jwt');
        window.location.href = '/auth/login';
      }

      throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', response.status);
    }

    if (response.status === 403) {
      // 403 Forbidden: User được xác thực nhưng không có quyền truy cập
      const errorData = await response.json().catch(() => ({ error: 'Bạn không có quyền truy cập tài nguyên này.' }));
      throw new ApiError(errorData.error || 'Bạn không có quyền truy cập tài nguyên này.', response.status);
    }

    const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
    // Backend returns { error: "..." } for most exceptions
    const errorMessage = errorData.error || errorData.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response;
}