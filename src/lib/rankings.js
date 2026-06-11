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

export async function getKillsRanking(limit = 50) {
  const playerAggregates = await prisma.playerStats.groupBy({
    by: ['steamid64'],
    _sum: {
      kills: true,
      deaths: true,
      assists: true,
    },
    _count: {
      steamid64: true,
    },
  });

  const sortedPlayers = playerAggregates
    .sort((a, b) => (b._sum.kills || 0) - (a._sum.kills || 0))
    .slice(0, limit);

  const playerNames = await getPlayerNames(sortedPlayers.map(p => p.steamid64));

  return sortedPlayers.map((p, index) => {
    const kills = p._sum.kills ?? 0;
    const deaths = p._sum.deaths ?? 0;
    const maps = p._count.steamid64;
    const kdr = deaths > 0 ? kills / deaths : kills;
    return {
      rank: index + 1,
      steamid64: p.steamid64.toString(),
      name: playerNames.get(p.steamid64.toString()) || `Player ${p.steamid64}`,
      value: kills.toString(),
      kills,
      deaths,
      diff: kills - deaths,
      kdr: kdr.toFixed(2),
      maps,
    };
  });
}


export async function getHeadshotRankings(limit = 50) {
  const result = await prisma.playerStats.groupBy({
    by: ['steamid64'],
    _sum: {
      kills: true,
      head_shot_kills: true,
    },
    having: {
      kills: {
        _sum: {
          gt: 50, // Consider only players with a minimum number of total kills
        }
      },
    },
    orderBy: {
      _sum: {
        head_shot_kills: 'desc',
      },
    },
  });

  const rankings = result.map(r => ({
    steamid64: r.steamid64,
    hs_percentage: r._sum.kills > 0 ? (r._sum.head_shot_kills / r._sum.kills) * 100 : 0,
    total_kills: r._sum.kills,
  })).sort((a, b) => b.hs_percentage - a.hs_percentage).slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || `Player ${r.steamid64}`,
    value: `${r.hs_percentage.toFixed(2)}%`,
  }));
}

export async function getClutchRankings(limit = 50) {
  const result = await prisma.playerStats.groupBy({
    by: ['steamid64'],
    _sum: {
      v1_wins: true,
      v2_wins: true,
    },
    orderBy: {
      _sum: {
        v1_wins: 'desc',
      },
    },
    take: limit,
  });

  const rankings = result.map(r => ({
    steamid64: r.steamid64,
    clutches_won: (r._sum.v1_wins || 0) + (r._sum.v2_wins || 0),
  })).sort((a, b) => b.clutches_won - a.clutches_won);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || `Player ${r.steamid64}`,
    value: r.clutches_won.toString(),
  }));
}

export async function getMultiKillRankings(limit = 50) {
  const result = await prisma.playerStats.groupBy({
    by: ['steamid64'],
    _sum: {
      enemy3ks: true,
      enemy4ks: true,
      enemy5ks: true,
    },
  });

  const rankings = result.map(r => ({
    steamid64: r.steamid64,
    total: (r._sum.enemy3ks || 0) + (r._sum.enemy4ks || 0) + (r._sum.enemy5ks || 0),
    enemy3ks: r._sum.enemy3ks || 0,
    enemy4ks: r._sum.enemy4ks || 0,
    enemy5ks: r._sum.enemy5ks || 0,
  })).sort((a, b) => b.total - a.total).slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || `Player ${r.steamid64}`,
    value: r.total.toString(),
    enemy3ks: r.enemy3ks,
    enemy4ks: r.enemy4ks,
    enemy5ks: r.enemy5ks,
  }));
}

export async function getADRRanking(limit = 50) {
  const playerAggregates = await prisma.playerStats.groupBy({
    by: ['steamid64'],
    _sum: { damage: true },
    _count: { steamid64: true },
    having: { steamid64: { _count: { gt: 5 } } },
  });

  const rankings = playerAggregates
    .map(p => ({
      steamid64: p.steamid64,
      avg_damage: p._count.steamid64 > 0 ? p._sum.damage / p._count.steamid64 : 0,
      maps: p._count.steamid64,
    }))
    .sort((a, b) => b.avg_damage - a.avg_damage)
    .slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || `Player ${r.steamid64}`,
    value: r.avg_damage.toFixed(1),
  }));
}

export async function getAccuracyRanking(limit = 50) {
  const result = await prisma.playerStats.groupBy({
    by: ['steamid64'],
    _sum: {
      shots_fired_total: true,
      shots_on_target_total: true,
    },
    having: { shots_fired_total: { _sum: { gt: 500 } } },
  });

  const rankings = result
    .map(r => ({
      steamid64: r.steamid64,
      accuracy: r._sum.shots_fired_total > 0
        ? (r._sum.shots_on_target_total / r._sum.shots_fired_total) * 100
        : 0,
    }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || `Player ${r.steamid64}`,
    value: `${r.accuracy.toFixed(2)}%`,
  }));
}

export async function getEntryFragRankings(limit = 50) {
  const result = await prisma.playerStats.groupBy({
    by: ['steamid64'],
    _sum: {
      entry_count: true,
      entry_wins: true,
    },
    having: {
      entry_count: {
        _sum: {
          gt: 20, // Minimum total entry attempts
        }
      },
    },
  });

  const rankings = result.map(r => ({
    steamid64: r.steamid64,
    entry_success_rate: r._sum.entry_count > 0 ? (r._sum.entry_wins / r._sum.entry_count) * 100 : 0,
    total_entries: r._sum.entry_count,
  })).sort((a, b) => b.entry_success_rate - a.entry_success_rate).slice(0, limit);

  const playerNames = await getPlayerNames(rankings.map(r => r.steamid64));

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || `Player ${r.steamid64}`,
    value: `${r.entry_success_rate.toFixed(2)}%`,
  }));
}
