import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      discordId?: string;
      role?: string;
    } & DefaultSession['user'];
  }

  interface Profile {
    id?: string;
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    discordId?: string;
    role?: string;
  }
}
