import 'server-only';

type SmsAuditEvent = { action: string; actorName?: string | null };

const actionNames: Record<string, string> = {
  Login: 'دخول عضو',
  Logout: 'خروج عضو',
  'User Registered': 'تسجيل عضو جديد',
  'Reset Request Created': 'طلب رستات جديد',
  'Key Activation': 'تفعيل مفتاح',
  'Giveaway Activation': 'تفعيل مفتاح سحب',
  'Key Creation': 'إنشاء مفاتيح',
  'Key Inventory Updated': 'تعديل المخزون',
  'Key Inventory Deleted': 'حذف مفاتيح',
  'HWID Reset': 'إعادة ضبط الجهاز',
  'AI Conversation Reopened': 'محادثة دعم جديدة',
  'AI Conversation Claimed': 'استلام محادثة دعم',
  'AI Conversation Closed By Staff': 'إغلاق محادثة دعم',
  'AI Conversation Auto Closed': 'إغلاق محادثة تلقائيًا',
};

export function normalizeSaudiMobile(value: string) {
  const digits = value.replace(/[\s()+-]/g, '');
  if (/^05\d{8}$/.test(digits)) return `966${digits.slice(1)}`;
  if (/^9665\d{8}$/.test(digits)) return digits;
  return null;
}

export function formatSmsAuditMessage({ action, actorName }: SmsAuditEvent) {
  const title = actionNames[action] || (action.startsWith('AI Reset ') ? 'تحديث طلب رستات' : action.startsWith('AI Conversation ') ? 'نشاط في الدعم' : action.replace(/[\r\n\t]/g, ' ').slice(0, 38));
  const actor = (actorName || 'النظام').replace(/[\r\n\t]/g, ' ').trim().slice(0, 24) || 'النظام';
  // Keep SMS short and leave license keys, IPs, and support messages in the protected site logs.
  return `تعن | ${title}\nبواسطة: ${actor}`;
}

/** Sends one short audit alert to the configured Saudi mobile via Taqnyat. */
export async function sendSmsAuditAlert(event: SmsAuditEvent): Promise<boolean> {
  if (process.env.SMS_ALERTS_ENABLED !== '1') return false;
  const token = process.env.TAQNYAT_BEARER_TOKEN;
  const sender = process.env.TAQNYAT_SENDER;
  const recipient = normalizeSaudiMobile(process.env.SMS_ALERT_TO || '');
  if (!token || !sender || !recipient) throw new Error('إعدادات تنبيهات SMS غير مكتملة.');

  const response = await fetch('https://api.taqnyat.sa/v1/messages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipients: [Number(recipient)], body: formatSmsAuditMessage(event), sender }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`تعذر إرسال تنبيه SMS (HTTP ${response.status}).`);
  const result = await response.json() as { statusCode?: number; messageId?: number };
  if (result.statusCode !== 201 || !result.messageId) throw new Error('لم يؤكد مزوّد الرسائل قبول تنبيه SMS.');
  return true;
}
