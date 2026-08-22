import WebSocket, { RawData } from 'ws';

const guildId = process.env.DISCORD_GUILD_ID || '1396959491786018826';
const websiteUrl = (process.env.NEXTAUTH_URL || 'https://t3nn.wtf').replace(/\/$/, '');

type GatewayPacket = { op: number; d: any; s?: number | null; t?: string | null };

let socket: WebSocket | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let sequence: number | null = null;
let started = false;

function clearTimers() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  heartbeatTimer = null;
  reconnectTimer = null;
}

function gatewayPayload(op: number, d: unknown) {
  return JSON.stringify({ op, d });
}

function sendGateway(op: number, d: unknown) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(gatewayPayload(op, d));
}

async function discordApi(path: string, token: string, init: RequestInit = {}) {
  return fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

function commands() {
  return [
    { name: 'مساعد', description: 'فتح مساعد تعن ومركز المساعدة', type: 1 },
    { name: 'موقعي', description: 'فتح منصة تعن ومنتجاتك', type: 1 },
  ];
}

async function registerCommands(applicationId: string, token: string) {
  const response = await discordApi(`/applications/${applicationId}/guilds/${guildId}/commands`, token, {
    method: 'PUT',
    body: JSON.stringify(commands()),
  });
  if (!response.ok) throw new Error(`Discord commands HTTP ${response.status}: ${await response.text()}`);
  console.info(`[Discord Bot] Commands registered in guild ${guildId}.`);
}

function assistantEmbed() {
  return {
    color: 0x22d3ee,
    author: { name: 'مساعد تعن' },
    title: 'مركز مساعدة تعن',
    description: 'ادخل إلى المنصة لفتح مساعد تعن، مراجعة منتجاتك، مشاهدة الشروحات، أو رفع طلب Reset بشكل منظم.',
    fields: [
      { name: 'مساعد تعن', value: 'يراجع أسئلتك وصور الأخطاء المتعلقة بالمنتجات داخل المنصة.', inline: false },
      { name: 'المنصة', value: `[فتح t3nn.wtf](${websiteUrl})`, inline: false },
    ],
    footer: { text: 'تعن • دعم منظم وآمن' },
  };
}

async function answerInteraction(interaction: any, token: string) {
  if (interaction.type !== 2) return;
  const commandName = interaction.data?.name;
  const data = commandName === 'موقعي'
    ? { content: `منصة تعن: ${websiteUrl}`, flags: 64 }
    : commandName === 'مساعد'
      ? { embeds: [assistantEmbed()], flags: 64 }
      : null;
  if (!data) return;

  const response = await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 4, data }),
  });
  if (!response.ok) console.error(`[Discord Bot] Unable to answer command: ${response.status} ${await response.text()}`);
}

function identify(token: string) {
  sendGateway(2, {
    token,
    intents: 1,
    properties: { os: 'linux', browser: 't3nn.wtf', device: 't3nn.wtf' },
  });
}

function scheduleReconnect(token: string) {
  if (!started || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(token);
  }, 5_000);
}

function handleGatewayMessage(data: RawData, token: string) {
  let packet: GatewayPacket;
  try {
    packet = JSON.parse(data.toString()) as GatewayPacket;
  } catch {
    return;
  }
  if (typeof packet.s === 'number') sequence = packet.s;

  if (packet.op === 10) {
    const interval = Number(packet.d?.heartbeat_interval) || 45_000;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    sendGateway(1, sequence);
    heartbeatTimer = setInterval(() => sendGateway(1, sequence), interval);
    identify(token);
    return;
  }
  if (packet.op === 7 || packet.op === 9) {
    socket?.close();
    return;
  }
  if (packet.op !== 0) return;

  if (packet.t === 'READY') {
    const applicationId = packet.d?.application?.id || packet.d?.user?.id;
    const tag = packet.d?.user?.global_username || packet.d?.user?.username || 'Ta3n Bot';
    console.info(`[Discord Bot] Connected as ${tag}.`);
    if (applicationId) void registerCommands(applicationId, token).catch((error) => console.error('[Discord Bot] Unable to register commands:', error));
    return;
  }
  if (packet.t === 'INTERACTION_CREATE') void answerInteraction(packet.d, token).catch((error) => console.error('[Discord Bot] Interaction handling failed:', error));
}

function connect(token: string) {
  clearTimers();
  socket?.removeAllListeners();
  socket?.close();
  sequence = null;
  socket = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json', { perMessageDeflate: false });
  socket.on('message', (data) => handleGatewayMessage(data, token));
  socket.on('error', (error) => console.error('[Discord Bot] Gateway error:', error));
  socket.on('close', (code) => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    console.warn(`[Discord Bot] Gateway closed (${code}). Reconnecting…`);
    scheduleReconnect(token);
  });
}

/** Starts one lightweight Discord gateway client per Next.js service instance. */
export async function startDiscordBot() {
  if (started) return;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.info('[Discord Bot] DISCORD_BOT_TOKEN is not set; gateway bot is disabled.');
    return;
  }
  started = true;
  connect(token);
}
