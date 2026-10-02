// URLs dos modelos e texturas 3D, hospedados no repositorio do LielXD.
//
// Os caminhos tem colchetes no nome da pasta ("[models]", "[textures]"), que
// precisam ir codificados — por isso os %5B/%5D literais.
//
// Nao importa JSON: e usado pelo client component do preview.

const BASE =
  'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/refs/heads/main/src';

const MODELOS = `${BASE}/%5Bmodels%5D`;
const TEXTURAS = `${BASE}/%5Btextures%5D`;

// Nome do arquivo: arma usa weapon_name; luva usa o defindex.
export function urlModelo(alvo) {
  return `${MODELOS}/${alvo}.glb`;
}

// Devolve [candidatosDaCor, candidatosDoMetal]. Cada lista tem .png e .webp
// porque o catalogo usa um ou outro dependendo da skin.
export function urlsTextura(alvo, paint) {
  if (paint === null || paint === undefined || paint === '' || Number(paint) === 0) {
    // Skin padrao nao tem textura propria — o modelo ja vem com ela.
    return [[], []];
  }

  const base = `${TEXTURAS}/${alvo}/${paint}`;
  return [
    [`${base}.png`, `${base}.webp`],
    [`${base}_metal.png`, `${base}_metal.webp`],
  ];
}

// Facas, luvas e taser tem um unico mesh no .glb; as demais armas trazem o
// modelo legado e o atual, e e preciso remover um. Ver Viewer3D.
export function temMeshUnico(nomeOuDefindex, categoria) {
  return (
    categoria === 'knifes' ||
    categoria === 'gloves' ||
    String(nomeOuDefindex).includes('weapon_taser')
  );
}
