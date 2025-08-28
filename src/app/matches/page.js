import { Breadcrumbs } from "@/components/Breadcrumbs";
import prisma from "@/lib/prisma";
import Link from "next/link";

async function getAllMatches() {
  const matches = await prisma.match.findMany({
    include: {
      maps: true, // Include map data to show the map name
    },
    orderBy: {
      start_time: 'desc',
    },
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
    <main className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Histórico de Partidas</h1>
          <p className="text-gray-400 mt-2">Todas as partidas jogadas no servidor.</p>
        </header>

        <div className="bg-gray-800 md:rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full text-sm responsive-table">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700">
                <th scope="col" className="p-3 text-left font-semibold">Partida</th>
                <th scope="col" className="p-3 text-center font-semibold">Placar</th>
                <th scope="col" className="p-3 text-left font-semibold">Mapa</th>
                <th scope="col" className="p-3 text-left font-semibold">Vencedor</th>
                <th scope="col" className="p-3 text-left font-semibold">Data</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800">
              {matches.map(match => {
                const firstMap = match.maps[0];
                const mapName = firstMap ? firstMap.mapname : 'N/A';
                const team1Rounds = firstMap ? firstMap.team1_score : 0;
                const team2Rounds = firstMap ? firstMap.team2_score : 0;
                const team1MatchScore = match.team1_score;
                const team2MatchScore = match.team2_score;

                return (
                  <tr key={match.matchid} className="last:border-b-0">
                    <td data-label="Partida" className="p-3 md:text-left">
                      <Link href={`/match/${match.matchid}`} className="hover:underline">
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
                    <td data-label="Data" className="p-3 text-gray-400 md:text-left">{new Date(match.start_time).toLocaleDateString('pt-BR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
