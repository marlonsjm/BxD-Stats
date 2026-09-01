// ============================================================================
// Reconstroi as partidas de 18/07 no banco a partir das demos parseadas.
// ----------------------------------------------------------------------------
// Use DEPOIS de:
//   1. rodar prisma/reset-tables.sql no TiDB, e
//   2. reiniciar o servidor CS2 (para o MatchZy recriar as tabelas corretas).
//
// Rodar:  node prisma/rebuild-from-demos.mjs
// Forcar (mesmo com dados existentes):  FORCE=1 node prisma/rebuild-from-demos.mjs
//
// OBS: as demos so capturam um subconjunto dos stats (kills, deaths, assists,
// damage, HS, multikills, utility_damage, enemies_flashed). As colunas
// avancadas do MatchZy que a demo nao tem (flashes, v1/v2, entradas, shots,
// economia, etc.) ficam em 0. Os numeros principais sao os reais das partidas.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function zeroStats() {
  return {
    enemy2ks: 0, utility_count: 0, utility_successes: 0, utility_enemies: 0,
    flash_count: 0, flash_successes: 0, health_points_removed_total: 0,
    shots_fired_total: 0, shots_on_target_total: 0, v1_count: 0, v1_wins: 0,
    v2_count: 0, v2_wins: 0, entry_count: 0, entry_wins: 0, equipment_value: 0,
    money_saved: 0, kill_reward: 0, live_time: 0, cash_earned: 0,
  };
}

async function main() {
  const parsed = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'parsed-demos.json'), 'utf8')
  );

  // Idempotente: limpa qualquer dado existente antes de reconstruir (ordem respeita relacoes)
  const delP = await prisma.playerStats.deleteMany({});
  const delM = await prisma.map.deleteMany({});
  const delMa = await prisma.match.deleteMany({});
  console.log(`Limpeza previa: ${delMa.count} matches, ${delM.count} maps, ${delP.count} player stats removidos.`);

  console.log(`Reconstruindo ${parsed.length} partidas a partir das demos...\n`);

  for (const demo of parsed) {
    const teams = demo.teams;
    const byNumber = (n) => teams.find((t) => t.teamNumber === n);
    const byClan = (name) => teams.find((t) => t.clanName === name);

    const t1 = byClan(demo.team1FromFilename) ?? teams[0];
    const t2 = byClan(demo.team2FromFilename) ?? teams[1];
    const winner = t1.score === t2.score ? '' : (t1.score > t2.score ? t1.clanName : t2.clanName);
    const mapWinner = winner.slice(0, 16); // maps.winner e VARCHAR(16) no schema do MatchZy
    const startTime = new Date(demo.datetime.replace(' ', 'T'));
    const mapname = demo.header?.mapName || demo.mapFromFilename || '';

    const playerData = demo.players.map((p) => ({
      steamid64: BigInt(p.steamId),
      name: p.name,
      team: byNumber(p.team)?.clanName || '',
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      damage: p.damage,
      head_shot_kills: p.headshotKills,
      utility_damage: p.utilityDamage,
      enemies_flashed: p.enemiesFlashed,
      health_points_dealt_total: p.damage,
      enemy3ks: p.enemy3Ks,
      enemy4ks: p.enemy4Ks,
      enemy5ks: p.enemy5Ks,
      ...zeroStats(),
    }));

    const match = await prisma.match.create({
      data: {
        start_time: startTime,
        end_time: startTime,
        series_type: 'BO1',
        winner,
        team1_name: t1.clanName,
        team2_name: t2.clanName,
        team1_score: t1.score > t2.score ? 1 : 0,
        team2_score: t2.score > t1.score ? 1 : 0,
        server_ip: '-',
        maps: {
          create: [
            {
              mapnumber: 0,
              mapname,
              winner: mapWinner,
              start_time: startTime,
              end_time: startTime,
              team1_score: t1.score,
              team2_score: t2.score,
              // mapnumber/matchid vem da relacao com o Map (nested write) — nao passar aqui
              player_stats: {
                create: playerData,
              },
            },
          ],
        },
      },
    });

    console.log(
      `OK  matchid=${match.matchid}  ${t1.clanName} ${t1.score} x ${t2.score} ${t2.clanName}  (${mapname})`
    );
  }

  console.log(`\nConcluido. ${parsed.length} partidas restauradas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
