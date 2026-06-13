'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { RATING_DESCRIPTION } from "@/lib/rating";

const COLUMNS = [
  { key: 'rating', label: 'Rating', description: RATING_DESCRIPTION },
  { key: 'kills', label: 'Kills', description: 'Total de abates' },
  { key: 'deaths', label: 'Deaths', description: 'Total de mortes' },
  { key: 'diff', label: '+/-', description: 'Diferença entre Kills e Deaths' },
  { key: 'adr', label: 'ADR', description: 'Dano Médio por Round' },
  { key: 'hs_percent', label: 'HS%', description: 'Percentual de Headshots' },
  { key: 'kdr', label: 'KDR', description: 'Kill/Death Ratio (Kills / Deaths)' },
  { key: 'mapsPlayed', label: 'Mapas', description: 'Número de mapas jogados' },
];

const RANK_COLORS = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-orange-400',
};

function formatValue(key, player) {
  switch (key) {
    case 'diff': {
      const sign = player.diff > 0 ? '+' : '';
      return `${sign}${player.diff}`;
    }
    case 'rating': return player.rating.toFixed(2);
    case 'adr': return player.adr.toFixed(1);
    case 'hs_percent': return `${player.hs_percent.toFixed(1)}%`;
    case 'kdr': return player.kdr.toFixed(2);
    default: return player[key];
  }
}

export function PlayersTable({ players }) {
  const [sort, setSort] = useState({ key: 'kills', dir: 'desc' });
  const [query, setQuery] = useState('');

  const toggleSort = (key) => {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      : { key, dir: 'desc' });
  };

  const visiblePlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? players.filter(p => p.name.toLowerCase().includes(q)) : players;
    return [...filtered].sort((a, b) =>
      sort.dir === 'desc' ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key]
    );
  }, [players, sort, query]);

  const SortIcon = ({ column }) => {
    if (sort.key !== column) return <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5 opacity-40" />;
    return sort.dir === 'desc'
      ? <ArrowDown aria-hidden="true" className="h-3.5 w-3.5 text-cyan-400" />
      : <ArrowUp aria-hidden="true" className="h-3.5 w-3.5 text-cyan-400" />;
  };

  return (
    <TooltipProvider>
      <div className="mb-4">
        <label htmlFor="player-search" className="sr-only">Buscar jogador pelo nome</label>
        <div className="relative max-w-sm">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="player-search"
            type="search"
            autoComplete="off"
            placeholder="Buscar jogador..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg">
        <table className="min-w-full text-sm responsive-table stats-table">
          <caption className="sr-only">Ranking de jogadores com estatísticas agregadas. Clique nos cabeçalhos para ordenar.</caption>
          <thead className="bg-gray-900">
            <tr className="border-b border-gray-700">
              <th scope="col" className="p-3 text-center font-semibold w-16 md:sticky md:top-16 z-10 bg-gray-900 first:rounded-tl-lg">Rank</th>
              <th scope="col" className="p-3 text-left font-semibold md:sticky md:top-16 z-10 bg-gray-900">Jogador</th>
              {COLUMNS.map((col, colIndex) => {
                const isLast = colIndex === COLUMNS.length - 1;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={sort.key === col.key ? (sort.dir === 'desc' ? 'descending' : 'ascending') : undefined}
                    className="p-0 font-semibold md:sticky md:top-16 z-10 bg-gray-900 last:rounded-tr-lg"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={`flex w-full items-center justify-end gap-1 p-3 ${isLast ? 'md:pr-6' : ''} hover:text-cyan-400 transition-colors`}
                        >
                          {col.label}
                          <SortIcon column={col.key} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{col.description} — clique para ordenar</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visiblePlayers.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="p-8 text-center text-gray-400">
                  Nenhum jogador encontrado para &quot;{query}&quot;.
                </td>
              </tr>
            ) : visiblePlayers.map((player, index) => {
              const rank = index + 1;
              const diffColor = player.diff > 0 ? 'text-green-500' : player.diff < 0 ? 'text-red-500' : 'text-gray-400';

              return (
                <tr key={player.steamid64}>
                  <td data-label="Rank" className={`p-3 font-bold md:text-center ${RANK_COLORS[rank] || 'text-gray-400'}`}>#{rank}</td>
                  <td data-label="Jogador" className="p-3 text-right md:text-left">
                    <Link href={`/player/${player.steamid64}`} className="inline-flex items-center gap-2 font-medium text-white hover:underline">
                      <PlayerAvatar src={player.avatar} name={player.name} size={28} />
                      {player.name}
                    </Link>
                  </td>
                  {COLUMNS.map((col, colIndex) => (
                    <td
                      key={col.key}
                      data-label={col.label}
                      className={`p-3 ${colIndex === COLUMNS.length - 1 ? 'md:pr-6' : ''} font-mono tabular-nums md:text-right ${col.key === 'diff' ? diffColor : ''} ${sort.key === col.key ? 'md:bg-gray-900/30' : ''}`}
                    >
                      {formatValue(col.key, player)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
