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

export async function getOverallRanking(limit = 50) {
  // 1. Aggregate points for all players
  const playerAggregates = await prisma.playerStats.groupBy({
    by: ['steamid64'],
    _sum: {
      points: true,
      kills: true,
      deaths: true,
      assists: true,
    },
  });

  // 2. Sort the aggregated results in JavaScript and take the top players
  const sortedPlayers = playerAggregates
    .sort((a, b) => (b._sum.points || 0) - (a._sum.points || 0))
    .slice(0, limit);

  // 3. Get player names for the top players
  const playerNames = await getPlayerNames(sortedPlayers.map(p => p.steamid64));

  // 4. Combine and format the results
  const rankedPlayers = sortedPlayers.map((p, index) => {
    const kdr = (p._sum.deaths ?? 0) > 0 ? (p._sum.kills ?? 0) / p._sum.deaths : (p._sum.kills ?? 0);
    return {
      rank: index + 1,
      steamid64: p.steamid64.toString(),
      name: playerNames.get(p.steamid64.toString()) || `Player ${p.steamid64}`,
      value: Math.round(p._sum.points ?? 0).toString(),
      kdr: kdr.toFixed(2),
      assists: p._sum.assists ?? 0,
    };
  });

  return rankedPlayers;
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
