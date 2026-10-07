// Seletor de servidor (LAN / Online).
//
// - Rota com prefixo (/online/rankings): segue. A preferencia e gravada no
//   navegador por <LembrarServidor> (layout de [servidor]), nao aqui: o Next
//   esconde do middleware o header de prefetch, e um <Link> pre-carregado para
//   o outro servidor trocaria a preferencia sem clique.
// - Rota de stats sem prefixo (/rankings, /): redireciona para o servidor do
//   cookie (padrao: LAN). Links antigos e os links de paginas globais caem aqui.
// - /match/:id sem prefixo vai sempre para a LAN: esses links foram compartilhados
//   quando so existia aquele banco, e o ID nao vale no outro.

import { NextResponse } from 'next/server';
import {
  COOKIE_SERVIDOR, ROTAS_POR_SERVIDOR, SERVIDOR_PADRAO, isServidor, rota,
} from '@/lib/servidores';

function ehRotaPorServidor(pathname) {
  return ROTAS_POR_SERVIDOR.some((r) => (r.endsWith('/') && r !== '/' ? pathname.startsWith(r) : pathname === r));
}

export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const preferido = request.cookies.get(COOKIE_SERVIDOR)?.value;

  if (isServidor(pathname.split('/')[1]) || !ehRotaPorServidor(pathname)) {
    return NextResponse.next();
  }

  const servidor = pathname.startsWith('/match/')
    ? SERVIDOR_PADRAO
    : isServidor(preferido) ? preferido : SERVIDOR_PADRAO;

  const destino = request.nextUrl.clone();
  destino.pathname = rota(servidor, pathname);
  destino.search = search;
  return NextResponse.redirect(destino);
}

export const config = {
  // Fora: API, assets do Next e arquivos com extensao (favicon, imagens).
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
