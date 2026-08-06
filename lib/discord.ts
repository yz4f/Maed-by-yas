import { DISCORD_ROLES } from './roles';

interface DiscordRoleResult {
  success: boolean;
  message: string;
}

export class DiscordBotService {
  private static botToken = process.env.DISCORD_BOT_TOKEN || '';
  private static guildId = process.env.DISCORD_GUILD_ID || '1396959491786018826';

  /**
   * Helper to perform fetches with a fast timeout to prevent blocking server threads
   */
  private static async fetchWithTimeout(url: string, options: any = {}, timeout = 4000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  /**
   * Fetches the roles of a Discord user in the target Guild
   */
  static async getMemberRoles(discordUserId: string): Promise<string[]> {
    if (!this.botToken || !this.guildId) return [];

    try {
      const response = await this.fetchWithTimeout(`https://discord.com/api/v10/guilds/${this.guildId}/members/${discordUserId}`, {
        headers: {
          Authorization: `Bot ${this.botToken}`,
          'Content-Type': 'application/json',
        },
      }, 3000); // 3 seconds timeout for checking roles on login

      if (!response.ok) {
        console.error(`[Discord API] Failed to fetch member ${discordUserId}: ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      return data.roles || [];
    } catch (error) {
      console.error('[Discord API] Error fetching member roles:', error);
      return [];
    }
  }

  /**
   * Adds a role to a Discord user in the target Guild
   */
  static async addRoleToMember(discordUserId: string, roleId: string): Promise<DiscordRoleResult> {
    if (!this.botToken || !this.guildId) {
      console.log(`[Discord Bot Simulation] Added Role ID ${roleId} to User ID ${discordUserId}`);
      return { success: true, message: `(محاكاة) تم إسناد رتبة الديسكورد ${roleId} بنجاح.` };
    }

    try {
      const url = `https://discord.com/api/v10/guilds/${this.guildId}/members/${discordUserId}/roles/${roleId}`;
      const res = await this.fetchWithTimeout(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${this.botToken}`,
          'Content-Type': 'application/json',
        },
      }, 4000);

      if (res.ok || res.status === 204) {
        return { success: true, message: `تمت إضافة رتبة الديسكورد (${roleId}) بنجاح!` };
      } else {
        const errorText = await res.text();
        console.error('Discord API Error:', errorText);
        return { success: false, message: `خطأ في Discord API: ${res.statusText}` };
      }
    } catch (err: any) {
      console.error('Discord Bot Fetch Error:', err);
      return { success: false, message: err.message || 'فشل الاتصال بـ Discord Bot' };
    }
  }

  /**
   * Removes a role from a Discord user in the target Guild
   */
  static async removeRoleFromMember(discordUserId: string, roleId: string): Promise<DiscordRoleResult> {
    if (!this.botToken || !this.guildId) {
      console.log(`[Discord Bot Simulation] Removed Role ID ${roleId} from User ID ${discordUserId}`);
      return { success: true, message: `(محاكاة) تم إزالة رتبة الديسكورد ${roleId} بنجاح.` };
    }

    try {
      const url = `https://discord.com/api/v10/guilds/${this.guildId}/members/${discordUserId}/roles/${roleId}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${this.botToken}`,
        },
      });

      if (res.ok || res.status === 204) {
        return { success: true, message: `تمت إزالة رتبة الديسكورد (${roleId}) بنجاح!` };
      } else {
        return { success: false, message: `خطأ في إزالة رتبة الديسكورد.` };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'فشل الاتصال بـ Discord Bot' };
    }
  }

  /**
   * Automatically synchronizes roles for product activation in parallel
   */
  static async syncRolesOnProductActivation(discordUserId: string, productName: string): Promise<string[]> {
    const rolesAdded: string[] = [];
    const promises: Promise<any>[] = [];

    // Always add customer role
    promises.push(
      this.addRoleToMember(discordUserId, DISCORD_ROLES.CUSTOMER).then((res) => {
        if (res.success) rolesAdded.push('عميل');
      })
    );

    const lowerName = productName.toLowerCase();
    if (lowerName.includes('فورت') || lowerName.includes('fortnite') || lowerName.includes('bypass')) {
      promises.push(
        this.addRoleToMember(discordUserId, DISCORD_ROLES.FORTNITE).then((res) => {
          if (res.success) rolesAdded.push('فورت نايت');
        })
      );
    }

    if (lowerName.includes('سبوفر') || lowerName.includes('spoofer') || lowerName.includes('تعن') || lowerName.includes('ta3n')) {
      promises.push(
        this.addRoleToMember(discordUserId, DISCORD_ROLES.PERM).then((res) => {
          if (res.success) rolesAdded.push('بيرم');
        })
      );
    }

    try {
      await Promise.all(promises);
    } catch (err) {
      console.error('[Discord Bot] Error syncing roles in parallel:', err);
    }

    return rolesAdded;
  }
}
