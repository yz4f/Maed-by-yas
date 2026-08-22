import { DISCORD_ROLES } from './roles';

interface DiscordRoleResult {
  success: boolean;
  message: string;
}

export interface DiscordRoleRestoreResult {
  success: boolean;
  restoredRoleIds: string[];
  failedRoleIds: string[];
  message: string;
}

export class DiscordBotService {
  private static botToken = process.env.DISCORD_BOT_TOKEN || '';
  private static guildId = process.env.DISCORD_GUILD_ID || '1396959491786018826';

  static isConfigured(): boolean {
    return Boolean(this.botToken && this.guildId);
  }

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
    if (!this.isConfigured()) {
      return { success: false, message: 'خدمة ديسكورد غير مهيأة حاليًا.' };
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
      }

      const errorText = await res.text();
      console.error('Discord API Error:', errorText);
      if (res.status === 404) {
        return { success: false, message: 'لم يتم العثور على حسابك داخل خادم ديسكورد. انضم إلى الخادم أولًا ثم أعد المحاولة.' };
      }
      if (res.status === 403) {
        return { success: false, message: 'لا يملك بوت ديسكورد صلاحية منح هذه الرتبة أو أن الرتبة أعلى من البوت.' };
      }
      if (res.status === 401) {
        return { success: false, message: 'تعذر مصادقة بوت ديسكورد. تواصل مع الإدارة.' };
      }
      if (res.status === 429) {
        return { success: false, message: 'ديسكورد يحد الطلبات مؤقتًا. أعد المحاولة بعد قليل.' };
      }
      return { success: false, message: 'تعذر منح رتبة ديسكورد حاليًا. حاول مرة أخرى لاحقًا.' };
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
   * Restores only roles that are derived from currently active product entitlements.
   * It never grants administrative roles and does not modify licenses or product records.
   */
  static async restoreEntitledRoles(discordUserId: string, activeProductNames: string[]): Promise<DiscordRoleRestoreResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        restoredRoleIds: [],
        failedRoleIds: [],
        message: 'خدمة رتب ديسكورد غير مهيأة حاليًا. تواصل مع الإدارة.'
      };
    }

    const roleIds = new Set<string>([DISCORD_ROLES.CUSTOMER]);
    for (const productName of activeProductNames) {
      const lowerName = productName.toLowerCase();
      const isVipProduct = lowerName.includes('vip');
      if (isVipProduct) {
        roleIds.add(DISCORD_ROLES.VIP);
        continue;
      }
      if (lowerName.includes('فورت') || lowerName.includes('fortnite') || lowerName.includes('bypass')) {
        roleIds.add(DISCORD_ROLES.FORTNITE);
      }
      if (lowerName.includes('سبوفر') || lowerName.includes('spoofer') || lowerName.includes('تعن') || lowerName.includes('ta3n')) {
        roleIds.add(DISCORD_ROLES.PERM);
      }
    }

    const attemptedRoleIds = Array.from(roleIds);
    const settled = await Promise.all(
      attemptedRoleIds.map(async (roleId) => ({ roleId, result: await this.addRoleToMember(discordUserId, roleId) }))
    );
    const restoredRoleIds = settled.filter(({ result }) => result.success).map(({ roleId }) => roleId);
    const failedRoleIds = settled.filter(({ result }) => !result.success).map(({ roleId }) => roleId);

    return {
      success: restoredRoleIds.length > 0 && failedRoleIds.length === 0,
      restoredRoleIds,
      failedRoleIds,
      message: failedRoleIds.length === 0
        ? 'تمت استعادة رتب الاستحقاق المرتبطة بتراخيصك المفعلة.'
        : 'تعذر استعادة بعض الرتب. تأكد من وجودك في خادم ديسكورد ومن أن البوت يملك صلاحية إدارة الرتب.'
    };
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
    const isVipProduct = lowerName.includes('vip');

    if (isVipProduct) {
      promises.push(
        this.addRoleToMember(discordUserId, DISCORD_ROLES.VIP).then((res) => {
          if (res.success) rolesAdded.push('عميل VIP');
        })
      );
    } else if (lowerName.includes('فورت') || lowerName.includes('fortnite') || lowerName.includes('bypass')) {
      promises.push(
        this.addRoleToMember(discordUserId, DISCORD_ROLES.FORTNITE).then((res) => {
          if (res.success) rolesAdded.push('فورت نايت');
        })
      );
    } else if (lowerName.includes('سبوفر') || lowerName.includes('spoofer') || lowerName.includes('تعن') || lowerName.includes('ta3n')) {
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
