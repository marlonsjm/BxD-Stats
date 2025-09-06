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
  // 1. Fetch all player stats with map and match details
  const allPlayerStats = await prisma.playerStats.findMany({
    include: {
      map: {
        include: {
          match: true, // Include match to know the series winner if needed
        },
      },
    },
  });

  // 2. Calculate ADR for each map to find the average
  const adrByMap = {};
  allPlayerStats.forEach(stat => {
    const mapKey = `${stat.matchid}-${stat.mapnumber}`;
    if (!adrByMap[mapKey]) {
      adrByMap[mapKey] = [];
    }
    const roundsPlayed = stat.map.team1_score + stat.map.team2_score;
    const adr = roundsPlayed > 0 ? stat.damage / roundsPlayed : 0;
    adrByMap[mapKey].push(adr);
  });

  const avgAdrByMap = {};
  for (const mapKey in adrByMap) {
    const adrs = adrByMap[mapKey];
    const totalAdr = adrs.reduce((sum, adr) => sum + adr, 0);
    avgAdrByMap[mapKey] = adrs.length > 0 ? totalAdr / adrs.length : 0;
  }

  // 3. Aggregate points per player
  const playerPoints = {};

  allPlayerStats.forEach(stat => {
    if (!playerPoints[stat.steamid64]) {
      playerPoints[stat.steamid64] = {
        steamid64: stat.steamid64,
        name: stat.name,
        totalPoints: 0,
      };
    }

    const mapKey = `${stat.matchid}-${stat.mapnumber}`;
    const avgAdr = avgAdrByMap[mapKey] || 0;
    const roundsPlayed = stat.map.team1_score + stat.map.team2_score;
    const adr = roundsPlayed > 0 ? stat.damage / roundsPlayed : 0;

    // Determine win/loss
    const playerWon = stat.team === stat.map.winner;
    let basePoints = playerWon ? 20 : -15;

    // Performance modifiers
    const adrModifier = (adr - avgAdr) * 0.1;
    const killAssistPoints = (stat.kills * 0.2) + (stat.assists * 0.1);
    const impactPoints = (stat.enemy3ks * 1) + (stat.enemy4ks * 3) + (stat.enemy5ks * 6);
    const clutchPoints = (stat.v1_wins * 1) + (stat.v2_wins * 3);
    const entryPoints = (stat.entry_wins * 0.5) - ((stat.entry_count - stat.entry_wins) * 0.2);

    const matchPoints = basePoints + adrModifier + killAssistPoints + impactPoints + clutchPoints + entryPoints;
    
    playerPoints[stat.steamid64].totalPoints += matchPoints;
  });

  // 4. Sort and format for output
  const rankedPlayers = Object.values(playerPoints)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, limit);

  return rankedPlayers.map((p, index) => ({
    rank: index + 1,
    steamid64: p.steamid64.toString(),
    name: p.name,
    value: p.totalPoints.toFixed(2),
  }));
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
