import { addLog } from '../db';
import { sendDiscordLog, DiscordEmbedLog } from './discord-webhook';

export interface LogParams {
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  productName?: string;
  keyValue?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  sendToDiscord?: boolean;
}

export async function logSystemAction(params: LogParams) {
  try {
    // 1. Save to local JSON store
    addLog({
      user_id: params.userId,
      user_email: params.userEmail,
      action: params.action,
      details: params.details,
      ip: params.ip,
      user_agent: params.userAgent,
    });

    // 2. Send to Discord Webhook if enabled (default true for important events)
    if (params.sendToDiscord !== false) {
      const embedLog: DiscordEmbedLog = {
        action: params.action,
        username: params.userName,
        email: params.userEmail,
        ip: params.ip,
        productName: params.productName,
        keyValue: params.keyValue,
        status: params.status || 'info',
        details: params.details,
        timestamp: new Date().toISOString(),
      };
      // Don't await discord log to prevent blocking API response
      sendDiscordLog(embedLog).catch(err => console.error('Discord log err:', err));
    }
  } catch (err) {
    console.error('System logging failed:', err);
  }
}
