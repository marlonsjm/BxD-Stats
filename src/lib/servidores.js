// Servidores de CS2 cujos stats o site exibe. Cada um tem seu proprio banco
// TiDB com as mesmas tabelas do MatchZy (ver getDb em lib/prisma.js).
//
// O servidor faz parte da URL (/lan/matches, /online/match/12): os IDs de
// partida colidem entre os bancos, e a URL com prefixo mantem o cache ISR por
// servidor. A preferencia fica no cookie COOKIE_SERVIDOR, gravado no navegador
// (LembrarServidor) a cada visita a uma rota com prefixo; o src/middleware.js
// le o cookie para redirecionar URLs sem prefixo.
//
// Este arquivo roda tambem no middleware (Edge): nada de Prisma ou Node aqui.

// cacheSegundos: validade do retrato dos stats em cache (lib/stats.js), ou
// seja, de quanto em quanto tempo o site pode voltar ao banco. A LAN so muda
// quando o sync roda, e o sync renova o cache na hora (POST /api/revalidar).
// O Online grava direto e nao avisa: o cache expira sozinho.
export const SERVIDORES = {
  lan: { id: 'lan', label: 'LAN', descricao: 'Partidas presenciais do BxD', cacheSegundos: 24 * 60 * 60 },
  online: { id: 'online', label: 'Online', descricao: 'Servidor online do BxD', cacheSegundos: 10 * 60 },
};

export const IDS_SERVIDORES = Object.keys(SERVIDORES);
export const SERVIDOR_PADRAO = 'lan';
export const COOKIE_SERVIDOR = 'bxd_servidor';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

export function isServidor(valor) {
  return Object.hasOwn(SERVIDORES, valor);
}

// Monta o caminho de uma pagina dentro de um servidor: rota('online', '/matches').
export function rota(servidor, caminho = '/') {
  return caminho === '/' ? `/${servidor}` : `/${servidor}${caminho}`;
}

// Rotas que dependem do banco. Sem prefixo, o middleware redireciona para o
// servidor preferido; a lista precisa bater com as pastas de src/app/[servidor].
export const ROTAS_POR_SERVIDOR = ['/', '/matches', '/players', '/rankings', '/maps', '/player/', '/map/', '/match/'];

// Pagina equivalente no outro servidor, usada pelo seletor da Navbar. A partida
// 12 da LAN nao tem relacao com a 12 do Online, entao /match/:id cai na lista.
export function rotaEquivalente(pathname, destino) {
  const [primeiro, ...resto] = pathname.split('/').filter(Boolean);
  if (!isServidor(primeiro)) return null;
  if (resto[0] === 'match') return rota(destino, '/matches');
  return rota(destino, resto.length ? `/${resto.join('/')}` : '/');
}
