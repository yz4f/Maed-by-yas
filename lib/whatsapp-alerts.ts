import 'server-only';

type AuditEvent = { action: string; actorName?: string | null };

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

export function formatWhatsAppAuditEvent({ action, actorName }: AuditEvent) {
  const title = actionNames[action] || (action.startsWith('AI Reset ') ? 'تحديث طلب رستات' : action.startsWith('AI Conversation ') ? 'نشاط في الدعم' : action.replace(/[\r\n\t]/g, ' ').slice(0, 38));
  const actor = (actorName || 'النظام').replace(/[\r\n\t]/g, ' ').trim().slice(0, 24) || 'النظام';
  // Never include license keys, IP addresses or support message contents in WhatsApp.
  return { title, actor };
}

/** Sends an approved two-variable template to the site owner via Meta Cloud API. */
export async function sendWhatsAppAuditAlert(event: AuditEvent): Promise<boolean> {
  if (process.env.WHATSAPP_ALERTS_ENABLED !== '1') return false;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = normalizeSaudiMobile(process.env.WHATSAPP_ALERT_TO || '');
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'ar';
  const version = process.env.WHATSAPP_GRAPH_API_VERSION;
  if (!token || !phoneNumberId || !recipient || !templateName || !version) throw new Error('إعدادات تنبيهات واتساب غير مكتملة.');
  if (!/^\d+$/.test(phoneNumberId) || !/^v\d+\.\d+$/.test(version) || !/^[a-z0-9_]+$/.test(templateName) || !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(language)) {
    throw new Error('صيغة إعدادات تنبيهات واتساب غير صحيحة.');
  }

  const { title, actor } = formatWhatsAppAuditEvent(event);
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: [{ type: 'body', parameters: [
          { type: 'text', text: title },
          { type: 'text', text: actor },
        ] }],
      },
    }),
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error(`تعذر إرسال تنبيه واتساب (HTTP ${response.status}).`);
  const result = await response.json() as { messages?: { id?: string }[] };
  if (!result.messages?.[0]?.id) throw new Error('لم تؤكد Meta قبول تنبيه واتساب.');
  return true;
}
