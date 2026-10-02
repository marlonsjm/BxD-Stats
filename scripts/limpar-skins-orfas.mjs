// Remove de wp_player_skins as linhas de arma exclusiva do lado errado
// (AK no CT, M4 no TR).
//
// Por que existem: ate 02/10/2026 a copia TR<->CT levava tudo, inclusive as
// exclusivas. Essas linhas nunca sao aplicadas pelo plugin — arma pega do chao
// preserva a skin do dono original —, so poluem a visualizacao do loadout.
// A copia ja filtra; este script limpa o que ficou para tras.
//
// Rodar:   node --env-file=.env.local scripts/limpar-skins-orfas.mjs
// Simular: DRY_RUN=1 node --env-file=.env.local scripts/limpar-skins-orfas.mjs

import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { weaponAllowedForTeam } from '../src/lib/skins/exclusivas.js';

const DRY_RUN = process.env.DRY_RUN === '1';
const prisma = new PrismaClient();

// weapon_defindex -> weapon_name, a partir das entradas padrao do catalogo.
const skins = JSON.parse(fs.readFileSync('src/data/skins/skins.json', 'utf8'));
const nomePorDefindex = new Map();
for (const s of skins) {
  if (typeof s.weapon_defindex !== 'number') continue;
  if (!nomePorDefindex.has(s.weapon_defindex)) {
    nomePorDefindex.set(s.weapon_defindex, s.weapon_name);
  }
}

const linhas = await prisma.playerSkin.findMany();
const orfas = linhas.filter((l) => {
  const nome = nomePorDefindex.get(l.weapon_defindex);
  return nome && !weaponAllowedForTeam(nome, l.weapon_team);
});

console.log(`${linhas.length} linhas em wp_player_skins, ${orfas.length} órfãs`);

if (orfas.length === 0) {
  await prisma.$disconnect();
  process.exit(0);
}

for (const o of orfas) {
  const lado = o.weapon_team === 3 ? 'CT' : 'TR';
  console.log(`  ${o.steamid}  ${lado}  ${nomePorDefindex.get(o.weapon_defindex)}`);
}

if (DRY_RUN) {
  console.log('\n(DRY_RUN: nada foi apagado)');
} else {
  let apagadas = 0;
  for (const o of orfas) {
    await prisma.playerSkin.delete({
      where: {
        steamid_weapon_team_weapon_defindex: {
          steamid: o.steamid,
          weapon_team: o.weapon_team,
          weapon_defindex: o.weapon_defindex,
        },
      },
    });
    apagadas++;
  }
  console.log(`\n${apagadas} linha(s) removida(s).`);
}

await prisma.$disconnect();
