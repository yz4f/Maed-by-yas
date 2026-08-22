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

export interface DiscordRoleSyncResult {
  success: boolean;
  grantedRoleIds: string[];
  failedRoleIds: string[];
  message: string;
}

export class DiscordBotService {
  private static botToken = process.env.DISCORD_BOT_TOKEN || '';
  private static guildId = process.env.DISCORD_GUILD_ID || '1396959491786018826';

  static isConfigured(): boolean {
    return Boolean(this.botToken && this.guildId);
  }

  private static async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 4000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  static async getMemberRoles(discordUserId: string): Promise<string[]> {
    if (!this.isConfigured()) return [];
    try {
      const response = await this.fetchWithTimeout(
        `https://discord.com/api/v10/guilds/${this.guildId}/members/${discordUserId}`,
        { headers: { Authorization: `Bot ${this.botToken}`, 'Content-Type': 'application/json' } },
        3000,
      );
      if (!response.ok) {
        console.error(`[Discord API] Failed to fetch member ${discordUserId}: ${response.statusText}`);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data.roles) ? data.roles : [];
    } catch (error) {
      console.error('[Discord API] Error fetching member roles:', error);
      return [];
    }
  }

  static async addRoleToMember(discordUserId: string, roleId: string): Promise<DiscordRoleResult> {
    if (!this.isConfigured()) {
      return { success: false, message: 'خدمة ديسكورد غير مهيأة حاليًا.' };
    }

    try {
      const response = await this.fetchWithTimeout(
        `https://discord.com/api/v10/guilds/${this.guildId}/members/${discordUserId}/roles/${roleId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bot ${this.botToken}`, 'Content-Type': 'application/json' },
        },
      );

      if (response.ok || response.status === 204) {
        return { success: true, message: `تمت إضافة رتبة ديسكورد (${roleId}) بنجاح.` };
      }

      const errorText = await response.text();
      console.error('[Discord API] Role assignment failed:', response.status, errorText);
      if (response.status === 404) return { success: false, message: 'لم يتم العثور على حساب العميل داخل خادم ديسكورد. يجب أن ينضم للخادم أولًا.' };
      if (response.status === 403) return { success: false, message: 'البوت لا يملك صلاحية منح هذه الرتبة أو أن الرتبة أعلى من البوت.' };
      if (response.status === 401) return { success: false, message: 'تعذر مصادقة بوت ديسكورد.' };
      if (response.status === 429) return { success: false, message: 'ديسكورد يحد الطلبات مؤقتًا. أعد المحاولة بعد قليل.' };
      return { success: false, message: 'تعذر منح رتبة ديسكورد حاليًا.' };
    } catch (error) {
      console.error('[Discord API] Role assignment error:', error);
      return { success: false, message: 'تعذر الاتصال بخدمة ديسكورد لمنح الرتبة.' };
    }
  }

  static async removeRoleFromMember(discordUserId: string, roleId: string): Promise<DiscordRoleResult> {
    if (!this.isConfigured()) {
      return { success: false, message: 'خدمة ديسكورد غير مهيأة حاليًا.' };
    }

    try {
      const response = await this.fetchWithTimeout(
        `https://discord.com/api/v10/guilds/${this.guildId}/members/${discordUserId}/roles/${roleId}`,
        { method: 'DELETE', headers: { Authorization: `Bot ${this.botToken}` } },
      );
      if (response.ok || response.status === 204) return { success: true, message: `تمت إزالة رتبة الديسكورد (${roleId}) بنجاح.` };
      return { success: false, message: 'تعذر إزالة رتبة ديسكورد.' };
    } catch (error) {
      console.error('[Discord API] Role removal error:', error);
      return { success: false, message: 'تعذر الاتصال بخدمة ديسكورد لإزالة الرتبة.' };
    }
  }

  /** Returns only entitlement roles. It never includes staff or administrative roles. */
  static getEntitlementRoleIds(activeProductNames: string[]): string[] {
    const roleIds = new Set<string>([DISCORD_ROLES.CUSTOMER]);

    for (const productName of activeProductNames) {
      const lowerName = productName.toLocaleLowerCase();
      if (lowerName.includes('vip')) {
        roleIds.add(DISCORD_ROLES.VIP);
        continue;
      }
      if (lowerName.includes('فورت') || lowerName.includes('fortnite') || lowerName.includes('bypass') || lowerName.includes('unban')) {
        roleIds.add(DISCORD_ROLES.FORTNITE);
      }
      if (lowerName.includes('سبوفر') || lowerName.includes('spoofer') || lowerName.includes('تعن') || lowerName.includes('ta3n')) {
        roleIds.add(DISCORD_ROLES.PERM);
      }
    }

    return [...roleIds];
  }

  /** Synchronizes Customer plus every role earned from the supplied active products. */
  static async syncEntitledRoles(discordUserId: string, activeProductNames: string[]): Promise<DiscordRoleSyncResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        grantedRoleIds: [],
        failedRoleIds: [],
        message: 'خدمة رتب ديسكورد غير مهيأة حاليًا.',
      };
    }

    const roleIds = this.getEntitlementRoleIds(activeProductNames);
    const settled = await Promise.all(
      roleIds.map(async (roleId) => ({ roleId, result: await this.addRoleToMember(discordUserId, roleId) })),
    );
    const grantedRoleIds = settled.filter(({ result }) => result.success).map(({ roleId }) => roleId);
    const failedRoleIds = settled.filter(({ result }) => !result.success).map(({ roleId }) => roleId);

    return {
      success: failedRoleIds.length === 0,
      grantedRoleIds,
      failedRoleIds,
      message: failedRoleIds.length === 0
        ? 'تمت مزامنة رتبة Customer ورتب المنتجات المستحقة بنجاح.'
        : 'تعذر منح بعض الرتب. تأكد من أن العميل موجود في خادم ديسكورد ومن أن رتبة البوت أعلى من الرتب المطلوبة.',
    };
  }

  static async restoreEntitledRoles(discordUserId: string, activeProductNames: string[]): Promise<DiscordRoleRestoreResult> {
    const result = await this.syncEntitledRoles(discordUserId, activeProductNames);
    return {
      success: result.success,
      restoredRoleIds: result.grantedRoleIds,
      failedRoleIds: result.failedRoleIds,
      message: result.success
        ? 'تمت استعادة رتب الاستحقاق المرتبطة بالتراخيص المفعلة.'
        : result.message,
    };
  }

  /** Called immediately after a valid key activation or an administrator product grant. */
  static async syncRolesOnProductActivation(discordUserId: string, productName: string): Promise<DiscordRoleSyncResult> {
    return this.syncEntitledRoles(discordUserId, [productName]);
  }
}
