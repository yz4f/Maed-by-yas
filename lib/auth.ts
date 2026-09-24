import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { DISCORD_ROLES } from './roles';
import { DiscordBotService } from './discord';
import { sendDiscordWebsiteLog } from './discord-bot';
import { recordSiteLogin } from './site-presence';
import { StoreDB } from './store-db';
import { normalizeRole } from './permissions';

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      authorization: { params: { scope: 'identify email guilds' } },
    }),
  ],
  callbacks: {
    async jwt({ token, profile }: any) {
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
          try {
            const storedUser = await StoreDB.getUserByDiscordId(profile.id);
            const storedRole = normalizeRole(storedUser?.role);
            token.role = storedRole === 'Owner' ? 'Customer' : storedRole;
          } catch (error) {
            console.error('[Auth] Unable to load the assigned account role:', error);
            token.role = 'Customer';
          }
        }

        const customerName = profile.global_name || profile.username || 'Customer';
        void Promise.all([
          recordSiteLogin({ discordId: profile.id, name: customerName, image: token.image, role: token.role || 'Customer' }),
          sendDiscordWebsiteLog({ type: 'login', customerId: profile.id, customerName, customerImage: token.image }),
        ]).catch((error) => console.error('[Website Presence] Login event failed:', error));
      } else if (token.discordId && token.role !== 'Boss' && token.role !== 'Co-Boss') {
        // Refresh database-managed roles whenever NextAuth renews the session.
        // This makes role grants and revocations visible without another OAuth login.
        try {
          const storedUser = await StoreDB.getUserByDiscordId(String(token.discordId));
          token.role = storedUser && !storedUser.isArchived && !storedUser.isBanned
            ? (normalizeRole(storedUser.role) === 'Owner' ? 'Customer' : normalizeRole(storedUser.role))
            : 'Customer';
        } catch (error) {
          console.error('[Auth] Unable to refresh the assigned account role:', error);
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
  secret: process.env.NEXTAUTH_SECRET,
};
