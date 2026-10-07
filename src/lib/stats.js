// Retrato dos stats de um servidor, em cache — a unica porta das paginas de
// stats para o banco.
//
// Por que: o TiDB e o plano gratuito (cobra por Request Units) e o servidor
// Online ja grava nele direto. Antes, cada pagina fazia de 2 a 14 consultas, a
// maioria varredura completa, e cada /player, /match e /map tinha seu proprio
// ciclo de cache. Agora o site le TRES consultas por servidor (partidas, mapas,
// linhas de jogador) e guarda o resultado no Data Cache do Next; rankings,
// perfis e listas sao calculados em memoria a partir dele.
//
// Validade: SERVIDORES[servidor].cacheSegundos (LAN 24 h, Online 10 min). A LAN
// tambem e renovada na hora pelo sync (POST /api/revalidar, tag abaixo).
// Detalhes e limites em docs/cache.md.

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getDb } from './prisma';
import { SERVIDORES } from './servidores';

export const tagStats = (servidor) => `stats:${servidor}`;

// O Data Cache da Vercel nao guarda item acima de 2 MB — e nesse caso cada
// render voltaria a consultar o banco, em silencio. As linhas vao como arrays
// (sem repetir o nome das colunas) e o tamanho e vigiado no log.
const LIMITE_ALERTA_BYTES = 1.5 * 1024 * 1024;

const COLUNAS = {
  partidas: ['matchid', 'start_time', 'end_time', 'winner', 'team1_name', 'team1_score', 'team2_name', 'team2_score'],
  mapas: ['matchid', 'mapnumber', 'mapname', 'team1_score', 'team2_score'],
  linhas: [
    'matchid', 'mapnumber', 'steamid64', 'team', 'name', 'kills', 'deaths', 'assists', 'damage',
    'head_shot_kills', 'enemy3ks', 'enemy4ks', 'enemy5ks', 'v1_wins', 'v2_wins',
    'entry_count', 'entry_wins', 'shots_fired_total', 'shots_on_target_total',
  ],
};

const selecionar = (colunas) => Object.fromEntries(colunas.map((c) => [c, true]));

// Datas viram ISO e steamid64 vira string: o cache serializa em JSON (sem
// Date nem BigInt).
function compactar(linha, colunas) {
  return colunas.map((c) => {
    const v = linha[c];
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'bigint') return v.toString();
    return v;
  });
}

const expandir = (linhas, colunas) =>
  linhas.map((l) => Object.fromEntries(colunas.map((c, i) => [c, l[i]])));

async function carregarDoBanco(servidor) {
  const db = getDb(servidor);
  const [partidas, mapas, linhas] = await Promise.all([
    // Raw: o banco ja teve matchid NULL (importacao quebrada em 07/2026), e o
    // findMany do Prisma falha nessa linha em vez de ignora-la.
    db.$queryRawUnsafe(`SELECT ${COLUNAS.partidas.join(', ')} FROM matchzy_stats_matches WHERE matchid IS NOT NULL`),
    db.map.findMany({ select: selecionar(COLUNAS.mapas) }),
    db.playerStats.findMany({ select: selecionar(COLUNAS.linhas) }),
  ]);

  const retrato = {
    geradoEm: new Date().toISOString(),
    partidas: partidas.map((p) => compactar(p, COLUNAS.partidas)),
    mapas: mapas.map((m) => compactar(m, COLUNAS.mapas)),
    linhas: linhas.map((l) => compactar(l, COLUNAS.linhas)),
  };

  const bytes = JSON.stringify(retrato).length;
  const msg = `[stats:${servidor}] retrato carregado do banco: ${partidas.length} partidas, ${linhas.length} linhas, ${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > LIMITE_ALERTA_BYTES) console.warn(`${msg} — PERTO DO LIMITE DE 2 MB DO CACHE, ver docs/cache.md`);
  else console.log(msg);

  return retrato;
}

function retratoEmCache(servidor) {
  return unstable_cache(() => carregarDoBanco(servidor), ['stats-retrato', servidor], {
    tags: [tagStats(servidor)],
    revalidate: SERVIDORES[servidor].cacheSegundos,
  })();
}

// Dados prontos para as paginas, montados uma vez por render.
//   partidas/mapas/linhas: TUDO (inclui partida ao vivo ou abandonada)
//   finalizada(matchid): a partida terminou? So estas contam em ranking/perfil
//   mapasFinalizados/linhasFinalizadas: o recorte que entra nas estatisticas
export const getStats = cache(async (servidor) => {
  getDb(servidor); // valida o servidor (404) antes de tocar no cache
  const r = await retratoEmCache(servidor);

  const partidas = expandir(r.partidas, COLUNAS.partidas);
  const mapas = expandir(r.mapas, COLUNAS.mapas);
  const linhas = expandir(r.linhas, COLUNAS.linhas);

  const idsFinalizadas = new Set(partidas.filter((p) => p.end_time).map((p) => p.matchid));
  const finalizada = (matchid) => idsFinalizadas.has(matchid);

  const inicioMaisRecente = partidas.reduce(
    (max, p) => (!max || new Date(p.start_time) > new Date(max) ? p.start_time : max),
    null,
  );

  return {
    geradoEm: r.geradoEm,
    partidas,
    mapas,
    linhas,
    finalizada,
    inicioMaisRecente,
    mapasFinalizados: mapas.filter((m) => finalizada(m.matchid)),
    linhasFinalizadas: linhas.filter((l) => finalizada(l.matchid)),
  };
});

export const chaveMapa = (x) => `${x.matchid}-${x.mapnumber}`;
