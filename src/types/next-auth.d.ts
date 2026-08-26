import type { Role } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      country: string;
      is_banned: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role?: Role;
    country?: string;
    is_banned?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    country: string;
    is_banned: boolean;
  }
}

export {};
