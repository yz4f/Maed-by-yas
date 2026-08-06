import fetch from 'node-fetch';
import { getSetting } from '../db';

export interface DiscordEmbedLog {
  action: string;
  username?: string;
  email?: string;
  ip?: string;
  timestamp?: string;
  productName?: string;
  keyValue?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  details?: string;
}

const COLORS = {
  success: 0x10b981, // Emerald Green
  warning: 0xf59e0b, // Amber Warning
  error: 0xef4444,   // Red Error
  info: 0x38bdf8,    // Sky Blue Info
};

export async function sendDiscordLog(log: DiscordEmbedLog) {
  try {
    const webhookUrl = getSetting('discord_webhook_url') || process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return; // Webhook not configured
    }

    const color = COLORS[log.status || 'info'];
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    if (log.username || log.email) {
      fields.push({
        name: '👤 المستخدم',
        value: `${log.username || 'غير محدد'}\n\`${log.email || 'N/A'}\``,
        inline: true,
      });
    }

    if (log.ip) {
      fields.push({
        name: '🌐 عنوان IP',
        value: `\`${log.ip}\``,
        inline: true,
      });
    }

    if (log.productName) {
      fields.push({
        name: '📦 المنتج',
        value: `**${log.productName}**`,
        inline: true,
      });
    }

    if (log.keyValue) {
      fields.push({
        name: '🔑 المفتاح',
        value: `\`${log.keyValue}\``,
        inline: true,
      });
    }

    if (log.details) {
      fields.push({
        name: '📝 تفاصيل العملية',
        value: log.details,
        inline: false,
      });
    }

    const embed = {
      title: `⚡ ${log.action}`,
      color: color,
      fields: fields,
      timestamp: log.timestamp || new Date().toISOString(),
      footer: {
        text: 'تـعـن | نظام المراقبة والحماية الآلي',
      },
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Ta3n Security & Logs',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/906/906361.png',
        embeds: [embed],
      }),
    });
  } catch (err) {
    console.error('Failed to send Discord log:', err);
  }
}
