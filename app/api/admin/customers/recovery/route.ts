import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { StoreDB } from '@/lib/store-db';
import { DISCORD_ROLES } from '@/lib/roles';
import { DiscordBotService } from '@/lib/discord';
import { hasDiscordRejoinConsent, rejoinDiscordMember } from '@/lib/discord-rejoin';
import type { User } from '@/types';

export const dynamic = 'force-dynamic';

type DiscordMember = {
  user?: { id?: string; username?: string; global_name?: string | null; avatar?: string | null; bot?: boolean };
  nick?: string | null;
  roles?: string[];
};

async function fetchDiscordMember(discordId: string): Promise<DiscordMember | null> {
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
  return response.json() as Promise<DiscordMember>;
}

function verifiedRole(member: DiscordMember): 'Customer' | 'Member' | null {
  if (member.roles?.includes(DISCORD_ROLES.CUSTOMER)) return 'Customer';
  if (member.roles?.includes(DISCORD_ROLES.MEMBER)) return 'Member';
  return null;
}

function historicalRole(user?: User): 'Customer' | 'Member' | null {
  if (!user) return null;
  if (user.botVerifiedRole) return user.botVerifiedRole;
  if (user.discordRoles?.includes(DISCORD_ROLES.CUSTOMER)) return 'Customer';
  if (user.discordRoles?.includes(DISCORD_ROLES.MEMBER)) return 'Member';
  return null;
}

function memberDetails(discordId: string, member: DiscordMember, role: 'Customer' | 'Member') {
  const name = (member.nick || member.user?.global_name || member.user?.username || 'عميل').trim().slice(0, 100);
  return {
    discordId,
    name,
    image: member.user?.avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${member.user.avatar}.png` : null,
    verifiedRole: role,
  };
}

function storedDetails(user: User, role: 'Customer' | 'Member') {
  return { discordId: user.discordId, name: user.name, image: user.image || null, verifiedRole: role };
}

function accountState(user?: User) {
  return !user ? 'missing' as const : user.isArchived ? 'archived' as const : 'active' as const;
}

function invalidId(discordId: string) {
  return !/^\d{16,22}$/.test(discordId);
}

export async function GET(request: Request) {
  if (!await isAuthorizedAdmin()) return NextResponse.json({ success: false, message: 'غير مصرح لك.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  if (params.get('list') === 'history') {
    const offset = Number(params.get('offset') || '0');
    if (!Number.isSafeInteger(offset) || offset < 0) return NextResponse.json({ success: false, message: 'رقم الصفحة غير صالح.' }, { status: 400 });
    try {
      const users = (await StoreDB.getUsers())
        .filter((user) => /^\d{16,22}$/.test(user.discordId) && historicalRole(user))
        .sort((a, b) => a.discordId.localeCompare(b.discordId));
      const page = users.slice(offset, offset + 40);
      const members = [];
      for (let index = 0; index < page.length; index += 5) {
        const chunk = await Promise.all(page.slice(index, index + 5).map(async (user) => {
          const live = await fetchDiscordMember(user.discordId);
          const role = live ? verifiedRole(live) : historicalRole(user);
          if (!role || live?.user?.bot) return null;
          return {
            member: live ? memberDetails(user.discordId, live, role) : storedDetails(user, role),
            state: accountState(user),
            membership: live ? 'in' : 'out',
            verification: live && verifiedRole(live) ? 'live' : 'historical',
            canRejoin: live ? false : await hasDiscordRejoinConsent(user.discordId),
            blocked: Boolean(user.isBanned),
          };
        }));
        members.push(...chunk.filter((item) => item !== null));
      }
      return NextResponse.json({ success: true, members, nextOffset: offset + 40 < users.length ? offset + 40 : null });
    } catch (error) {
      console.error('[Customer Recovery] History list failed:', error);
      return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'تعذر عرض سجلات العملاء.' }, { status: 502 });
    }
  }
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
          state: accountState(user),
          membership: 'in',
          verification: 'live',
          canRejoin: false,
          blocked: Boolean(user?.isBanned),
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
    const user = await StoreDB.getUserByDiscordId(discordId);
    const live = await fetchDiscordMember(discordId);
    const role = live ? verifiedRole(live) : historicalRole(user);
    if (!role || live?.user?.bot) return NextResponse.json({ success: false, message: 'لا توجد رتبة عضو أو عميل موثقة لهذا الحساب في السيرفر أو سجلات البوت.' }, { status: 404 });
    return NextResponse.json({
      success: true,
      member: live ? memberDetails(discordId, live, role) : storedDetails(user!, role),
      state: accountState(user),
      membership: live ? 'in' : 'out',
      verification: live ? 'live' : 'historical',
      canRejoin: live ? false : await hasDiscordRejoinConsent(discordId),
      blocked: Boolean(user?.isBanned),
    });
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
    const existing = await StoreDB.getUserByDiscordId(discordId);
    if (existing?.isBanned) return NextResponse.json({ success: false, message: 'الحساب محظور. لا يمكن للاسترجاع تجاوز قرار الحظر الإداري.' }, { status: 403 });
    let live = await fetchDiscordMember(discordId);
    let role = live ? verifiedRole(live) : historicalRole(existing);
    if (!role || live?.user?.bot) return NextResponse.json({ success: false, message: 'تعذر إثبات رتبة عضو أو عميل لهذا الحساب في البوت أو سجلاته.' }, { status: 404 });
    let rejoined = false;
    if (!live) {
      if (!await hasDiscordRejoinConsent(discordId)) return NextResponse.json({ success: false, message: 'العميل خارج السيرفر ولم يفوض البوت بإعادته. اطلب منه تسجيل الدخول إلى الموقع للموافقة، ثم أعد المحاولة.', consentRequired: true }, { status: 409 });
      const outcome = await rejoinDiscordMember(discordId);
      rejoined = outcome === 'joined';
      const assigned = await DiscordBotService.addRoleToMember(discordId, role === 'Customer' ? DISCORD_ROLES.CUSTOMER : DISCORD_ROLES.MEMBER);
      if (!assigned.success) return NextResponse.json({ success: false, message: `عاد العميل إلى السيرفر، لكن تعذر استرجاع رتبته: ${assigned.message}`, membership: 'in' }, { status: 502 });
      live = await fetchDiscordMember(discordId);
      role = live ? verifiedRole(live) : null;
      if (!role) return NextResponse.json({ success: false, message: 'عاد العميل إلى السيرفر، لكن لم يتم التحقق من رتبته بعد. حدّث القائمة وحاول لاحقًا.', membership: 'in' }, { status: 502 });
    }
    const member = memberDetails(discordId, live!, role);
    if (existing && !existing.isArchived) {
      if (rejoined) {
        await StoreDB.updateUser(existing.id, {
          name: member.name,
          image: member.image,
          botVerifiedAt: new Date().toISOString(),
          botVerifiedRole: role,
          discordRoles: [...new Set([...(existing.discordRoles || []), role === 'Customer' ? DISCORD_ROLES.CUSTOMER : DISCORD_ROLES.MEMBER])],
        });
        try {
          await StoreDB.addLog('Customer Rejoined', `أُعيد ${member.name} إلى سيرفر ديسكورد برتبة ${role}.`, actor.discordId, actor.name, getClientIp(request), {
            eventType: 'customer_rejoined', targetDiscordId: discordId, actorDiscordId: actor.discordId,
            metadata: { rejoined: true },
          });
        } catch (logError) {
          console.error('[Customer Recovery] Rejoin audit logging failed:', logError);
        }
      }
      return NextResponse.json({ success: true, message: rejoined ? 'أُعيد العميل إلى سيرفر ديسكورد مع رتبته.' : 'العميل موجود في السيرفر والموقع.', state: 'active', membership: 'in', verification: 'live' });
    }
    if (existing) {
      await StoreDB.updateUser(existing.id, {
        isArchived: false,
        archivedAt: null,
        name: member.name,
        image: member.image,
        botVerifiedAt: new Date().toISOString(),
        botVerifiedRole: role,
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
        botVerifiedAt: now,
        botVerifiedRole: role,
        createdAt: now,
        isBanned: false,
        warningCount: 0,
        isArchived: false,
      };
      await StoreDB.createUser(user);
    }
    try {
      await StoreDB.addLog('Customer Recovered', `${rejoined ? 'أعيد إلى السيرفر و' : ''}تم استرجاع حساب ${member.name} من رتبة ${member.verifiedRole} في ديسكورد.`, actor.discordId, actor.name, getClientIp(request), {
        eventType: 'customer_recovered', targetDiscordId: discordId, actorDiscordId: actor.discordId,
        metadata: { recovery: existing ? 'archived' : 'missing', rejoined },
      });
    } catch (logError) {
      console.error('[Customer Recovery] Account restored but audit logging failed:', logError);
    }
    return NextResponse.json({ success: true, message: rejoined ? 'أُعيد العميل إلى السيرفر واستُرجع حسابه المحفوظ.' : existing ? 'تمت استعادة حساب العميل المحفوظ.' : 'تم استيراد العميل الموثق من البوت.', state: 'active', membership: 'in', verification: 'live' });
  } catch (error) {
    console.error('[Customer Recovery] Restore failed:', error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'تعذر استرجاع العميل.' }, { status: 502 });
  }
}
