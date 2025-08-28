import TopRankings from "@/components/TopRankings";
import prisma from "@/lib/prisma";
import { PlayerCard } from "@/components/PlayerCard";
import Image from "next/image";
import Link from "next/link";

async function getTopPlayers() {
  const allStats = await prisma.playerStats.findMany({
    select: {
      steamid64: true,
      name: true,
      kills: true,
    }
  });

  const aggregatedPlayers = {};
  allStats.forEach(stat => {
    if (!aggregatedPlayers[stat.steamid64]) {
      aggregatedPlayers[stat.steamid64] = {
        steamid64: stat.steamid64,
        name: stat.name,
        kills: 0,
      };
    }
    aggregatedPlayers[stat.steamid64].kills += stat.kills;
  });

  const sortedPlayers = Object.values(aggregatedPlayers).sort((a, b) => b.kills - a.kills);
  return sortedPlayers.slice(0, 5);
}

async function getOverallStats() {
  const matchCountPromise = prisma.match.count();
  const statsPromise = prisma.playerStats.aggregate({
    _sum: {
      kills: true,
      head_shot_kills: true,
    },
  });

  const [matchCount, totalStats] = await Promise.all([matchCountPromise, statsPromise]);

  return {
    totalMatches: matchCount,
    totalKills: totalStats._sum.kills || 0,
    totalHeadshots: totalStats._sum.head_shot_kills || 0,
  };
}

export default async function Home() {
  const [topPlayers, overallStats] = await Promise.all([
    getTopPlayers(),
    getOverallStats(),
  ]);

  const StatCard = ({ value, label }) => (
    <div className="bg-gray-800 p-6 rounded-lg text-center shadow-lg">
      <p className="text-3xl md:text-4xl font-bold font-mono text-white">{value.toLocaleString('pt-BR')}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  );

  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      <div className="container mx-auto space-y-16">
        <section className="text-center pt-16 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 font-orbitron">
            BxD STATS
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Acompanhe as estatísticas, veja os resultados das partidas e o ranking dos jogadores do nosso servidor.
          </p>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard value={overallStats.totalMatches} label="Partidas Jogadas" />
            <StatCard value={overallStats.totalKills} label="Kills Totais" />
            <StatCard value={overallStats.totalHeadshots} label="Headshots Totais" />
          </div>
        </section>

        <TopRankings />

        <section>
          <h2 className="text-3xl font-bold text-center mb-8">Top 5 Fraggers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {topPlayers.map((player, index) => (
              <PlayerCard key={player.steamid64} player={player} rank={index + 1} />
            ))}
          </div>
        </section>

        <section className="text-center">
            <Link href="/players" className="inline-block bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 hover:scale-105">
              Ver Ranking Completo
            </Link>
        </section>

        <section className="text-center">
          <h2 className="text-3xl font-bold text-center mb-8">Galeria da Comunidade</h2>
          <p className="text-gray-400 mb-8">Veja as melhores fotos e vídeos das nossas partidas.</p>
          <Link href="/gallery" className="inline-block bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 hover:scale-105">
            Acessar Galeria
          </Link>
        </section>
      </div>
    </main>
  );
}
