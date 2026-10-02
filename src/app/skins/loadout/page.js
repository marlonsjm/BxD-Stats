// Loadout completo dos dois lados, lado a lado, com a opcao de copiar um para
// o outro (fase 6).
//
// Util porque a grade de /skins mostra um time por vez: aqui da para conferir
// de relance o que esta faltando no outro lado.

import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getLoadout } from '@/lib/skins/loadout';
import { CopiarLoadout } from '@/components/skins/CopiarLoadout';
import {
  TEAM_CT,
  TEAM_T,
  agentsForTeam,
  gloveByDefindex,
  glovePaints,
  musicKits,
  skinByDefindexPaint,
  slugFromTeam,
  weaponByDefindex,
  weaponByName,
} from '@/lib/skins/catalog';
import { imagemAdesivo, imagemChaveiro, parseAdesivo, parseChaveiro } from '@/lib/skins/adesivos';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Meu loadout',
  description: 'Tudo que você tem equipado nos dois lados, no servidor BxD.',
};

function nomeDaSkin(paintName) {
  const partes = String(paintName || '').split('|');
  return partes.length > 1 ? partes.slice(1).join('|').trim() : 'Padrão';
}

// Transforma o loadout cru do banco em linhas prontas para exibir.
function montarResumo(loadout, team) {
  const linhas = [];
  const armas = [];
  for (const [defindexTexto, linha] of loadout.skins) {
    const arma = weaponByDefindex(defindexTexto);
    const skin = skinByDefindexPaint(defindexTexto, linha.weapon_paint_id);

    // Luva: nao esta no catalogo de armas, e so conta se o modelo estiver
    // realmente equipado (a linha de skin pode ter sobrado de outra escolha).
    if (!arma) {
      const luva = gloveByDefindex(defindexTexto);
      if (!luva || String(loadout.glove) !== String(defindexTexto)) continue;

      const cor = glovePaints(defindexTexto).find(
        (g) => String(g.paint) === String(linha.weapon_paint_id)
      );
      linhas.push({
        grupo: 'Luvas',
        titulo: luva.label,
        subtitulo: cor ? nomeDaSkin(cor.paint_name) : null,
        imagem: cor?.image ?? luva.image,
        href: `/skins/gloves_${defindexTexto}/${linha.weapon_paint_id}?team=${slugFromTeam(team)}`,
        detalhe: linha,
      });
      continue;
    }

    const ehFaca = arma.category === 'knifes';
    // Skin de faca so vale se aquela faca for a escolhida.
    if (ehFaca && loadout.knife !== arma.name) continue;

    const item = {
      grupo: ehFaca ? 'Faca' : 'Armas',
      titulo: arma.label,
      subtitulo: skin ? nomeDaSkin(skin.paint_name) : 'Padrão',
      imagem: skin?.image ?? arma.image,
      href: `/skins/${arma.name}/${linha.weapon_paint_id}?team=${slugFromTeam(team)}`,
      detalhe: linha,
    };

    if (ehFaca) linhas.push(item);
    else armas.push(item);
  }

  // Faca escolhida sem skin aplicada: continua sendo uma escolha, entao aparece.
  if (loadout.knife && !linhas.some((l) => l.grupo === 'Faca')) {
    const faca = weaponByName(loadout.knife);
    linhas.push({
      grupo: 'Faca',
      titulo: faca?.label ?? loadout.knife,
      subtitulo: 'Sem skin',
      imagem: faca?.image ?? null,
      href: `/skins/${loadout.knife}?team=${slugFromTeam(team)}`,
    });
  }

  // --- Agente ---
  if (loadout.agent) {
    const agente = agentsForTeam(team).find((a) => a.model === loadout.agent);
    linhas.push({
      grupo: 'Agente',
      titulo: String(agente?.agent_name ?? loadout.agent).split('|')[0].trim(),
      subtitulo: agente ? nomeDaSkin(agente.agent_name) : null,
      imagem: agente?.image ?? null,
      href: `/skins?team=${slugFromTeam(team)}&cat=agents`,
    });
  }

  // --- Musica ---
  if (loadout.music) {
    const kit = musicKits().find((k) => String(k.id) === String(loadout.music));
    linhas.push({
      grupo: 'Música',
      titulo: kit?.name ?? `Kit ${loadout.music}`,
      subtitulo: null,
      imagem: kit?.image ?? null,
      href: `/skins?team=${slugFromTeam(team)}&cat=music`,
    });
  }

  armas.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  return [...linhas, ...armas];
}

function Extras({ linha }) {
  if (!linha) return null;

  const adesivos = Array.from({ length: 5 }, (_, i) =>
    parseAdesivo(linha[`weapon_sticker_${i}`])
  ).filter((a) => a.id > 0);
  const chaveiro = parseChaveiro(linha.weapon_keychain);

  const etiquetas = [];
  if (linha.weapon_stattrak) {
    etiquetas.push(`StatTrak™ ${linha.weapon_stattrak_count ?? 0}`);
  }
  if (linha.weapon_nametag) etiquetas.push(`"${linha.weapon_nametag}"`);

  if (adesivos.length === 0 && chaveiro.id === 0 && etiquetas.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      {etiquetas.map((t) => (
        <span key={t} className="rounded bg-gray-700/60 px-1.5 py-0.5 text-[10px] text-gray-300">
          {t}
        </span>
      ))}
      {adesivos.map((a, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={imagemAdesivo(a.id)} alt="" title={`Adesivo ${a.id}`} className="h-5 w-5 object-contain" />
      ))}
      {chaveiro.id > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagemChaveiro(chaveiro.id)} alt="" title="Chaveiro" className="h-5 w-5 object-contain" />
      )}
    </div>
  );
}

function ColunaTime({ team, itens }) {
  const lado = team === TEAM_CT ? 'CT' : 'TR';
  const grupos = ['Faca', 'Luvas', 'Agente', 'Música', 'Armas'];

  return (
    <section className="rounded-lg border border-gray-700 bg-gray-800/30 p-5">
      <h2 className="mb-4 font-orbitron text-xl font-bold text-white">
        {lado}
        <span className="ml-2 text-sm font-normal text-gray-500">
          {itens.length} {itens.length === 1 ? 'item' : 'itens'}
        </span>
      </h2>

      {itens.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">
          Nada equipado neste lado.
        </p>
      ) : (
        grupos.map((grupo) => {
          const doGrupo = itens.filter((i) => i.grupo === grupo);
          if (doGrupo.length === 0) return null;

          return (
            <div key={grupo} className="mb-5 last:mb-0">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                {grupo}
              </p>
              <ul className="space-y-2">
                {doGrupo.map((item, i) => (
                  <li key={`${item.titulo}-${i}`}>
                    <Link
                      href={item.href}
                      className="flex items-start gap-3 rounded-md border border-gray-700/60 bg-gray-800/40 p-2 transition-colors hover:border-gray-500"
                    >
                      <span className="flex h-12 w-16 shrink-0 items-center justify-center">
                        {item.imagem ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imagem} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-gray-600">—</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">{item.titulo}</span>
                        {item.subtitulo && (
                          <span className="block truncate text-xs text-cyan-400">{item.subtitulo}</span>
                        )}
                        <Extras linha={item.detalhe} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}

export default async function LoadoutPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="container py-24 text-center">
        <h1 className="mb-3 font-orbitron text-3xl font-bold text-white">Meu loadout</h1>
        <p className="mb-8 text-gray-400">Entre com a Steam para ver o que você tem equipado.</p>
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
  const tr = montarResumo(completo[TEAM_T], TEAM_T);
  const ct = montarResumo(completo[TEAM_CT], TEAM_CT);

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

      <div className="grid gap-6 lg:grid-cols-2">
        <ColunaTime team={TEAM_T} itens={tr} />
        <ColunaTime team={TEAM_CT} itens={ct} />
      </div>
    </div>
  );
}
