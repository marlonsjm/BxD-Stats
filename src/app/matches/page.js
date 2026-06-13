import { Breadcrumbs } from "@/components/Breadcrumbs";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MetricHeader } from "@/components/MetricHeader";

export const revalidate = 300;

export const metadata = {
  title: "Histórico de Partidas",
  description: "Todas as partidas de CS2 jogadas no servidor BxD, com placares e mapas.",
};

async function getAllMatches() {
  const matches = await prisma.match.findMany({
    select: {
      matchid: true,
      start_time: true,
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
        },
      },
    },
    orderBy: { start_time: 'desc' },
  });
  return matches;
}

export default async function MatchesPage() {
  const matches = await getAllMatches();

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { label: "Partidas" },
  ];

  return (
    <TooltipProvider>
      <div className="text-white py-4 md:py-8">
        <div className="container mx-auto">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold">Histórico de Partidas</h1>
            <p className="text-gray-400 mt-2">Todas as partidas jogadas no servidor.</p>
            <p className="text-xs text-gray-500 mt-1">Dados atualizados automaticamente a cada 5 minutos.</p>
          </header>

          {matches.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Nenhuma partida registrada ainda.</p>
          ) : (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full text-sm responsive-table stats-table">
              <caption className="sr-only">Histórico de partidas com placar, mapas, vencedor e data.</caption>
              <thead className="bg-gray-900/50">
                <tr className="border-b border-gray-700">
                  <th scope="col" className="p-3 text-left font-semibold">Partida</th>
                  <MetricHeader label="Placar" description="Resultado da partida no formato: rounds (vitórias na série)" className="p-3 text-center font-semibold" />
                  <th scope="col" className="p-3 text-left font-semibold">Mapa</th>
                  <th scope="col" className="p-3 text-left font-semibold">Vencedor</th>
                  <th scope="col" className="p-3 md:pr-6 text-left font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800">
                {matches.map(match => {
                  const firstMap = match.maps[0];
                  const mapName = match.maps.length > 0 ? match.maps.map(m => m.mapname).join(', ') : 'N/A';
                  const team1Rounds = firstMap ? firstMap.team1_score : 0;
                  const team2Rounds = firstMap ? firstMap.team2_score : 0;
                  const team1MatchScore = match.team1_score;
                  const team2MatchScore = match.team2_score;

                  return (
                    <tr key={match.matchid}>
                      <td data-label="Partida" className="p-3 md:text-left">
                        <Link href={`/match/${match.matchid}`} className="inline-flex items-center font-medium text-white hover:underline">
                          {match.team1_name} vs {match.team2_name}
                        </Link>
                      </td>
                      <td data-label="Placar" className="p-3 font-mono">
                        <span className={match.winner === match.team1_name ? 'text-green-500 font-bold' : match.winner === match.team2_name ? 'text-red-500' : ''}>
                          {team1Rounds} ({team1MatchScore})
                        </span>
                        <span> : </span>
                        <span className={match.winner === match.team2_name ? 'text-green-500 font-bold' : match.winner === match.team1_name ? 'text-red-500' : ''}>
                          {team2Rounds} ({team2MatchScore})
                        </span>
                      </td>
                      <td data-label="Mapa" className="p-3 text-gray-400 md:text-left">{mapName}</td>
                      <td data-label="Vencedor" className={`p-3 font-semibold md:text-left ${match.winner === match.team1_name || match.winner === match.team2_name ? 'text-green-500' : ''}`}>
                        {match.winner || 'Empate'}
                      </td>
                      <td data-label="Data" className="p-3 md:pr-6 text-gray-400 md:text-left">{new Date(match.start_time).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

