// Aproximação do Rating 2.0 da HLTV.
//
// A fórmula pública (reconstruída pela comunidade) é:
//   Rating = 0.0073*KAST + 0.3591*KPR - 0.5329*DPR + 0.2372*Impact + 0.0032*ADR + 0.1587
//   Impact = 2.13*KPR + 0.42*APR - 0.41
//
// O MatchZy não registra KAST, então usamos um KAST fixo de 68% (média típica).
// Isso desloca todos os ratings pela mesma constante, preservando a comparação entre jogadores.
const KAST_BASELINE = 68;

export function calculateRating({ kills, deaths, assists, damage, rounds }) {
  if (!rounds || rounds <= 0) return 0;

  const kpr = kills / rounds;
  const dpr = deaths / rounds;
  const apr = assists / rounds;
  const adr = damage / rounds;

  const impact = 2.13 * kpr + 0.42 * apr - 0.41;
  const rating = 0.0073 * KAST_BASELINE + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * impact + 0.0032 * adr + 0.1587;

  return Math.max(0, rating);
}

export const RATING_DESCRIPTION = "Aproximação do Rating 2.0 da HLTV, calculada com kills, mortes, assistências e dano por round (sem o componente KAST, que o servidor não registra).";
