import { getCookie } from './utils';

// Đảm bảo NEXT_PUBLIC_API_URL được sử dụng
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api';

interface FetchApiOptions extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
}

/**
 * [HÀM 1] fetchApi (Không có Bearer Token)
 * Dùng cho các API công khai hoặc dùng CSRF/Cookie (ví dụ: /login, /register).
 * @param endpoint Đường dẫn API (ví dụ: '/login')
 * @param options Các tùy chọn cho fetch
 */
export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
  // Đọc XSRF-TOKEN từ cookie
  const xsrfToken = getCookie('XSRF-TOKEN');

  const headers: HeadersInit = {
    ...options.headers,
  };

  // Đối với các request thay đổi trạng thái (POST, PUT, DELETE...), đính kèm header X-XSRF-TOKEN
  const method = options.method?.toUpperCase();
  if (xsrfToken && method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['X-XSRF-TOKEN'] = xsrfToken;
  }

  // Chuyển đổi body thành JSON nếu nó là object và content-type là json
  let body = options.body;
  if (body && typeof body === 'object' && headers['Content-Type'] === 'application/json') {
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body,
    // QUAN TRỌNG: Luôn gửi kèm cookie (cần cho XSRF token và session cookie)
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