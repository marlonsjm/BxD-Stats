import { Breadcrumbs } from '@/components/Breadcrumbs';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { cache } from 'react';
import { Star, Trophy } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MetricHeader } from "@/components/MetricHeader";
import { getKillsRanking } from '@/lib/rankings';
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { calculateRating, RATING_DESCRIPTION } from "@/lib/rating";
import { getPlayerAvatars } from "@/lib/steam";

export const revalidate = 300;

// Habilita cache ISR por caminho: cada partida é renderizada na primeira visita e cacheada
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { match_id } = await params;
  try {
    const { match } = await getMatchAndRanking(match_id);
    if (!match) return { title: 'Partida não encontrada' };
    return {
      title: `${match.team1_name} vs ${match.team2_name} - Partida #${match.matchid}`,
      description: `Placar e estatísticas da partida entre ${match.team1_name} e ${match.team2_name}.`,
    };
  } catch {
    // Banco indisponível: usa um título genérico e deixa a página tratar o erro
    return { title: `Partida #${match_id}` };
  }
}

const getMatchAndRanking = cache(async (matchId) => {
  const match = await prisma.match.findUnique({
    where: { matchid: parseInt(matchId) },
    select: {
      matchid: true,
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
          player_stats: {
            orderBy: { kills: 'desc' },
            select: {
              steamid64: true,
              name: true,
              team: true,
              kills: true,
              deaths: true,
              assists: true,
              head_shot_kills: true,
              damage: true,
            },
          },
        },
      },
    },
  });

  const ranking = await getKillsRanking();
  const rankMap = new Map(ranking.map(p => [p.steamid64, p.rank]));

  return { match, rankMap };
});

export default async function MatchPage({ params }) {
  const { match_id } = await params;
  const { match, rankMap } = await getMatchAndRanking(match_id);

  if (!match) {
    return (
      <div className="text-white py-12">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Partida não encontrada</h1>
          <Link href="/matches" className="inline-flex items-center min-h-[44px] text-blue-400 hover:underline mt-4">Voltar para a lista de partidas</Link>
        </div>
      </div>
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
          damage: 0,
        };
      }
      const player = aggregatedPlayers[stat.steamid64];
      player.kills += stat.kills;
      player.deaths += stat.deaths;
      player.assists += stat.assists;
      player.head_shot_kills += stat.head_shot_kills;
      player.damage += stat.damage;
    });
  });

  let totalTeam1Rounds = 0;
  let totalTeam2Rounds = 0;
  match.maps.forEach(map => {
    totalTeam1Rounds += map.team1_score;
    totalTeam2Rounds += map.team2_score;
  });
  const totalRounds = totalTeam1Rounds + totalTeam2Rounds;

  const playersForTable = Object.values(aggregatedPlayers).map(p => ({
    ...p,
    rank: rankMap.get(p.steamid64.toString()) || 'N/A', // Get rank from the map
    diff: p.kills - p.deaths,
    kdr: p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : 'N/A',
    hs_percent: p.kills > 0 ? ((p.head_shot_kills / p.kills) * 100).toFixed(1) : '0.0',
    rating: calculateRating({ kills: p.kills, deaths: p.deaths, assists: p.assists, damage: p.damage, rounds: totalRounds }),
  }));

  const team1Players = playersForTable.filter(p => p.team === match.team1_name).sort((a, b) => b.rating - a.rating);
  const team2Players = playersForTable.filter(p => p.team === match.team2_name).sort((a, b) => b.rating - a.rating);

  // Destaque da partida: maior rating (desempate por kills)
  const mvp = [...playersForTable].sort((a, b) => b.rating - a.rating || b.kills - a.kills)[0];

  const avatars = await getPlayerAvatars(playersForTable.map(p => p.steamid64.toString()));

  const renderPlayerRow = (player) => {
    const diffColor = player.diff > 0 ? 'text-green-500' : player.diff < 0 ? 'text-red-500' : 'text-gray-400';
    const diffSign = player.diff > 0 ? '+' : '';

    const isMvp = mvp && player.steamid64 === mvp.steamid64;

    return (
      <tr key={player.steamid64}>
        <td data-label="Rank" className="p-3 font-mono tabular-nums md:text-center">{player.rank}</td>
        <td data-label="Jogador" className="p-3 md:text-left">
          <Link href={`/player/${player.steamid64}`} className="inline-flex items-center gap-2 font-medium text-white hover:underline">
            <PlayerAvatar src={avatars.get(player.steamid64.toString())?.medium} name={player.name} size={28} />
            {player.name}
            {isMvp && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Star aria-label="Destaque da partida" className="h-4 w-4 shrink-0 text-yellow-400" fill="currentColor" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Destaque da partida (maior rating)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </Link>
        </td>
        <td data-label="K-D" className="p-3 font-mono tabular-nums md:text-right">{`${player.kills}-${player.deaths}`}</td>
        <td data-label="+/-" className={`p-3 font-mono tabular-nums md:text-right ${diffColor}`}>{`${diffSign}${player.diff}`}</td>
        <td data-label="Assists" className="p-3 font-mono tabular-nums md:text-right">{player.assists}</td>
        <td data-label="HS%" className="p-3 font-mono tabular-nums md:text-right">{player.hs_percent}%</td>
        <td data-label="KDR" className="p-3 font-mono tabular-nums md:text-right">{player.kdr}</td>
        <td data-label="Rating" className={`p-3 md:pr-6 font-mono tabular-nums font-bold md:text-right ${player.rating >= 1 ? 'text-green-400' : 'text-red-400'}`}>{player.rating.toFixed(2)}</td>
      </tr>
    );
  };

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { href: "/matches", label: "Partidas" },
    { label: `Partida #${match.matchid}` },
  ];

  return (
    <TooltipProvider>
      <div className="text-white py-4 md:py-8">
        <div className="container mx-auto">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="mb-8">
            <div className="bg-gray-800 p-4 rounded-lg text-center shadow-lg">
              <p className="text-gray-400 text-sm md:text-base">
                Partida em {match.maps.length > 0 ? match.maps.map(m => m.mapname).join(', ') : 'Mapa Desconhecido'}
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-2xl md:text-4xl font-bold my-2">
                <span className={`min-w-0 break-words ${match.winner === match.team1_name ? 'text-green-400' : ''}`}>{match.team1_name}</span>
                <span className="font-mono whitespace-nowrap">{totalTeam1Rounds} : {totalTeam2Rounds}</span>
                <span className={`min-w-0 break-words ${match.winner === match.team2_name ? 'text-green-400' : ''}`}>{match.team2_name}</span>
              </div>
              <p className="text-sm text-gray-400">Vencedor: <span className="font-semibold text-green-400">{match.winner}</span></p>
            </div>
          </header>

          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full text-sm responsive-table stats-table">
              <caption className="sr-only">Estatísticas dos jogadores na partida, agrupadas por time.</caption>
              <thead className="bg-gray-900/50">
                <tr className="border-b border-gray-700">
                  <th scope="col" className="p-3 text-center font-semibold">Rank</th>
                  <th scope="col" className="p-3 text-left font-semibold">Jogador</th>
                  <MetricHeader label="K-D" description="Kills - Deaths" className="p-3 text-right font-semibold" />
                  <MetricHeader label="+/-" description="Diferença entre Kills e Deaths" className="p-3 text-right font-semibold" />
                  <MetricHeader label="A" description="Assistências" className="p-3 text-right font-semibold" />
                  <MetricHeader label="HS%" description="Percentual de Headshots" className="p-3 text-right font-semibold" />
                  <MetricHeader label="KDR" description="Kill/Death Ratio (Kills / Deaths)" className="p-3 text-right font-semibold" />
                  <MetricHeader label="Rating" description={RATING_DESCRIPTION} className="p-3 md:pr-6 text-right font-semibold" />
                </tr>
              </thead>
              <tbody className="bg-gray-800">
                {/* Team 1 */}
                <tr className="bg-gray-900/30 responsive-table-header-group">
                  <td colSpan="8" className={`px-3 py-2 font-bold text-lg ${match.winner === match.team1_name ? 'text-green-400' : ''}`}>
                    <span className="inline-flex items-center gap-2">
                      {match.team1_name}
                      {match.winner === match.team1_name && <Trophy aria-label="Time vencedor" className="h-4 w-4" />}
                    </span>
                  </td>
                </tr>
                {team1Players.map(renderPlayerRow)}

                {/* Team 2 */}
                <tr className="bg-gray-900/30 responsive-table-header-group">
                  <td colSpan="8" className={`px-3 py-2 font-bold text-lg ${match.winner === match.team2_name ? 'text-green-400' : ''}`}>
                    <span className="inline-flex items-center gap-2">
                      {match.team2_name}
                      {match.winner === match.team2_name && <Trophy aria-label="Time vencedor" className="h-4 w-4" />}
                    </span>
                  </td>
                </tr>
                {team2Players.map(renderPlayerRow)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
