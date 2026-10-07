import { cache } from 'react';
import { chaveMapa, getStats } from './stats';

// Nick atual de cada jogador: o da partida mais recente em que ele aparece.
const getNomesAtuais = cache(async (servidor) => {
  const { linhas, partidas } = await getStats(servidor);
  const inicio = new Map(partidas.map(p => [p.matchid, new Date(p.start_time).getTime()]));
  const nomes = new Map();
  const quando = new Map();
  for (const l of linhas) {
    const t = inicio.get(l.matchid) ?? 0;
    if (!nomes.has(l.steamid64) || t > quando.get(l.steamid64)) {
      nomes.set(l.steamid64, l.name);
      quando.set(l.steamid64, t);
    }
  }
  return nomes;
});


/**
 * Busca todos os PlayerStats que possuem um Map correspondente válido e retorna
 * um objeto agregado por steamid64. Isso evita que registros "órfãos" (sem mapa)
 * distorçam os rankings e garante que ADR seja calculado por ROUND jogado.
 * Só entram partidas finalizadas (ver lib/partidas.js). Cacheado por render: a
 * página de rankings chama sete funções que partem do mesmo agregado.
 */
const getAggregatedPlayerStats = cache(async (servidor) => {
  const { mapasFinalizados: maps, linhasFinalizadas: stats } = await getStats(servidor);

  const mapKeySet = new Set(maps.map(chaveMapa));
  const roundsByKey = new Map(maps.map(m => [chaveMapa(m), m.team1_score + m.team2_score]));

  if (maps.length === 0) return [];

  const aggregated = {};

  stats.forEach(s => {
    const mapKey = chaveMapa(s);
    if (!mapKeySet.has(mapKey)) return; // segurança extra

    if (!aggregated[s.steamid64]) {
      aggregated[s.steamid64] = {
        steamid64: s.steamid64,
        name: s.name,
        maps: 0,
        rounds: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        head_shot_kills: 0,
        damage: 0,
        enemy3ks: 0,
        enemy4ks: 0,
        enemy5ks: 0,
        v1_wins: 0,
        v2_wins: 0,
        entry_count: 0,
        entry_wins: 0,
        shots_fired_total: 0,
        shots_on_target_total: 0,
      };
    }

    const p = aggregated[s.steamid64];
    p.maps += 1;
    p.rounds += roundsByKey.get(mapKey) || 0;
    p.kills += s.kills || 0;
    p.deaths += s.deaths || 0;
    p.assists += s.assists || 0;
    p.head_shot_kills += s.head_shot_kills || 0;
    p.damage += s.damage || 0;
    p.enemy3ks += s.enemy3ks || 0;
    p.enemy4ks += s.enemy4ks || 0;
    p.enemy5ks += s.enemy5ks || 0;
    p.v1_wins += s.v1_wins || 0;
    p.v2_wins += s.v2_wins || 0;
    p.entry_count += s.entry_count || 0;
    p.entry_wins += s.entry_wins || 0;
    p.shots_fired_total += s.shots_fired_total || 0;
    p.shots_on_target_total += s.shots_on_target_total || 0;
  });

  return Object.values(aggregated);
});

// Amostra minima de cada ranking. Num servidor com poucas partidas (o Online
// recem-aberto) ninguem alcanca o padrao e o ranking fica vazio, entao o minimo
// efetivo e o MENOR entre o padrao e metade do maior valor do servidor. Com
// volume, o padrao volta a valer sozinho. As paginas mostram o minimo efetivo.
const PADROES_MINIMOS = {
  headshots: { campo: 'kills', padrao: 50, unidade: ['abate', 'abates'] },
  entries: { campo: 'entry_count', padrao: 20, unidade: ['tentativa de entry', 'tentativas de entry'] },
  adr: { campo: 'maps', padrao: 5, unidade: ['mapa', 'mapas'] },
  precisao: { campo: 'shots_fired_total', padrao: 500, unidade: ['tiro disparado', 'tiros disparados'] },
};

function calcularMinimos(aggregates) {
  return Object.fromEntries(Object.entries(PADROES_MINIMOS).map(([chave, { campo, padrao, unidade }]) => {
    const maior = aggregates.reduce((max, p) => Math.max(max, p[campo]), 0);
    const valor = Math.max(1, Math.min(padrao, Math.ceil(maior / 2)));
    return [chave, { valor, unidade: unidade[valor === 1 ? 0 : 1], reduzido: valor < padrao }];
  }));
}

export async function getMinimosRanking(servidor) {
  return calcularMinimos(await getAggregatedPlayerStats(servidor));
}

export async function getKillsRanking(servidor, limit = 50) {
  const aggregates = await getAggregatedPlayerStats(servidor);

  const sortedPlayers = aggregates
    .sort((a, b) => b.kills - a.kills)
    .slice(0, limit);

  const playerNames = await getNomesAtuais(servidor);

  return sortedPlayers.map((p, index) => {
    const kdr = p.deaths > 0 ? p.kills / p.deaths : p.kills;
    return {
      rank: index + 1,
      steamid64: p.steamid64.toString(),
      name: playerNames.get(p.steamid64.toString()) || p.name || `Player ${p.steamid64}`,
      value: p.kills.toString(),
      kills: p.kills,
      deaths: p.deaths,
      diff: p.kills - p.deaths,
      kdr: kdr.toFixed(2),
      maps: p.maps,
    };
  });
}

export async function getHeadshotRankings(servidor, limit = 50) {
  const aggregates = await getAggregatedPlayerStats(servidor);
  const minimo = calcularMinimos(aggregates).headshots.valor;

  const rankings = aggregates
    .filter(p => p.kills >= minimo)
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      hs_percentage: p.kills > 0 ? (p.head_shot_kills / p.kills) * 100 : 0,
      total_kills: p.kills,
    }))
    .sort((a, b) => b.hs_percentage - a.hs_percentage)
    .slice(0, limit);

  const playerNames = await getNomesAtuais(servidor);

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: `${r.hs_percentage.toFixed(1)}%`,
  }));
}

export async function getClutchRankings(servidor, limit = 50) {
  const aggregates = await getAggregatedPlayerStats(servidor);

  const rankings = aggregates
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      clutches_won: p.v1_wins + p.v2_wins,
    }))
    .filter(p => p.clutches_won > 0)
    .sort((a, b) => b.clutches_won - a.clutches_won)
    .slice(0, limit);

  const playerNames = await getNomesAtuais(servidor);

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: r.clutches_won.toString(),
  }));
}

export async function getMultiKillRankings(servidor, limit = 50) {
  const aggregates = await getAggregatedPlayerStats(servidor);

  const rankings = aggregates
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      total: p.enemy3ks + p.enemy4ks + p.enemy5ks,
      enemy3ks: p.enemy3ks,
      enemy4ks: p.enemy4ks,
      enemy5ks: p.enemy5ks,
    }))
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  const playerNames = await getNomesAtuais(servidor);

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: r.total.toString(),
    enemy3ks: r.enemy3ks,
    enemy4ks: r.enemy4ks,
    enemy5ks: r.enemy5ks,
  }));
}

export async function getADRRanking(servidor, limit = 50) {
  const aggregates = await getAggregatedPlayerStats(servidor);
  const minimo = calcularMinimos(aggregates).adr.valor;

  const rankings = aggregates
    .filter(p => p.maps >= minimo)
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      // ADR = Average Damage per Round (não por mapa)
      adr: p.rounds > 0 ? p.damage / p.rounds : 0,
      maps: p.maps,
      rounds: p.rounds,
    }))
    .sort((a, b) => b.adr - a.adr)
    .slice(0, limit);

  const playerNames = await getNomesAtuais(servidor);

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: r.adr.toFixed(1),
  }));
}

export async function getAccuracyRanking(servidor, limit = 50) {
  const aggregates = await getAggregatedPlayerStats(servidor);
  const minimo = calcularMinimos(aggregates).precisao.valor;

  const rankings = aggregates
    .filter(p => p.shots_fired_total >= minimo)
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      accuracy: p.shots_fired_total > 0
        ? (p.shots_on_target_total / p.shots_fired_total) * 100
        : 0,
    }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, limit);

  const playerNames = await getNomesAtuais(servidor);

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: `${r.accuracy.toFixed(1)}%`,
  }));
}

export async function getEntryFragRankings(servidor, limit = 50) {
  const aggregates = await getAggregatedPlayerStats(servidor);
  const minimo = calcularMinimos(aggregates).entries.valor;

  const rankings = aggregates
    .filter(p => p.entry_count >= minimo)
    .map(p => ({
      steamid64: p.steamid64,
      name: p.name,
      entry_success_rate: p.entry_count > 0 ? (p.entry_wins / p.entry_count) * 100 : 0,
      total_entries: p.entry_count,
    }))
    .sort((a, b) => b.entry_success_rate - a.entry_success_rate)
    .slice(0, limit);

  const playerNames = await getNomesAtuais(servidor);

  return rankings.map((r, index) => ({
    rank: index + 1,
    steamid64: r.steamid64.toString(),
    name: playerNames.get(r.steamid64.toString()) || r.name || `Player ${r.steamid64}`,
    value: `${r.entry_success_rate.toFixed(1)}%`,
  }));
}
