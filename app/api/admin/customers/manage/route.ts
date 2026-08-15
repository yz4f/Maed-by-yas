import { NextResponse } from 'next/server';
import { StoreDB } from '@/lib/store-db';
import { DiscordBotService } from '@/lib/discord';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    if (!requestHasTrustedOrigin(req)) {
      return NextResponse.json({ success: false, message: 'تم رفض مصدر الطلب غير الموثوق.' }, { status: 403 });
    }

    const admin = await getSessionActor();
    if (!admin) return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });
    if (!await isAuthorizedAdmin()) {
      return NextResponse.json({ success: false, message: 'غير مصرح لك بتنفيذ عمليات إدارة العملاء.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, userId, productId, status, warningMessage, banReason, banType, banExpiresAt } = body;
    const allowedActions = new Set(['remove_product', 'add_product', 'update_status', 'warn_user', 'ban_user', 'unban_user']);
    if (!allowedActions.has(action) || typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json({ success: false, message: 'بيانات العملية غير صالحة.' }, { status: 400 });
    }
    if (['remove_product', 'add_product', 'update_status'].includes(action) && (typeof productId !== 'string' || !productId.trim())) {
      return NextResponse.json({ success: false, message: 'معرف المنتج مطلوب.' }, { status: 400 });
    }
    if (action === 'ban_user' && banType === 'temporary' && (!banExpiresAt || Number.isNaN(new Date(banExpiresAt).getTime()) || new Date(banExpiresAt) <= new Date())) {
      return NextResponse.json({ success: false, message: 'تاريخ انتهاء الحظر المؤقت غير صالح.' }, { status: 400 });
    }

    const adminName = admin.name;
    const adminId = admin.discordId;
    const ip = getClientIp(req);
    const userDetails = await StoreDB.getUserDetails(userId);
    if (!userDetails) {
      return NextResponse.json({ success: false, message: 'العميل غير موجود في النظام' }, { status: 404 });
    }
    const userObj = userDetails.user;

    // 1. REMOVE PRODUCT
    if (action === 'remove_product') {
      await StoreDB.removeProductFromUser(userId, productId);
      const prod = await StoreDB.getProductById(productId);
      const productName = prod ? prod.name : productId;
      
      if (userObj?.discordId) {
        if (prod?.name.toLowerCase().includes('fortnite')) {
          await DiscordBotService.removeRoleFromMember(userObj.discordId, '1483330317040484364');
        }
      }
      
      await StoreDB.addLog(
        'Product Revoked',
        `قام المشرف ${adminName || 'Admin'} بسحب منتج (${productName}) من العميل ${userObj.name}`,
        adminId || 'admin-system',
        adminName || 'Admin',
        ip,
        {
          eventType: 'product_revoked', actorDiscordId: admin.discordId, actorName: adminName,
          targetUserId: userId, targetDiscordId: userObj.discordId || null, productId,
          metadata: { action, reason: 'admin_remove_product' },
        }
      );
      
      return NextResponse.json({ success: true, message: 'تم سحب المنتج وتحديث رتب الديسكورد.' });
    }

    // 2. ADD PRODUCT
    if (action === 'add_product') {
      await StoreDB.addProductToUser(userId, productId);
      const prod = await StoreDB.getProductById(productId);
      const productName = prod ? prod.name : productId;

      await StoreDB.addLog(
        'Product Granted',
        `قام المشرف ${adminName || 'Admin'} بمنح منتج (${productName}) للعميل ${userObj.name} مباشرة`,
        adminId || 'admin-system',
        adminName || 'Admin',
        ip,
        {
          eventType: 'product_granted', actorDiscordId: admin.discordId, actorName: adminName,
          targetUserId: userId, targetDiscordId: userObj.discordId || null, productId,
          metadata: { action, source: 'admin_grant' },
        }
      );

      return NextResponse.json({ success: true, message: 'تم منح المنتج للعميل بنجاح.' });
    }

    // 3. UPDATE PRODUCT STATUS
    if (action === 'update_status') {
      await StoreDB.updateUserProductStatus(userId, productId, status);
      const prod = await StoreDB.getProductById(productId);
      const productName = prod ? prod.name : productId;

      await StoreDB.addLog(
        'Product Status Updated',
        `قام المشرف ${adminName || 'Admin'} بتعديل حالة منتج (${productName}) للعميل ${userObj.name} إلى: ${status}`,
        adminId || 'admin-system',
        adminName || 'Admin',
        ip,
        {
          eventType: 'product_status_changed', actorDiscordId: admin.discordId, actorName: adminName,
          targetUserId: userId, targetDiscordId: userObj.discordId || null, productId,
          metadata: { action, status },
        }
      );

      return NextResponse.json({ success: true, message: 'تم تحديث حالة المنتج.' });
    }

    // 4. WARN USER
    if (action === 'warn_user') {
      const currentWarningCount = userObj.warningCount || 0;
      await StoreDB.updateUser(userId, {
        warningMessage: warningMessage || 'تم توجيه تحذير رسمي لحسابك',
        warningCount: currentWarningCount + 1
      });

      await StoreDB.addLog(
        'User Warned',
        `قام المشرف ${adminName || 'Admin'} بتحذير العميل ${userObj.name}. السبب: ${warningMessage}`,
        adminId || 'admin-system',
        adminName || 'Admin',
        ip,
        {
          eventType: 'user_warned', actorDiscordId: admin.discordId, actorName: adminName,
          targetUserId: userId, targetDiscordId: userObj.discordId || null,
          metadata: { action, warningMessage: warningMessage || null },
        }
      );

      return NextResponse.json({ success: true, message: 'تم إرسال التحذير وتوجيهه للعميل بنجاح.' });
    }

    // 5. BAN USER
    if (action === 'ban_user') {
      await StoreDB.updateUser(userId, {
        isBanned: true,
        banReason: banReason || 'مخالفة شروط الاستخدام للموقع',
        banType: banType || 'permanent',
        banExpiresAt: banType === 'temporary' ? banExpiresAt : null
      });

      const banDisplay = banType === 'temporary' ? `مؤقت لغاية ${new Date(banExpiresAt).toLocaleDateString('ar-SA')}` : 'دائم';

      await StoreDB.addLog(
        'User Banned',
        `قام المشرف ${adminName || 'Admin'} بحظر العميل ${userObj.name} (${banDisplay}). السبب: ${banReason}`,
        adminId || 'admin-system',
        adminName || 'Admin',
        ip,
        {
          eventType: 'user_banned', actorDiscordId: admin.discordId, actorName: adminName,
          targetUserId: userId, targetDiscordId: userObj.discordId || null,
          metadata: { action, banType: banType || 'permanent', banExpiresAt: banType === 'temporary' ? banExpiresAt : null },
        }
      );

      return NextResponse.json({ success: true, message: 'تم حظر العميل بنجاح.' });
    }

    // 6. UNBAN USER
    if (action === 'unban_user') {
      await StoreDB.updateUser(userId, {
        isBanned: false,
        banReason: null,
        banType: null,
        banExpiresAt: null
      });

      await StoreDB.addLog(
        'User Unbanned',
        `قام المشرف ${adminName || 'Admin'} بفك حظر العميل ${userObj.name}`,
        adminId || 'admin-system',
        adminName || 'Admin',
        ip,
        {
          eventType: 'user_unbanned', actorDiscordId: admin.discordId, actorName: adminName,
          targetUserId: userId, targetDiscordId: userObj.discordId || null,
          metadata: { action },
        }
      );

      return NextResponse.json({ success: true, message: 'تم إلغاء حظر العميل بنجاح.' });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    console.error("Manage customers API failed:", err);
    return NextResponse.json({ success: false, message: 'تعذر تنفيذ العملية. حاول مرة أخرى.' }, { status: 500 });
  }
}
