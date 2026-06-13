// Busca avatares de jogadores na Steam Web API (GetPlayerSummaries).
// Requer a env var STEAM_API_KEY (gratuita em https://steamcommunity.com/dev/apikey).
// Sem a key, ou para perfis sem avatar, o site usa um fallback com a inicial do nick.

const BATCH_SIZE = 100; // limite da API por requisição
const REVALIDATE_SECONDS = 86400; // avatares mudam raramente; cache de 24h

export async function getPlayerAvatars(steamids) {
  const key = process.env.STEAM_API_KEY;
  const avatars = new Map();

  if (!key || !steamids || steamids.length === 0) return avatars;

  const uniqueIds = [...new Set(steamids.map(String))];

  for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${key}&steamids=${batch.join(',')}`,
        { next: { revalidate: REVALIDATE_SECONDS } }
      );
      if (!res.ok) continue;

      const data = await res.json();
      (data.response?.players || []).forEach(player => {
        avatars.set(player.steamid, {
          medium: player.avatarmedium || player.avatar || null, // 64px
          full: player.avatarfull || player.avatarmedium || null, // 184px
        });
      });
    } catch (error) {
      console.error('Failed to fetch Steam avatars:', error);
    }
  }

  return avatars;
}
