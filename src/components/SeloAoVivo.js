// Partida sem end_time e ainda dentro da janela de lib/partidas.js. Com o ISR de
// 5 minutos, o selo pode durar ate 5 minutos alem do fim real da partida.
export function SeloAoVivo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-red-400 ${className}`}>
      <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      Ao vivo
    </span>
  );
}
