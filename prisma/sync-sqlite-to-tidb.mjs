// ============================================================================
// Sincroniza as partidas gravadas pelo MatchZy no SQLite local (matchzy.db)
// para o TiDB, que e o banco lido pelo site.
//
// Por que existe: o MatchZy nao consegue gravar direto no TiDB Serverless.
// O InitMatch faz "INSERT matches" e depois "SELECT LAST_INSERT_ID()" em
// round-trips separados; quando a conexao longa dele nao esta aberta, o Dapper
// abre/fecha a conexao a cada statement e o LAST_INSERT_ID volta 0 — o INSERT
// em matchzy_stats_maps entao bate na foreign key e o plugin cai no catch,
// deixando liveMatchId = -1 e perdendo mapa e stats individuais.
// No SQLite isso nao acontece (a conexao e um arquivo local e fica aberta),
// entao o MatchZy grava tudo certo e este script replica para o TiDB.
//
// Rodar:      node --env-file=.env.local prisma/sync-sqlite-to-tidb.mjs
// Simular:    DRY_RUN=1 node --env-file=.env.local prisma/sync-sqlite-to-tidb.mjs
//
// E idempotente: identifica a partida por (start_time, team1_name, team2_name),
// entao rodar de novo nao duplica. Partidas incompletas (mapa sem end_time,
// ex.: partida abortada) sao ignoradas — sao elas que virariam "Empate 0x0".
// ============================================================================

import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

const SQLITE_PATH =
  process.env.MATCHZY_DB ||
  'D:/steamcmd/cs2-server/game/csgo/addons/counterstrikesharp/plugins/MatchZy/matchzy.db';

const DRY = process.env.DRY_RUN === '1';
const prisma = new PrismaClient();

// O MatchZy grava datas com datetime('now') no SQLite, que e UTC.
const toDate = (s) => (s ? new Date(s.replace(' ', 'T') + 'Z') : null);
const key = (startTime, t1, t2) => `${startTime.toISOString()}|${t1}|${t2}`;

async function main() {
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  console.log(`Origem: ${SQLITE_PATH}${DRY ? '   [DRY RUN]' : ''}\n`);

  // Uma partida so entra se tiver pelo menos um mapa finalizado (end_time preenchido)
  const srcMatches = sqlite
    .prepare(
      `SELECT m.* FROM matchzy_stats_matches m
        WHERE EXISTS (SELECT 1 FROM matchzy_stats_maps mp
                       WHERE mp.matchid = m.matchid AND mp.end_time IS NOT NULL)
        ORDER BY m.matchid`
    )
    .all();

  const skipped = sqlite
    .prepare(
      `SELECT COUNT(*) c FROM matchzy_stats_matches m
        WHERE NOT EXISTS (SELECT 1 FROM matchzy_stats_maps mp
                           WHERE mp.matchid = m.matchid AND mp.end_time IS NOT NULL)`
    )
    .get().c;

  console.log(`${srcMatches.length} partida(s) completa(s) no SQLite (${skipped} incompleta(s) ignorada(s)).`);

  // Indice do que ja existe no TiDB, pela chave natural
  const existing = await prisma.match.findMany({
    select: { matchid: true, start_time: true, team1_name: true, team2_name: true },
  });
  const seen = new Set(existing.map((m) => key(m.start_time, m.team1_name, m.team2_name)));

  // Novos matchids continuam a sequencia baixa ja usada no TiDB (7..18 -> 19, 20, ...)
  let nextId = Math.max(0, ...existing.map((m) => m.matchid).filter((id) => id < 1000)) + 1;
  const usedIds = new Set(existing.map((m) => m.matchid));
  const takeId = () => {
    while (usedIds.has(nextId)) nextId++;
    usedIds.add(nextId);
    return nextId;
  };

  const getMaps = sqlite.prepare('SELECT * FROM matchzy_stats_maps WHERE matchid = ? ORDER BY mapnumber');
  const getPlayers = sqlite.prepare('SELECT * FROM matchzy_stats_players WHERE matchid = ? AND mapnumber = ?');

  let inserted = 0;
  let already = 0;

  for (const m of srcMatches) {
    const startTime = toDate(m.start_time);
    const k = key(startTime, m.team1_name, m.team2_name);

    if (seen.has(k)) {
      already++;
      continue;
    }

    const maps = getMaps.all(m.matchid).filter((mp) => mp.end_time);
    if (!maps.length) continue;

    const newId = takeId();
    const label =
      `sqlite#${String(m.matchid).padEnd(3)} -> tidb#${String(newId).padEnd(4)} ` +
      `${m.start_time}  ${m.team1_name} ${m.team1_score} x ${m.team2_score} ${m.team2_name}`;

    if (DRY) {
      console.log(`  INSERT  ${label}`);
      seen.add(k);
      inserted++;
      continue;
    }

    await prisma.match.create({
      data: {
        matchid: newId,
        start_time: startTime,
        end_time: toDate(m.end_time) ?? startTime,
        winner: (m.winner ?? '').slice(0, 255),
        series_type: m.series_type || 'BO1',
        team1_name: m.team1_name,
        team1_score: m.team1_score,
        team2_name: m.team2_name,
        team2_score: m.team2_score,
        server_ip: m.server_ip || '-',
      },
    });

    for (const mp of maps) {
      await prisma.map.create({
        data: {
          matchid: newId,
          mapnumber: mp.mapnumber,
          // normaliza o nome do mapa: o MatchZy as vezes grava em maiusculas
          // (ex.: DE_NUKE), o que criaria um mapa duplicado em /maps
          mapname: (mp.mapname ?? '').toLowerCase().slice(0, 64),
          winner: (mp.winner ?? '').slice(0, 16), // maps.winner e VARCHAR(16)
          start_time: toDate(mp.start_time),
          end_time: toDate(mp.end_time),
          team1_score: mp.team1_score,
          team2_score: mp.team2_score,
        },
      });

      const players = getPlayers.all(m.matchid, mp.mapnumber);
      if (players.length) {
        await prisma.playerStats.createMany({
          data: players.map((p) => {
            const { matchid, mapnumber, steamid64, ...rest } = p;
            return { ...rest, matchid: newId, mapnumber: mp.mapnumber, steamid64: BigInt(steamid64) };
          }),
        });
      }
    }

    console.log(`  OK      ${label}  (${maps.length} mapa/s)`);
    seen.add(k);
    inserted++;
  }

  console.log(
    `\n${inserted} partida(s) ${DRY ? 'seriam inseridas' : 'inseridas'}, ${already} ja estavam no TiDB.`
  );
  if (DRY) console.log('[DRY RUN] Nada foi gravado.');
  sqlite.close();
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
