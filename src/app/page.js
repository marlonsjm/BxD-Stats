import { PrismaClient } from '@prisma/client';
import Link from 'next/link'; // Import the Link component

const prisma = new PrismaClient();

export default async function Home() {
  const matches = await prisma.match.findMany({
    orderBy: {
      start_time: 'desc',
    },
    include: {
      maps: {
        orderBy: {
          mapnumber: 'asc',
        },
      },
    },
  });

  return (
    <main className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen p-8">
      <div className="container mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">Estatísticas de Partidas</h1>
          <p className="text-gray-600 dark:text-gray-400">Resultados das últimas partidas de CS2</p>
        </header>

        <div>
          {matches.length === 0 ? (
            <div className="text-center bg-gray-100 dark:bg-gray-800 p-8 rounded-lg">
              <p className="text-xl text-gray-700 dark:text-gray-400">Nenhuma partida encontrada no banco de dados.</p>
              <p className="text-gray-500 dark:text-gray-500 mt-2">Jogue uma partida com o plugin MatchZy para que os dados apareçam aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                // Wrap the card with a Link component
                <Link href={`/match/${match.matchid}`} key={match.matchid}>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors h-full cursor-pointer">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-xl">{match.maps.length > 0 ? match.maps[0].mapname : 'Mapa Desconhecido'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(match.start_time).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-lg ${match.winner === match.team1_name ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>
                          {match.team1_name}
                        </span>
                        <span className={`text-lg font-mono ${match.winner === match.team1_name ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>
                          {match.maps.length > 0 ? `${match.maps[0].team1_score} (${match.team1_score})` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-lg ${match.winner === match.team2_name ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>
                          {match.team2_name}
                        </span>
                        <span className={`text-lg font-mono ${match.winner === match.team2_name ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>
                          {match.maps.length > 0 ? `${match.maps[0].team2_score} (${match.team2_score})` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Vencedor: <span className="font-semibold text-green-600 dark:text-green-400">{match.winner}</span></p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}