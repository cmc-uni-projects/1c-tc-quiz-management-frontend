import NextAuth, { AuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { fetchApi } from '@/lib/apiClient'; // Import API client đã tạo

// Định nghĩa kiểu dữ liệu cho user và token
interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[NextAuth] Authorize function called.');

        if (!credentials?.email || !credentials?.password) {
          console.error('[NextAuth] Missing email or password.');
          throw new Error('Vui lòng nhập email và mật khẩu.');
        }
        
        console.log('[NextAuth] Credentials received:', { email: credentials.email });

        try {
          // Dùng fetchApi để gọi đến backend Spring Boot
          console.log('[NextAuth] Calling backend API at /login...');
          const user = await fetchApi('/login', {
            method: 'POST',
            body: {
              email: credentials.email,
              password: credentials.password,
            },
          });
          
          console.log('[NextAuth] Backend response (user object):', user);

          // Nếu backend trả về user, đăng nhập thành công
          if (user && user.role) {
            console.log('[NextAuth] User authenticated successfully. Returning user object.');
            // Dữ liệu trả về từ hàm này sẽ được dùng trong callback `jwt`
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          } else {
            // Nếu backend không trả về user, hoặc không có role
            console.error('[NextAuth] Authentication failed: Backend did not return a valid user object with a role.');
            throw new Error('Sai tài khoản hoặc mật khẩu.');
          }
        } catch (error: any) {
          // Bắt lỗi từ fetchApi (ví dụ: 401, 500 từ backend)
          // và throw error để NextAuth hiển thị cho người dùng
          console.error('[NextAuth] Error during authorization:', error);
          const errorMessage = error.message || 'Đăng nhập thất bại.';
          throw new Error(errorMessage);
        }
      },
    }),
  ],

  // Cấu hình callbacks để thêm thông tin vào JWT và session
  callbacks: {
    async jwt({ token, user }) {
      // `user` object là dữ liệu trả về từ `authorize`
      // Khi đăng nhập lần đầu, thêm role vào token
      if (user) {
        token.role = (user as User).role;
        token.id = (user as User).id;
      }
      return token;
    },
    async session({ session, token }) {
      // Thêm role và id từ token vào `session.user`
      // để có thể truy cập ở client-side (ví dụ: qua useSession)
      if (session.user) {
        session.user.role = token.role as User['role'];
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // Sử dụng chiến lược JWT
  session: {
    strategy: 'jwt',
  },

  // Trang đăng nhập tùy chỉnh
  pages: {
    signIn: '/login',
    error: '/login', // Chuyển về trang login nếu có lỗi (ví dụ: sai pass)
  },

  // Secret đã được định nghĩa trong .env.local
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
