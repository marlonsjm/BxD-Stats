
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKillsRanking, getHeadshotRankings, getClutchRankings, getEntryFragRankings, getMultiKillRankings, getADRRanking, getAccuracyRanking } from "@/lib/rankings";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MetricHeader } from "@/components/MetricHeader";

export const dynamic = 'force-dynamic';

function RankingTable({ title, description, data, columnHeader, columnDescription }) {
  return (
    <Card className="bg-gray-800 border-gray-700 text-white md:rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">{title}</CardTitle>
        {description && <p className="text-gray-400 text-sm mt-2">{description}</p>}
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm responsive-table">
            <thead className="bg-gray-900">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Player</th>
                <MetricHeader
                  label={columnHeader}
                  description={columnDescription}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                />
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

function MultiKillTable({ data }) {
  return (
    <Card className="bg-gray-800 border-gray-700 text-white md:rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Top Multi-Kills</CardTitle>
        <p className="text-gray-400 text-sm mt-2">Jogadores com mais rounds de alto impacto (3K, 4K e ACE).</p>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm responsive-table">
            <thead className="bg-gray-900">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-16">Rank</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Player</th>
                <MetricHeader label="Total" description="Total de rounds com 3K, 4K ou 5K" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" />
                <MetricHeader label="3K" description="Rounds com 3 kills" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" />
                <MetricHeader label="4K" description="Rounds com 4 kills" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" />
                <MetricHeader label="ACE" description="Rounds com 5 kills (ace)" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" />
              </tr>
            </thead>
            <tbody className="bg-gray-800">
              {data.map((player) => (
                <tr key={player.rank} className="last:border-b-0">
                  <td data-label="Rank" className="px-4 py-3 font-medium text-left">{player.rank}</td>
                  <td data-label="Player" className="px-4 py-3 text-left">
                    <Link href={`/player/${player.steamid64}`} className="hover:text-white hover:underline">
                      {player.name}
                    </Link>
                  </td>
                  <td data-label="Total" className="px-4 py-3 font-bold text-center">{player.value}</td>
                  <td data-label="3K" className="px-4 py-3 text-yellow-400 font-mono text-center">{player.enemy3ks}</td>
                  <td data-label="4K" className="px-4 py-3 text-orange-400 font-mono text-center">{player.enemy4ks}</td>
                  <td data-label="ACE" className="px-4 py-3 text-red-400 font-bold font-mono text-center">{player.enemy5ks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function KillsTable({ data }) {
  return (
    <Card className="bg-gray-800 border-gray-700 text-white md:rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Ranking Geral (Kills)</CardTitle>
        <p className="text-gray-400 text-sm mt-2">Jogadores com mais abates acumulados em todas as partidas do servidor.</p>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm responsive-table">
            <thead className="bg-gray-900">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-16">Rank</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Player</th>
                <MetricHeader label="Kills" description="Total de abates" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" />
                <MetricHeader label="Deaths" description="Total de mortes" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" />
                <MetricHeader label="+/-" description="Diferença entre abates e mortes" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" />
                <MetricHeader label="KDR" description="Razão entre kills e deaths" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" />
                <MetricHeader label="Mapas" description="Total de mapas jogados" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" />
              </tr>
            </thead>
            <tbody className="bg-gray-800">
              {data.map((player) => (
                <tr key={player.rank} className="last:border-b-0">
                  <td data-label="Rank" className="px-4 py-3 font-medium text-left">{player.rank}</td>
                  <td data-label="Player" className="px-4 py-3 text-left">
                    <Link href={`/player/${player.steamid64}`} className="hover:text-white hover:underline">
                      {player.name}
                    </Link>
                  </td>
                  <td data-label="Kills" className="px-4 py-3 font-bold text-green-400 text-center">{player.kills}</td>
                  <td data-label="Deaths" className="px-4 py-3 text-red-400 text-center">{player.deaths}</td>
                  <td data-label="+/-" className={`px-4 py-3 font-mono text-center ${player.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {player.diff >= 0 ? `+${player.diff}` : player.diff}
                  </td>
                  <td data-label="KDR" className="px-4 py-3 text-center">{player.kdr}</td>
                  <td data-label="Mapas" className="px-4 py-3 text-center text-gray-400">{player.maps}</td>
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
  const [killsRanking, headshotRankings, clutchRankings, entryFragRankings, multiKillRankings, adrRanking, accuracyRanking] = await Promise.all([
    getKillsRanking(),
    getHeadshotRankings(),
    getClutchRankings(),
    getEntryFragRankings(),
    getMultiKillRankings(),
    getADRRanking(),
    getAccuracyRanking(),
  ]);

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { label: "Rankings" },
  ];

  const metricDescriptions = {
    "HS %": "Percentual de abates que foram headshots. (Mínimo de 50 abates)",
    "Clutches Won": "Total de rounds vencidos em uma situação de 1 contra X inimigos.",
    "Entry Success Rate": "Percentual de sucesso ao conseguir o primeiro abate para o time no round. (Mínimo de 20 tentativas de entry)",
    "Dano/Mapa": "Média de dano causado por mapa jogado. (Mínimo de 5 mapas)",
    "Precisão": "Percentual de tiros que acertaram o alvo. (Mínimo de 500 tiros disparados)",
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Rankings Detalhados</h1>
          <p className="text-gray-400 mt-2">Explore as classificações de jogadores por categorias específicas.</p>
        </header>
        <div className="space-y-8">
          <KillsTable data={killsRanking} />
          <MultiKillTable data={multiKillRankings} />
          <RankingTable title="Top Headshots" data={headshotRankings} columnHeader="HS %" columnDescription={metricDescriptions["HS %"]} />
          <RankingTable title="Top Clutches (1vX)" data={clutchRankings} columnHeader="Clutches Won" columnDescription={metricDescriptions["Clutches Won"]} />
          <RankingTable title="Top Entry Fraggers" data={entryFragRankings} columnHeader="Entry Success Rate" columnDescription={metricDescriptions["Entry Success Rate"]} />
          <RankingTable title="Top Dano por Mapa" data={adrRanking} columnHeader="Dano/Mapa" columnDescription={metricDescriptions["Dano/Mapa"]} />
          <RankingTable title="Top Precisão" data={accuracyRanking} columnHeader="Precisão" columnDescription={metricDescriptions["Precisão"]} />
        </div>
      </div>
    </TooltipProvider>
  );
}
