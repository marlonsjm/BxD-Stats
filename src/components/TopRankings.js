import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKillsRanking, getHeadshotRankings, getClutchRankings, getEntryFragRankings } from "@/lib/rankings";

async function RankingList({ title, data, unit, href }) {
  return (
    <Card className="bg-gray-800 border-gray-700 text-white flex flex-col">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-white">{title}</CardTitle>
        <Link href={href} className="inline-flex min-h-[40px] items-center px-2 -mr-2 text-sm text-gray-400 hover:text-white">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent className="flex-grow">
        <ol className="divide-y divide-gray-700/50">
          {data.map((player, index) => (
            <li key={index} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 flex-1 items-center">
                <span className="font-bold w-6 shrink-0 text-center">{player.rank}</span>
                <Link href={`/player/${player.steamid64}`} className="ml-2 inline-flex min-h-[40px] min-w-0 items-center hover:text-white hover:underline">
                  <span className="truncate">{player.name}</span>
                </Link>
              </span>
              <span className="shrink-0 font-semibold font-mono">{player.value}{unit}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default async function TopRankings() {
  const [topOverall, topHeadshots, topClutches, topEntries] = await Promise.all([
    getKillsRanking(5),
    getHeadshotRankings(5),
    getClutchRankings(5),
    getEntryFragRankings(5),
  ]);

  return (
    <section className="w-full py-8">
      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white text-center">Destaques do Servidor</h2>
      <p className="text-center text-gray-400 mb-6 text-sm max-w-2xl mx-auto">
        Rankings acumulados de todos os jogadores do servidor com base em desempenho individual.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
        <RankingList title="Top 5 Geral (Kills)" data={topOverall} href="/rankings" />
        <RankingList title="Top 5 Headshots" data={topHeadshots} href="/rankings" />
        <RankingList title="Top 5 Clutches" data={topClutches} href="/rankings" />
        <RankingList title="Top 5 Entry Frags" data={topEntries} href="/rankings" />
      </div>
    </section>
  );
}
