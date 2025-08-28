
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHeadshotRankings, getClutchRankings, getEntryFragRankings } from "@/lib/rankings";



function RankingTable({ title, data, columnHeader }) {
  return (
    <Card className="bg-gray-800 border-gray-700 text-white md:rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm responsive-table">
            <thead className="bg-gray-900">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Player</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">{columnHeader}</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800">
              {data.map((player) => (
                <tr key={player.rank} className="last:border-b-0">
                  <td data-label="Rank" className="px-4 py-3 font-medium md:text-left">{player.rank}</td>
                  <td data-label="Player" className="px-4 py-3 md:text-left">
                    <Link href={`/player/${player.steamid64}`} className="hover:text-white hover:underline">
                      {player.name}
                    </Link>
                  </td>
                  <td data-label={columnHeader} className="px-4 py-3 font-bold md:text-left">{player.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function RankingsPage() {
  const [headshotRankings, clutchRankings, entryFragRankings] = await Promise.all([
    getHeadshotRankings(),
    getClutchRankings(),
    getEntryFragRankings(),
  ]);

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { label: "Rankings" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Rankings Detalhados</h1>
        <p className="text-gray-400 mt-2">Explore as classificações de jogadores por categorias específicas.</p>
      </header>
      <div className="space-y-8">
        <RankingTable title="Top Headshots" data={headshotRankings} columnHeader="HS %" />
        <RankingTable title="Top Clutches (1vX)" data={clutchRankings} columnHeader="Clutches Won" />
        <RankingTable title="Top Entry Fraggers" data={entryFragRankings} columnHeader="Entry Success Rate" />
      </div>
    </div>
  );
}
