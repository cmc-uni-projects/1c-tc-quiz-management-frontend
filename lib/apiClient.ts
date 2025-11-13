import { getCookie } from './utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api';

interface FetchApiOptions extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
}

/**
 * Hàm fetch API client tập trung.
 * Tự động xử lý CSRF token và gửi credentials (cookies).
 * @param endpoint Đường dẫn API (ví dụ: '/login')
 * @param options Các tùy chọn cho fetch
 */
export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
  // Đọc XSRF-TOKEN từ cookie
  const xsrfToken = getCookie('XSRF-TOKEN');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Đối với các request thay đổi trạng thái, đính kèm header X-XSRF-TOKEN
  const method = options.method?.toUpperCase();
  if (xsrfToken && method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['X-XSRF-TOKEN'] = xsrfToken;
  }

  // Chuyển đổi body thành JSON nếu nó là object
  const body = options.body && typeof options.body === 'object'
    ? JSON.stringify(options.body)
    : options.body;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body,
    // QUAN TRỌNG: Luôn gửi kèm cookie với mỗi request
    credentials: 'include', 
  });

  if (!response.ok) {
    // Xử lý lỗi một cách nhất quán
    const errorData = await response.json().catch(() => ({ message: `Yêu cầu thất bại với status ${response.status}` }));
    throw new Error(errorData.message || `Yêu cầu thất bại với status ${response.status}`);
  }

  // Trả về JSON nếu có nội dung, ngược lại trả về response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response;
}
