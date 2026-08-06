import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { DISCORD_ROLES } from './roles';
import { DiscordBotService } from './discord';

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'https://maed-by-yas.vercel.app';
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || '1421920616382205962',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || 'KNHfJmq4fcYqfH_kR2aPuJnq3-unMMBk',
      authorization: { params: { scope: 'identify email guilds' } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }: any) {
      if (profile) {
        token.discordId = profile.id;
        token.image = profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          : 'https://cdn.discordapp.com/embed/avatars/0.png';

        // Fetch user roles from the Discord server
        const memberRoles = await DiscordBotService.getMemberRoles(profile.id);

        // Check if user is Boss / Co-boss / Admin based on Discord ID or roles
        if (
          profile.id === '1315014140804206636' || 
          profile.id === DISCORD_ROLES.BOSS || 
          memberRoles.includes(DISCORD_ROLES.BOSS)
        ) {
          token.role = 'Boss';
        } else if (
          profile.id === DISCORD_ROLES.CO_BOSS || 
          memberRoles.includes(DISCORD_ROLES.CO_BOSS)
        ) {
          token.role = 'Co-Boss';
        } else {
          token.role = 'Customer';
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.discordId = token.discordId;
        session.user.role = token.role || 'Customer';
        session.user.image = token.image;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 't3n_super_secret_jwt_key_2026',
};
