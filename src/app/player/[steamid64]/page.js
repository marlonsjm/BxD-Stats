import { Breadcrumbs } from '@/components/Breadcrumbs';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MetricHeader } from "@/components/MetricHeader";

async function getPlayerData(steamid64) {
  const steamIdBigInt = BigInt(steamid64);

  const [stats, nameRecords, mapsData] = await Promise.all([
    prisma.playerStats.aggregate({
      where: { steamid64: steamIdBigInt },
      _sum: {
        kills: true,
        deaths: true,
        assists: true,
        head_shot_kills: true,
        damage: true,
        v1_wins: true,
        v2_wins: true,
        entry_count: true,
        entry_wins: true,
        shots_fired_total: true,
        shots_on_target_total: true,
        enemy3ks: true,
        enemy4ks: true,
        enemy5ks: true,
      },
      _count: { _all: true },
    }),
    prisma.playerStats.findMany({
      where: { steamid64: steamIdBigInt },
      select: { name: true },
      distinct: ['name'],
    }),
    prisma.map.findMany({
      where: { player_stats: { some: { steamid64: steamIdBigInt } } },
      select: { team1_score: true, team2_score: true },
    }),
  ]);

  if (stats._count._all === 0) return null;

  const kills = stats._sum.kills || 0;
  const deaths = stats._sum.deaths || 0;
  const assists = stats._sum.assists || 0;
  const head_shot_kills = stats._sum.head_shot_kills || 0;
  const damage = stats._sum.damage || 0;
  const mapsPlayed = stats._count._all;
  const shots_fired = stats._sum.shots_fired_total || 0;
  const shots_on_target = stats._sum.shots_on_target_total || 0;
  const enemy3ks = stats._sum.enemy3ks || 0;
  const enemy4ks = stats._sum.enemy4ks || 0;
  const enemy5ks = stats._sum.enemy5ks || 0;
  const clutches_won = (stats._sum.v1_wins || 0) + (stats._sum.v2_wins || 0);
  const entry_count = stats._sum.entry_count || 0;
  const entry_wins = stats._sum.entry_wins || 0;
  const totalRounds = mapsData.reduce((sum, m) => sum + m.team1_score + m.team2_score, 0);

  return {
    steamid64,
    names: nameRecords.map(r => r.name),
    kills,
    deaths,
    assists,
    mapsPlayed,
    diff: kills - deaths,
    kdr: deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString(),
    hs_percent: kills > 0 ? ((head_shot_kills / kills) * 100).toFixed(1) : '0.0',
    adr: totalRounds > 0 ? (damage / totalRounds).toFixed(1) : '0.0',
    accuracy: shots_fired > 0 ? ((shots_on_target / shots_fired) * 100).toFixed(1) : '0.0',
    enemy3ks,
    enemy4ks,
    enemy5ks,
    clutches_won,
    entry_success_rate: entry_count > 0 ? ((entry_wins / entry_count) * 100).toFixed(1) : '0.0',
  };
}

async function getPlayerMatchHistory(steamid64) {
  const steamIdBigInt = BigInt(steamid64);

  // No includes — avoids crashes when PlayerStats has orphan Maps or orphan Matches
  const stats = await prisma.playerStats.findMany({
    where: { steamid64: steamIdBigInt },
    orderBy: { matchid: 'desc' },
  });

  if (stats.length === 0) return [];

  const matchIds = [...new Set(stats.map(s => s.matchid))];
  const mapKeys = stats.map(s => ({ matchid: s.matchid, mapnumber: s.mapnumber }));

  const [maps, matches] = await Promise.all([
    prisma.map.findMany({
      where: { OR: mapKeys.map(k => ({ matchid: k.matchid, mapnumber: k.mapnumber })) },
      select: { matchid: true, mapnumber: true, mapname: true, team1_score: true, team2_score: true },
    }),
    prisma.match.findMany({
      where: { matchid: { in: matchIds } },
      select: { matchid: true, team1_name: true, team2_name: true, winner: true },
    }),
  ]);

  const mapLookup = new Map(maps.map(m => [`${m.matchid}-${m.mapnumber}`, m]));
  const matchLookup = new Map(matches.map(m => [m.matchid, m]));

  return stats
    .map(s => ({
      ...s,
      map: mapLookup.get(`${s.matchid}-${s.mapnumber}`) || null,
      match: matchLookup.get(s.matchid) || null,
    }))
    .filter(s => s.map !== null && s.match !== null);
}

const StatCard = ({ value, label, description }) => (
  <div className="bg-gray-900/50 p-3 rounded-md">
    <div className="text-2xl font-bold font-mono">{value}</div>
    <Tooltip>
      <TooltipTrigger className="cursor-help underline decoration-dotted">
        <div className="text-sm text-gray-400">{label}</div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);

export default async function PlayerDetailPage({ params }) {
  const { steamid64 } = await params;
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
    { label: primaryName },
  ];

  return (
    <TooltipProvider>
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
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">Estatísticas Gerais</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center mb-4">
              <StatCard value={playerData.kdr} label="KDR" description="Kill/Death Ratio (Kills / Deaths)" />
              <StatCard value={`${playerData.hs_percent}%`} label="HS%" description="Percentual de Headshots" />
              <StatCard value={playerData.adr} label="ADR" description="Dano Médio por Round (Damage Total / Total de Rounds)" />
              <StatCard value={`${playerData.accuracy}%`} label="Accuracy" description="Precisão: tiros no alvo / tiros disparados" />
              <StatCard value={playerData.clutches_won} label="Clutches" description="Total de rounds vencidos em situação de 1vX" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
              <StatCard value={playerData.kills} label="Kills" description="Total de abates" />
              <StatCard value={playerData.deaths} label="Deaths" description="Total de mortes" />
              <StatCard value={playerData.assists} label="Assists" description="Total de assistências" />
              <StatCard value={`${playerData.entry_success_rate}%`} label="Entry %" description="Taxa de sucesso ao conseguir o primeiro abate para o time no round" />
              <StatCard value={playerData.mapsPlayed} label="Mapas" description="Total de mapas jogados" />
            </div>
          </div>

          {/* Multi-Kill Stats */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-8">
            <h2 className="text-xl font-bold mb-4">Multi-Kills</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-900/50 p-3 rounded-md">
                <div className="text-2xl font-bold font-mono text-yellow-400">{playerData.enemy3ks}</div>
                <div className="text-sm text-gray-400">3K</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-md">
                <div className="text-2xl font-bold font-mono text-orange-400">{playerData.enemy4ks}</div>
                <div className="text-sm text-gray-400">4K</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-md">
                <div className="text-2xl font-bold font-mono text-red-400">{playerData.enemy5ks}</div>
                <div className="text-sm text-gray-400">ACE (5K)</div>
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
                  <MetricHeader label="K-D" description="Kills - Deaths na partida" className="p-3 text-center font-semibold" />
                  <MetricHeader label="A" description="Assistências na partida" className="p-3 text-center font-semibold" />
                  <MetricHeader label="+/-" description="Diferença entre Kills e Deaths na partida" className="p-3 text-center font-semibold" />
                  <MetricHeader label="ADR" description="Dano Médio por Round na partida" className="p-3 text-center font-semibold" />
                  <MetricHeader label="HS%" description="Percentual de Headshots na partida" className="p-3 text-center font-semibold" />
                </tr>
              </thead>
              <tbody className="bg-gray-800">
                {matchHistory.map(stat => {
                  const match = stat.match;
                  const diff = stat.kills - stat.deaths;
                  const diffColor = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-400';
                  const diffSign = diff > 0 ? '+' : '';
                  const hs_percent = stat.kills > 0 ? ((stat.head_shot_kills / stat.kills) * 100).toFixed(1) : '0.0';
                  const mapRounds = stat.map.team1_score + stat.map.team2_score;
                  const adr = mapRounds > 0 ? (stat.damage / mapRounds).toFixed(0) : '0';

                  return (
                    <tr key={`${stat.matchid}-${stat.mapnumber}`} className="last:border-b-0">
                      <td data-label="Partida" className="p-3 md:text-left">
                        <Link href={`/match/${match.matchid}`} className="hover:underline">
                          {match.team1_name} vs {match.team2_name}
                        </Link>
                      </td>
                      <td data-label="Mapa" className="p-3 text-gray-400 md:text-left">{stat.map.mapname}</td>
                      <td data-label="K-D" className="p-3 font-mono text-center">{`${stat.kills}-${stat.deaths}`}</td>
                      <td data-label="A" className="p-3 font-mono text-center">{stat.assists}</td>
                      <td data-label="+/-" className={`p-3 font-mono text-center ${diffColor}`}>{`${diffSign}${diff}`}</td>
                      <td data-label="ADR" className="p-3 font-mono text-center">{adr}</td>
                      <td data-label="HS%" className="p-3 font-mono text-center">{hs_percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}
