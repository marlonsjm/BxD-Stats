import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const maps = await p.$queryRawUnsafe(
  `SELECT matchid, mapname, team1_score, team2_score, winner FROM matchzy_stats_maps ORDER BY matchid`);
console.log('Mapas (placar por rounds):');
console.table(maps.map(m => ({ matchid: Number(m.matchid), mapname: m.mapname, t1: m.team1_score, t2: m.team2_score, winner: m.winner })));

// Cobertura das colunas avancadas que os rankings usam
const adv = await p.$queryRawUnsafe(
  `SELECT
     SUM(shots_fired_total) shots, SUM(shots_on_target_total) hits,
     SUM(entry_count) entries, SUM(entry_wins) entry_wins,
     SUM(v1_wins) v1w, SUM(v2_wins) v2w,
     SUM(damage) dmg, SUM(kills) kills, SUM(head_shot_kills) hs,
     SUM(enemy3ks+enemy4ks+enemy5ks) multi
   FROM matchzy_stats_players`);
console.log('\nCobertura de stats (soma total):');
console.table(Object.fromEntries(Object.entries(adv[0]).map(([k, v]) => [k, Number(v)])));

await p.$disconnect();
