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
  const allStats = await prisma.playerStats.findMany({
    include: {
      map: {
        select: {
          team1_score: true,
          team2_score: true,
        },
      },
    },
  });

  const aggregatedPlayers = {};

  allStats.forEach(stat => {
    const roundsInMap = stat.map ? stat.map.team1_score + stat.map.team2_score : 0;

    if (!aggregatedPlayers[stat.steamid64]) {
      // If player is not in the aggregator, create them with the current stats
      aggregatedPlayers[stat.steamid64] = {
        steamid64: stat.steamid64,
        name: stat.name, // Use the name from the first stat encountered
        kills: stat.kills,
        deaths: stat.deaths,
        assists: stat.assists,
        head_shot_kills: stat.head_shot_kills,
        damage: stat.damage,
        totalRounds: roundsInMap,
        mapsPlayed: 1,
      };
    } else {
      // If player exists, just add the new stats to their totals
      const player = aggregatedPlayers[stat.steamid64];
      player.kills += stat.kills;
      player.deaths += stat.deaths;
      player.assists += stat.assists;
      player.head_shot_kills += stat.head_shot_kills;
      player.damage += stat.damage;
      player.totalRounds += roundsInMap;
      player.mapsPlayed += 1;
    }
  });

  const players = Object.values(aggregatedPlayers).map(p => {
    const kdr = p.deaths > 0 ? (p.kills / p.deaths) : p.kills;
    const hs_percent = p.kills > 0 ? ((p.head_shot_kills / p.kills) * 100) : 0;
    const adr = p.totalRounds > 0 ? (p.damage / p.totalRounds) : 0;

    return {
      steamid64: p.steamid64,
      name: p.name,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      mapsPlayed: p.mapsPlayed,
      diff: p.kills - p.deaths,
      hs_percent: hs_percent.toFixed(1),
      kdr: kdr,
      adr: adr,
    };
  }).sort((a, b) => b.kills - a.kills);

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
            <p className="text-gray-400 mt-2">Estatísticas agregadas de todos os jogadores, ordenadas por total de Kills.</p>
          </header>

          <div className="bg-gray-800 md:rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full text-sm responsive-table">
              <thead className="bg-gray-900/50">
                <tr className="border-b border-gray-700">
                  <th scope="col" className="p-3 text-center font-semibold w-16">Rank</th>
                  <th scope="col" className="p-3 text-left font-semibold">Jogador</th>
                  <MetricHeader label="Kills" description="Total de abates" />
                  <MetricHeader label="Deaths" description="Total de mortes" />
                  <MetricHeader label="+/-" description="Diferença entre Kills e Deaths" />
                  <MetricHeader label="ADR" description="Dano Médio por Round" />
                  <MetricHeader label="HS%" description="Percentual de Headshots" />
                  <MetricHeader label="KDR" description="Kill/Death Ratio (Kills / Deaths)" />
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
                      <td data-label="Kills" className="p-3 font-mono text-right md:text-center">{player.kills}</td>
                      <td data-label="Deaths" className="p-3 font-mono text-right md:text-center">{player.deaths}</td>
                      <td data-label="+/-" className={`p-3 font-mono text-right md:text-center ${diffColor}`}>{`${diffSign}${player.diff}`}</td>
                      <td data-label="ADR" className="p-3 font-mono text-right md:text-center">{player.adr.toFixed(0)}</td>
                      <td data-label="HS%" className="p-3 font-mono text-right md:text-center">{player.hs_percent}%</td>
                      <td data-label="KDR" className="p-3 font-mono text-right md:text-center">{player.kdr.toFixed(2)}</td>
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