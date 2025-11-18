import { getCookie } from './utils';

// Đảm bảo NEXT_PUBLIC_API_URL được sử dụng
// Sử dụng /api làm path gốc cho các request thông thường, nhưng /api/login cần là endpoint tuyệt đối
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api';
// Dùng base URL không có /api để gọi chính xác endpoint /api/login
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
  // Đọc XSRF-TOKEN từ cookie
  const xsrfToken = getCookie('XSRF-TOKEN');

  const headers: HeadersInit = {
    // Đặt mặc định Content-Type là JSON nếu không có
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Đối với các request thay đổi trạng thái (POST, PUT, DELETE...), đính kèm header X-XSRF-TOKEN
  const method = options.method?.toUpperCase();
  if (xsrfToken && method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['X-XSRF-TOKEN'] = xsrfToken;
  }

  // Chuyển đổi body thành JSON nếu nó là object (đã đảm bảo Content-Type ở trên)
  let body = options.body;
  if (body && typeof body === 'object') {
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

/**
 * [HÀM 2] loginApi (Sử dụng Form Data)
 * Dùng riêng cho endpoint /api/login để tương thích với Spring Security mặc định.
 * @param username Tên đăng nhập hoặc Email.
 * @param password Mật khẩu.
 */
export async function loginApi(username: string, password?: string) {
    const loginData = new URLSearchParams();

    // Spring Security mặc định tìm key là 'username' và 'password'
    loginData.append('username', username);

    if (password) {
        loginData.append('password', password);
    }

    try {
        const response = await fetch(`${ROOT_URL}/api/login`, {
            method: 'POST',
            // Content-Type: application/x-www-form-urlencoded được ngầm định bởi URLSearchParams
            body: loginData,
            credentials: 'include', // Rất quan trọng để nhận Cookie Session và CSRF
        });

        if (response.status === 401) {
             throw new Error("Thông tin đăng nhập không hợp lệ.");
        }

        if (!response.ok) {
            throw new Error(`Đăng nhập thất bại: ${response.status} - ${response.statusText}`);
        }

        // Đăng nhập thành công (thường Spring Security trả về 200 OK nhưng không có body)
        return { success: true };

    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        // Ném lỗi để component Login có thể bắt và hiển thị
        throw error;
    }
}