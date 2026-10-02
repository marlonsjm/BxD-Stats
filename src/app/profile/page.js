// Perfil do jogador logado via Steam.
// - Sem sessão: tela de login com o botão da Steam.
// - Com sessão: loadout de skins no topo, depois o componente da página
//   /player/[steamid64] com o steamid da sessão — mesmas estatísticas, zero
//   duplicação de queries.
// Página dinâmica por natureza (depende do cookie de sessão).

import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import PlayerDetailPage from '../player/[steamid64]/page';
import { getLoadout, montarItensDoLoadout } from '@/lib/skins/loadout';
import { LoadoutCompleto } from '@/components/skins/LoadoutCompleto';
import { TEAM_CT, TEAM_T } from '@/lib/skins/times';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Meu Perfil',
  description: 'Seu loadout de skins e suas estatísticas de CS2 no servidor BxD.',
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

// Loadout de skins do jogador logado, acima das estatisticas.
//
// Usa a mesma visualizacao de /skins/loadout; o que muda e o enquadramento:
// aqui e so leitura, com atalho para trocar. Os botoes de copiar TR<->CT ficam
// na pagina dedicada.
async function SecaoLoadout({ steamid }) {
  const completo = await getLoadout(steamid);
  const tr = montarItensDoLoadout(completo[TEAM_T], TEAM_T);
  const ct = montarItensDoLoadout(completo[TEAM_CT], TEAM_CT);

  const vazio = tr.length === 0 && ct.length === 0;

  return (
    <section className="container py-8" aria-labelledby="titulo-loadout">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-loadout" className="font-orbitron text-2xl font-bold text-white">
          Meu loadout
        </h2>
        <Link href="/skins" className="text-sm text-cyan-400 hover:text-cyan-300">
          {vazio ? 'Escolher skins' : 'Trocar skins'} &rarr;
        </Link>
      </div>

      {vazio ? (
        <p className="rounded-lg border border-dashed border-gray-700 bg-gray-800/30 p-8 text-center text-gray-400">
          Você ainda não escolheu nenhuma skin.{' '}
          <Link href="/skins" className="text-cyan-400 hover:underline">
            Escolha as suas
          </Link>{' '}
          — elas aparecem no jogo automaticamente, sem digitar comando.
        </p>
      ) : (
        <>
          <LoadoutCompleto tr={tr} ct={ct} />
          <p className="mt-3 text-xs text-gray-500">
            Trocou alguma coisa com o jogo aberto? Reconecte ao servidor — ele lê
            suas skins só na hora em que você entra.{' '}
            <Link href="/skins/loadout" className="text-cyan-400 hover:underline">
              Copiar entre os lados
            </Link>
          </p>
        </>
      )}
    </section>
  );
}

export default async function ProfilePage({ searchParams }) {
  const session = await getSession();
  const { erro } = await searchParams;

  if (!session) {
    return <LoginScreen erro={erro} />;
  }

  // Jogador logado mas sem partidas registradas: mensagem amigável em vez do
  // "Jogador não encontrado" da página pública.
  const played = await prisma.playerStats.count({
    where: { steamid64: BigInt(session.steamid) },
  });

  // Sem partidas ainda, mas o loadout continua valendo: dá para escolher skins
  // antes de jogar a primeira vez.
  if (played === 0) {
    return (
      <div>
        <div className="container flex flex-col items-center justify-center py-16 text-center">
          <h1 className="text-3xl font-bold text-white font-orbitron mb-3">
            Olá, {session.name || 'jogador'}!
          </h1>
          <p className="text-gray-400 max-w-md mb-8">
            Você ainda não tem partidas registradas no servidor. Jogue um MIX e
            suas estatísticas aparecerão aqui.
          </p>
          <Link href="/matches" className="text-cyan-400 hover:underline">
            Ver partidas recentes →
          </Link>
        </div>

        <SecaoLoadout steamid={session.steamid} />
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
          <Link href={`/player/${session.steamid}`} className="text-sm text-cyan-400 hover:underline">
            Link público do seu perfil →
          </Link>
        </div>
      </div>
      <SecaoLoadout steamid={session.steamid} />

      {/* Reutiliza a página do jogador com o steamid da sessão */}
      <PlayerDetailPage params={Promise.resolve({ steamid64: session.steamid })} />
    </div>
  );
}
