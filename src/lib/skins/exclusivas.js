// Armas exclusivas de um lado.
//
// Modulo sem nenhum import, de proposito: assim o script de manutencao
// (scripts/limpar-skins-orfas.mjs) consegue importa-lo direto pelo node, que
// nao entende o alias `@/`. O catalog.js reexporta daqui.

export const TIME_TR = 2;
export const TIME_CT = 3;

export const SO_CT = new Set([
  'weapon_m4a1',
  'weapon_m4a1_silencer',
  'weapon_usp_silencer',
  'weapon_aug',
  'weapon_fiveseven',
  'weapon_famas',
  'weapon_scar20',
  'weapon_mp9',
  'weapon_hkp2000',
]);

export const SO_TR = new Set([
  'weapon_ak47',
  'weapon_galilar',
  'weapon_glock',
  'weapon_sg556',
  'weapon_elite',
  'weapon_g3sg1',
  'weapon_mac10',
  'weapon_tec9',
]);

// Equipar skin de M4 no TR nao aparece no jogo: a arma nao existe daquele lado,
// e arma pega do chao preserva a skin do dono original.
export function weaponAllowedForTeam(weaponName, team) {
  if (SO_CT.has(weaponName)) return Number(team) === TIME_CT;
  if (SO_TR.has(weaponName)) return Number(team) === TIME_TR;
  return true;
}
