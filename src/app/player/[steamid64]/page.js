import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

async function getPlayerData(steamid64) {
  const steamIdBigInt = BigInt(steamid64);

  const statsPromise = prisma.playerStats.aggregate({
    where: { steamid64: steamIdBigInt },
    _sum: {
      kills: true,
      deaths: true,
      assists: true,
      head_shot_kills: true,
      v1_wins: true,
      v2_wins: true,
      entry_count: true,
      entry_wins: true,
    },
    _count: {
      _all: true, // This counts the number of matches played
    },
  });

  const namesPromise = prisma.playerStats.findMany({
    where: { steamid64: steamIdBigInt },
    select: { name: true },
    distinct: ['name'],
  });

  const [stats, nameRecords] = await Promise.all([statsPromise, namesPromise]);

  if (stats._count._all === 0) {
    return null;
  }

  const kills = stats._sum.kills || 0;
  const deaths = stats._sum.deaths || 0;
  const assists = stats._sum.assists || 0;
  const head_shot_kills = stats._sum.head_shot_kills || 0;
  const mapsPlayed = stats._count._all;

  const clutches_won = (stats._sum.v1_wins || 0) + (stats._sum.v2_wins || 0);
  const entry_count = stats._sum.entry_count || 0;
  const entry_wins = stats._sum.entry_wins || 0;

  const player = {
    steamid64,
    names: nameRecords.map(r => r.name),
    kills,
    deaths,
    assists,
    mapsPlayed,
    diff: kills - deaths,
    kdr: deaths > 0 ? (kills / deaths).toFixed(2) : 'N/A',
    hs_percent: kills > 0 ? ((head_shot_kills / kills) * 100).toFixed(1) : '0.0',
    clutches_won,
    entry_success_rate: entry_count > 0 ? ((entry_wins / entry_count) * 100).toFixed(1) : '0.0',
  };

  return player;
}

async function getPlayerMatchHistory(steamid64) {
  const steamIdBigInt = BigInt(steamid64);
  const matches = await prisma.playerStats.findMany({
    where: { steamid64: steamIdBigInt },
    include: {
      map: {
        include: {
          match: true,
        },
      },
    },
    orderBy: {
      matchid: 'desc',
    },
  });
  return matches;
}

export default async function PlayerDetailPage({ params }) {
  const { steamid64 } = params;
  const playerData = await getPlayerData(steamid64);

  if (!playerData) {
    return (
      <main className="bg-gray-900 text-white min-h-screen p-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold">Jogador não encontrado</h1>
          <Link href="/players" className="text-blue-400 hover:underline mt-4 inline-block">Voltar para o Ranking</Link>
        </div>
      </main>
    );
  }

  const matchHistory = await getPlayerMatchHistory(steamid64);
  const primaryName = playerData.names[0] || 'Jogador Desconhecido';

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { href: "/players", label: "Jogadores" },
    { label: primaryName }, // Current page, no href
  ];

  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-8">
          <Link href="/players" className="text-blue-400 hover:underline mb-6 inline-block">← Voltar para o Ranking</Link>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h1 className="text-3xl md:text-4xl font-bold">{primaryName}</h1>
            <p className="text-gray-400">SteamID64: {playerData.steamid64}</p>
            {playerData.names.length > 1 && (
              <p className="text-sm text-gray-500">Nicks Anteriores: {playerData.names.slice(1).join(', ')}</p>
            )}
          </div>
        </header>

        {/* Player Stats Summary */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-8">
          <h2 className="text-xl font-bold mb-4">Estatísticas Gerais</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 text-center">
            <div className="bg-gray-900/50 p-3 rounded-md">
              <div className="text-2xl font-bold font-mono">{playerData.kdr}</div>
              <div className="text-sm text-gray-400">KDR</div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-md">
              <div className="text-2xl font-bold font-mono">{playerData.hs_percent}%</div>
              <div className="text-sm text-gray-400">HS%</div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-md">
              <div className="text-2xl font-bold font-mono">{playerData.clutches_won}</div>
              <div className="text-sm text-gray-400">Clutches</div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-md">
              <div className="text-2xl font-bold font-mono">{playerData.entry_success_rate}%</div>
              <div className="text-sm text-gray-400">Entry %</div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-md">
              <div className="text-2xl font-bold font-mono">{playerData.kills}</div>
              <div className="text-sm text-gray-400">Kills</div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-md">
              <div className="text-2xl font-bold font-mono">{playerData.deaths}</div>
              <div className="text-sm text-gray-400">Deaths</div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-md">
              <div className="text-2xl font-bold font-mono">{playerData.assists}</div>
              <div className="text-sm text-gray-400">Assists</div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-md">
              <div className="text-2xl font-bold font-mono">{playerData.mapsPlayed}</div>
              <div className="text-sm text-gray-400">Mapas</div>
            </div>
          </div>
        </div>

        {/* Match History */}
        <div className="bg-gray-800 md:rounded-lg shadow-lg overflow-hidden">
          <h2 className="text-xl font-bold p-4">Histórico de Partidas</h2>
          <table className="min-w-full text-sm responsive-table">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700">
                <th scope="col" className="p-3 text-left font-semibold">Partida</th>
                <th scope="col" className="p-3 text-left font-semibold">Mapa</th>
                <th scope="col" className="p-3 text-center font-semibold">K-D</th>
                <th scope="col" className="p-3 text-center font-semibold">+/-</th>
                <th scope="col" className="p-3 text-center font-semibold">HS%</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800">
              {matchHistory.map(stat => {
                const match = stat.map.match;
                const diff = stat.kills - stat.deaths;
                const diffColor = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-400';
                const diffSign = diff > 0 ? '+' : '';
                const hs_percent = stat.kills > 0 ? ((stat.head_shot_kills / stat.kills) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={`${match.matchid}-${stat.mapid}`} className="last:border-b-0">
                    <td data-label="Partida" className="p-3 md:text-left">
                      <Link href={`/match/${match.matchid}`} className="hover:underline">
                        {match.team1_name} vs {match.team2_name}
                      </Link>
                    </td>
                    <td data-label="Mapa" className="p-3 text-gray-400 md:text-left">{stat.map.mapname}</td>
                    <td data-label="K-D" className="p-3 font-mono">{`${stat.kills}-${stat.deaths}`}</td>
                    <td data-label="+/-" className={`p-3 font-mono ${diffColor}`}>{`${diffSign}${diff}`}</td>
                    <td data-label="HS%" className="p-3 font-mono">{hs_percent}%</td>
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
