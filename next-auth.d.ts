// next-auth.d.ts
import 'next-auth';
import 'next-auth/jwt';

/**
 * Extends the built-in session and token types to include the properties
 * we added in the [...nextauth]/route.ts configuration.
 */

declare module 'next-auth' {
  /**
   * The shape of the session object returned by `useSession` or `getSession`.
   * We are adding the `accessToken` and custom user properties here.
   */
  interface Session {
    accessToken?: string;
    user?: {
      id?: string;
      role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /**
   * The shape of the token object passed to the `jwt` callback.
   * We are adding the backend token and user details here.
   */
  interface JWT {
    accessToken?: string;
    role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
    id?: string;
  }
}
