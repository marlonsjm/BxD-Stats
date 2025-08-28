import Link from 'next/link';

export function PlayerCard({ player, rank }) {
  const rankColors = {
    1: 'text-yellow-400',
    2: 'text-gray-300',
    3: 'text-orange-500',
  };

  const rankColor = rankColors[rank] || 'text-gray-400';

  return (
    <Link href={`/player/${player.steamid64}`} className="block">
      <div className="bg-gray-800 p-3 rounded-lg shadow-lg h-full flex items-center gap-4 transition-colors hover:bg-gray-700/50">
        {/* Rank */}
        <div className={`text-xl font-bold ${rankColor} w-8 text-center`}>
          #{rank}
        </div>
        
        {/* Player Name (flexible part) */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white break-all">{player.name}</p>
        </div>

        {/* Kills (fixed part) */}
        <div className="text-right">
          <p className="text-lg font-bold text-white">{player.kills}</p>
          <p className="text-xs text-gray-400">Kills</p>
        </div>
      </div>
    </Link>
  );
}