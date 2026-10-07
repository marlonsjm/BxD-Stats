import TopRankings from "@/components/TopRankings";
import { getStats } from "@/lib/stats";
import { SERVIDORES, rota } from "@/lib/servidores";
import { SeloServidor } from "@/components/SeloServidor";
import { PlayerCard } from "@/components/PlayerCard";
import Image from "next/image";
import Link from "next/link";
import { getCloudinaryImages } from "../gallery/actions";
import { getPlayerAvatars } from "@/lib/steam";

// Cache com revalidação: o banco é consultado no máximo a cada 5 minutos por página
export const revalidate = 300;

async function getTopPlayers(servidor) {
  const { linhasFinalizadas: allStats } = await getStats(servidor);

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
  const topPlayers = sortedPlayers.slice(0, 5);

  const avatars = await getPlayerAvatars(topPlayers.map(p => p.steamid64.toString()));
  topPlayers.forEach(p => {
    p.avatar = avatars.get(p.steamid64.toString())?.medium || null;
  });

  return topPlayers;
}

async function getOverallStats(servidor) {
  const { partidas, finalizada, linhasFinalizadas } = await getStats(servidor);
  return {
    totalMatches: partidas.filter(p => finalizada(p.matchid)).length,
    totalKills: linhasFinalizadas.reduce((s, l) => s + (l.kills || 0), 0),
    totalHeadshots: linhasFinalizadas.reduce((s, l) => s + (l.head_shot_kills || 0), 0),
  };
}

// Helper function to get random items from an array
function getRandomItems(arr, num) {
  if (!arr || arr.length === 0) {
    return [];
  }
  if (arr.length <= num) {
    return arr;
  }
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

export default async function Home({ params }) {
  const { servidor } = await params;
  const [topPlayers, overallStats, allImages] = await Promise.all([
    getTopPlayers(servidor),
    getOverallStats(servidor),
    getCloudinaryImages(),
  ]);

  const randomImages = getRandomItems(allImages, 3);

  const StatCard = ({ value, label }) => (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg text-center shadow-lg">
      <p className="text-3xl md:text-4xl font-bold font-mono text-white">{value.toLocaleString('pt-BR')}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  );

  return (
    <div className="text-white py-4 md:py-8">
      <div className="container mx-auto space-y-12 md:space-y-16">
        <section className="text-center pt-8 md:pt-16 pb-4 md:pb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 font-orbitron">
            BxD STATS
          </h1>
          <SeloServidor servidor={servidor} className="mb-4" />
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Acompanhe as estatísticas, veja os resultados das partidas e o ranking dos jogadores do servidor {SERVIDORES[servidor].label}.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={rota(servidor, "/matches")}
              className="inline-flex w-full sm:w-auto items-center justify-center min-h-[48px] bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold px-8 rounded-lg transition-colors"
            >
              Ver Partidas
            </Link>
            <Link
              href={rota(servidor, "/rankings")}
              className="inline-flex w-full sm:w-auto items-center justify-center min-h-[48px] bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 rounded-lg transition-colors"
            >
              Ver Rankings
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Estatísticas Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard value={overallStats.totalMatches} label="Partidas Jogadas" />
            <StatCard value={overallStats.totalKills} label="Kills Totais" />
            <StatCard value={overallStats.totalHeadshots} label="Headshots Totais" />
          </div>
        </section>

        <TopRankings servidor={servidor} />

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Top 5 Kills</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {topPlayers.map((player, index) => (
              <PlayerCard key={player.steamid64} servidor={servidor} player={player} rank={index + 1} />
            ))}
          </div>
        </section>

        <section className="text-center">
          <Link href={rota(servidor, "/players")} className="inline-flex items-center justify-center min-h-[48px] bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 hover:scale-105">
            Ver Ranking Completo
          </Link>
        </section>

        <section className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Galeria da Comunidade</h2>
          <p className="text-gray-400 mb-4">Veja as melhores fotos e vídeos das nossas partidas.</p>

          {randomImages.length > 0 && (
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {randomImages.map((image) => (
                <Link key={image.src} href="/gallery">
                  <div className="relative aspect-video overflow-hidden rounded-lg group cursor-pointer">
                    <Image
                      src={image.thumbnail || image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link href="/gallery" className="inline-flex items-center justify-center min-h-[48px] bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 hover:scale-105">
            Acessar Galeria
          </Link>
        </section>
      </div>
    </div>
  );
}
