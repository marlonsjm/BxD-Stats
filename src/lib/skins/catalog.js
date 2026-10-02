// Catalogo estatico de skins do CS2 — categorias, armas e imagens padrao.
//
// A fonte destes dados sao os JSON em src/data/skins/, gerados a partir dos
// repositorios do Nereziel (plugin) e do LielXD (site original). Eles nao mudam
// em runtime: o modulo deriva os indices uma vez e reaproveita.
//
// ATENCAO ao tamanho: skins.json tem ~520 KB e stickers.json ~2 MB. Este arquivo
// so importa skins/gloves/agents/music. Stickers e keychains sao carregados sob
// demanda na tela de customizacao (ver loadStickers/loadKeychains).

import skinsData from '@/data/skins/skins.json';
import glovesData from '@/data/skins/gloves.json';
import agentsData from '@/data/skins/agents.json';
import musicData from '@/data/skins/music.json';

// Times: definidos em times.js (sem JSON) e reexportados aqui por
// conveniencia do codigo de servidor, que ja importa deste modulo.
export { TEAM_T, TEAM_CT, TEAMS, teamFromSlug, slugFromTeam } from '@/lib/skins/times';
import { TEAM_T, TEAM_CT, slugFromTeam } from '@/lib/skins/times';

// Ordem das categorias na interface.
export const CATEGORIES = [
  { id: 'rifles', label: 'Rifles' },
  { id: 'pistols', label: 'Pistolas' },
  { id: 'smg', label: 'SMGs' },
  { id: 'sniper_rifles', label: 'Snipers' },
  { id: 'shotguns', label: 'Escopetas' },
  { id: 'machine_guns', label: 'Metralhadoras' },
  { id: 'knifes', label: 'Facas' },
  { id: 'gloves', label: 'Luvas' },
  { id: 'agents', label: 'Agentes' },
  { id: 'music', label: 'Música' },
];

export const DEFAULT_CATEGORY = 'rifles';

export function isCategory(id) {
  return CATEGORIES.some((c) => c.id === id);
}

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

// weapon_name -> categoria. Copiado do site PHP (pages/skins.php).
const WEAPON_CATEGORY = {
  // Facas
  weapon_bayonet: 'knifes',
  weapon_knife_css: 'knifes',
  weapon_knife_flip: 'knifes',
  weapon_knife_gut: 'knifes',
  weapon_knife_karambit: 'knifes',
  weapon_knife_m9_bayonet: 'knifes',
  weapon_knife_tactical: 'knifes',
  weapon_knife_falchion: 'knifes',
  weapon_knife_survival_bowie: 'knifes',
  weapon_knife_butterfly: 'knifes',
  weapon_knife_push: 'knifes',
  weapon_knife_cord: 'knifes',
  weapon_knife_canis: 'knifes',
  weapon_knife_ursus: 'knifes',
  weapon_knife_gypsy_jackknife: 'knifes',
  weapon_knife_outdoor: 'knifes',
  weapon_knife_stiletto: 'knifes',
  weapon_knife_widowmaker: 'knifes',
  weapon_knife_skeleton: 'knifes',
  weapon_knife_kukri: 'knifes',
  weapon_knife_default: 'knifes',

  // Pistolas
  weapon_deagle: 'pistols',
  weapon_cz75a: 'pistols',
  weapon_fiveseven: 'pistols',
  weapon_glock: 'pistols',
  weapon_hkp2000: 'pistols',
  weapon_p250: 'pistols',
  weapon_revolver: 'pistols',
  weapon_tec9: 'pistols',
  weapon_usp_silencer: 'pistols',
  weapon_elite: 'pistols',
  weapon_taser: 'pistols',

  // Rifles
  weapon_ak47: 'rifles',
  weapon_aug: 'rifles',
  weapon_famas: 'rifles',
  weapon_galilar: 'rifles',
  weapon_m4a1: 'rifles',
  weapon_m4a1_silencer: 'rifles',
  weapon_sg556: 'rifles',

  // SMG
  weapon_mac10: 'smg',
  weapon_mp5sd: 'smg',
  weapon_mp7: 'smg',
  weapon_mp9: 'smg',
  weapon_bizon: 'smg',
  weapon_p90: 'smg',
  weapon_ump45: 'smg',

  // Metralhadoras
  weapon_m249: 'machine_guns',
  weapon_negev: 'machine_guns',

  // Snipers
  weapon_ssg08: 'sniper_rifles',
  weapon_awp: 'sniper_rifles',
  weapon_scar20: 'sniper_rifles',
  weapon_g3sg1: 'sniper_rifles',

  // Escopetas
  weapon_mag7: 'shotguns',
  weapon_nova: 'shotguns',
  weapon_sawedoff: 'shotguns',
  weapon_xm1014: 'shotguns',
};

// Armas exclusivas de um lado. Equipar skin de M4 no TR nao aparece no jogo,
// entao a lista nem e exibida para o time errado.
const CT_ONLY = new Set([
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

const T_ONLY = new Set([
  'weapon_ak47',
  'weapon_galilar',
  'weapon_glock',
  'weapon_sg556',
  'weapon_elite',
  'weapon_g3sg1',
  'weapon_mac10',
  'weapon_tec9',
]);

export function weaponAllowedForTeam(weaponName, team) {
  if (CT_ONLY.has(weaponName)) return Number(team) === TEAM_CT;
  if (T_ONLY.has(weaponName)) return Number(team) === TEAM_T;
  return true;
}

// ---------------------------------------------------------------------------
// Indices derivados de skins.json (feito uma vez, no carregamento do modulo)
// ---------------------------------------------------------------------------

// weapon_name -> { name, defindex, category, image, label }
// A entrada "padrao" de cada arma e a de paint 0 (ou 'default', no caso da faca
// generica). E dela que sai a imagem e o defindex numerico que o banco usa.
const WEAPONS = (() => {
  const porArma = new Map();

  for (const skin of skinsData) {
    const nome = skin.weapon_name;
    const categoria = WEAPON_CATEGORY[nome];
    if (!categoria) continue;

    const ehPadrao = skin.paint === 0 || skin.paint === '0' || skin.paint === 'default';
    if (!ehPadrao || porArma.has(nome)) continue;

    porArma.set(nome, {
      name: nome,
      defindex: skin.weapon_defindex,
      category: categoria,
      image: skin.image,
      // "AK-47  | Default" -> "AK-47"
      label: String(skin.paint_name || nome).split('|')[0].trim(),
    });
  }

  return porArma;
})();

export function weaponByName(name) {
  return WEAPONS.get(name) ?? null;
}

// weapon_defindex -> arma. Necessario porque wp_player_skins guarda armas,
// facas e luvas na mesma tabela, identificadas so pelo defindex.
const WEAPONS_POR_DEFINDEX = (() => {
  const indice = new Map();
  for (const w of WEAPONS.values()) indice.set(String(w.defindex), w);
  return indice;
})();

export function weaponByDefindex(defindex) {
  return WEAPONS_POR_DEFINDEX.get(String(defindex)) ?? null;
}

// Quantas skins existem para cada arma (usado para mostrar a contagem no card).
const SKIN_COUNT = (() => {
  const contagem = new Map();
  for (const skin of skinsData) {
    const nome = skin.weapon_name;
    if (!WEAPON_CATEGORY[nome]) continue;
    contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
  }
  return contagem;
})();

export function skinCount(weaponName) {
  return SKIN_COUNT.get(weaponName) ?? 0;
}

// `${weapon_defindex}:${paint}` -> entrada do catalogo. E assim que a linha
// gravada no banco (weapon_defindex + weapon_paint_id) vira imagem e nome.
const SKIN_BY_KEY = (() => {
  const indice = new Map();
  for (const s of skinsData) {
    indice.set(`${s.weapon_defindex}:${s.paint}`, s);
  }
  return indice;
})();

export function skinByDefindexPaint(defindex, paint) {
  return SKIN_BY_KEY.get(`${defindex}:${paint}`) ?? null;
}

// Todas as skins de uma arma (para a tela de escolha, fase 3).
export function skinsForWeapon(weaponName) {
  return skinsData.filter((s) => s.weapon_name === weaponName);
}

// Lista de armas de uma categoria, ja filtrada pelo time.
export function weaponsForCategory(category, team) {
  return [...WEAPONS.values()]
    .filter((w) => w.category === category && weaponAllowedForTeam(w.name, team))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

// --- Luvas, agentes e musica: formatos proprios, nao vem de skins.json ---

// As luvas "default" tem weapon_defindex string ('gloves_default'); as demais
// sao numericas. A primeira ocorrencia de cada defindex e a entrada padrao.
export function glovesForTeam(team) {
  const slug = slugFromTeam(team);
  const vistos = new Set();
  const lista = [];

  for (const g of glovesData) {
    const key = String(g.weapon_defindex);
    // As luvas padrao vem duplicadas, uma por time (paint 't' / 'ct').
    if (key === 'gloves_default' && g.paint !== slug) continue;
    if (vistos.has(key)) continue;
    vistos.add(key);
    lista.push({
      defindex: g.weapon_defindex,
      paint: g.paint,
      image: g.image,
      label: String(g.paint_name || 'Luvas').split('|')[0].trim(),
    });
  }

  return lista;
}

// Todas as cores de um modelo de luva (para a tela de escolha).
export function glovePaints(defindex) {
  return glovesData.filter((g) => String(g.weapon_defindex) === String(defindex));
}

// Modelo de luva pelo defindex, com o rotulo ja limpo.
export function gloveByDefindex(defindex) {
  const primeira = glovesData.find(
    (g) => String(g.weapon_defindex) === String(defindex)
  );
  if (!primeira) return null;
  return {
    defindex: primeira.weapon_defindex,
    image: primeira.image,
    label: String(primeira.paint_name || 'Luvas').split('|')[0].trim(),
  };
}

export function agentsForTeam(team) {
  return agentsData.filter((a) => Number(a.team) === Number(team));
}

export function musicKits() {
  return musicData;
}

// --- Carregados sob demanda (arquivos grandes) ---

export async function loadStickers() {
  return (await import('@/data/skins/stickers.json')).default;
}

export async function loadKeychains() {
  return (await import('@/data/skins/keychains.json')).default;
}
