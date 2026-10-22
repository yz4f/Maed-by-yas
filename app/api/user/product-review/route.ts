import { NextResponse } from 'next/server';
import { z } from 'zod';
import { StoreDB } from '@/lib/store-db';
import { getClientIp, getSessionActor, requestHasTrustedOrigin } from '@/lib/request-security';
import { limitProductReview } from '@/lib/security-rate-limit';

export const dynamic = 'force-dynamic';

const REVIEW_CHANNEL_ID = '1397221014215331891';
const MAX_REQUEST_CHARS = 750_000;
const reviewSchema = z.object({
  licenseId: z.string().trim().min(1).max(180),
  rating: z.number().int().min(1).max(10),
  comment: z.string().trim().min(3).max(800),
  image: z.string().max(650_000).regex(/^data:image\/jpeg;base64,[a-zA-Z0-9+/]+={0,2}$/).optional(),
}).strict();

function safeDiscordImage(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    const url = new URL(value, process.env.NEXTAUTH_URL || 'https://t3nn.wtf');
    return url.protocol === 'https:' && url.href.length <= 1900 ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function validJpeg(bytes: Buffer): boolean {
  return bytes.length >= 4 && bytes.length <= 500_000
    && bytes[0] === 0xff && bytes[1] === 0xd8
    && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
}

async function readLimitedBody(request: Request): Promise<string> {
  if (Number(request.headers.get('content-length') || 0) > MAX_REQUEST_CHARS) throw new Error('large');
  if (!request.body) throw new Error('empty');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let raw = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_CHARS) throw new Error('large');
      raw += decoder.decode(value, { stream: true });
    }
    return raw + decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export async function POST(request: Request) {
  if (!requestHasTrustedOrigin(request)) {
    return NextResponse.json({ success: false, message: 'مصدر الطلب غير موثوق.' }, { status: 403 });
  }

  const actor = await getSessionActor();
  if (!actor) return NextResponse.json({ success: false, message: 'سجّل الدخول لتقييم منتجك.' }, { status: 401 });

  let raw: string;
  try {
    raw = await readLimitedBody(request);
  } catch {
    return NextResponse.json({ success: false, message: 'حجم الصورة كبير جدًا. اختر صورة أصغر.' }, { status: 413 });
  }

  let parsed: z.infer<typeof reviewSchema>;
  try {
    const result = reviewSchema.safeParse(JSON.parse(raw));
    if (!result.success) throw new Error('invalid');
    parsed = result.data;
  } catch {
    return NextResponse.json({ success: false, message: 'أدخل تقييمًا من 1 إلى 10 وتعليقًا واضحًا.' }, { status: 400 });
  }

  const attachment = parsed.image ? Buffer.from(parsed.image.slice('data:image/jpeg;base64,'.length), 'base64') : null;
  if (attachment && !validJpeg(attachment)) {
    return NextResponse.json({ success: false, message: 'صورة اللعبة غير صالحة أو كبيرة جدًا.' }, { status: 400 });
  }

  try {
    const user = await StoreDB.getUserByDiscordId(actor.discordId);
    const temporaryBanExpired = user?.banType === 'temporary' && user.banExpiresAt
      && Number.isFinite(Date.parse(user.banExpiresAt)) && Date.parse(user.banExpiresAt) <= Date.now();
    if (!user || user.isArchived || (user.isBanned && !temporaryBanExpired)) {
      return NextResponse.json({ success: false, message: 'الحساب غير متاح لإرسال التقييم.' }, { status: 403 });
    }

    const license = (await StoreDB.getUserProducts(user.id)).find((item) => item.id === parsed.licenseId);
    if (!license?.product || license.revokedAt || license.status === 'Revoked') {
      return NextResponse.json({ success: false, message: 'لا يوجد ترخيص لهذا المنتج في حسابك.' }, { status: 403 });
    }

    const limit = await limitProductReview(actor.discordId, getClientIp(request));
    if (!limit.allowed) {
      return NextResponse.json({ success: false, message: 'أرسلت عدة تقييمات مؤخرًا. حاول لاحقًا.' }, {
        status: 429, headers: { 'Retry-After': String(limit.retryAfter) },
      });
    }

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error('Discord bot is not configured');

    const baseUrl = process.env.NEXTAUTH_URL || 'https://t3nn.wtf';
    const embed = {
      color: 0x38bdf8,
      author: {
        name: actor.name.slice(0, 80),
        url: `https://discord.com/users/${actor.discordId}`,
        icon_url: safeDiscordImage(actor.image, 'https://cdn.discordapp.com/embed/avatars/0.png'),
      },
      title: 'تقييم منتج من عميل',
      description: parsed.comment,
      thumbnail: { url: safeDiscordImage(license.product.image, `${baseUrl}/logo.png`) },
      fields: [
        { name: 'المنتج', value: license.product.name.slice(0, 150), inline: true },
        { name: 'التقييم', value: `${parsed.rating}/10  ${'★'.repeat(parsed.rating)}${'☆'.repeat(10 - parsed.rating)}`, inline: true },
        { name: 'العميل', value: `<@${actor.discordId}>`, inline: false },
      ],
      ...(attachment ? { image: { url: 'attachment://game-result.jpg' } } : {}),
      footer: { text: 'تعن • تقييمات المنتجات' },
      timestamp: new Date().toISOString(),
    };

    const payload = { embeds: [embed], allowed_mentions: { parse: [] } };
    let body: BodyInit;
    let headers: HeadersInit = { Authorization: `Bot ${token}` };
    if (attachment) {
      const form = new FormData();
      form.append('payload_json', JSON.stringify(payload));
      form.append('files[0]', new Blob([new Uint8Array(attachment)], { type: 'image/jpeg' }), 'game-result.jpg');
      body = form;
    } else {
      body = JSON.stringify(payload);
      headers = { ...headers, 'Content-Type': 'application/json' };
    }

    const response = await fetch(`https://discord.com/api/v10/channels/${REVIEW_CHANNEL_ID}/messages`, {
      method: 'POST', headers, body, cache: 'no-store', signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.error('Product review delivery failed:', response.status);
      return NextResponse.json({ success: false, message: 'تعذر إرسال التقييم إلى Discord الآن. حاول مجددًا بعد قليل.' }, { status: 502 });
    }
    return NextResponse.json({ success: true, message: 'تم إرسال تقييمك بنجاح.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Product review failed:', error);
    return NextResponse.json({ success: false, message: 'تعذر إرسال التقييم الآن. حاول مجددًا.' }, { status: 500 });
  }
}
