const fs = require('fs');
const path = require('path');

const demoDir = path.join(__dirname, '..', 'MatchZy_demo');
const files = fs.readdirSync(demoDir).filter(f => f.endsWith('.dem'));

const demos = files.map(name => {
  // Formato esperado: YYYY-MM-DD_HH-MM-SS_matchid_de_map_team_<team1>_vs_team_<team2>.dem
  // ou cs_map
  const base = name.replace('.dem', '');
  const m = base.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})_(-?\d+)_(de_[a-z0-9]+|cs_[a-z0-9]+)_team_(.+)_vs_team_(.+)$/);
  if (!m) {
    console.warn('Não conseguiu parsear:', name);
    return null;
  }
  return {
    filename: name,
    datetime: `${m[1]} ${m[2].replace(/-/g, ':')}`,
    matchid: m[3],
    map: m[4],
    team1: `team_${m[5]}`,
    team2: `team_${m[6]}`,
  };
}).filter(Boolean);

demos.sort((a, b) => a.datetime.localeCompare(b.datetime));

console.log('=== Demos encontradas ===\n');
demos.forEach((d, idx) => {
  console.log(`${idx + 1}. ${d.datetime} | matchid=${d.matchid} | ${d.map} | ${d.team1} vs ${d.team2}`);
});

console.log('\n=== Resumo ===');
console.log(`Total de demos: ${demos.length}`);
console.log(`Match IDs únicos: ${[...new Set(demos.map(d => d.matchid))].join(', ')}`);
console.log(`Mapas: ${[...new Set(demos.map(d => d.map))].join(', ')}`);
