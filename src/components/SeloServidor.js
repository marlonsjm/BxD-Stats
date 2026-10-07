import { SERVIDORES } from '@/lib/servidores';

// Cor de cada servidor. Classes literais para o Tailwind encontrar no build.
// LAN fica com o ciano que o site ja usava; Online ganha violeta, que nao
// colide com as cores de rank (amarelo/laranja) nem de vitoria/derrota.
export const ESTILO_SERVIDOR = {
  lan: {
    ativo: 'bg-cyan-500 text-gray-900',
    selo: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  },
  online: {
    ativo: 'bg-violet-500 text-white',
    selo: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  },
};

export function SeloServidor({ servidor, className = '' }) {
  const { label, descricao } = SERVIDORES[servidor];
  return (
    <span
      title={descricao}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${ESTILO_SERVIDOR[servidor].selo} ${className}`}
    >
      {label}
    </span>
  );
}
