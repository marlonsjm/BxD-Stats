// ============================================================================
// Extrai os stats finais de cada demo do MatchZy para JSON, no mesmo formato de
// prisma/parsed-demos.json (usado pelo rebuild). Serve para reconstruir partidas
// que o MatchZy nao conseguiu gravar no banco.
//
// Rodar:  node prisma/parse-demos.mjs <pasta-de-demos> <arquivo-de-saida> [filtro]
// Ex:     node prisma/parse-demos.mjs "D:/steamcmd/cs2-server/game/csgo/MatchZy_demo" prisma/parsed-demos-2026-08-29.json 2026-08-29
// ============================================================================

import fs from 'fs';
import path from 'path';
import pkg from '@laihoe/demoparser2';

const { parseHeader, parseEvent, parseTicks } = pkg;

const [demoDir, outFile, filter = ''] = process.argv.slice(2);
if (!demoDir || !outFile) {
  console.error('Uso: node prisma/parse-demos.mjs <pasta-de-demos> <saida.json> [filtro]');
  process.exit(1);
}

const PROPS = [
  'kills_total', 'deaths_total', 'assists_total', 'damage_total',
  'headshot_kills_total', 'utility_damage_total', 'enemies_flashed_total',
  '3k_rounds_total', '4k_rounds_total', 'ace_rounds_total', 'mvps', 'score',
  'team_name', 'team_clan_name', 'team_num',
  'team_rounds_total', 'team_score_first_half', 'team_score_second_half',
];

// YYYY-MM-DD_HH-MM-SS_matchid_de_map_team_<t1>_vs_team_<t2>.dem
const NAME_RE = /^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})_(-?\d+)_((?:de|cs)_[a-z0-9]+)_(team_.+)_vs_(team_.+)$/;

const files = fs
  .readdirSync(demoDir)
  .filter((f) => f.endsWith('.dem') && f.includes(filter))
  .sort();

console.log(`${files.length} demo(s) para processar em ${demoDir}\n`);

const results = [];

for (const [i, name] of files.entries()) {
  const full = path.join(demoDir, name);
  const sizeMb = (fs.statSync(full).size / 1024 / 1024).toFixed(0);
  console.log(`[${i + 1}/${files.length}] ${name} (${sizeMb} MB)`);

  const m = name.replace('.dem', '').match(NAME_RE);
  if (!m) {
    console.warn('   ! nome fora do padrao, pulando');
    continue;
  }

  try {
    const header = parseHeader(full);

    // O placar final so e valido no tick do painel de fim de partida.
    const panel = parseEvent(full, 'cs_win_panel_match');
    if (!panel.length) {
      console.warn('   ! sem cs_win_panel_match (partida incompleta?), pulando');
      continue;
    }
    const endTick = panel.at(-1).tick;

    const rows = parseTicks(full, PROPS, [endTick]).filter(
      (r) => r.team_num === 2 || r.team_num === 3
    );
    if (!rows.length) {
      console.warn('   ! nenhum jogador no tick final, pulando');
      continue;
    }

    // Times sao deduzidos das linhas dos jogadores (todos carregam o placar do seu time)
    const teams = [];
    for (const r of rows) {
      if (teams.some((t) => t.teamNumber === r.team_num)) continue;
      teams.push({
        teamNumber: r.team_num,
        teamName: r.team_name,
        clanName: r.team_clan_name,
        score: r.team_rounds_total,
        scoreFirstHalf: r.team_score_first_half,
        scoreSecondHalf: r.team_score_second_half,
        members: rows.filter((p) => p.team_num === r.team_num).map((p) => p.name),
      });
    }

    results.push({
      filename: name,
      datetime: `${m[1]} ${m[2].replace(/-/g, ':')}`,
      originalMatchid: m[3],
      mapFromFilename: m[4],
      team1FromFilename: m[5],
      team2FromFilename: m[6],
      header: { serverName: header.server_name, mapName: header.map_name },
      teams,
      players: rows.map((r) => ({
        name: r.name,
        steamId: r.steamid,
        team: r.team_num,
        kills: r.kills_total,
        deaths: r.deaths_total,
        assists: r.assists_total,
        damage: r.damage_total,
        headshotKills: r.headshot_kills_total,
        utilityDamage: r.utility_damage_total,
        enemiesFlashed: r.enemies_flashed_total,
        enemy3Ks: r['3k_rounds_total'],
        enemy4Ks: r['4k_rounds_total'],
        enemy5Ks: r.ace_rounds_total,
        score: r.score,
        mvps: r.mvps,
      })),
    });

    const [a, b] = teams;
    console.log(`   OK  ${a.clanName} ${a.score} x ${b.score} ${b.clanName}  (${rows.length} jogadores)`);
  } catch (e) {
    console.error(`   ! ERRO: ${e.message.split('\n')[0]}`);
  }
}

fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
console.log(`\n${results.length} partida(s) gravadas em ${outFile}`);
