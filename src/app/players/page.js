import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function PlayersPage() {
  const playerStats = await prisma.playerStats.findMany({
    orderBy: {
      steamid64: 'asc',
    },
  });

  const aggregatedPlayers = {};

  playerStats.forEach(stat => {
    if (!aggregatedPlayers[stat.steamid64]) {
      aggregatedPlayers[stat.steamid64] = {
        steamid64: stat.steamid64,
        names: new Set(), // Use a Set to store unique names
        totalKills: 0,
        totalDeaths: 0,
        totalAssists: 0,
        totalDamage: 0,
        totalHeadshotKills: 0,
        totalEnemy2ks: 0,
        totalEnemy3ks: 0,
        totalEnemy4ks: 0,
        totalEnemy5ks: 0,
        totalEntryCount: 0,
        totalEntryWins: 0,
        totalMapsPlayed: 0,
      };
    }
    aggregatedPlayers[stat.steamid64].names.add(stat.name);
    aggregatedPlayers[stat.steamid64].totalKills += stat.kills;
    aggregatedPlayers[stat.steamid64].totalDeaths += stat.deaths;
    aggregatedPlayers[stat.steamid64].totalAssists += stat.assists;
    aggregatedPlayers[stat.steamid64].totalDamage += stat.damage;
    aggregatedPlayers[stat.steamid64].totalHeadshotKills += stat.head_shot_kills;
    aggregatedPlayers[stat.steamid64].totalEnemy2ks += stat.enemy2ks;
    aggregatedPlayers[stat.steamid64].totalEnemy3ks += stat.enemy3ks;
    aggregatedPlayers[stat.steamid64].totalEnemy4ks += stat.enemy4ks;
    aggregatedPlayers[stat.steamid64].totalEnemy5ks += stat.enemy5ks;
    aggregatedPlayers[stat.steamid64].totalEntryCount += stat.entry_count;
    aggregatedPlayers[stat.steamid64].totalEntryWins += stat.entry_wins;
    aggregatedPlayers[stat.steamid64].totalMapsPlayed += 1;
  });

  const players = Object.values(aggregatedPlayers).map(player => {
    const hsPercentage = player.totalKills > 0 ? ((player.totalHeadshotKills / player.totalKills) * 100).toFixed(1) : 0;
    const diff = player.totalKills - player.totalDeaths;
    const kdr = player.totalDeaths > 0 ? (player.totalKills / player.totalDeaths).toFixed(2) : player.totalKills.toFixed(2);
    const mk = player.totalEnemy2ks + player.totalEnemy3ks + player.totalEnemy4ks + player.totalEnemy5ks;
    const fk = player.totalEntryCount; // FK is total entry count
    return {
      steamid64: player.steamid64,
      names: Array.from(player.names).join(', '),
      totalKills: player.totalKills,
      totalDeaths: player.totalDeaths,
      totalAssists: player.totalAssists,
      totalDamage: player.totalDamage,
      hsPercentage: hsPercentage,
      diff: diff,
      kdr: kdr,
      mk: mk,
      fk: fk,
      totalMapsPlayed: player.totalMapsPlayed,
    };
  }).sort((a, b) => b.totalKills - a.totalKills); // Revert to fixed sorting by totalKills

  return (
    <main className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen p-8">
      <div className="container mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">Estatísticas de Jogadores</h1>
          <p className="text-gray-600 dark:text-gray-400">Estatísticas agregadas de todos os jogadores</p>
        </header>

        <div className="overflow-x-auto">
          {players.length === 0 ? (
            <div className="text-center bg-gray-100 dark:bg-gray-800 p-8 rounded-lg">
              <p className="text-xl text-gray-700 dark:text-gray-400">Nenhum jogador encontrado no banco de dados.</p>
            </div>
          ) : (
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase">
                <tr>
                  <th scope="col" className="px-6 py-3">SteamID64</th>
                  <th scope="col" className="px-6 py-3">Nicks</th>
                  <th scope="col" className="px-6 py-3 text-center" title="Kills">K</th>
                  <th scope="col" className="px-6 py-3 text-center" title="Assistências">A</th>
                  <th scope="col" className="px-6 py-3 text-center" title="Mortes">D</th>
                  <th scope="col" className="px-6 py-3 text-center" title="Diferença entre Kills e Mortes">DIFF</th>
                  <th scope="col" className="px-6 py-3 text-center" title="Rodadas com mais de 1 kill">MK</th>
                  <th scope="col" className="px-6 py-3 text-center" title="First Kill">FK</th>
                  <th scope="col" className="px-6 py-3 text-center" title="Porcentagem de Headshot">HS%</th>
                  <th scope="col" className="px-6 py-3 text-center" title="Razão entre Abates e Mortes">KDR</th>
                  <th scope="col" className="px-6 py-3 text-center" title="Mapas Jogados">Mapas</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.steamid64} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap">
                      <Link href={`/player/${player.steamid64}`} className="text-blue-500 hover:underline">
                        {player.steamid64}
                      </Link>
                    </th>
                    <td className="px-6 py-4">{player.names}</td>
                    <td className="px-6 py-4 text-center">{player.totalKills}</td>
                    <td className="px-6 py-4 text-center">{player.totalAssists}</td>
                    <td className="px-6 py-4 text-center">{player.totalDeaths}</td>
                    <td className="px-6 py-4 text-center">{player.diff}</td>
                    <td className="px-6 py-4 text-center">{player.mk}</td>
                    <td className="px-6 py-4 text-center">{player.fk}</td>
                    <td className="px-6 py-4 text-center">{player.hsPercentage}%</td>
                    <td className="px-6 py-4 text-center">{player.kdr}</td>
                    <td className="px-6 py-4 text-center">{player.totalMapsPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="text-center mt-8">
          <Link href="/" className="text-blue-500 hover:underline">← Voltar para a lista de partidas</Link>
        </div>
      </div>
    </main>
  );
}