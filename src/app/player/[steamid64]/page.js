import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function PlayerDetailPage({ params }) {
  const { steamid64 } = params;

  // Fetch all player stats for this steamid64, including related map and match details
  const playerStats = await prisma.playerStats.findMany({
    where: {
      steamid64: BigInt(steamid64), // Convert string steamid64 to BigInt
    },
    include: {
      map: {
        include: {
          match: true, // Include match details for each map
        },
      },
    },
    orderBy: {
      map: {
        match: {
          start_time: 'desc', // Order by most recent matches
        },
      },
    },
  });

  if (playerStats.length === 0) {
    return (
      <main className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen p-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold">Jogador não encontrado</h1>
          <Link href="/players" className="text-blue-500 hover:underline mt-4 inline-block">Voltar para a lista de jogadores</Link>
        </div>
      </main>
    );
  }

  // Aggregate overall player stats
  const aggregatedStats = {
    totalKills: 0,
    totalDeaths: 0,
    totalAssists: 0,
    totalDamage: 0,
    totalHeadshotKills: 0,
    totalEnemy2ks: 0,
    totalEnemy3ks: 0,
    totalEnemy4ks: 0,
    totalEnemy5ks: 0,
    totalUtilityCount: 0,
    totalUtilityDamage: 0,
    totalUtilitySuccesses: 0,
    totalUtilityEnemies: 0,
    totalFlashCount: 0,
    totalFlashSuccesses: 0,
    totalShotsFired: 0,
    totalShotsOnTarget: 0,
    totalV1Count: 0,
    totalV1Wins: 0,
    totalV2Count: 0,
    totalV2Wins: 0,
    totalEntryCount: 0,
    totalEntryWins: 0,
    totalEnemiesFlashed: 0,
    totalMapsPlayed: playerStats.length,
    uniqueNames: new Set(),
  };

  playerStats.forEach(stat => {
    aggregatedStats.totalKills += stat.kills;
    aggregatedStats.totalDeaths += stat.deaths;
    aggregatedStats.totalAssists += stat.assists;
    aggregatedStats.totalDamage += stat.damage;
    aggregatedStats.totalHeadshotKills += stat.head_shot_kills;
    aggregatedStats.totalEnemy2ks += stat.enemy2ks;
    aggregatedStats.totalEnemy3ks += stat.enemy3ks;
    aggregatedStats.totalEnemy4ks += stat.enemy4ks;
    aggregatedStats.totalEnemy5ks += stat.enemy5ks;
    aggregatedStats.totalUtilityCount += stat.utility_count;
    aggregatedStats.totalUtilityDamage += stat.utility_damage;
    aggregatedStats.totalUtilitySuccesses += stat.utility_successes;
    aggregatedStats.totalUtilityEnemies += stat.utility_enemies;
    aggregatedStats.totalFlashCount += stat.flash_count;
    aggregatedStats.totalFlashSuccesses += stat.flash_successes;
    aggregatedStats.totalShotsFired += stat.shots_fired_total;
    aggregatedStats.totalShotsOnTarget += stat.shots_on_target_total;
    aggregatedStats.totalV1Count += stat.v1_count;
    aggregatedStats.totalV1Wins += stat.v1_wins;
    aggregatedStats.totalV2Count += stat.v2_count;
    aggregatedStats.totalV2Wins += stat.v2_wins;
    aggregatedStats.totalEntryCount += stat.entry_count;
    aggregatedStats.totalEntryWins += stat.entry_wins;
    aggregatedStats.totalEnemiesFlashed += stat.enemies_flashed;
    aggregatedStats.uniqueNames.add(stat.name);
  });

  const hsPercentage = aggregatedStats.totalKills > 0 ? ((aggregatedStats.totalHeadshotKills / aggregatedStats.totalKills) * 100).toFixed(1) : 0;
  const diff = aggregatedStats.totalKills - aggregatedStats.totalDeaths;
  const kdr = aggregatedStats.totalDeaths > 0 ? (aggregatedStats.totalKills / aggregatedStats.totalDeaths).toFixed(2) : aggregatedStats.totalKills.toFixed(2);
  const mk = aggregatedStats.totalEnemy2ks + aggregatedStats.totalEnemy3ks + aggregatedStats.totalEnemy4ks + aggregatedStats.totalEnemy5ks;
  const shotAccuracy = aggregatedStats.totalShotsFired > 0 ? ((aggregatedStats.totalShotsOnTarget / aggregatedStats.totalShotsFired) * 100).toFixed(1) : 0;
  const playerDisplayName = Array.from(aggregatedStats.uniqueNames).join(', ');

  return (
    <main className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen p-8">
      <div className="container mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">Detalhes do Jogador: {playerDisplayName}</h1>
          <p className="text-gray-600 dark:text-gray-400">SteamID64: {steamid64}</p>
        </header>

        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Estatísticas Gerais</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-lg">
            <div><span className="font-semibold">Kills:</span> {aggregatedStats.totalKills}</div>
            <div><span className="font-semibold">Deaths:</span> {aggregatedStats.totalDeaths}</div>
            <div><span className="font-semibold">Assists:</span> {aggregatedStats.totalAssists}</div>
            <div><span className="font-semibold">HS%:</span> {hsPercentage}%</div>
            <div><span className="font-semibold">DIFF:</span> {diff}</div>
            <div><span className="font-semibold">KDR:</span> {kdr}</div>
            <div><span className="font-semibold">MK:</span> {mk}</div>
            <div><span className="font-semibold">Utilidade Usada:</span> {aggregatedStats.totalUtilityCount}</div>
            <div><span className="font-semibold">Dano de Utilidade:</span> {aggregatedStats.totalUtilityDamage}</div>
            <div><span className="font-semibold">Flashes Lançadas:</span> {aggregatedStats.totalFlashCount}</div>
            <div><span className="font-semibold">Inimigos Flashados:</span> {aggregatedStats.totalEnemiesFlashed}</div>
            <div><span className="font-semibold">Precisão de Tiro:</span> {shotAccuracy}%</div>
            <div><span className="font-semibold">1vs1:</span> {aggregatedStats.totalV1Count} ({aggregatedStats.totalV1Wins} vitórias)</div>
            <div><span className="font-semibold">1vs2:</span> {aggregatedStats.totalV2Count} ({aggregatedStats.totalV2Wins} vitórias)</div>
            <div><span className="font-semibold">FK:</span> {aggregatedStats.totalEntryCount} ({aggregatedStats.totalEntryWins} vitórias)</div>
            <div><span className="font-semibold">Mapas Jogados:</span> {aggregatedStats.totalMapsPlayed}</div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Partidas Participadas</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase">
              <tr>
                <th scope="col" className="px-6 py-3">Partida</th>
                <th scope="col" className="px-6 py-3">Mapa</th>
                <th scope="col" className="px-6 py-3 text-center">K</th>
                <th scope="col" className="px-6 py-3 text-center">A</th>
                <th scope="col" className="px-6 py-3 text-center">D</th>
                <th scope="col" className="px-6 py-3 text-center">DIFF</th>
                <th scope="col" className="px-6 py-3 text-center">MK</th>
                <th scope="col" className="px-6 py-3 text-center">FK</th>
                <th scope="col" className="px-6 py-3 text-center">HS%</th>
                <th scope="col" className="px-6 py-3 text-center">KDR</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map(stat => {
                const hs = stat.kills > 0 ? ((stat.head_shot_kills / stat.kills) * 100).toFixed(1) : 0;
                const diff = stat.kills - stat.deaths;
                const kdr = stat.deaths > 0 ? (stat.kills / stat.deaths).toFixed(2) : stat.kills.toFixed(2);
                const mk = stat.enemy2ks + stat.enemy3ks + stat.enemy4ks + stat.enemy5ks;
                const matchName = stat.map && stat.map.match ? `${stat.map.match.team1_name} vs ${stat.map.match.team2_name}` : 'Partida Desconhecida';
                const mapName = stat.map ? stat.map.mapname : 'Mapa Desconhecido';
                return (
                  <tr key={`${stat.matchid}-${stat.mapnumber}`} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap">
                      <Link href={`/match/${stat.matchid}`} className="text-blue-500 hover:underline">
                        {matchName}
                      </Link>
                    </th>
                    <td className="px-6 py-4">{mapName}</td>
                    <td className="px-6 py-4 text-center">{stat.kills}</td>
                    <td className="px-6 py-4 text-center">{stat.assists}</td>
                    <td className="px-6 py-4 text-center">{stat.deaths}</td>
                    <td className="px-6 py-4 text-center">{diff}</td>
                    <td className="px-6 py-4 text-center">{mk}</td>
                    <td className="px-6 py-4 text-center">{stat.entry_count}</td>
                    <td className="px-6 py-4 text-center">{hs}%</td>
                    <td className="px-6 py-4 text-center">{kdr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-8">
          <Link href="/players" className="text-blue-500 hover:underline">← Voltar para a lista de jogadores</Link>
        </div>
      </div>
    </main>
  );
}