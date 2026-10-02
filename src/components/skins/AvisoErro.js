'use client';

// Aviso de erro das telas de skins, com tratamento especial para um caso que
// confunde muito: a aba ficou aberta durante um deploy.
//
// O id de uma server action e gerado a cada build. Se o site for atualizado com
// a pagina aberta, o JS antigo manda um id que o servidor novo desconhece e o
// Next lanca "Failed to find Server Action ...". Sem isto, esse erro sobe ate o
// error boundary do app, que avisa "o banco pode estar acordando" — mandando o
// jogador investigar o lugar errado.

export function ehActionDesatualizada(e) {
  const msg = String(e?.message ?? e ?? '');
  return (
    msg.includes('Failed to find Server Action') ||
    msg.includes('older or newer deployment')
  );
}

export function AvisoErro({ erro, onFechar }) {
  if (!erro) return null;

  if (erro === 'desatualizada') {
    return (
      <div
        role="alert"
        className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200"
      >
        <span>
          O site foi atualizado enquanto esta página estava aberta, então sua
          escolha não foi enviada.
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-amber-500/20 px-3 py-1 font-bold text-amber-100 ring-1 ring-amber-500/40 transition-colors hover:bg-amber-500/30"
        >
          Recarregar
        </button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-300"
    >
      <span>{erro}</span>
      {onFechar && (
        <button
          type="button"
          onClick={onFechar}
          className="text-red-400 underline hover:text-red-200"
        >
          fechar
        </button>
      )}
    </div>
  );
}
