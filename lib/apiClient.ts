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

/**
 * A wrapper for the fetch API that automatically adds the JWT Authorization header.
 * @param endpoint The API endpoint to call (e.g., '/products', '/me').
 * @param options Fetch options.
 */
export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
  // Get the JWT from localStorage
  const token = localStorage.getItem('jwt');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // If a token exists, add the Authorization header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  // Stringify the body if it's a JavaScript object
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
     if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
       // Handle form data specifically if needed, otherwise JSON is default
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
    // Handle 401 Unauthorized or 403 Forbidden errors
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('jwt'); // Clear invalid token
      window.location.href = '/auth/login'; // Redirect to login page
      // Throw an error to stop further processing in the calling function
      throw new ApiError('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', response.status);
    }

    const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
    throw new ApiError(errorData.message || `Request failed with status ${response.status}`, response.status);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  // For non-JSON responses (like file downloads or simple text), return the raw response
  return response;
}