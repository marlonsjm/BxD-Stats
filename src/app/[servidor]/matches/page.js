import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getStats } from "@/lib/stats";
import { statusPartida } from "@/lib/partidas";
import { rota } from "@/lib/servidores";
import { SeloAoVivo } from "@/components/SeloAoVivo";
import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MetricHeader } from "@/components/MetricHeader";
import { formatMatchDate, toDateTimeAttribute } from "@/lib/date";

export const revalidate = 300;

export const metadata = {
  title: "Histórico de Partidas",
  description: "Todas as partidas de CS2 jogadas no servidor BxD, com placares e mapas.",
};

async function getAllMatches(servidor) {
  const { partidas, mapas, inicioMaisRecente } = await getStats(servidor);

  // Partida sem fim: aparece como "ao vivo" se for a ultima e recente; senao
  // foi abandonada e some. Ver lib/partidas.js.
  const mapsByMatchId = {};
  mapas.forEach(m => {
    if (!mapsByMatchId[m.matchid]) mapsByMatchId[m.matchid] = [];
    mapsByMatchId[m.matchid].push(m);
  });

  const matches = partidas
    .map(m => ({ ...m, status: statusPartida(m, inicioMaisRecente), maps: mapsByMatchId[m.matchid] || [] }))
    .filter(m => m.status !== 'abandonada')
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  return { matches, mapCount: mapas.length };
}

export default async function MatchesPage({ params }) {
  const { servidor } = await params;
  const { matches, mapCount } = await getAllMatches(servidor);

  const breadcrumbItems = [
    { href: rota(servidor), label: "Home" },
    { label: "Partidas" },
  ];

  return (
    <TooltipProvider>
      <div className="text-white py-4 md:py-8">
        <div className="container mx-auto">
          <Breadcrumbs items={breadcrumbItems} servidor={servidor} />
          <header className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold">Histórico de Partidas</h1>
            <p className="text-gray-400 mt-2">Todas as partidas jogadas no servidor.</p>
            <p className="text-xs text-gray-500 mt-1">Dados atualizados automaticamente a cada 5 minutos.</p>
          </header>

          {matches.length === 0 ? (
            <div className="text-center text-gray-400 py-12 space-y-2">
              <p>Nenhuma partida registrada na tabela <code className="text-gray-300">matchzy_stats_matches</code>.</p>
              {mapCount > 0 && (
                <p className="text-sm">
                  Porém existem <strong className="text-white">{mapCount}</strong> mapa(s) na tabela <code className="text-gray-300">matchzy_stats_maps</code>.<br />
                  Isso indica dados importados sem a tabela de partidas, ou <code className="text-gray-300">matchid</code> divergente entre as tabelas.
                </p>
              )}
            </div>
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
                        <Link href={rota(servidor, `/match/${match.matchid}`)} className="inline-flex items-center font-medium text-white hover:underline">
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
                        {match.status === 'ao-vivo' ? <SeloAoVivo /> : (match.winner || 'Empate')}
                      </td>
                      <td data-label="Data" className="p-3 md:pr-6 text-gray-400 md:text-left"><time dateTime={toDateTimeAttribute(match.start_time)}>{formatMatchDate(match.start_time)}</time></td>
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

