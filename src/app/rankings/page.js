
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverallRanking, getHeadshotRankings, getClutchRankings, getEntryFragRankings } from "@/lib/rankings";
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

export default async function RankingsPage() {
  const [overallRanking, headshotRankings, clutchRankings, entryFragRankings] = await Promise.all([
    getOverallRanking(),
    getHeadshotRankings(),
    getClutchRankings(),
    getEntryFragRankings(),
  ]);

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { label: "Rankings" },
  ];

  const generalRankingDescription = `
    Este ranking utiliza um sistema de pontos (RP) para avaliar o desempenho dos jogadores. A vitória é o fator principal: jogadores do time vencedor ganham uma base de +20 RP, enquanto os do time perdedor perdem -15 RP. Essa base é então ajustada pelo desempenho individual na partida, considerando ADR, Kills, Assists, Multi-Kills, Clutches e Entry Frags. Um bom desempenho individual pode amenizar a perda de pontos em uma derrota ou aumentar o ganho em uma vitória.
  `;

  const metricDescriptions = {
    "Pontos": "Pontuação geral do jogador, calculada com base em uma fórmula que considera Kills, Deaths, Assists, ADR, Multi-Kills, Clutches e Entry Frags.",
    "HS %": "Percentual de abates que foram headshots. (Mínimo de 50 abates)",
    "Clutches Won": "Total de rounds vencidos em uma situação de 1 contra X inimigos.",
    "Entry Success Rate": "Percentual de sucesso ao conseguir o primeiro abate para o time no round. (Mínimo de 20 tentativas de entry)",
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
          <RankingTable
            title="Ranking Geral por Pontos"
            description={generalRankingDescription}
            data={overallRanking}
            columnHeader="Pontos"
            columnDescription={metricDescriptions["Pontos"]}
          />
          <RankingTable title="Top Headshots" data={headshotRankings} columnHeader="HS %" columnDescription={metricDescriptions["HS %"]} />
          <RankingTable title="Top Clutches (1vX)" data={clutchRankings} columnHeader="Clutches Won" columnDescription={metricDescriptions["Clutches Won"]} />
          <RankingTable title="Top Entry Fraggers" data={entryFragRankings} columnHeader="Entry Success Rate" columnDescription={metricDescriptions["Entry Success Rate"]} />
        </div>
      </div>
    </TooltipProvider>
  );
}
