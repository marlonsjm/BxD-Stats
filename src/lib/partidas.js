// Partida sem end_time: em andamento, ou abandonada (servidor caiu, mix
// cancelado). Na LAN o sync ja descarta essas; no Online o MatchZy grava direto
// no banco, entao quem filtra e o site.
//
// Regra: so partidas FINALIZADAS contam em ranking, totais e perfil. Na lista
// de partidas, a incompleta aparece como "ao vivo" so se for a ULTIMA partida
// do servidor (ele roda uma por vez: se outra comecou depois, esta foi
// abandonada) e tiver comecado ha menos de JANELA_AO_VIVO_MS.
export const JANELA_AO_VIVO_MS = 3 * 60 * 60 * 1000;

export function statusPartida({ start_time, end_time }, inicioMaisRecente) {
  if (end_time) return 'finalizada';
  const inicio = new Date(start_time).getTime();
  const ehAUltima = inicio >= new Date(inicioMaisRecente).getTime();
  return ehAUltima && Date.now() - inicio < JANELA_AO_VIVO_MS ? 'ao-vivo' : 'abandonada';
}

