'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

// Captura erros de renderização das páginas (ex.: banco TiDB hibernado/inacessível)
// e exibe uma mensagem amigável em vez de quebrar o site.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center text-white">
      <h1 className="text-2xl md:text-3xl font-bold">Não foi possível carregar os dados</h1>
      <p className="max-w-md text-gray-400">
        O banco de dados pode estar &quot;acordando&quot; após um período de inatividade.
        Isso geralmente resolve em alguns segundos.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-lg bg-cyan-500 px-8 font-bold text-gray-900 transition-colors hover:bg-cyan-400"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Tentar novamente
      </button>
    </div>
  );
}
