const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Clean up existing data
  await prisma.playerStats.deleteMany();
  await prisma.match.deleteMany();

  // Create fake matches
  const match1 = await prisma.match.create({
    data: {
      match_id: 'match-1',
      server_ip: '127.0.0.1:27015',
      map_name: 'de_dust2',
      team1_name: 'Ninjas in Pyjamas',
      team2_name: 'Fnatic',
      winner: 'Ninjas in Pyjamas',
      team1_score: 16,
      team2_score: 12,
      start_time: new Date(),
      end_time: new Date(),
      demo_name: 'match-1-demo.dem',
    },
  });

  const match2 = await prisma.match.create({
    data: {
      match_id: 'match-2',
      server_ip: '127.0.0.1:27015',
      map_name: 'de_mirage',
      team1_name: 'G2 Esports',
      team2_name: 'FaZe Clan',
      winner: 'FaZe Clan',
      team1_score: 10,
      team2_score: 16,
      start_time: new Date(),
      end_time: new Date(),
      demo_name: 'match-2-demo.dem',
    },
  });

  // Create fake player stats for match 1
  await prisma.playerStats.createMany({
    data: [
      { match_id: 'match-1', player_steam_id: 'STEAM_1:0:123', player_name: 'f0rest', player_team: 'Ninjas in Pyjamas', kills: 22, deaths: 15, assists: 5, adr: 85, hs: 10, mvps: 3, kast: 75, ud: 0, ef: 0, f_ass: 0, cl_1v1: 1, cl_1v2: 0, cl_1v3: 0, cl_1v4: 0, cl_1v5: 0, k2: 5, k3: 2, k4: 1, k5: 0, bp: 0, bd: 0, eb: 0, hp: 0, hd: 0, hr: 0, td: 0, fa: 0, da: 0, rw: 0 },
      { match_id: 'match-1', player_steam_id: 'STEAM_1:0:456', player_name: 'GeT_RiGhT', player_team: 'Ninjas in Pyjamas', kills: 18, deaths: 16, assists: 7, adr: 70, hs: 8, mvps: 2, kast: 70, ud: 0, ef: 0, f_ass: 0, cl_1v1: 0, cl_1v2: 0, cl_1v3: 0, cl_1v4: 0, cl_1v5: 0, k2: 4, k3: 1, k4: 0, k5: 0, bp: 0, bd: 0, eb: 0, hp: 0, hd: 0, hr: 0, td: 0, fa: 0, da: 0, rw: 0 },
      { match_id: 'match-1', player_steam_id: 'STEAM_1:0:789', player_name: 'olofmeister', player_team: 'Fnatic', kills: 25, deaths: 17, assists: 3, adr: 95, hs: 12, mvps: 5, kast: 80, ud: 0, ef: 0, f_ass: 0, cl_1v1: 2, cl_1v2: 1, cl_1v3: 0, cl_1v4: 0, cl_1v5: 0, k2: 6, k3: 3, k4: 1, k5: 0, bp: 0, bd: 0, eb: 0, hp: 0, hd: 0, hr: 0, td: 0, fa: 0, da: 0, rw: 0 },
    ]
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
