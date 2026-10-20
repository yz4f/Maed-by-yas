import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { StoreDB } from '@/lib/store-db';
import { DISCORD_ROLES } from '@/lib/roles';
import type { User } from '@/types';

export const dynamic = 'force-dynamic';

type DiscordMember = {
  user?: { id?: string; username?: string; global_name?: string | null; avatar?: string | null; bot?: boolean };
  nick?: string | null;
  roles?: string[];
};

async function findVerifiedMember(discordId: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID || '1396959491786018826';
  if (!token) throw new Error('بوت ديسكورد غير مهيأ على الخادم.');
  const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
    headers: { Authorization: `Bot ${token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`تعذر التحقق من رتبة العميل في ديسكورد (HTTP ${response.status}).`);
  const member = await response.json() as DiscordMember;
  if (member.user?.id !== discordId || member.user.bot || !member.roles?.some((role) => role === DISCORD_ROLES.CUSTOMER || role === DISCORD_ROLES.MEMBER)) return null;
  const name = (member.nick || member.user.global_name || member.user.username || 'عميل').trim().slice(0, 100);
  return {
    discordId,
    name,
    image: member.user.avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${member.user.avatar}.png` : null,
    verifiedRole: member.roles.includes(DISCORD_ROLES.CUSTOMER) ? 'Customer' as const : 'Member' as const,
  };
}

function invalidId(discordId: string) {
  return !/^\d{16,22}$/.test(discordId);
}

export async function GET(request: Request) {
  if (!await isAuthorizedAdmin()) return NextResponse.json({ success: false, message: 'غير مصرح لك.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  if (params.get('list') === '1') {
    const cursor = params.get('cursor') || '';
    if (cursor && invalidId(cursor)) return NextResponse.json({ success: false, message: 'معرّف الصفحة غير صالح.' }, { status: 400 });
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID || '1396959491786018826';
    if (!token) return NextResponse.json({ success: false, message: 'بوت ديسكورد غير مهيأ.' }, { status: 503 });
    try {
      const url = `https://discord.com/api/v10/guilds/${guildId}/members?limit=100${cursor ? `&after=${cursor}` : ''}`;
      const response = await fetch(url, { headers: { Authorization: `Bot ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`تعذر عرض أعضاء البوت (HTTP ${response.status}). قد يحتاج البوت صلاحية Server Members Intent.`);
      const members = await response.json() as DiscordMember[];
      const users = await StoreDB.getUsers();
      const byDiscordId = new Map(users.map((user) => [user.discordId, user]));
      const verified = members.filter((member) => member.user?.id && !member.user.bot && member.roles?.some((role) => role === DISCORD_ROLES.CUSTOMER || role === DISCORD_ROLES.MEMBER)).map((member) => {
        const discordId = member.user!.id!;
        const user = byDiscordId.get(discordId);
        return {
          member: {
            discordId,
            name: (member.nick || member.user!.global_name || member.user!.username || 'عميل').trim().slice(0, 100),
            image: member.user!.avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${member.user!.avatar}.png` : null,
            verifiedRole: member.roles!.includes(DISCORD_ROLES.CUSTOMER) ? 'Customer' : 'Member',
          },
          state: !user ? 'missing' : user.isArchived ? 'archived' : 'active',
        };
      });
      return NextResponse.json({ success: true, members: verified, nextCursor: members.length === 100 ? members[members.length - 1]?.user?.id || null : null });
    } catch (error) {
      console.error('[Customer Recovery] List failed:', error);
      return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'تعذر عرض أعضاء البوت.' }, { status: 502 });
    }
  }
  const discordId = params.get('discordId')?.trim() || '';
  if (invalidId(discordId)) return NextResponse.json({ success: false, message: 'أدخل Discord ID صالحًا.' }, { status: 400 });
  try {
    const member = await findVerifiedMember(discordId);
    if (!member) return NextResponse.json({ success: false, message: 'الحساب غير موجود في الخادم أو لا يملك رتبة عضو أو عميل من البوت.' }, { status: 404 });
    const user = await StoreDB.getUserByDiscordId(discordId);
    return NextResponse.json({ success: true, member, state: !user ? 'missing' : user.isArchived ? 'archived' : 'active' });
  } catch (error) {
    console.error('[Customer Recovery] Lookup failed:', error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'تعذر فحص حساب ديسكورد.' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!requestHasTrustedOrigin(request)) return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  if (!await isAuthorizedAdmin()) return NextResponse.json({ success: false, message: 'غير مصرح لك.' }, { status: 403 });
  const actor = await getSessionActor();
  if (!actor) return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول.' }, { status: 401 });
  let discordId = '';
  try { discordId = String((await request.json()).discordId || '').trim(); } catch { /* Invalid JSON is handled below. */ }
  if (invalidId(discordId)) return NextResponse.json({ success: false, message: 'أدخل Discord ID صالحًا.' }, { status: 400 });
  try {
    const member = await findVerifiedMember(discordId);
    if (!member) return NextResponse.json({ success: false, message: 'تعذر إثبات رتبة عضو أو عميل لهذا الحساب في البوت.' }, { status: 404 });
    const existing = await StoreDB.getUserByDiscordId(discordId);
    if (existing && !existing.isArchived) {
      return NextResponse.json({ success: true, message: 'العميل موجود بالفعل في الموقع.', state: 'active' });
    }
    if (existing) {
      await StoreDB.updateUser(existing.id, {
        isArchived: false,
        archivedAt: null,
        isBanned: false,
        banReason: null,
        banType: null,
        banExpiresAt: null,
        discordRoles: [...new Set([...(existing.discordRoles || []), member.verifiedRole === 'Customer' ? DISCORD_ROLES.CUSTOMER : DISCORD_ROLES.MEMBER])],
      });
    } else {
      const now = new Date().toISOString();
      const user: User = {
        id: `user-discord-${discordId}`,
        discordId,
        name: member.name,
        image: member.image,
        role: member.verifiedRole,
        discordRoles: [member.verifiedRole === 'Customer' ? DISCORD_ROLES.CUSTOMER : DISCORD_ROLES.MEMBER],
        createdAt: now,
        isBanned: false,
        warningCount: 0,
        isArchived: false,
      };
      await StoreDB.createUser(user);
    }
    try {
      await StoreDB.addLog('Customer Recovered', `تم استرجاع حساب ${member.name} من رتبة ${member.verifiedRole} في ديسكورد.`, actor.discordId, actor.name, getClientIp(request), {
        eventType: 'customer_recovered', targetDiscordId: discordId, actorDiscordId: actor.discordId,
        metadata: { recovery: existing ? 'archived' : 'missing' },
      });
    } catch (logError) {
      console.error('[Customer Recovery] Account restored but audit logging failed:', logError);
    }
    return NextResponse.json({ success: true, message: existing ? 'تمت استعادة حساب العميل المحفوظ.' : 'تم استيراد العميل الموثق من البوت.', state: 'active' });
  } catch (error) {
    console.error('[Customer Recovery] Restore failed:', error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'تعذر استرجاع العميل.' }, { status: 502 });
  }
}
