// Constantes de customizacao (desgaste, seed, etiqueta).
//
// Mora num modulo proprio, SEM importar os JSON do catalogo, porque o
// formulario de customizacao e client component: importar isto de catalog.js
// arrastaria skins.json (523 KB) e companhia para o bundle do navegador.
// Medido: fazia /skins/[item]/[paint] ir de 145 kB para 187 kB de First Load.

export const SEED_MAX = 1000;
export const NAMETAG_MAX = 20; // o jogo corta bem antes dos 128 da coluna

// Faixas de desgaste do CS2. `valor` e o float usado pelos atalhos da interface.
// A ordem importa: a primeira faixa que couber vence.
export const FAIXAS_DESGASTE = [
  { id: 'fn', label: 'Nova de Fábrica', curto: 'FN', max: 0.07, valor: 0.01 },
  { id: 'mw', label: 'Pouco Usada', curto: 'MW', max: 0.15, valor: 0.1 },
  { id: 'ft', label: 'Testada em Campo', curto: 'FT', max: 0.38, valor: 0.25 },
  { id: 'ww', label: 'Bem Desgastada', curto: 'WW', max: 0.45, valor: 0.41 },
  { id: 'bs', label: 'Veterana de Guerra', curto: 'BS', max: 1.01, valor: 0.7 },
];

export function faixaDoDesgaste(wear) {
  const w = Number(wear);
  return (
    FAIXAS_DESGASTE.find((f) => w < f.max) ??
    FAIXAS_DESGASTE[FAIXAS_DESGASTE.length - 1]
  );
}
