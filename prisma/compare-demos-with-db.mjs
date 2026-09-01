import fs from 'fs';

const parsedPath = 'D:\\BxD-Stats\\prisma\\parsed-demos.json';
const parsed = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));

// Soma estatísticas por jogador a partir das demos
const demoTotals = {};
for (const demo of parsed) {
  for (const p of demo.players) {
    if (!demoTotals[p.name]) {
      demoTotals[p.name] = {
        name: p.name,
        kills: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        headshotKills: 0,
        enemy3Ks: 0,
        enemy4Ks: 0,
        enemy5Ks: 0,
        maps: 0,
      };
    }
    demoTotals[p.name].kills += p.kills;
    demoTotals[p.name].deaths += p.deaths;
    demoTotals[p.name].assists += p.assists;
    demoTotals[p.name].damage += p.damage;
    demoTotals[p.name].headshotKills += p.headshotKills;
    demoTotals[p.name].enemy3Ks += p.enemy3Ks;
    demoTotals[p.name].enemy4Ks += p.enemy4Ks;
    demoTotals[p.name].enemy5Ks += p.enemy5Ks;
    demoTotals[p.name].maps += 1;
  }
}

// Dados do banco (matchid=0 agregados + matchid=-1)
// Extraídos manualmente do dump SQL
const dbTotals = {
  'Knife': { kills: 27, deaths: 37, damage: 2993, head_shot_kills: 9, enemy3ks: 1, enemy4ks: 0, enemy5ks: 0, maps: 2 },
  'FabulosoDG*N1*Androide-Lenda': { kills: 56, deaths: 36, damage: 5698, head_shot_kills: 18, enemy3ks: 3, enemy4ks: 1, enemy5ks: 0, maps: 2 },
  'IVOZ1KA': { kills: 29, deaths: 46, damage: 3615, head_shot_kills: 8, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0, maps: 2 },
  'D Z N': { kills: 39, deaths: 44, damage: 4980, head_shot_kills: 21, enemy3ks: 3, enemy4ks: 1, enemy5ks: 0, maps: 2 },
  'rAzza': { kills: 48, deaths: 39, damage: 5240, head_shot_kills: 12, enemy3ks: 4, enemy4ks: 0, enemy5ks: 0, maps: 2 },
  'R4MON': { kills: 34, deaths: 41, damage: 3558, head_shot_kills: 9, enemy3ks: 1, enemy4ks: 0, enemy5ks: 0, maps: 2 },
  'Ing': { kills: 41, deaths: 43, damage: 3843, head_shot_kills: 14, enemy3ks: 1, enemy4ks: 0, enemy5ks: 0, maps: 2 },
  'rooNIZNoGouD': { kills: 50, deaths: 37, damage: 4698, head_shot_kills: 17, enemy3ks: 3, enemy4ks: 0, enemy5ks: 0, maps: 2 },
  '310': { kills: 35, deaths: 38, damage: 3617, head_shot_kills: 13, enemy3ks: 1, enemy4ks: 0, enemy5ks: 0, maps: 2 },
  'duck lee skins': { kills: 9, deaths: 23, damage: 1181, head_shot_kills: 4, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0, maps: 1 },
  'Geo <*)))\u003e\u003c': { kills: 25, deaths: 24, damage: 2719, head_shot_kills: 15, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0, maps: 1 },
  'cobr4w -': { kills: 19, deaths: 14, damage: 1825, head_shot_kills: 10, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0, maps: 1 },
  'Viteco': { kills: 22, deaths: 22, damage: 2529, head_shot_kills: 7, enemy3ks: 3, enemy4ks: 0, enemy5ks: 0, maps: 1 },
  'É o Lusca': { kills: 14, deaths: 27, damage: 1380, head_shot_kills: 4, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0, maps: 1 },
  'GIGANTESCO DA GAMA': { kills: 18, deaths: 22, damage: 1796, head_shot_kills: 8, enemy3ks: 1, enemy4ks: 0, enemy5ks: 0, maps: 1 },
  'LUCAS77': { kills: 39, deaths: 20, damage: 3847, head_shot_kills: 15, enemy3ks: 5, enemy4ks: 1, enemy5ks: 0, maps: 1 },
  'eomarl1n': { kills: 10, deaths: 13, damage: 1052, head_shot_kills: 5, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0, maps: 1 },
  'f0rest': { kills: 4, deaths: 16, damage: 750, head_shot_kills: 2, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0, maps: 1 },
  'dzBÍCEPS': { kills: 14, deaths: 23, damage: 1973, head_shot_kills: 4, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0, maps: 1 },
};

console.log('=== Comparação Demo vs Banco ===\n');
console.log('Jogador | Kills Demo | Kills DB | Diff | Maps Demo | Maps DB');
for (const name of Object.keys(demoTotals).sort()) {
  const d = demoTotals[name];
  const b = dbTotals[name];
  if (b) {
    const diff = d.kills - b.kills;
    console.log(`${name} | ${d.kills} | ${b.kills} | ${diff >= 0 ? '+' : ''}${diff} | ${d.maps} | ${b.maps}`);
  } else {
    console.log(`${name} | ${d.kills} | N/A | N/A | ${d.maps} | N/A`);
  }
}

console.log('\n=== Jogadores no banco que não aparecem nas demos ===');
for (const name of Object.keys(dbTotals)) {
  if (!demoTotals[name]) {
    console.log(name, dbTotals[name]);
  }
}
