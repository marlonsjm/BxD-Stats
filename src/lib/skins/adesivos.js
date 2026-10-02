// Adesivos e chaveiro: as strings posicionais que o plugin le.
//
// Formato (confirmado no WeaponSynchronization.cs do upstream):
//   weapon_sticker_0..4  ->  id;schema;x;y;wear;scale;rotation   (7 campos)
//   weapon_keychain      ->  id;x;y;z;seed                       (5 campos)
//
// id = 0 significa "slot vazio". O plugin exige a contagem exata de campos:
// string malformada e ignorada em silencio.
//
// Sem imports de JSON de proposito — este modulo e usado pelo client component
// do formulario, e o catalogo de adesivos tem 2 MB.

export const SLOTS_ADESIVO = 5;
export const SEED_CHAVEIRO_MAX = 100000;

// ATENCAO ao `scale`: o site PHP antigo gravava 0 em todos os campos de
// posicao, porque a colocacao customizada nunca foi implementada la (o proprio
// config.php dizia "not an option yet, future feature"). E o plugin aplica o
// valor LITERAL, sem normalizar zero — ou seja, adesivo com escala 0. Aqui o
// padrao e 1, que e a escala normal de um adesivo no CS2.
export const ADESIVO_PADRAO = {
  id: 0,
  schema: 0,
  x: 0,
  y: 0,
  wear: 0,
  scale: 1,
  rotation: 0,
};

export const CHAVEIRO_PADRAO = { id: 0, x: 0, y: 0, z: 0, seed: 0 };

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function parseAdesivo(texto) {
  const partes = String(texto ?? '').split(';');
  if (partes.length !== 7) return { ...ADESIVO_PADRAO };

  const id = num(partes[0]);
  if (id <= 0) return { ...ADESIVO_PADRAO };

  return {
    id,
    schema: num(partes[1]),
    x: num(partes[2]),
    y: num(partes[3]),
    wear: num(partes[4]),
    // Linha gravada pelo site antigo vem com escala 0; tratamos como 1 para o
    // adesivo nao sumir, em vez de propagar o valor quebrado.
    scale: num(partes[5]) > 0 ? num(partes[5]) : 1,
    rotation: num(partes[6]),
  };
}

export function serializarAdesivo(a) {
  if (!a || num(a.id) <= 0) return '0;0;0;0;0;0;0';
  const s = num(a.scale, 1);
  return [
    Math.trunc(num(a.id)),
    Math.trunc(num(a.schema)),
    num(a.x),
    num(a.y),
    num(a.wear),
    s > 0 ? s : 1,
    num(a.rotation),
  ].join(';');
}

export function parseChaveiro(texto) {
  const partes = String(texto ?? '').split(';');
  if (partes.length !== 5) return { ...CHAVEIRO_PADRAO };

  const id = num(partes[0]);
  if (id <= 0) return { ...CHAVEIRO_PADRAO };

  return {
    id,
    x: num(partes[1]),
    y: num(partes[2]),
    z: num(partes[3]),
    seed: num(partes[4]),
  };
}

export function serializarChaveiro(k) {
  if (!k || num(k.id) <= 0) return '0;0;0;0;0';
  return [
    Math.trunc(num(k.id)),
    num(k.x),
    num(k.y),
    num(k.z),
    Math.trunc(num(k.seed)),
  ].join(';');
}

// Imagem de um adesivo/chaveiro pelo id, sem precisar do catalogo inteiro.
// O padrao de URL e estavel no repositorio do plugin.
const IMG = 'https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins';

export function imagemAdesivo(id) {
  return id > 0 ? `${IMG}/sticker-${id}.png` : null;
}

export function imagemChaveiro(id) {
  return id > 0 ? `${IMG}/keychain-${id}.png` : null;
}
