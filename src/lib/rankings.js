import prisma from './prisma';

// Helper function to get player names
async function getPlayerNames(steamids) {
  const players = await prisma.playerStats.findMany({
    where: {
      steamid64: { in: steamids },
    },
    select: {
      steamid64: true,
      name: true,
    },
    distinct: ['steamid64'],
  });

  const nameMap = new Map();
  players.forEach(p => nameMap.set(p.steamid64.toString(), p.name));
  return nameMap;
}

/**
 * Busca todos os PlayerStats que possuem um Map correspondente válido e retorna
 * um objeto agregado por steamid64. Isso evita que registros "órfãos" (sem mapa)
 * distorçam os rankings e garante que ADR seja calculado por ROUND jogado.
 */
async function getAggregatedPlayerStats() {
  const maps = await prisma.map.findMany({
    select: {
      matchid: true,
      mapnumber: true,
      team1_score: true,
      team2_score: true,
    },
  });

  const mapKeySet = new Set(maps.map(m => `${m.matchid}-${m.mapnumber}`));
  const roundsByKey = new Map(
    maps.map(m => [`${m.matchid}-${m.mapnumber}`, m.team1_score + m.team2_score])
  );

  // Se não houver mapas, não há o que agregar (evita OR vazio no Prisma)
  if (maps.length === 0) return [];

  const stats = await prisma.playerStats.findMany({
    where: {
      OR: maps.map(m => ({ matchid: m.matchid, mapnumber: m.mapnumber })),
    },
    select: {
      steamid64: true,
      name: true,
      matchid: true,
      mapnumber: true,
      kills: true,
      deaths: true,
      assists: true,
      head_shot_kills: true,
      damage: true,
      enemy3ks: true,
      enemy4ks: true,
      enemy5ks: true,
      v1_wins: true,
      v2_wins: true,
      entry_count: true,
      entry_wins: true,
      shots_fired_total: true,
      shots_on_target_total: true,
    },
  });

  const aggregated = {};

  stats.forEach(s => {
    const mapKey = `${s.matchid}-${s.mapnumber}`;
    if (!mapKeySet.has(mapKey)) return; // segurança extra

    if (!aggregated[s.steamid64]) {
      aggregated[s.steamid64] = {
        steamid64: s.steamid64,
        name: s.name,
        maps: 0,
        rounds: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        head_shot_kills: 0,
        damage: 0,
        enemy3ks: 0,
        enemy4ks: 0,
        enemy5ks: 0,
        v1_wins: 0,
        v2_wins: 0,
        entry_count: 0,
        entry_wins: 0,
        shots_fired_total: 0,
        shots_on_target_total: 0,
      };
    }

    const p = aggregated[s.steamid64];
    p.maps += 1;
    p.rounds += roundsByKey.get(mapKey) || 0;
    p.kills += s.kills || 0;
    p.deaths += s.deaths || 0;
    p.assists += s.assists || 0;
    p.head_shot_kills += s.head_shot_kills || 0;
    p.damage += s.damage || 0;
    p.enemy3ks += s.enemy3ks || 0;
    p.enemy4ks += s.enemy4ks || 0;
    p.enemy5ks += s.enemy5ks || 0;
    p.v1_wins += s.v1_wins || 0;
    p.v2_wins += s.v2_wins || 0;
    p.entry_count += s.entry_count || 0;
    p.entry_wins += s.entry_wins || 0;
    p.shots_fired_total += s.shots_fired_total || 0;
    p.shots_on_target_total += s.shots_on_target_total || 0;
  });

  return Object.values(aggregated);
}

export async function getKillsRanking(limit = 50) {
  const aggregates = await getAggregatedPlayerStats();

  const sortedPlayers = aggregates
    .sort((a, b) => b.kills - a.kills)
    .slice(0, limit);

  const playerNames = await getPlayerNames(sortedPlayers.map(p => p.steamid64));

  return sortedPlayers.map((p, index) => {
    const kdr = p.deaths > 0 ? p.kills / p.deaths : p.kills;
    return {
      rank: index + 1,
      steamid64: p.steamid64.toString(),
      name: playerNames.get(p.steamid64.toString()) || p.name || `Player ${p.steamid64}`,
      value: p.kills.toString(),
      kills: p.kills,
      deaths: p.deaths,
      diff: p.kills - p.deaths,
      kdr: kdr.toFixed(2),
      maps: p.maps,
    };
  });
}

export async function getHeadshotRankings(limit = 50) {
  const aggregates = await getAggregatedPlayerStats();

  const rankings = aggregates
    .filter(p => p.kills > 50) // mínimo de 50 abates
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      hs_percentage: p.kills > 0 ? (p.head_shot_kills / p.kills) * 100 : 0,
      total_kills: p.kills,
    }))
    .sort((a, b) => b.hs_percentage - a.hs_percentage)
    .slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: `${r.hs_percentage.toFixed(1)}%`,
  }));
}

export async function getClutchRankings(limit = 50) {
  const aggregates = await getAggregatedPlayerStats();

  const rankings = aggregates
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      clutches_won: p.v1_wins + p.v2_wins,
    }))
    .sort((a, b) => b.clutches_won - a.clutches_won)
    .slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: r.clutches_won.toString(),
  }));
}

export async function getMultiKillRankings(limit = 50) {
  const aggregates = await getAggregatedPlayerStats();

  const rankings = aggregates
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      total: p.enemy3ks + p.enemy4ks + p.enemy5ks,
      enemy3ks: p.enemy3ks,
      enemy4ks: p.enemy4ks,
      enemy5ks: p.enemy5ks,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: r.total.toString(),
    enemy3ks: r.enemy3ks,
    enemy4ks: r.enemy4ks,
    enemy5ks: r.enemy5ks,
  }));
}

export async function getADRRanking(limit = 50) {
  const aggregates = await getAggregatedPlayerStats();

  const rankings = aggregates
    .filter(p => p.maps > 5) // mínimo de 5 mapas
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      // ADR = Average Damage per Round (não por mapa)
      adr: p.rounds > 0 ? p.damage / p.rounds : 0,
      maps: p.maps,
      rounds: p.rounds,
    }))
    .sort((a, b) => b.adr - a.adr)
    .slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: r.adr.toFixed(1),
  }));
}

export async function getAccuracyRanking(limit = 50) {
  const aggregates = await getAggregatedPlayerStats();

  const rankings = aggregates
    .filter(p => p.shots_fired_total > 500) // mínimo de 500 tiros
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      accuracy: p.shots_fired_total > 0
        ? (p.shots_on_target_total / p.shots_fired_total) * 100
        : 0,
    }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: `${r.accuracy.toFixed(1)}%`,
  }));
}

export async function getEntryFragRankings(limit = 50) {
  const aggregates = await getAggregatedPlayerStats();

  const rankings = aggregates
    .filter(p => p.entry_count > 20) // mínimo de 20 tentativas de entry
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      entry_success_rate: p.entry_count > 0 ? (p.entry_wins / p.entry_count) * 100 : 0,
      total_entries: p.entry_count,
    }))
    .sort((a, b) => b.entry_success_rate - a.entry_success_rate)
    .slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: `${r.entry_success_rate.toFixed(1)}%`,
  }));
}
