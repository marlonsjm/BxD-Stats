// Perfil do jogador logado via Steam.
// - Sem sessão: tela de login com o botão da Steam.
// - Com sessão: o componente da página /player/[steamid64] com o steamid da
//   sessão — mesmas estatísticas, zero duplicação de queries. As skins ficam
//   em /skins (atalho "Minhas Skins" no menu do avatar), não aqui.
// Página dinâmica por natureza (depende do cookie de sessão).
// As estatísticas seguem o seletor LAN/Online (cookie).

import Link from 'next/link';
import { cookies } from 'next/headers';
import { getStats } from '@/lib/stats';
import { COOKIE_SERVIDOR, SERVIDORES, SERVIDOR_PADRAO, isServidor, rota } from '@/lib/servidores';
import { getSession } from '@/lib/session';
import PlayerDetailPage from '../[servidor]/player/[steamid64]/page';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Meu Perfil',
  description: 'Suas estatísticas de CS2 no servidor BxD.',
};

function LoginScreen({ erro }) {
  const mensagens = {
    login_cancelado: 'Login cancelado. Tente novamente.',
    retorno_invalido: 'Retorno de login inválido. Tente novamente.',
    identidade_invalida: 'Não foi possível identificar sua conta Steam.',
    assinatura_invalida: 'A Steam não confirmou o login. Tente novamente.',
  };

  return (
    <div className="container flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-3xl font-bold text-white font-orbitron mb-3">Meu Perfil</h1>
      <p className="text-gray-400 mb-8 max-w-md">
        Entre com sua conta Steam para ver suas estatísticas no servidor:
        rating, KDR, multi-kills e histórico de partidas.
      </p>
      {erro && (
        <p className="mb-6 rounded-md border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-300">
          {mensagens[erro] || 'Erro no login. Tente novamente.'}
        </p>
      )}
      <a
        href="/api/auth/steam"
        className="inline-flex items-center gap-3 rounded-md bg-gray-800 border border-gray-600 px-6 py-3 text-white font-medium hover:bg-gray-700 transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://community.fastly.steamstatic.com/public/images/signinthroughsteam/sits_01.png"
          alt=""
          className="h-8 w-auto"
        />
        <span className="sr-only">Entrar com Steam</span>
      </a>
      <p className="mt-6 text-xs text-gray-500 max-w-sm">
        Usamos o login oficial da Steam (OpenID). Sua senha nunca passa por
        este site — só recebemos seu SteamID público.
      </p>
    </div>
  );
}


export default async function ProfilePage({ searchParams }) {
  const session = await getSession();
  const { erro } = await searchParams;
  const preferido = (await cookies()).get(COOKIE_SERVIDOR)?.value;
  const servidor = isServidor(preferido) ? preferido : SERVIDOR_PADRAO;

  if (!session) {
    return <LoginScreen erro={erro} />;
  }

  // Jogador logado mas sem partidas registradas: mensagem amigável em vez do
  // "Jogador não encontrado" da página pública.
  const { linhasFinalizadas } = await getStats(servidor);
  const played = linhasFinalizadas.filter(l => l.steamid64 === String(session.steamid)).length;

  if (played === 0) {
    return (
      <div>
        <div className="container flex flex-col items-center justify-center py-16 text-center">
          <h1 className="text-3xl font-bold text-white font-orbitron mb-3">
            Olá, {session.name || 'jogador'}!
          </h1>
          <p className="text-gray-400 max-w-md mb-8">
            Você ainda não tem partidas registradas no servidor{' '}
            {SERVIDORES[servidor].label}. Jogue um MIX e suas estatísticas
            aparecerão aqui — ou troque de servidor no topo da página.
          </p>
          <Link href={rota(servidor, '/matches')} className="text-cyan-400 hover:underline">
            Ver partidas recentes →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-3">
          <p className="text-sm text-gray-300">
            Logado como <span className="font-semibold text-white">{session.name || session.steamid}</span>
          </p>
          <Link href={rota(servidor, `/player/${session.steamid}`)} className="text-sm text-cyan-400 hover:underline">
            Link público do seu perfil →
          </Link>
        </div>
      </div>

      {/* Reutiliza a página do jogador com o steamid da sessão */}
      <PlayerDetailPage params={Promise.resolve({ servidor, steamid64: session.steamid })} />
    </div>
  );
}
