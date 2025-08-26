import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

async function getMatchDetails(matchId) {
  const match = await prisma.match.findUnique({
    where: { matchid: parseInt(matchId) },
    include: {
      maps: {
        include: {
          player_stats: {
            orderBy: {
              kills: 'desc',
            },
          },
        },
      },
    },
  });
  return match;
}

export default async function MatchPage({ params }) {
  const match = await getMatchDetails(params.match_id);

  if (!match) {
    return (
      <main className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold">Partida não encontrada</h1>
          <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">Voltar para a lista de partidas</Link>
        </div>
      </main>
    );
  }

  // Aggregate player stats across all maps
  const aggregatedPlayers = {};
  match.maps.forEach(map => {
    map.player_stats.forEach(stat => {
      if (!aggregatedPlayers[stat.steamid64]) {
        aggregatedPlayers[stat.steamid64] = {
          steamid64: stat.steamid64,
          name: stat.name,
          team: stat.team,
          kills: 0, deaths: 0, assists: 0,
          head_shot_kills: 0,
        };
      }
      const player = aggregatedPlayers[stat.steamid64];
      player.kills += stat.kills;
      player.deaths += stat.deaths;
      player.assists += stat.assists;
      player.head_shot_kills += stat.head_shot_kills;
    });
  });

  const playersForTable = Object.values(aggregatedPlayers).map(p => ({
    ...p,
    diff: p.kills - p.deaths,
    kdr: p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : 'N/A',
    hs_percent: p.kills > 0 ? ((p.head_shot_kills / p.kills) * 100).toFixed(1) : '0.0',
  }));

  const team1Players = playersForTable.filter(p => p.team === match.team1_name).sort((a, b) => b.kills - a.kills);
  const team2Players = playersForTable.filter(p => p.team === match.team2_name).sort((a, b) => b.kills - a.kills);

  let totalTeam1Rounds = 0;
  let totalTeam2Rounds = 0;
  match.maps.forEach(map => {
    totalTeam1Rounds += map.team1_score;
    totalTeam2Rounds += map.team2_score;
  });

  const renderPlayerRow = (player) => {
    const diffColor = player.diff > 0 ? 'text-green-500' : player.diff < 0 ? 'text-red-500' : 'text-gray-400';
    const diffSign = player.diff > 0 ? '+' : '';

    return (
      <tr key={player.steamid64} className="border-b border-gray-800">
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
      </tr>
    );
  };

  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        <header className="mb-8">
          <Link href="/" className="text-blue-400 hover:underline mb-6 inline-block">← Voltar para todas as partidas</Link>
          <div className="bg-gray-800 p-4 rounded-lg text-center shadow-lg">
            <p className="text-gray-400">
              Partida em {match.maps.length > 0 ? match.maps.map(m => m.mapname).join(', ') : 'Mapa Desconhecido'}
            </p>
            <div className="flex justify-center items-center text-3xl md:text-4xl font-bold my-2">
              <span className={`${match.winner === match.team1_name ? 'text-green-400' : ''}`}>{match.team1_name}</span>
              <span className="mx-4 font-mono">{totalTeam1Rounds} : {totalTeam2Rounds}</span>
              <span className={`${match.winner === match.team2_name ? 'text-green-400' : ''}`}>{match.team2_name}</span>
            </div>
            <p className="text-sm text-gray-400">Vencedor: <span className="font-semibold text-green-400">{match.winner}</span></p>
          </div>
        </header>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700">
                <th scope="col" className="p-3 text-left font-semibold">Jogador</th>
                <th scope="col" className="p-3 text-center font-semibold">K-D</th>
                <th scope="col" className="p-3 text-center font-semibold">+/-</th>
                <th scope="col" className="p-3 text-center font-semibold">A</th>
                <th scope="col" className="p-3 text-center font-semibold">HS%</th>
                <th scope="col" className="p-3 text-center font-semibold">KDR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {/* Team 1 */}
              <tr className="bg-gray-900/30">
                <td colSpan="6" className="p-2 font-bold text-lg">{match.team1_name}</td>
              </tr>
              {team1Players.map(renderPlayerRow)}

              {/* Team 2 */}
              <tr className="bg-gray-900/30">
                <td colSpan="6" className="p-2 font-bold text-lg">{match.team2_name}</td>
              </tr>
              {team2Players.map(renderPlayerRow)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
