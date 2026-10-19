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

async function sendViaInfobip(event: AuditEvent, recipient: string, templateName: string, language: string): Promise<boolean> {
  const baseUrl = process.env.INFOBIP_BASE_URL || '';
  const apiKey = process.env.INFOBIP_API_KEY;
  const sender = normalizeSaudiMobile(process.env.INFOBIP_WHATSAPP_SENDER || '');
  if (!apiKey || !sender || !baseUrl) throw new Error('إعدادات واتساب Infobip غير مكتملة.');
  // Keep the destination on Infobip's own API domain; the base URL is configurable per account.
  if (!/^[a-z0-9-]+\.api\.infobip\.com$/i.test(baseUrl)) throw new Error('عنوان Infobip غير صالح.');

  const { title, actor } = formatWhatsAppAuditEvent(event);
  const response = await fetch(`https://${baseUrl}/whatsapp/1/message/template`, {
    method: 'POST',
    headers: { Authorization: `App ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ messages: [{
      from: sender,
      to: recipient,
      content: {
        templateName,
        templateData: { body: { placeholders: [title, actor] } },
        language,
      },
    }] }),
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error(`تعذر إرسال تنبيه Infobip (HTTP ${response.status}).`);
  const result = await response.json() as { messageId?: string; messages?: { messageId?: string; status?: { groupName?: string } }[]; status?: { groupName?: string } };
  const message = result.messages?.[0] || result;
  if (!message.messageId || message.status?.groupName === 'REJECTED') throw new Error('لم يؤكد Infobip قبول تنبيه واتساب.');
  return true;
}

async function sendViaMeta(event: AuditEvent, recipient: string, templateName: string, language: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_GRAPH_API_VERSION;
  if (!token || !phoneNumberId || !version) throw new Error('إعدادات واتساب Meta غير مكتملة.');
  if (!/^\d+$/.test(phoneNumberId) || !/^v\d+\.\d+$/.test(version)) throw new Error('صيغة إعدادات واتساب Meta غير صحيحة.');

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

/** Sends an approved two-variable template through the configured WhatsApp provider. */
export async function sendWhatsAppAuditAlert(event: AuditEvent): Promise<boolean> {
  if (process.env.WHATSAPP_ALERTS_ENABLED !== '1') return false;
  const recipient = normalizeSaudiMobile(process.env.WHATSAPP_ALERT_TO || '');
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || '';
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'ar';
  if (!recipient || !/^[a-z0-9_]+$/.test(templateName) || !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(language)) {
    throw new Error('إعدادات تنبيهات واتساب غير مكتملة أو غير صحيحة.');
  }
  const provider = process.env.WHATSAPP_PROVIDER || 'meta';
  if (provider === 'infobip') return sendViaInfobip(event, recipient, templateName, language);
  if (provider === 'meta') return sendViaMeta(event, recipient, templateName, language);
  throw new Error('مزوّد واتساب غير مدعوم.');
}
