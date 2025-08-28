import { Breadcrumbs } from "@/components/Breadcrumbs";
import prisma from "@/lib/prisma";
import Link from "next/link";

async function getMapData(mapname) {
  const decodedMapname = decodeURIComponent(mapname);

  // Get all player stats for this specific map for the leaderboard
  const playerStatsOnMap = await prisma.playerStats.findMany({
    where: { map: { mapname: decodedMapname } },
  });

  const leaderboard = {};
  playerStatsOnMap.forEach(stat => {
    if (!leaderboard[stat.steamid64]) {
      leaderboard[stat.steamid64] = {
        steamid64: stat.steamid64,
        name: stat.name,
        kills: 0,
        deaths: 0,
      };
    }
    leaderboard[stat.steamid64].kills += stat.kills;
    leaderboard[stat.steamid64].deaths += stat.deaths;
  });

  const sortedLeaderboard = Object.values(leaderboard)
    .map(p => ({
      ...p,
      kdr: p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : 'N/A',
      diff: p.kills - p.deaths,
    }))
    .sort((a, b) => b.kills - a.kills);

  // Get match history for this map, including map details for round scores
  const matchHistory = await prisma.match.findMany({
    where: { maps: { some: { mapname: decodedMapname } } },
    include: { maps: true }, // Include map data
    orderBy: { start_time: 'desc' },
  });

  return { leaderboard: sortedLeaderboard, matchHistory, decodedMapname };
}

export default async function MapPage({ params }) {
  const { mapname } = params;
  const { leaderboard, matchHistory, decodedMapname } = await getMapData(mapname);

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { href: "/maps", label: "Mapas" },
    { label: decodedMapname.replace(/de_|cs_/, '').charAt(0).toUpperCase() + decodedMapname.replace(/de_|cs_/, '').slice(1) },
  ];

  const renderLeaderboard = () => (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <h2 className="text-xl font-bold p-4">Ranking do Mapa</h2>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-900/50">
          <tr className="border-b border-gray-700">
            <th scope="col" className="p-3 text-center font-semibold w-16">Rank</th>
            <th scope="col" className="p-3 text-left font-semibold">Jogador</th>
            <th scope="col" className="p-3 text-center font-semibold">Kills</th>
            <th scope="col" className="p-3 text-center font-semibold">Deaths</th>
            <th scope="col" className="p-3 text-center font-semibold">KDR</th>
            <th scope="col" className="p-3 text-center font-semibold">+/-</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((player, index) => {
            const diffColor = player.diff > 0 ? 'text-green-500' : player.diff < 0 ? 'text-red-500' : 'text-gray-400';
            const diffSign = player.diff > 0 ? '+' : '';
            return (
              <tr key={player.steamid64} className="border-b border-gray-800 last:border-b-0">
                <td className="p-3 text-center font-bold text-gray-400">#{index + 1}</td>
                <td className="p-3">
                  <Link href={`/player/${player.steamid64}`} className="text-white hover:underline">
                    {player.name}
                  </Link>
                </td>
                <td className="p-3 text-center font-mono">{player.kills}</td>
                <td className="p-3 text-center font-mono">{player.deaths}</td>
                <td className="p-3 text-center font-mono">{player.kdr}</td>
                <td className={`p-3 text-center font-mono ${diffColor}`}>{`${diffSign}${player.diff}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderMatchHistory = () => (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <h2 className="text-xl font-bold p-4">Histórico de Partidas</h2>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-900/50">
          <tr className="border-b border-gray-700">
            <th scope="col" className="p-3 text-left font-semibold">Times</th>
            <th scope="col" className="p-3 text-center font-semibold">Placar</th>
            <th scope="col" className="p-3 text-left font-semibold">Vencedor</th>
            <th scope="col" className="p-3 text-left font-semibold">Data</th>
          </tr>
        </thead>
        <tbody>
          {matchHistory.map(match => {
            const mapData = match.maps.find(m => m.mapname === decodedMapname);
            const team1Rounds = mapData ? mapData.team1_score : 0;
            const team2Rounds = mapData ? mapData.team2_score : 0;
            const team1MatchScore = match.team1_score;
            const team2MatchScore = match.team2_score;

            return (
              <tr key={match.matchid} className="border-b border-gray-800 last:border-b-0">
                <td className="p-3">
                  <Link href={`/match/${match.matchid}`} className="hover:underline">
                    {match.team1_name} vs {match.team2_name}
                  </Link>
                </td>
                <td className="p-3 text-center font-mono">
                  <span className={match.winner === match.team1_name ? 'text-green-500 font-bold' : match.winner === match.team2_name ? 'text-red-500' : ''}>
                    {team1Rounds} ({team1MatchScore})
                  </span>
                  <span> : </span>
                  <span className={match.winner === match.team2_name ? 'text-green-500 font-bold' : match.winner === match.team1_name ? 'text-red-500' : ''}>
                    {team2Rounds} ({team2MatchScore})
                  </span>
                </td>
                <td className={`p-3 font-semibold ${match.winner === match.team1_name || match.winner === match.team2_name ? 'text-green-500' : ''}`}>
                  {match.winner || 'Empate'}
                </td>
                <td className="p-3 text-gray-400">{new Date(match.start_time).toLocaleDateString('pt-BR')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      <div className="container mx-auto space-y-8">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold capitalize">
            Estatísticas de {decodedMapname.replace(/de_|cs_/, '')}
          </h1>
          <Link href="/maps" className="text-blue-400 hover:underline mt-2 inline-block">← Voltar para todos os mapas</Link>
        </header>

        {leaderboard.length > 0 ? renderLeaderboard() : <p>Nenhum ranking disponível para este mapa.</p>}
        {matchHistory.length > 0 ? renderMatchHistory() : <p>Nenhuma partida encontrada para este mapa.</p>}

      </div>
    </main>
  );
}
