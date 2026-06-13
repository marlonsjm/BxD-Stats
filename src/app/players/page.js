import { Breadcrumbs } from "@/components/Breadcrumbs";
import prisma from '@/lib/prisma';
import { PlayersTable } from "@/components/PlayersTable";
import { calculateRating } from "@/lib/rating";
import { getPlayerAvatars } from "@/lib/steam";

export const revalidate = 300;

export const metadata = {
  title: "Ranking de Jogadores",
  description: "Estatísticas agregadas de todos os jogadores do servidor BxD.",
};

async function getPlayerRankings() {
  const [allStats, allMaps] = await Promise.all([
    prisma.playerStats.findMany(),
    prisma.map.findMany({
      select: { matchid: true, mapnumber: true, team1_score: true, team2_score: true },
    }),
  ]);

  const mapLookup = {};
  allMaps.forEach(m => {
    mapLookup[`${m.matchid}-${m.mapnumber}`] = m;
  });

  const aggregatedPlayers = {};

  allStats.forEach(stat => {
    const mapData = mapLookup[`${stat.matchid}-${stat.mapnumber}`];
    const roundsInMap = mapData ? mapData.team1_score + mapData.team2_score : 0;

    if (!aggregatedPlayers[stat.steamid64]) {
      aggregatedPlayers[stat.steamid64] = {
        steamid64: stat.steamid64.toString(),
        name: stat.name,
        kills: stat.kills,
        deaths: stat.deaths,
        assists: stat.assists,
        head_shot_kills: stat.head_shot_kills,
        damage: stat.damage,
        totalRounds: roundsInMap,
        mapsPlayed: 1,
      };
    } else {
      const player = aggregatedPlayers[stat.steamid64];
      player.kills += stat.kills;
      player.deaths += stat.deaths;
      player.assists += stat.assists;
      player.head_shot_kills += stat.head_shot_kills;
      player.damage += stat.damage;
      player.totalRounds += roundsInMap;
      player.mapsPlayed += 1;
    }
  });

  const players = Object.values(aggregatedPlayers).map(p => ({
    steamid64: p.steamid64,
    name: p.name,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    mapsPlayed: p.mapsPlayed,
    diff: p.kills - p.deaths,
    hs_percent: p.kills > 0 ? (p.head_shot_kills / p.kills) * 100 : 0,
    kdr: p.deaths > 0 ? p.kills / p.deaths : p.kills,
    adr: p.totalRounds > 0 ? p.damage / p.totalRounds : 0,
    rating: calculateRating({ kills: p.kills, deaths: p.deaths, assists: p.assists, damage: p.damage, rounds: p.totalRounds }),
  })).sort((a, b) => b.kills - a.kills);

  const avatars = await getPlayerAvatars(players.map(p => p.steamid64));
  players.forEach(p => {
    p.avatar = avatars.get(p.steamid64)?.medium || null;
  });

  return players;
}

export default async function PlayersPage() {
  const players = await getPlayerRankings();

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { label: "Jogadores" },
  ];

  return (
    <div className="text-white py-4 md:py-8">
      <div className="container mx-auto">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Ranking de Jogadores</h1>
          <p className="text-gray-400 mt-2">Estatísticas agregadas de todos os jogadores. Clique nas colunas para ordenar.</p>
          <p className="text-xs text-gray-500 mt-1">Dados atualizados automaticamente a cada 5 minutos.</p>
        </header>

        {players.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Nenhum jogador registrado ainda. As estatísticas aparecem aqui após a primeira partida.</p>
        ) : (
          <PlayersTable players={players} />
        )}
      </div>
    </div>
  );
}
