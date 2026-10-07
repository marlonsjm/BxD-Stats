import { Breadcrumbs } from '@/components/Breadcrumbs';
import { chaveMapa, getStats } from '@/lib/stats';
import { IDS_SERVIDORES, SERVIDORES, rota } from '@/lib/servidores';
import Link from 'next/link';
import { cache } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MetricHeader } from "@/components/MetricHeader";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { calculateRating, RATING_DESCRIPTION } from "@/lib/rating";
import { getPlayerAvatars } from "@/lib/steam";
import { formatMatchDate, toDateTimeAttribute } from "@/lib/date";

export const revalidate = 300;

// Habilita cache ISR por caminho: cada jogador é renderizado na primeira visita e cacheado
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { servidor, steamid64 } = await params;
  try {
    const playerData = await getPlayerData(servidor, steamid64);
    if (!playerData) return { title: 'Jogador não encontrado' };
    const name = playerData.names[0] || 'Jogador';
    return {
      title: `${name} - Estatísticas`,
      description: `Estatísticas de CS2 de ${name} no servidor BxD: KDR, ADR, headshots e histórico de partidas.`,
    };
  } catch {
    // Banco indisponível: usa um título genérico e deixa a página tratar o erro
    return { title: 'Jogador' };
  }
}

const getPlayerData = cache(async (servidor, steamid64) => {
  if (!/^\d+$/.test(steamid64)) return null;
  const { linhas, partidas, mapasFinalizados, linhasFinalizadas } = await getStats(servidor);

  const minhas = linhasFinalizadas.filter(l => l.steamid64 === steamid64);
  if (minhas.length === 0) return null;

  const soma = (campo) => minhas.reduce((s, l) => s + (l[campo] || 0), 0);
  const kills = soma('kills');
  const deaths = soma('deaths');
  const assists = soma('assists');
  const head_shot_kills = soma('head_shot_kills');
  const damage = soma('damage');
  const mapsPlayed = minhas.length;
  const shots_fired = soma('shots_fired_total');
  const shots_on_target = soma('shots_on_target_total');
  const enemy3ks = soma('enemy3ks');
  const enemy4ks = soma('enemy4ks');
  const enemy5ks = soma('enemy5ks');
  const clutches_won = soma('v1_wins') + soma('v2_wins');
  const entry_count = soma('entry_count');
  const entry_wins = soma('entry_wins');
  const minhasChaves = new Set(minhas.map(chaveMapa));
  const totalRounds = mapasFinalizados
    .filter(m => minhasChaves.has(chaveMapa(m)))
    .reduce((sum, m) => sum + m.team1_score + m.team2_score, 0);

  // Nicks do mais recente para o mais antigo (o primeiro e o atual).
  const inicio = new Map(partidas.map(p => [p.matchid, new Date(p.start_time).getTime()]));
  const nameRecords = [...new Set(
    linhas
      .filter(l => l.steamid64 === steamid64)
      .sort((a, b) => (inicio.get(b.matchid) ?? 0) - (inicio.get(a.matchid) ?? 0))
      .map(l => l.name),
  )].map(name => ({ name }));

  return {
    steamid64,
    names: nameRecords.map(r => r.name),
    rating: calculateRating({ kills, deaths, assists, damage, rounds: totalRounds }),
    kills,
    deaths,
    assists,
    mapsPlayed,
    diff: kills - deaths,
    kdr: deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString(),
    hs_percent: kills > 0 ? ((head_shot_kills / kills) * 100).toFixed(1) : '0.0',
    adr: totalRounds > 0 ? (damage / totalRounds).toFixed(1) : '0.0',
    accuracy: shots_fired > 0 ? ((shots_on_target / shots_fired) * 100).toFixed(1) : '0.0',
    enemy3ks,
    enemy4ks,
    enemy5ks,
    clutches_won,
    entry_success_rate: entry_count > 0 ? ((entry_wins / entry_count) * 100).toFixed(1) : '0.0',
  };
});

async function getPlayerMatchHistory(servidor, steamid64) {
  const { linhasFinalizadas, mapas: maps, partidas: matches } = await getStats(servidor);
  const stats = linhasFinalizadas.filter(l => l.steamid64 === steamid64);
  if (stats.length === 0) return [];

  const mapLookup = new Map(maps.map(m => [chaveMapa(m), m]));
  const matchLookup = new Map(matches.map(m => [m.matchid, m]));

  return stats
    .map(s => ({
      ...s,
      map: mapLookup.get(chaveMapa(s)) || null,
      match: matchLookup.get(s.matchid) || null,
    }))
    .filter(s => s.map !== null && s.match !== null)
    // Ordena por data, nao por matchid: partidas recuperadas de demos/SQLite
    // receberam ids fora de ordem cronologica (junho ficou com ids maiores que julho).
    .sort((a, b) => new Date(b.match.start_time) - new Date(a.match.start_time));
}

const StatCard = ({ value, label, description }) => (
  <div className="bg-gray-900/50 p-3 rounded-md">
    <div className="text-2xl font-bold font-mono">{value}</div>
    <Tooltip>
      <TooltipTrigger className="cursor-help underline decoration-dotted">
        <div className="text-sm text-gray-400">{label}</div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);

export default async function PlayerDetailPage({ params }) {
  const { servidor, steamid64 } = await params;
  const playerData = await getPlayerData(servidor, steamid64);

  if (!playerData) {
    // Comum ao trocar de servidor no seletor: o jogador existe, so nao jogou
    // neste. Oferece o perfil no outro servidor em vez de um 404 seco.
    const outro = IDS_SERVIDORES.find(id => id !== servidor);
    return (
      <div className="text-white py-12">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Sem partidas no servidor {SERVIDORES[servidor].label}</h1>
          <p className="text-gray-400 mt-3">Este jogador ainda não tem partidas finalizadas registradas aqui.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-6">
            {/^\d+$/.test(steamid64) && (
              <Link href={rota(outro, `/player/${steamid64}`)} className="inline-flex items-center min-h-[44px] text-cyan-400 hover:underline">
                Ver no servidor {SERVIDORES[outro].label}
              </Link>
            )}
            <Link href={rota(servidor, "/players")} className="inline-flex items-center min-h-[44px] text-blue-400 hover:underline">Voltar para o Ranking</Link>
          </div>
        </div>
      </div>
    );
  }

  const [matchHistory, avatars] = await Promise.all([
    getPlayerMatchHistory(servidor, steamid64),
    getPlayerAvatars([steamid64]),
  ]);
  const avatar = avatars.get(steamid64)?.full || null;
  const primaryName = playerData.names[0] || 'Jogador Desconhecido';

  const breadcrumbItems = [
    { href: rota(servidor), label: "Home" },
    { href: rota(servidor, "/players"), label: "Jogadores" },
    { label: primaryName },
  ];

  return (
    <TooltipProvider>
      <div className="text-white py-4 md:py-8">
        <div className="container mx-auto">
          <Breadcrumbs items={breadcrumbItems} servidor={servidor} />
          <header className="mb-8">
            <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <PlayerAvatar src={avatar} name={primaryName} size={80} className="border-2 border-gray-700" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold break-words">{primaryName}</h1>
                  <p className="text-sm text-gray-400 break-all">SteamID64: {playerData.steamid64}</p>
                  {playerData.names.length > 1 && (
                    <p className="text-sm text-gray-400">Nicks Anteriores: {playerData.names.slice(1).join(', ')}</p>
                  )}
                </div>
                <div className="shrink-0 rounded-lg bg-gray-900/60 px-5 py-3 text-center">
                  <div className={`text-3xl font-bold font-mono ${playerData.rating >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {playerData.rating.toFixed(2)}
                  </div>
                  <Tooltip>
                    <TooltipTrigger className="cursor-help underline decoration-dotted">
                      <div className="text-xs text-gray-400">Rating 2.0*</div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{RATING_DESCRIPTION}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </header>

          {/* Player Stats Summary */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">Estatísticas Gerais</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center mb-4">
              <StatCard value={playerData.kdr} label="KDR" description="Kill/Death Ratio (Kills / Deaths)" />
              <StatCard value={`${playerData.hs_percent}%`} label="HS%" description="Percentual de Headshots" />
              <StatCard value={playerData.adr} label="ADR" description="Dano Médio por Round (Damage Total / Total de Rounds)" />
              <StatCard value={`${playerData.accuracy}%`} label="Accuracy" description="Precisão: tiros no alvo / tiros disparados" />
              <StatCard value={playerData.clutches_won} label="Clutches" description="Total de rounds vencidos em situação de 1vX" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
              <StatCard value={playerData.kills} label="Kills" description="Total de abates" />
              <StatCard value={playerData.deaths} label="Deaths" description="Total de mortes" />
              <StatCard value={playerData.assists} label="Assists" description="Total de assistências" />
              <StatCard value={`${playerData.entry_success_rate}%`} label="Entry %" description="Taxa de sucesso ao conseguir o primeiro abate para o time no round" />
              <StatCard value={playerData.mapsPlayed} label="Mapas" description="Total de mapas jogados" />
            </div>
          </div>

          {/* Multi-Kill Stats */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-8">
            <h2 className="text-xl font-bold mb-4">Multi-Kills</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-900/50 p-3 rounded-md">
                <div className="text-2xl font-bold font-mono text-yellow-400">{playerData.enemy3ks}</div>
                <div className="text-sm text-gray-400">3K</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-md">
                <div className="text-2xl font-bold font-mono text-orange-400">{playerData.enemy4ks}</div>
                <div className="text-sm text-gray-400">4K</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-md">
                <div className="text-2xl font-bold font-mono text-red-400">{playerData.enemy5ks}</div>
                <div className="text-sm text-gray-400">ACE (5K)</div>
              </div>
            </div>
          </div>

          {/* Match History */}
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <h2 className="text-xl font-bold p-4">Histórico de Partidas</h2>
            <table className="min-w-full text-sm responsive-table stats-table">
              <caption className="sr-only">Histórico de partidas do jogador com estatísticas por mapa.</caption>
              <thead className="bg-gray-900/50">
                <tr className="border-b border-gray-700">
                  <th scope="col" className="p-3 text-left font-semibold">Partida</th>
                  <th scope="col" className="p-3 text-left font-semibold">Mapa</th>
                  <MetricHeader label="K-D" description="Kills - Deaths na partida" className="p-3 text-right font-semibold" />
                  <MetricHeader label="A" description="Assistências na partida" className="p-3 text-right font-semibold" />
                  <MetricHeader label="+/-" description="Diferença entre Kills e Deaths na partida" className="p-3 text-right font-semibold" />
                  <MetricHeader label="ADR" description="Dano Médio por Round na partida" className="p-3 text-right font-semibold" />
                  <MetricHeader label="HS%" description="Percentual de Headshots na partida" className="p-3 text-right font-semibold" />
                  <th scope="col" className="p-3 md:pr-6 text-left font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800">
                {matchHistory.map(stat => {
                  const match = stat.match;
                  const diff = stat.kills - stat.deaths;
                  const diffColor = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-400';
                  const diffSign = diff > 0 ? '+' : '';
                  const hs_percent = stat.kills > 0 ? ((stat.head_shot_kills / stat.kills) * 100).toFixed(1) : '0.0';
                  const mapRounds = stat.map.team1_score + stat.map.team2_score;
                  const adr = mapRounds > 0 ? (stat.damage / mapRounds).toFixed(1) : '0.0';

                  return (
                    <tr key={`${stat.matchid}-${stat.mapnumber}`}>
                      <td data-label="Partida" className="p-3 md:text-left">
                        <Link href={rota(servidor, `/match/${match.matchid}`)} className="inline-flex items-center font-medium text-white hover:underline">
                          {match.team1_name} vs {match.team2_name}
                        </Link>
                      </td>
                      <td data-label="Mapa" className="p-3 text-gray-400 md:text-left">{stat.map.mapname}</td>
                      <td data-label="K-D" className="p-3 font-mono tabular-nums md:text-right">{`${stat.kills}-${stat.deaths}`}</td>
                      <td data-label="A" className="p-3 font-mono tabular-nums md:text-right">{stat.assists}</td>
                      <td data-label="+/-" className={`p-3 font-mono tabular-nums md:text-right ${diffColor}`}>{`${diffSign}${diff}`}</td>
                      <td data-label="ADR" className="p-3 font-mono tabular-nums md:text-right">{adr}</td>
                      <td data-label="HS%" className="p-3 font-mono tabular-nums md:text-right">{hs_percent}%</td>
                      <td data-label="Data" className="p-3 md:pr-6 text-gray-400 md:text-left">
                        <time dateTime={toDateTimeAttribute(match.start_time)}>
                          {formatMatchDate(match.start_time)}
                        </time>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
