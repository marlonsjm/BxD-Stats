// Times, como o plugin grava na coluna weapon_team.
//
// Modulo proprio, SEM importar os JSON do catalogo: client components precisam
// destas constantes, e importa-las de catalog.js arrastaria skins.json (523 KB)
// e companhia para o bundle do navegador.
//
// Ja aconteceu duas vezes nesta migracao — o formulario de customizacao e o
// botao de copiar loadout. Em ambos o custo foi ~40 KB de JS por rota.

export const TEAM_T = 2;
export const TEAM_CT = 3;

export const TEAMS = [
  { id: TEAM_T, slug: 't', label: 'TR' },
  { id: TEAM_CT, slug: 'ct', label: 'CT' },
];

export function teamFromSlug(slug) {
  return slug === 'ct' ? TEAM_CT : TEAM_T;
}

export function slugFromTeam(team) {
  return Number(team) === TEAM_CT ? 'ct' : 't';
}
