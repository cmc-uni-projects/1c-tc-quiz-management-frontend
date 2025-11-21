import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { fetchApi } from '@/lib/apiClient';

// Extends the default User model to include role and the backend token
interface IUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  token: string; // To hold the JWT from the backend
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập email và mật khẩu.');
        }

        try {
          // The backend is expected to return an object like { user: { ... }, token: '...' }
          const response = await fetchApi('/login', {
            method: 'POST',
            body: {
              email: credentials.email,
              password: credentials.password,
            },
          });

          // If the response contains the user and a token, combine them for the callback
          if (response.user && response.token) {
            return {
              ...response.user,
              token: response.token, // Pass the backend token along
            };
          }
          
          throw new Error(response.message || 'Sai tài khoản hoặc mật khẩu.');
        } catch (error: any) {
          console.error('[NextAuth] Error during authorization:', error);
          // Rethrow the error message from the backend or a generic one
          throw new Error(error.message || 'Đăng nhập thất bại.');
        }
      },
    }),
  ],

  callbacks: {
    // This callback is called whenever a JWT is created or updated.
    async jwt({ token, user }) {
      // The 'user' object is only passed on the initial sign-in.
      if (user) {
        const customUser = user as IUser;
        // Persist the backend token and user role into the NextAuth JWT.
        token.accessToken = customUser.token;
        token.role = customUser.role;
        token.id = customUser.id;
      }
      return token;
    },
    // This callback is called whenever a session is checked.
    async session({ session, token }) {
      // Expose the data from the JWT to the client-side session object.
      if (session.user) {
        session.user.role = token.role as IUser['role'];
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string; // Expose the backend token
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
    error: '/login', // Redirect users to login page on error
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Add this to a `next-auth.d.ts` file in your project root to get type-safety
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user?: {
      id?: string;
      role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
    id?: string;
  }
}
