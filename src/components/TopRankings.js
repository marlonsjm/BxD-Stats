import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverallRanking, getHeadshotRankings, getClutchRankings, getEntryFragRankings } from "@/lib/rankings";

async function RankingList({ title, data, unit, href }) {
  return (
    <Card className="bg-gray-800 border-gray-700 text-white flex flex-col">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-white">{title}</CardTitle>
        <Link href={href} className="text-sm text-gray-400 hover:text-white">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent className="flex-grow">
        <ol className="space-y-2">
          {data.map((player, index) => (
            <li key={index} className="flex items-center justify-between text-sm">
              <span className="flex items-center min-w-0">
                <span className="font-bold w-6 text-center">{player.rank}</span>
                <Link href={`/player/${player.steamid64}`} className="ml-2 hover:text-white hover:underline break-all">
                  {player.name}
                </Link>
              </span>
              <span className="font-semibold">{player.value}{unit}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default async function TopRankings() {
  const [topOverall, topHeadshots, topClutches, topEntries] = await Promise.all([
    getOverallRanking(5),
    getHeadshotRankings(5),
    getClutchRankings(5),
    getEntryFragRankings(5),
  ]);

  return (
    <section className="w-full py-8">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold mb-2 text-white text-center">Destaques do Servidor</h2>
        <p className="text-center text-gray-400 mb-6 text-sm max-w-2xl mx-auto">
          O Ranking por Pontos (RP) é calculado com base no resultado da partida (vitória/derrota) e ajustado pelo desempenho individual de cada jogador.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <RankingList title="Top 5 Geral (Pontos)" data={topOverall} href="/rankings" />
          <RankingList title="Top 5 Headshots" data={topHeadshots} href="/rankings" />
          <RankingList title="Top 5 Clutches" data={topClutches} href="/rankings" />
          <RankingList title="Top 5 Entry Frags" data={topEntries} href="/rankings" />
        </div>
      </div>
    </section>
  );
}
