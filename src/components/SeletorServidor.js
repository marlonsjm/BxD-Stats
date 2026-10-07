'use client';

// Chave LAN | Online da Navbar.
//
// Em pagina de stats (/lan/..., /online/...) o servidor vem da URL e trocar leva
// para a pagina equivalente do outro lado. Em pagina global (/skins, /gallery,
// /profile) so grava a preferencia e recarrega os dados do servidor: o /profile
// le o cookie, e os links da Navbar sem prefixo passam pelo middleware.
//
// E um <button>, nao um <Link>, de proposito: o prefetch de um link para o outro
// servidor nao pode trocar a preferencia sem clique.

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  COOKIE_MAX_AGE, COOKIE_SERVIDOR, IDS_SERVIDORES, SERVIDORES, SERVIDOR_PADRAO, isServidor, rotaEquivalente,
} from '@/lib/servidores';
import { ESTILO_SERVIDOR } from '@/components/SeloServidor';

function gravarCookie(servidor) {
  document.cookie = `${COOKIE_SERVIDOR}=${servidor}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

// Montado no layout de [servidor]: visitar /online/... grava a preferencia. E o
// que faz a escolha "ir ficando salva" ao navegar, inclusive por link
// compartilhado. Roda so quando a pagina e exibida, nunca em prefetch.
export function LembrarServidor({ servidor }) {
  useEffect(() => {
    gravarCookie(servidor);
  }, [servidor]);
  return null;
}

function lerCookie() {
  const valor = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_SERVIDOR}=`))
    ?.split('=')[1];
  return isServidor(valor) ? valor : SERVIDOR_PADRAO;
}

// Servidor da pagina atual: o da URL, ou o preferido (null ate montar, ja que o
// cookie so e lido no navegador).
export function useServidorAtual() {
  const pathname = usePathname();
  const daUrl = pathname.split('/')[1];
  const [preferido, setPreferido] = useState(null);

  useEffect(() => {
    setPreferido(lerCookie());
  }, [pathname]);

  return {
    servidor: isServidor(daUrl) ? daUrl : preferido,
    naUrl: isServidor(daUrl),
    setPreferido,
  };
}

export function SeletorServidor({ className = '' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { servidor, setPreferido } = useServidorAtual();

  const escolher = (id) => {
    if (id === servidor) return;
    gravarCookie(id);
    setPreferido(id);
    const destino = rotaEquivalente(pathname, id);
    if (destino) router.push(destino + window.location.hash);
    else router.refresh();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Servidor das estatísticas"
      className={`inline-flex shrink-0 rounded-full border border-gray-700 bg-gray-800/80 p-0.5 ${className}`}
    >
      {IDS_SERVIDORES.map((id) => {
        const ativo = id === servidor;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={ativo}
            title={SERVIDORES[id].descricao}
            onClick={() => escolher(id)}
            className={`min-h-[32px] rounded-full px-3 text-xs font-bold uppercase tracking-wide transition-colors ${
              ativo ? ESTILO_SERVIDOR[id].ativo : 'text-gray-400 hover:text-white'
            }`}
          >
            {SERVIDORES[id].label}
          </button>
        );
      })}
    </div>
  );
}
