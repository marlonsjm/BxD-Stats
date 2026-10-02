// Customizacao de uma skin: desgaste, seed, etiqueta e StatTrak (fase 4).
//
// Chega-se aqui pelo botao "Personalizar" da tela de escolha, nao pelo clique
// no card — clicar num card equipa direto, que e o caso comum.
//
// Adesivos, chaveiro e preview 3D ficam para a fase 5.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getLoadout } from '@/lib/skins/loadout';
import { CustomizarForm } from '@/components/skins/CustomizarForm';
import { Previsualizacao } from '@/components/skins/Previsualizacao';
import { temMeshUnico, urlModelo, urlsTextura } from '@/lib/skins/modelo3d';
import {
  ADESIVO_PADRAO,
  CHAVEIRO_PADRAO,
  SLOTS_ADESIVO,
  parseAdesivo,
  parseChaveiro,
} from '@/lib/skins/adesivos';
import {
  TEAM_CT,
  glovePaints,
  gloveByDefindex,
  skinByDefindexPaint,
  teamFromSlug,
  weaponAllowedForTeam,
  weaponByName,
} from '@/lib/skins/catalog';

export const dynamic = 'force-dynamic';

function nomeDaSkin(paintName) {
  const partes = String(paintName || '').split('|');
  return partes.length > 1 ? partes.slice(1).join('|').trim() : 'Padrão';
}

export default async function CustomizarPage({ params, searchParams }) {
  const session = await getSession();
  if (!session) {
    return (
      <div className="container py-24 text-center">
        <p className="mb-6 text-gray-400">Entre com a Steam para personalizar suas skins.</p>
        <a
          href="/api/auth/steam"
          className="inline-flex rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-bold text-white"
        >
          Entrar com Steam
        </a>
      </div>
    );
  }

  const { item, paint } = await params;
  const query = await searchParams;

  const teamSlug = query?.team === 'ct' ? 'ct' : 't';
  const team = teamFromSlug(teamSlug);
  const lado = team === TEAM_CT ? 'CT' : 'TR';

  const ehLuva = item.startsWith('gloves_');

  // --- Resolve o item e a skin ---
  let defindex;
  let titulo;
  let subtitulo;
  let imagem;
  // Identificador usado nos arquivos 3D: arma usa weapon_name, luva usa defindex.
  let alvo3d;
  let categoria3d;
  let legacy = false;

  if (ehLuva) {
    const alvo = item.slice('gloves_'.length);
    const modelo = gloveByDefindex(alvo);
    if (!modelo) notFound();

    const cor = glovePaints(alvo).find((g) => String(g.paint) === String(paint));
    if (!cor) notFound();

    defindex = Number(modelo.defindex);
    titulo = modelo.label;
    subtitulo = nomeDaSkin(cor.paint_name);
    imagem = cor.image;
    alvo3d = String(modelo.defindex);
    categoria3d = 'gloves';
  } else {
    const arma = weaponByName(item);
    if (!arma || typeof arma.defindex !== 'number') notFound();
    if (!weaponAllowedForTeam(arma.name, team)) notFound();

    const skin = skinByDefindexPaint(arma.defindex, paint);
    if (!skin) notFound();

    defindex = arma.defindex;
    titulo = arma.label;
    subtitulo = nomeDaSkin(skin.paint_name);
    imagem = skin.image;
    alvo3d = arma.name;
    categoria3d = arma.category;
    // Diz qual dos dois meshes do .glb usar (modelo legado x atual).
    legacy = Boolean(skin.legacy_model);
  }

  // --- Valores atuais (se a skin ja estiver equipada) ---
  const loadout = (await getLoadout(session.steamid))[team];
  const linha = loadout.skins.get(String(defindex));
  const mesmaSkin = linha && String(linha.weapon_paint_id) === String(paint);

  const slotsVazios = Array.from({ length: SLOTS_ADESIVO }, () => ({ ...ADESIVO_PADRAO }));

  const inicial = mesmaSkin
    ? {
        wear: linha.weapon_wear,
        seed: linha.weapon_seed,
        nametag: linha.weapon_nametag ?? '',
        stattrak: linha.weapon_stattrak,
        adesivos: Array.from({ length: SLOTS_ADESIVO }, (_, i) =>
          parseAdesivo(linha[`weapon_sticker_${i}`])
        ),
        chaveiro: parseChaveiro(linha.weapon_keychain),
      }
    : {
        wear: 0.000001,
        seed: 0,
        nametag: '',
        stattrak: false,
        adesivos: slotsVazios,
        chaveiro: { ...CHAVEIRO_PADRAO },
      };

  return (
    <div className="container py-10">
      <Link
        href={`/skins/${item}?team=${teamSlug}`}
        className="text-sm text-cyan-400 hover:text-cyan-300"
      >
        &larr; Voltar para as skins da {titulo}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside>
          <Previsualizacao
            imagem={imagem}
            modelUrl={urlModelo(alvo3d)}
            texturaUrls={urlsTextura(alvo3d, paint)}
            legacy={legacy}
            meshUnico={temMeshUnico(alvo3d, categoria3d)}
          />
          <h1 className="mt-4 font-orbitron text-2xl font-bold text-white">{titulo}</h1>
          <p className="text-sm text-cyan-400">{subtitulo}</p>
          <p className="mt-1 text-sm text-gray-500">
            lado <strong className="text-gray-400">{lado}</strong>
          </p>
          {!mesmaSkin && (
            <p className="mt-4 rounded-md border border-gray-700 bg-gray-800/60 p-3 text-xs text-gray-400">
              Esta skin ainda não está equipada. Salvar aqui equipa ela com os
              ajustes abaixo.
            </p>
          )}
        </aside>

        <CustomizarForm
          item={item}
          paint={paint}
          team={team}
          ehLuva={ehLuva}
          inicial={inicial}
        />
      </div>
    </div>
  );
}
