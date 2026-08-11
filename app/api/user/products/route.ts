import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdOrDiscordId = searchParams.get('userId') || 'user-demo-customer';
    const discordId = searchParams.get('discordId');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const image = searchParams.get('image');
    
    // Get client IP address
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    let user = await StoreDB.getUserByDiscordId(discordId || userIdOrDiscordId);
    if (!user && (discordId || name)) {
      // Auto-create user
      const newUser = {
        id: userIdOrDiscordId.startsWith('user-') ? userIdOrDiscordId : `user-${Date.now()}`,
        discordId: discordId || userIdOrDiscordId,
        name: name || 'T3N User',
        email: email || null,
        image: image || null,
        role: 'Customer' as const,
        discordRoles: [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        lastIp: ip,
        isBanned: false,
        warningMessage: null,
        warningCount: 0
      };
      await StoreDB.createUser(newUser);
      user = newUser;
      
      await StoreDB.addLog(
        'User Registered',
        `تم تسجيل دخول العميل ${user.name} لأول مرة بنجاح`,
        user.id,
        user.name,
        ip
      );
    } else if (user) {
      // Update last login and IP
      await StoreDB.updateUser(user.id, {
        lastLogin: new Date().toISOString(),
        lastIp: ip,
        name: name || user.name, // update to latest discord name
        image: image || user.image // update to latest avatar
      });
    }

    // Check if banned
    if (user && user.isBanned) {
      // Check if temporary ban has expired
      if (user.banType === 'temporary' && user.banExpiresAt) {
        const expiresAt = new Date(user.banExpiresAt);
        if (new Date() > expiresAt) {
          // Unban user
          await StoreDB.updateUser(user.id, {
            isBanned: false,
            banReason: null,
            banType: null,
            banExpiresAt: null
          });
          user.isBanned = false;
          
          await StoreDB.addLog(
            'User Unbanned Automatically',
            `تم فك حظر العميل ${user.name} تلقائياً لانتهاء مدة الحظر`,
            user.id,
            user.name,
            ip
          );
        }
      }
    }

    const products = await StoreDB.getUserProducts(user ? user.id : userIdOrDiscordId);
    return NextResponse.json({ success: true, products, user });
  } catch (err: any) {
    console.error("User products sync API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
