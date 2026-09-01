// ============================================================================
// Reconstroi no banco as partidas de UM dia a partir das demos ja parseadas.
//
// ADITIVO: nunca apaga partidas de outros dias. Para as partidas do dia alvo:
//   - se ja existe linha em matchzy_stats_matches (o MatchZy criou mas nao
//     conseguiu preencher), a linha e ATUALIZADA no lugar — o matchid e mantido;
//   - se nao existe, uma linha nova e inserida com matchid explicito livre;
//   - maps/players sao regravados apenas para esses matchids (idempotente).
//
// Rodar:  node --env-file=.env.local prisma/rebuild-day.mjs <parsed.json>
// Simular sem gravar:  DRY_RUN=1 node --env-file=.env.local prisma/rebuild-day.mjs <parsed.json>
//
// OBS: a demo so tem um subconjunto dos stats (kills, deaths, assists, damage,
// HS, multikills, utility_damage, enemies_flashed). As colunas avancadas do
// MatchZy (precisao, entries, clutches, economia) ficam 0 nessas partidas.
// ============================================================================

import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY = process.env.DRY_RUN === '1';
const parsedFile = process.argv[2];

if (!parsedFile) {
  console.error('Uso: node --env-file=.env.local prisma/rebuild-day.mjs <parsed.json>');
  process.exit(1);
}

// Colunas que a demo nao fornece — ficam zeradas (mesmo criterio do rebuild de julho)
function zeroStats() {
  return {
    enemy2ks: 0, utility_count: 0, utility_successes: 0, utility_enemies: 0,
    flash_count: 0, flash_successes: 0, health_points_removed_total: 0,
    shots_fired_total: 0, shots_on_target_total: 0, v1_count: 0, v1_wins: 0,
    v2_count: 0, v2_wins: 0, entry_count: 0, entry_wins: 0, equipment_value: 0,
    money_saved: 0, kill_reward: 0, live_time: 0, cash_earned: 0,
  };
}

const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

function pickTeam(teams, nameFromFilename, fallbackIndex) {
  return (
    teams.find((t) => t.clanName === nameFromFilename) ??
    teams.find((t) => norm(t.clanName) === norm(nameFromFilename)) ??
    teams[fallbackIndex]
  );
}

async function main() {
  const parsed = JSON.parse(fs.readFileSync(parsedFile, 'utf8'));
  console.log(`${parsed.length} partida(s) em ${parsedFile}${DRY ? '  [DRY RUN]' : ''}\n`);

  // Janela do dia coberto pelas demos, para procurar as linhas ja existentes
  const stamps = parsed.map((d) => new Date(d.datetime.replace(' ', 'T')).getTime());
  const from = new Date(Math.min(...stamps) - 6 * 3600e3);
  const to = new Date(Math.max(...stamps) + 6 * 3600e3);

  const existing = await prisma.match.findMany({
    where: { start_time: { gte: from, lte: to } },
    select: { matchid: true, start_time: true, team1_name: true, team2_name: true },
    orderBy: { start_time: 'asc' },
  });
  console.log(`${existing.length} linha(s) ja existentes em matchzy_stats_matches nessa janela.\n`);

  // Pool de matchids livres para as partidas que o MatchZy nem chegou a registrar.
  const used = new Set((await prisma.match.findMany({ select: { matchid: true } })).map((m) => m.matchid));
  let nextFreeId = Math.max(0, ...[...used].filter((id) => id < 1000)) + 1;
  const takeFreeId = () => {
    while (used.has(nextFreeId)) nextFreeId++;
    used.add(nextFreeId);
    return nextFreeId;
  };

  const taken = new Set();
  const plan = [];

  for (const demo of parsed) {
    const startTime = new Date(demo.datetime.replace(' ', 'T'));
    const t1 = pickTeam(demo.teams, demo.team1FromFilename, 0);
    const t2 = pickTeam(demo.teams, demo.team2FromFilename, 1);

    // Casa a demo com a linha existente: mesmos dois times e inicio proximo (<= 15 min)
    const candidate = existing.find(
      (m) =>
        !taken.has(m.matchid) &&
        Math.abs(m.start_time.getTime() - startTime.getTime()) <= 15 * 60e3 &&
        ((norm(m.team1_name) === norm(t1.clanName) && norm(m.team2_name) === norm(t2.clanName)) ||
          (norm(m.team1_name) === norm(t2.clanName) && norm(m.team2_name) === norm(t1.clanName)))
    );
    if (candidate) taken.add(candidate.matchid);

    plan.push({
      demo, startTime, t1, t2,
      matchid: candidate ? candidate.matchid : takeFreeId(),
      action: candidate ? 'UPDATE' : 'INSERT',
    });
  }

  console.log('Plano:');
  for (const p of plan) {
    console.log(
      `  ${p.action.padEnd(6)} matchid=${String(p.matchid).padEnd(7)} ` +
      `${p.demo.datetime}  ${p.t1.clanName} ${p.t1.score} x ${p.t2.score} ${p.t2.clanName}`
    );
  }
  const orphans = existing.filter((m) => !taken.has(m.matchid));
  if (orphans.length) {
    console.log(`\n  Linhas na janela sem demo correspondente (intocadas): ${orphans.map((m) => m.matchid).join(', ')}`);
  }

  if (DRY) {
    console.log('\n[DRY RUN] Nada foi gravado.');
    return;
  }

  console.log('\nGravando...\n');

  for (const { demo, startTime, t1, t2, matchid, action } of plan) {
    const winner = t1.score === t2.score ? '' : t1.score > t2.score ? t1.clanName : t2.clanName;
    const mapname = demo.header?.mapName || demo.mapFromFilename || '';
    const byNumber = (n) => demo.teams.find((t) => t.teamNumber === n);

    const matchData = {
      start_time: startTime,
      end_time: startTime,
      series_type: 'BO1',
      winner,
      team1_name: t1.clanName,
      team2_name: t2.clanName,
      team1_score: t1.score > t2.score ? 1 : 0,
      team2_score: t2.score > t1.score ? 1 : 0,
      server_ip: '-',
    };

    if (action === 'UPDATE') {
      await prisma.match.update({ where: { matchid }, data: matchData });
    } else {
      await prisma.match.create({ data: { matchid, ...matchData } });
    }

    // Regrava mapa/jogadores apenas deste matchid (respeitando as FKs)
    await prisma.playerStats.deleteMany({ where: { matchid } });
    await prisma.map.deleteMany({ where: { matchid } });

    await prisma.map.create({
      data: {
        matchid,
        mapnumber: 0,
        mapname,
        winner: winner.slice(0, 16), // maps.winner e VARCHAR(16) no schema do MatchZy
        start_time: startTime,
        end_time: startTime,
        team1_score: t1.score,
        team2_score: t2.score,
      },
    });

    await prisma.playerStats.createMany({
      data: demo.players.map((p) => ({
        matchid,
        mapnumber: 0,
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
      })),
    });

    console.log(
      `${action.padEnd(6)} matchid=${String(matchid).padEnd(7)} ` +
      `${t1.clanName} ${t1.score} x ${t2.score} ${t2.clanName}  (${mapname}, ${demo.players.length} jogadores)`
    );
  }

  console.log(`\nConcluido. ${plan.length} partida(s) gravadas.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
