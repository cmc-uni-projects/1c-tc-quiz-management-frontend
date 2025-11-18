import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { fetchApi } from '@/lib/apiClient';

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
          console.log('[NextAuth] Calling backend API at /login...');
          const user = await fetchApi('/login', {
            method: 'POST',
            body: {
              email: credentials.email,
              password: credentials.password,
            },
          });
          
          console.log('[NextAuth] Backend response (user object):', user);

          if (user && user.role) {
            console.log('[NextAuth] User authenticated successfully. Returning user object.');
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          } else {
            console.error('[NextAuth] Authentication failed: Backend did not return a valid user object with a role.');
            throw new Error('Sai tài khoản hoặc mật khẩu.');
          }
        } catch (error: unknown) {
          console.error('[NextAuth] Error during authorization:', error);
          const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại.';
          throw new Error(errorMessage);
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as User).role;
        token.id = (user as User).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as User['role'];
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
