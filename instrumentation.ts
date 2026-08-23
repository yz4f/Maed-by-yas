export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const [{ startDiscordBot }, { startAiConversationMaintenance }] = await Promise.all([
    import('./lib/discord-bot'),
    import('./lib/t3n-ai'),
  ]);
  startAiConversationMaintenance();
  await startDiscordBot();
}
