import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { getClientIp, getSessionActor } from '@/lib/request-security';
import { createHash, createHmac } from 'node:crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const isBackgroundSync = new URL(req.url).searchParams.get('sync') === '1';
    const actor = await getSessionActor();
    if (!actor) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const userAgent = String(req.headers.get('user-agent') || '').slice(0, 512);
    const securityUserAgentHash = userAgent && process.env.NEXTAUTH_SECRET
      ? createHmac('sha256', process.env.NEXTAUTH_SECRET).update(userAgent).digest('hex')
      : undefined;
    let isNewUser = false;
    let user = await StoreDB.getUserByDiscordId(actor.discordId);
    if (!user) {
      const createdAt = new Date().toISOString();
      const newUser = {
        id: `user-${actor.discordId}`,
        discordId: actor.discordId,
        name: actor.name,
        email: actor.email,
        image: actor.image,
        role: actor.role === 'Boss' ? 'Boss' : actor.role === 'Co-Boss' ? 'Co-Boss' : 'Customer',
        discordRoles: [],
        createdAt,
        welcomeVideoRequiredAt: createdAt,
        welcomeVideoCompletedAt: null,
        lastLogin: createdAt,
        lastIp: ip,
        ...(securityUserAgentHash ? { securityUserAgentHash } : {}),
        isBanned: false,
        warningMessage: null,
        warningCount: 0,
      } as any;
      await StoreDB.createUser(newUser);
      user = newUser;
      isNewUser = true;
      await StoreDB.addLog(
        'User Registered',
        `تم تسجيل دخول العميل ${newUser.name} لأول مرة بنجاح`,
        newUser.id,
        newUser.name,
        ip,
        {
          eventType: 'account_registered', actorUserId: newUser.id, actorDiscordId: actor.discordId,
          actorName: newUser.name, targetUserId: newUser.id, targetDiscordId: actor.discordId,
          metadata: { source: 'discord_oauth' },
        }
      );
      if (ip !== 'unknown' && securityUserAgentHash) {
        try {
          const relatedAccounts = (await StoreDB.getUsers()).filter((candidate) =>
            candidate.id !== newUser.id && !candidate.isArchived && candidate.lastIp === ip
            && candidate.securityUserAgentHash === securityUserAgentHash
          );
          if (relatedAccounts.length) {
            await StoreDB.addLog(
              'Security Related Accounts',
              `تطابق عنوان الاتصال والمتصفح مع ${relatedAccounts.length} حساب آخر؛ يلزم مراجعة بشرية.`,
              newUser.id, newUser.name, ip,
              {
                eventType: 'security_related_accounts', actorUserId: newUser.id,
                actorDiscordId: actor.discordId, actorName: newUser.name,
                metadata: { relatedDiscordIds: relatedAccounts.slice(0, 10).map((candidate) => candidate.discordId), signal: 'ip_and_user_agent' },
              }
            );
          }
        } catch (error) {
          console.error('Related-account review failed:', error);
        }
      }
    } else if (!isBackgroundSync) {
      await StoreDB.updateUser(user.id, { lastLogin: new Date().toISOString(), lastIp: ip, ...(securityUserAgentHash ? { securityUserAgentHash } : {}), name: actor.name, image: actor.image });
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'تعذر تهيئة حساب المستخدم.' }, { status: 500 });
    }

    if (user.isBanned && user.banType === 'temporary' && user.banExpiresAt && new Date() > new Date(user.banExpiresAt)) {
      await StoreDB.updateUser(user.id, { isBanned: false, banReason: null, banType: null, banExpiresAt: null });
      user.isBanned = false;
      await StoreDB.addLog(
        'User Unbanned Automatically',
        `تم فك حظر العميل ${user.name} تلقائياً لانتهاء مدة الحظر`,
        user.id,
        user.name,
        ip,
        {
          eventType: 'user_unbanned_automatically', actorUserId: user.id, actorDiscordId: actor.discordId,
          actorName: user.name, targetUserId: user.id, targetDiscordId: actor.discordId,
          metadata: { source: 'temporary_ban_expiry' },
        }
      );
    }

    const catalogPromise = StoreDB.getProducts();
    const [products, activity, catalog] = await Promise.all([
      StoreDB.getUserProducts(user.id, catalogPromise),
      isBackgroundSync ? Promise.resolve(undefined) : StoreDB.getAuditEvents({ userId: user.id, limit: 12 }),
      catalogPromise,
    ]);
    const revision = createHash('sha256').update(JSON.stringify({ products, catalog })).digest('hex');
    const headers = { 'Cache-Control': 'private, no-store' };
    const showWelcomeVideo = Boolean(user.welcomeVideoRequiredAt && !user.welcomeVideoCompletedAt);
    if (isBackgroundSync && req.headers.get('X-Sync-Revision') === revision) {
      return NextResponse.json({ success: true, unchanged: true, revision, showWelcomeVideo, welcomeName: showWelcomeVideo ? user.name : undefined }, { headers });
    }
    return NextResponse.json({ success: true, products, user, activity, catalog, isNewUser, showWelcomeVideo, revision }, { headers });
  } catch (error) {
    console.error('User products synchronization failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحميل المنتجات الآن. حاول مرة أخرى.' }, { status: 500 });
  }
}
