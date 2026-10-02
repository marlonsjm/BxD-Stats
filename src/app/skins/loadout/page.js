// Loadout completo dos dois lados, com a opcao de copiar um para o outro.
//
// A visualizacao em si vive em LoadoutCompleto, compartilhada com /profile.
// Aqui fica o que e exclusivo desta pagina: os botoes de copiar.

import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getLoadout, montarItensDoLoadout } from '@/lib/skins/loadout';
import { CopiarLoadout } from '@/components/skins/CopiarLoadout';
import { LoadoutCompleto } from '@/components/skins/LoadoutCompleto';
import { TEAM_CT, TEAM_T } from '@/lib/skins/times';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Meu loadout',
  description: 'Tudo que você tem equipado nos dois lados, no servidor BxD.',
};

export default async function LoadoutPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="container py-24 text-center">
        <h1 className="mb-3 font-orbitron text-3xl font-bold text-white">Meu loadout</h1>
        <p className="mb-8 text-gray-400">
          Entre com a Steam para ver o que você tem equipado.
        </p>
        <a
          href="/api/auth/steam"
          className="inline-flex rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-bold text-white"
        >
          Entrar com Steam
        </a>
      </div>
    );
  }

  const completo = await getLoadout(session.steamid);
  const tr = montarItensDoLoadout(completo[TEAM_T], TEAM_T);
  const ct = montarItensDoLoadout(completo[TEAM_CT], TEAM_CT);

  return (
    <div className="container py-10">
      <header className="mb-8">
        <Link href="/skins" className="text-sm text-cyan-400 hover:text-cyan-300">
          &larr; Voltar para as skins
        </Link>
        <h1 className="mt-3 font-orbitron text-3xl font-bold text-white">Meu loadout</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Tudo que você tem equipado nos dois lados. Clique em qualquer item para
          trocar ou personalizar.
        </p>
      </header>

      <div className="mb-8">
        <CopiarLoadout itensPorTime={{ [TEAM_T]: tr.length, [TEAM_CT]: ct.length }} />
      </div>

      <LoadoutCompleto tr={tr} ct={ct} />
    </div>
  );
}
