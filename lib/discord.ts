import { DISCORD_ROLES } from './store-db';

interface DiscordRoleResult {
  success: boolean;
  message: string;
}

export class DiscordBotService {
  private static botToken = process.env.DISCORD_BOT_TOKEN || '';
  private static guildId = process.env.DISCORD_GUILD_ID || '1396959491786018826';

  /**
   * Fetches the roles of a Discord user in the target Guild
   */
  static async getMemberRoles(discordUserId: string): Promise<string[]> {
    if (!this.botToken || !this.guildId) return [];

    try {
      const response = await fetch(`https://discord.com/api/v10/guilds/${this.guildId}/members/${discordUserId}`, {
        headers: {
          Authorization: `Bot ${this.botToken}`,
          'Content-Type': 'application/json',
        },
      });

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
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${this.botToken}`,
          'Content-Type': 'application/json',
        },
      });

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
   * Automatically synchronizes roles for product activation
   */
  static async syncRolesOnProductActivation(discordUserId: string, productName: string): Promise<string[]> {
    const rolesAdded: string[] = [];

    // Always add customer role
    const resCustomer = await this.addRoleToMember(discordUserId, DISCORD_ROLES.CUSTOMER);
    if (resCustomer.success) rolesAdded.push('عميل');

    if (productName.includes('فورت') || productName.includes('fortnite')) {
      const resFort = await this.addRoleToMember(discordUserId, DISCORD_ROLES.FORTNITE);
      if (resFort.success) rolesAdded.push('فورت نايت');
    }

    if (productName.includes('سبوفر') || productName.includes('تعن')) {
      const resPerm = await this.addRoleToMember(discordUserId, DISCORD_ROLES.PERM);
      if (resPerm.success) rolesAdded.push('بيرم');
    }

    return rolesAdded;
  }
}
