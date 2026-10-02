// Grade de itens do loadout de skins.
//
// Regra de navegacao: a grade mostra o item final sempre que possivel.
//   - agentes e kits de musica sao escolhidos AQUI (um clique salva);
//   - armas, facas e luvas abrem a tela seguinte, onde se escolhe a skin.
//
// Depende do cookie de sessao, entao e dinamica por natureza (como /profile).

import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getLoadout, resumirLoadout } from '@/lib/skins/loadout';
import { ItemGrid } from '@/components/skins/ItemGrid';
import { SkinsToolbar } from '@/components/skins/SkinsToolbar';
import { ResumoLoadout } from '@/components/skins/ResumoLoadout';
import {
  DEFAULT_CATEGORY,
  agentsForTeam,
  categoryLabel,
  glovesForTeam,
  isCategory,
  musicKits,
  skinByDefindexPaint,
  skinCount,
  teamFromSlug,
  weaponsForCategory,
} from '@/lib/skins/catalog';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Skins',
  description: 'Escolha suas skins, faca, luvas, agente e música do servidor BxD.',
};

function TelaDeLogin() {
  return (
    <div className="container flex flex-col items-center justify-center py-24 text-center">
      <h1 className="mb-3 font-orbitron text-3xl font-bold text-white">Skins</h1>
      <p className="mb-8 max-w-md text-gray-400">
        Entre com sua conta Steam para escolher suas skins, faca, luvas, agente e
        kit de música. Elas aparecem no jogo automaticamente, sem digitar nenhum
        comando.
      </p>
      <a
        href="/api/auth/steam"
        className="inline-flex transform items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-cyan-400 hover:to-blue-400"
      >
        Entrar com Steam
      </a>
    </div>
  );
}

// Nome da skin a partir do "Nome da arma | Nome da skin" do catalogo.
function nomeDaSkin(paintName) {
  const partes = String(paintName || '').split('|');
  return partes.length > 1 ? partes.slice(1).join('|').trim() : '';
}

function montarItens({ category, team, loadout }) {
  // --- Armas e facas: abrem a tela de escolha da skin ---
  if (category !== 'gloves' && category !== 'agents' && category !== 'music') {
    return weaponsForCategory(category, team).map((arma) => {
      const equipada = loadout.skins.get(String(arma.defindex));
      const skin = equipada
        ? skinByDefindexPaint(arma.defindex, equipada.weapon_paint_id)
        : null;

      // Para facas existe uma escolha a mais: QUAL faca usar.
      const facaEscolhida = category === 'knifes' && loadout.knife === arma.name;

      return {
        key: arma.name,
        href: `/skins/${arma.name}?team=${team === 3 ? 'ct' : 't'}`,
        image: skin?.image ?? arma.image,
        label: arma.label,
        sublabel: skin ? nomeDaSkin(skin.paint_name) || 'Skin aplicada' : 'Padrão',
        equipped: category === 'knifes' ? facaEscolhida : Boolean(equipada),
        badge: `${skinCount(arma.name)} skins`,
      };
    });
  }

  // --- Luvas: a padrao remove na hora; as demais abrem a lista de cores ---
  if (category === 'gloves') {
    return glovesForTeam(team).map((luva) => {
      const ehPadrao = String(luva.defindex) === 'gloves_default';
      return {
        key: String(luva.defindex),
        href: ehPadrao ? undefined : `/skins/gloves_${luva.defindex}?team=${team === 3 ? 'ct' : 't'}`,
        payload: ehPadrao
          ? { kind: 'glove', team, defindex: 'gloves_default' }
          : undefined,
        image: luva.image,
        label: luva.label,
        sublabel: ehPadrao ? 'Sem luva personalizada' : null,
        equipped: ehPadrao
          ? loadout.glove == null
          : String(loadout.glove) === String(luva.defindex),
      };
    });
  }

  // --- Agentes: escolha direta ---
  if (category === 'agents') {
    return agentsForTeam(team).map((agente) => ({
      key: agente.model,
      payload: { kind: 'agent', team, model: agente.model },
      image: agente.image,
      label: String(agente.agent_name || '').split('|')[0].trim(),
      sublabel: nomeDaSkin(agente.agent_name) || null,
      equipped:
        agente.model === 'default'
          ? loadout.agent == null
          : loadout.agent === agente.model,
    }));
  }

  // --- Kits de musica: escolha direta, com opcao de remover ---
  const nenhum = {
    key: 'default',
    payload: { kind: 'music', team, musicId: 'default' },
    image: null,
    label: 'Nenhum',
    sublabel: 'Sem kit de música',
    equipped: loadout.music == null,
  };

  const kits = musicKits().map((kit) => ({
    key: String(kit.id),
    payload: { kind: 'music', team, musicId: kit.id },
    image: kit.image,
    label: kit.name,
    sublabel: null,
    equipped: String(loadout.music) === String(kit.id),
  }));

  return [nenhum, ...kits];
}

export default async function SkinsPage({ searchParams }) {
  const session = await getSession();
  if (!session) return <TelaDeLogin />;

  const params = await searchParams;

  const teamSlug = params?.team === 'ct' ? 'ct' : 't';
  const team = teamFromSlug(teamSlug);
  const category = isCategory(params?.cat) ? params.cat : DEFAULT_CATEGORY;

  const loadoutCompleto = await getLoadout(session.steamid);
  const loadout = loadoutCompleto[team];

  const itens = montarItens({ category, team, loadout });
  const resumo = resumirLoadout(loadout, team);
  const lado = teamSlug === 'ct' ? 'CT' : 'TR';

  return (
    <div className="container py-10">
      <header className="mb-8">
        <h1 className="font-orbitron text-3xl font-bold text-white">Skins</h1>
        <div className="mt-3 max-w-2xl rounded-lg border border-amber-700/50 bg-amber-950/30 p-4">
          <p className="text-sm text-amber-200">
            <strong>Escolheu com o jogo aberto? Reconecte ao servidor.</strong>
          </p>
          <p className="mt-1 text-sm text-amber-200/80">
            O servidor lê suas skins <strong>uma vez só, quando você entra</strong>.
            Mudanças feitas depois disso não aparecem até você sair e entrar de
            novo. Já reconectado, elas são aplicadas ao renascer.
          </p>
        </div>
      </header>

      {/* Contexto antes da escolha: o que ja esta equipado nas OUTRAS
          categorias. Sem isto o jogador escolhe um rifle sem lembrar qual faca
          ou luva tem. */}
      <div className="mb-6">
        <ResumoLoadout resumo={resumo} teamSlug={teamSlug} lado={lado} />
      </div>

      <SkinsToolbar teamSlug={teamSlug} category={category} />

      <section className="mt-8" aria-label={categoryLabel(category)}>
        <ItemGrid
          items={itens}
          filtravel
          vazio={`Nenhum item desta categoria disponível para o lado ${lado}.`}
        />
      </section>

      <footer className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-500">
        <Link href="/skins/loadout" className="text-cyan-400 hover:text-cyan-300">
          Ver meu loadout completo
        </Link>
        <span className="mx-2 text-gray-700">·</span>
        <Link href="/profile" className="text-cyan-400 hover:text-cyan-300">
          Ver minhas estatísticas
        </Link>
      </footer>
    </div>
  );
}
