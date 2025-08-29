import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const prisma = new PrismaClient();

async function getPlayerRankings() {
  // 1. Include map data to get the winner
  const allStats = await prisma.playerStats.findMany({
    include: {
      map: {
        select: {
          winner: true,
        },
      },
    },
  });

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
        wins: 0,       // 2. Add wins
        losses: 0,     // 2. Add losses
      };
    }
    const player = aggregatedPlayers[stat.steamid64];
    player.names.add(stat.name);
    player.kills += stat.kills;
    player.deaths += stat.deaths;
    player.assists += stat.assists;
    player.head_shot_kills += stat.head_shot_kills;
    player.mapsPlayed += 1;

    // 3. Tally wins and losses by comparing player's team with the map winner
    if (stat.map && stat.map.winner) {
      if (stat.map.winner === stat.team) {
        player.wins += 1;
      } else {
        player.losses += 1;
      }
    }
  });

  const players = Object.values(aggregatedPlayers).map(p => {
    // 4. Calculate KDR and WLR, handling division by zero
    const kdr = p.deaths > 0 ? (p.kills / p.deaths) : p.kills;
    const wlr = p.losses > 0 ? (p.wins / p.losses) : p.wins;

    return {
      steamid64: p.steamid64,
      name: Array.from(p.names)[0],
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      mapsPlayed: p.mapsPlayed,
      diff: p.kills - p.deaths,
      hs_percent: p.kills > 0 ? ((p.head_shot_kills / p.kills) * 100).toFixed(1) : '0.0',
      wins: p.wins,
      losses: p.losses,
      kdr: kdr,
      wlr: wlr,
    };
  }).sort((a, b) => {
    // 5. Implement new sorting logic
    // Primary sort: WLR descending
    if (b.wlr > a.wlr) return 1;
    if (b.wlr < a.wlr) return -1;

    // Secondary sort: KDR descending
    if (b.kdr > a.kdr) return 1;
    if (b.kdr < a.kdr) return -1;

    // Tertiary sort: Assists descending
    return b.assists - a.assists;
  });

  return players;
}

import { MetricHeader } from "@/components/MetricHeader";

export default async function PlayersPage() {
  const players = await getPlayerRankings();

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { label: "Jogadores" },
  ];

  return (
    <TooltipProvider>
      <main className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
        <div className="container mx-auto">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold">Ranking de Jogadores</h1>
            <p className="text-gray-400 mt-2">Estatísticas agregadas de todos os jogadores, ordenadas por Win/Loss Ratio (e KDR/Assistências como desempate).</p>
          </header>

          <div className="bg-gray-800 md:rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full text-sm responsive-table">
              <thead className="bg-gray-900/50">
                <tr className="border-b border-gray-700">
                  <th scope="col" className="p-3 text-center font-semibold w-16">Rank</th>
                  <th scope="col" className="p-3 text-left font-semibold">Jogador</th>
                  <MetricHeader label="W-L" description="Vitórias - Derrotas" />
                  <MetricHeader label="K-D" description="Kills - Deaths" />
                  <MetricHeader label="+/-" description="Diferença entre Kills e Deaths" />
                  <MetricHeader label="A" description="Assistências" />
                  <MetricHeader label="HS%" description="Percentual de Headshots" />
                  <MetricHeader label="KDR" description="Kill/Death Ratio (Kills / Deaths)" />
                  <MetricHeader label="WLR" description="Win/Loss Ratio (Vitórias / Derrotas)" />
                  <MetricHeader label="Mapas" description="Número de mapas jogados" />
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => {
                  const diffColor = player.diff > 0 ? 'text-green-500' : player.diff < 0 ? 'text-red-500' : 'text-gray-400';
                  const diffSign = player.diff > 0 ? '+' : '';

                  return (
                    <tr key={player.steamid64} className="last:border-b-0">
                      <td data-label="Rank" className="p-3 font-bold text-gray-400 md:text-center">#{index + 1}</td>
                      <td data-label="Jogador" className="p-3 text-right md:text-left">
                        <Link href={`/player/${player.steamid64}`} className="text-white hover:underline">
                          {player.name}
                        </Link>
                      </td>
                      <td data-label="W-L" className="p-3 font-mono text-right md:text-center">{`${player.wins}-${player.losses}`}</td>
                      <td data-label="K-D" className="p-3 font-mono text-right md:text-center">{`${player.kills}-${player.deaths}`}</td>
                      <td data-label="+/-" className={`p-3 font-mono text-right md:text-center ${diffColor}`}>{`${diffSign}${player.diff}`}</td>
                      <td data-label="Assists" className="p-3 font-mono text-right md:text-center">{player.assists}</td>
                      <td data-label="HS%" className="p-3 font-mono text-right md:text-center">{player.hs_percent}%</td>
                      <td data-label="KDR" className="p-3 font-mono text-right md:text-center">{player.kdr.toFixed(2)}</td>
                      <td data-label="WLR" className="p-3 font-mono text-right md:text-center">{player.wlr.toFixed(2)}</td>
                      <td data-label="Mapas" className="p-3 font-mono text-right md:text-center">{player.mapsPlayed}</td>
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