import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

// This function fetches all stats and then aggregates them in JavaScript.
// This approach correctly handles players who may have used multiple names.
async function getPlayerRankings() {
  const allStats = await prisma.playerStats.findMany();

  const aggregatedPlayers = {};

  allStats.forEach(stat => {
    if (!aggregatedPlayers[stat.steamid64]) {
      aggregatedPlayers[stat.steamid64] = {
        steamid64: stat.steamid64,
        names: new Set(),
        kills: 0,
        deaths: 0,
        assists: 0,
        head_shot_kills: 0,
        mapsPlayed: 0,
      };
    }
    const player = aggregatedPlayers[stat.steamid64];
    player.names.add(stat.name);
    player.kills += stat.kills;
    player.deaths += stat.deaths;
    player.assists += stat.assists;
    player.head_shot_kills += stat.head_shot_kills;
    player.mapsPlayed += 1;
  });

  const players = Object.values(aggregatedPlayers).map(p => {
    return {
      steamid64: p.steamid64,
      name: Array.from(p.names)[0], // Use the first name found as the primary
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      mapsPlayed: p.mapsPlayed,
      diff: p.kills - p.deaths,
      kdr: p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : 'N/A',
      hs_percent: p.kills > 0 ? ((p.head_shot_kills / p.kills) * 100).toFixed(1) : '0.0',
    };
  }).sort((a, b) => b.kills - a.kills); // Sort by kills descending

  return players;
}

export default async function PlayersPage() {
  const players = await getPlayerRankings();

  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Ranking de Jogadores</h1>
          <p className="text-gray-400 mt-2">Estatísticas agregadas de todos os jogadores, ordenadas por Kills.</p>
        </header>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700">
                <th scope="col" className="p-3 text-center font-semibold w-16">Rank</th>
                <th scope="col" className="p-3 text-left font-semibold">Jogador</th>
                <th scope="col" className="p-3 text-center font-semibold">K-D</th>
                <th scope="col" className="p-3 text-center font-semibold">+/-</th>
                <th scope="col" className="p-3 text-center font-semibold">A</th>
                <th scope="col" className="p-3 text-center font-semibold">HS%</th>
                <th scope="col" className="p-3 text-center font-semibold">KDR</th>
                <th scope="col" className="p-3 text-center font-semibold">Mapas</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => {
                const diffColor = player.diff > 0 ? 'text-green-500' : player.diff < 0 ? 'text-red-500' : 'text-gray-400';
                const diffSign = player.diff > 0 ? '+' : '';

                return (
                  <tr key={player.steamid64} className="border-b border-gray-800 last:border-b-0">
                    <td className="p-3 text-center font-bold text-gray-400">#{index + 1}</td>
                    <td className="p-3">
                      <Link href={`/player/${player.steamid64}`} className="text-white hover:underline">
                        {player.name}
                      </Link>
                    </td>
                    <td className="p-3 text-center font-mono">{`${player.kills}-${player.deaths}`}</td>
                    <td className={`p-3 text-center font-mono ${diffColor}`}>{`${diffSign}${player.diff}`}</td>
                    <td className="p-3 text-center font-mono">{player.assists}</td>
                    <td className="p-3 text-center font-mono">{player.hs_percent}%</td>
                    <td className="p-3 text-center font-mono">{player.kdr}</td>
                    <td className="p-3 text-center font-mono">{player.mapsPlayed}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}