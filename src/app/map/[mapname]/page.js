import { Breadcrumbs } from "@/components/Breadcrumbs";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MetricHeader } from "@/components/MetricHeader";

export const revalidate = 300;

// Habilita cache ISR por caminho: cada mapa é renderizado na primeira visita e cacheado
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { mapname } = await params;
  const cleanName = decodeURIComponent(mapname).replace(/de_|cs_/, '');
  const title = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  return {
    title: `Estatísticas de ${title}`,
    description: `Ranking de jogadores e histórico de partidas no mapa ${title}.`,
  };
}

async function getMapData(mapname) {
  const decodedMapname = decodeURIComponent(mapname);

  const mapInstances = await prisma.map.findMany({
    where: { mapname: decodedMapname },
    select: { matchid: true, mapnumber: true },
  });

  const playerStatsOnMap = mapInstances.length > 0
    ? await prisma.playerStats.findMany({
        where: { OR: mapInstances.map(m => ({ matchid: m.matchid, mapnumber: m.mapnumber })) },
      })
    : [];

  const leaderboard = {};
  playerStatsOnMap.forEach(stat => {
    if (!leaderboard[stat.steamid64]) {
      leaderboard[stat.steamid64] = {
        steamid64: stat.steamid64,
        name: stat.name,
        kills: 0,
        deaths: 0,
      };
    }
    leaderboard[stat.steamid64].kills += stat.kills;
    leaderboard[stat.steamid64].deaths += stat.deaths;
  });

  const sortedLeaderboard = Object.values(leaderboard)
    .map(p => ({
      ...p,
      kdr: p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : 'N/A',
      diff: p.kills - p.deaths,
    }))
    .sort((a, b) => b.kills - a.kills);

  // Get match history for this map, including map details for round scores
  const matchHistory = await prisma.match.findMany({
    where: { maps: { some: { mapname: decodedMapname } } },
    select: {
      matchid: true,
      start_time: true,
      winner: true,
      team1_name: true,
      team1_score: true,
      team2_name: true,
      team2_score: true,
      maps: {
        select: {
          mapname: true,
          team1_score: true,
          team2_score: true,
        },
      },
    },
    orderBy: { start_time: 'desc' },
  });

  return { leaderboard: sortedLeaderboard, matchHistory, decodedMapname };
}

export default async function MapPage({ params }) {
  const { mapname } = await params;
  const { leaderboard, matchHistory, decodedMapname } = await getMapData(mapname);

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { href: "/maps", label: "Mapas" },
    { label: decodedMapname.replace(/de_|cs_/, '').charAt(0).toUpperCase() + decodedMapname.replace(/de_|cs_/, '').slice(1) },
  ];

  const renderLeaderboard = () => (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <h2 className="text-xl font-bold p-4">Ranking do Mapa</h2>
      <table className="min-w-full text-sm responsive-table stats-table">
        <caption className="sr-only">Ranking de jogadores neste mapa.</caption>
        <thead className="bg-gray-900/50">
          <tr className="border-b border-gray-700">
            <th scope="col" className="p-3 text-center font-semibold w-16">Rank</th>
            <th scope="col" className="p-3 text-left font-semibold">Jogador</th>
            <MetricHeader label="Kills" description="Total de abates no mapa." className="p-3 text-right font-semibold" />
            <MetricHeader label="Deaths" description="Total de mortes no mapa." className="p-3 text-right font-semibold" />
            <MetricHeader label="KDR" description="Kill/Death Ratio (Kills / Deaths)" className="p-3 text-right font-semibold" />
            <MetricHeader label="+/-" description="Diferença entre Kills e Deaths" className="p-3 md:pr-6 text-right font-semibold" />
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((player, index) => {
            const diffColor = player.diff > 0 ? 'text-green-500' : player.diff < 0 ? 'text-red-500' : 'text-gray-400';
            const diffSign = player.diff > 0 ? '+' : '';
            return (
              <tr key={player.steamid64}>
                <td data-label="Rank" className={`p-3 md:text-center font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-400'}`}>#{index + 1}</td>
                <td data-label="Jogador" className="p-3 md:text-left">
                  <Link href={`/player/${player.steamid64}`} className="inline-flex items-center font-medium text-white hover:underline">
                    {player.name}
                  </Link>
                </td>
                <td data-label="Kills" className="p-3 md:text-right font-mono tabular-nums">{player.kills}</td>
                <td data-label="Deaths" className="p-3 md:text-right font-mono tabular-nums">{player.deaths}</td>
                <td data-label="KDR" className="p-3 md:text-right font-mono tabular-nums">{player.kdr}</td>
                <td data-label="+/-" className={`p-3 md:pr-6 md:text-right font-mono tabular-nums ${diffColor}`}>{`${diffSign}${player.diff}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderMatchHistory = () => (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <h2 className="text-xl font-bold p-4">Histórico de Partidas</h2>
      <table className="min-w-full text-sm responsive-table stats-table">
        <caption className="sr-only">Histórico de partidas jogadas neste mapa.</caption>
        <thead className="bg-gray-900/50">
          <tr className="border-b border-gray-700">
            <th scope="col" className="p-3 text-left font-semibold">Times</th>
            <MetricHeader label="Placar" description="Resultado da partida no formato: rounds (vitórias na série)" className="p-3 text-center font-semibold" />
            <th scope="col" className="p-3 text-left font-semibold">Vencedor</th>
            <th scope="col" className="p-3 md:pr-6 text-left font-semibold">Data</th>
          </tr>
        </thead>
        <tbody>
          {matchHistory.map(match => {
            const mapData = match.maps.find(m => m.mapname === decodedMapname);
            const team1Rounds = mapData ? mapData.team1_score : 0;
            const team2Rounds = mapData ? mapData.team2_score : 0;
            const team1MatchScore = match.team1_score;
            const team2MatchScore = match.team2_score;

            return (
              <tr key={match.matchid}>
                <td data-label="Times" className="p-3 md:text-left">
                  <Link href={`/match/${match.matchid}`} className="inline-flex items-center font-medium text-white hover:underline">
                    {match.team1_name} vs {match.team2_name}
                  </Link>
                </td>
                <td data-label="Placar" className="p-3 md:text-center font-mono">
                  <span>
                    <span className={match.winner === match.team1_name ? 'text-green-500 font-bold' : match.winner === match.team2_name ? 'text-red-500' : ''}>
                      {team1Rounds} ({team1MatchScore})
                    </span>
                    <span> : </span>
                    <span className={match.winner === match.team2_name ? 'text-green-500 font-bold' : match.winner === match.team1_name ? 'text-red-500' : ''}>
                      {team2Rounds} ({team2MatchScore})
                    </span>
                  </span>
                </td>
                <td data-label="Vencedor" className={`p-3 font-semibold md:text-left ${match.winner === match.team1_name || match.winner === match.team2_name ? 'text-green-500' : ''}`}>
                  {match.winner || 'Empate'}
                </td>
                <td data-label="Data" className="p-3 md:pr-6 text-gray-400 md:text-left">{new Date(match.start_time).toLocaleDateString('pt-BR')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="text-white py-4 md:py-8">
        <div className="container mx-auto space-y-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold capitalize">
              Estatísticas de {decodedMapname.replace(/de_|cs_/, '')}
            </h1>
          </header>

          {leaderboard.length > 0 ? renderLeaderboard() : <p className="text-center text-gray-400 py-8">Nenhum ranking disponível para este mapa.</p>}
          {matchHistory.length > 0 ? renderMatchHistory() : <p className="text-center text-gray-400 py-8">Nenhuma partida encontrada para este mapa.</p>}

        </div>
      </div>
    </TooltipProvider>
  );
}
