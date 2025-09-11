const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to calculate points
function calculateRp(playerStats, winnerTeam, totalRounds) {
  const hasWon = playerStats.team === winnerTeam;
  let points = hasWon ? 20 : -15;

  // Modulation based on ADR (Damage Per Round)
  const adr = playerStats.damage / totalRounds;
  if (adr > 100) {
    points += 3; // High impact
  } else if (adr > 80) {
    points += 1; // Positive impact
  } else if (adr < 50) {
    points -= 2; // Low impact
  }

  // Modulation based on K/D
  const kdr = playerStats.kills / (playerStats.deaths || 1);
  if (kdr > 1.5) {
    points += 2;
  } else if (kdr < 0.7) {
    points -= 2;
  }

  return Math.round(points);
}

async function main() {
  console.log(`Start seeding ...`);

  // --- Match 1: NiP vs Fnatic on de_dust2 ---
  const match1 = await prisma.match.create({
    data: {
      team1_name: 'Ninjas in Pyjamas',
      team2_name: 'Fnatic',
      series_type: 'bo1',
      winner: 'Ninjas in Pyjamas',
      team1_score: 1,
      team2_score: 0,
      start_time: new Date(),
      end_time: new Date(),
      maps: {
        create: [
          {
            mapnumber: 1,
            mapname: 'de_dust2',
            winner: 'Ninjas in Pyjamas',
            team1_score: 13,
            team2_score: 9,
            start_time: new Date(),
            end_time: new Date(),
          },
        ],
      },
    },
    include: {
      maps: true,
    },
  });

  const map1 = match1.maps[0];
  const totalRoundsMap1 = map1.team1_score + map1.team2_score;

  const playerStatsMap1 = [
    { steamid64: 76561197960265728n, name: 'f0rest', team: 'Ninjas in Pyjamas', kills: 22, deaths: 15, assists: 5, damage: 2500, head_shot_kills: 10 },
    { steamid64: 76561197960265729n, name: 'GeT_RiGhT', team: 'Ninjas in Pyjamas', kills: 18, deaths: 16, assists: 7, damage: 2100, head_shot_kills: 8 },
    { steamid64: 76561197960265730n, name: 'Xizt', team: 'Ninjas in Pyjamas', kills: 19, deaths: 18, assists: 4, damage: 2200, head_shot_kills: 9 },
    { steamid64: 76561197960265731n, name: 'friberg', team: 'Ninjas in Pyjamas', kills: 15, deaths: 19, assists: 6, damage: 1800, head_shot_kills: 5 },
    { steamid64: 76561197960265732n, name: 'Adam', team: 'Ninjas in Pyjamas', kills: 12, deaths: 18, assists: 3, damage: 1500, head_shot_kills: 7 },
    { steamid64: 76561197960265733n, name: 'olofmeister', team: 'Fnatic', kills: 25, deaths: 17, assists: 3, damage: 2800, head_shot_kills: 12 },
    { steamid64: 76561197960265734n, name: 'KRIMZ', team: 'Fnatic', kills: 20, deaths: 18, assists: 5, damage: 2400, head_shot_kills: 11 },
    { steamid64: 76561197960265735n, name: 'JW', team: 'Fnatic', kills: 17, deaths: 20, assists: 2, damage: 2000, head_shot_kills: 6 },
    { steamid64: 76561197960265736n, name: 'flusha', team: 'Fnatic', kills: 14, deaths: 19, assists: 8, damage: 1900, head_shot_kills: 8 },
    { steamid64: 76561197960265737n, name: 'pronax', team: 'Fnatic', kills: 10, deaths: 22, assists: 4, damage: 1300, head_shot_kills: 4 },
  ];

  const playerStatsDataMap1 = playerStatsMap1.map(stats => {
    const rp = calculateRp(stats, map1.winner, totalRoundsMap1);
    return {
      ...stats,
      matchid: map1.matchid,
      mapnumber: map1.mapnumber,
      points: rp,
      // Filling in other required fields from schema with default values
      enemy5ks: 0, enemy4ks: 0, enemy3ks: 0, enemy2ks: 0,
      utility_count: 0, utility_damage: 0, utility_successes: 0, utility_enemies: 0,
      flash_count: 0, flash_successes: 0, health_points_removed_total: 0,
      health_points_dealt_total: stats.damage, shots_fired_total: 0,
      shots_on_target_total: 0, v1_count: 0, v1_wins: 0, v2_count: 0, v2_wins: 0,
      entry_count: 0, entry_wins: 0, equipment_value: 0, money_saved: 0,
      kill_reward: 0, live_time: 0, cash_earned: 0, enemies_flashed: 0,
    };
  });

  await prisma.playerStats.createMany({
    data: playerStatsDataMap1,
  });

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });