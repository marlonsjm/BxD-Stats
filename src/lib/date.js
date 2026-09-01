// Formatacao de datas de partida.
//
// O MatchZy grava start_time/end_time em UTC (NOW() no MySQL, datetime('now')
// no SQLite). Se formatarmos sem fixar o fuso, o resultado muda conforme a
// maquina: local (BRT) mostra um dia, a Vercel (UTC) mostra outro. Uma partida
// que comecou 21:06 de 06/06 no Brasil esta gravada como 07/06 00:06 UTC e
// apareceria no dia errado em producao. Por isso todo o site formata data de
// partida por aqui, sempre em America/Sao_Paulo.

const TIME_ZONE = "America/Sao_Paulo";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "29/08/2026" — use em colunas de tabela. */
export function formatMatchDate(value) {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "—";
}

/** "29/08/2026 às 13:00" — use em cabecalhos, onde ha espaco para a hora. */
export function formatMatchDateTime(value) {
  const date = toDate(value);
  return date ? `${dateFormatter.format(date)} às ${timeFormatter.format(date)}` : "—";
}

/** Valor para o atributo dateTime de <time>, que espera ISO 8601. */
export function toDateTimeAttribute(value) {
  return toDate(value)?.toISOString();
}
