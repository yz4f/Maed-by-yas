import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { getClientIp, getSessionActor } from '@/lib/request-security';
import { createHash } from 'node:crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const isBackgroundSync = new URL(req.url).searchParams.get('sync') === '1';
    const actor = await getSessionActor();
    if (!actor) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    }

    const ip = getClientIp(req);
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
        lastLogin: createdAt,
        lastIp: ip,
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
    } else if (!isBackgroundSync) {
      await StoreDB.updateUser(user.id, { lastLogin: new Date().toISOString(), lastIp: ip, name: actor.name, image: actor.image });
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
    if (isBackgroundSync && req.headers.get('X-Sync-Revision') === revision) {
      return NextResponse.json({ success: true, unchanged: true, revision }, { headers });
    }
    return NextResponse.json({ success: true, products, user, activity, catalog, isNewUser, revision }, { headers });
  } catch (error) {
    console.error('User products synchronization failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحميل المنتجات الآن. حاول مرة أخرى.' }, { status: 500 });
  }
}
