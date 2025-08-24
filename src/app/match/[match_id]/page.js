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
      <main className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen p-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold">Partida não encontrada</h1>
          <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">Voltar para a lista de partidas</Link>
        </div>
      </main>
    );
  }

  let allPlayersRaw = [];
  match.maps.forEach(map => {
    allPlayersRaw = allPlayersRaw.concat(map.player_stats);
  });

  const aggregatedPlayers = {};

  allPlayersRaw.forEach(stat => {
    if (!aggregatedPlayers[stat.steamid64]) {
      aggregatedPlayers[stat.steamid64] = {
        steamid64: stat.steamid64,
        name: stat.name, // Take the name from the first occurrence
        team: stat.team, // Assume team is consistent for a player within a match
        kills: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        head_shot_kills: 0,
        enemy2ks: 0,
        enemy3ks: 0,
        enemy4ks: 0,
        enemy5ks: 0,
        entry_count: 0, // This is FK
      };
    }
    aggregatedPlayers[stat.steamid64].kills += stat.kills;
    aggregatedPlayers[stat.steamid64].deaths += stat.deaths;
    aggregatedPlayers[stat.steamid64].assists += stat.assists;
    aggregatedPlayers[stat.steamid64].damage += stat.damage;
    aggregatedPlayers[stat.steamid64].head_shot_kills += stat.head_shot_kills;
    aggregatedPlayers[stat.steamid64].enemy2ks += stat.enemy2ks;
    aggregatedPlayers[stat.steamid64].enemy3ks += stat.enemy3ks;
    aggregatedPlayers[stat.steamid64].enemy4ks += stat.enemy4ks;
    aggregatedPlayers[stat.steamid64].enemy5ks += stat.enemy5ks;
    aggregatedPlayers[stat.steamid64].entry_count += stat.entry_count;
  });

  const playersForTable = Object.values(aggregatedPlayers).map(player => {
    const hs = player.kills > 0 ? ((player.head_shot_kills / player.kills) * 100).toFixed(1) : 0;
    const diff = player.kills - player.deaths;
    const kdr = player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : 'N/A';
    const mk = player.enemy2ks + player.enemy3ks + player.enemy4ks + player.enemy5ks;
    const fk = player.entry_count; // FK is total entry count

    return {
      ...player, // Include all aggregated fields
      hs: hs,
      diff: diff,
      kdr: kdr,
      mk: mk,
      fk: fk,
    };
  });

  const team1Players = playersForTable.filter(p => p.team === match.team1_name);
  const team2Players = playersForTable.filter(p => p.team === match.team2_name);

  const renderPlayerTable = (players) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase">
          <tr>
            <th scope="col" className="px-6 py-3">Jogador</th>
            <th scope="col" className="px-6 py-3 text-center" title="Kills">K</th>
            <th scope="col" className="px-6 py-3 text-center" title="Assistências">A</th>
            <th scope="col" className="px-6 py-3 text-center" title="Mortes">D</th>
            <th scope="col" className="px-6 py-3 text-center" title="Diferença entre Kills e Mortes">DIFF</th>
            <th scope="col" className="px-6 py-3 text-center" title="Rodadas com mais de 1 kill">MK</th>
            <th scope="col" className="px-6 py-3 text-center" title="First Kill">FK</th>
            <th scope="col" className="px-6 py-3 text-center" title="Porcentagem de Headshot">HS%</th>
            <th scope="col" className="px-6 py-3 text-center" title="Razão entre Abates e Mortes">KDR</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => {
            // hs, diff, kdr, mk, fk are already calculated in playersForTable
            return (
              <tr key={player.steamid64} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap">
                  <Link href={`/player/${player.steamid64}`} className="text-blue-500 hover:underline">
                    {player.name}
                  </Link>
                </th>
                <td className="px-6 py-4 text-center">{player.kills}</td>
                <td className="px-6 py-4 text-center">{player.assists}</td>
                <td className="px-6 py-4 text-center">{player.deaths}</td>
                <td className="px-6 py-4 text-center">{player.diff}</td>
                <td className="px-6 py-4 text-center">{player.mk}</td>
                <td className="px-6 py-4 text-center">{player.fk}</td>
                <td className="px-6 py-4 text-center">{player.hs}%</td>
                <td className="px-6 py-4 text-center">{player.kdr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  let totalTeam1Rounds = 0;
  let totalTeam2Rounds = 0;

  match.maps.forEach(map => {
    totalTeam1Rounds += map.team1_score;
    totalTeam2Rounds += map.team2_score;
  });

  return (
    <main className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen p-8">
      <div className="container mx-auto">
        <header className="mb-8">
          <Link href="/" className="text-blue-500 hover:underline mb-6 inline-block">← Voltar para todas as partidas</Link>
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center shadow-md">
            <p className="text-gray-600 dark:text-gray-400">Partida em {match.maps.length > 0 ? match.maps[0].mapname : 'Mapa Desconhecido'}</p>
            <div className="flex justify-center items-center text-4xl font-bold my-2">
              <span className={`${match.winner === match.team1_name ? 'text-green-600 dark:text-green-400' : ''}`}>{match.team1_name}</span>
              <span className="mx-4 font-mono">{totalTeam1Rounds} : {totalTeam2Rounds}</span>
              <span className={`${match.winner === match.team2_name ? 'text-green-600 dark:text-green-400' : ''}`}>{match.team2_name}</span>
            </div>
            <p className="text-sm text-gray-500">Vencedor: <span className="font-semibold text-green-600 dark:text-green-400">{match.winner}</span></p>
          </div>
        </header>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">{match.team1_name}</h2>
            {renderPlayerTable(team1Players)}
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">{match.team2_name}</h2>
            {renderPlayerTable(team2Players)}
          </div>
        </div>
      </div>
    </main>
  );
}