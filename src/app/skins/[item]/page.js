// Escolha da skin de um item do loadout.
//
// O segmento [item] aceita duas formas:
//   weapon_ak47        -> skins daquela arma (ou faca)
//   gloves_5032        -> cores daquele modelo de luva
//
// Agentes e kits de musica NAO caem aqui: sao escolhidos direto na grade de
// /skins, porque la o card ja e a opcao final.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getLoadout } from '@/lib/skins/loadout';
import { ItemGrid } from '@/components/skins/ItemGrid';
import {
  TEAM_CT,
  glovePaints,
  gloveByDefindex,
  skinsForWeapon,
  slugFromTeam,
  teamFromSlug,
  weaponAllowedForTeam,
  weaponByName,
} from '@/lib/skins/catalog';

export const dynamic = 'force-dynamic';

function nomeDaSkin(paintName) {
  const partes = String(paintName || '').split('|');
  return partes.length > 1 ? partes.slice(1).join('|').trim() : 'Padrão';
}

function TelaDeLogin() {
  return (
    <div className="container flex flex-col items-center justify-center py-24 text-center">
      <h1 className="mb-3 font-orbitron text-3xl font-bold text-white">Skins</h1>
      <p className="mb-8 max-w-md text-gray-400">
        Entre com sua conta Steam para escolher suas skins.
      </p>
      <a
        href="/api/auth/steam"
        className="inline-flex transform items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-105"
      >
        Entrar com Steam
      </a>
    </div>
  );
}

export default async function EscolherSkinPage({ params, searchParams }) {
  const session = await getSession();
  if (!session) return <TelaDeLogin />;

  const { item } = await params;
  const query = await searchParams;

  const teamSlug = query?.team === 'ct' ? 'ct' : 't';
  const team = teamFromSlug(teamSlug);
  const lado = team === TEAM_CT ? 'CT' : 'TR';

  const loadout = (await getLoadout(session.steamid))[team];

  const ehLuva = item.startsWith('gloves_');
  let dados;
  try {
    dados = ehLuva
      ? montarLuva({ item, team, loadout })
      : montarArma({ item, team, loadout });
  } catch (e) {
    console.error('[skins][item] falhou ao montar:', item, e);
    throw e;
  }

  if (!dados) notFound();

  const { titulo, subtitulo, categoria, itens, aviso, paintAtual } = dados;

  return (
    <div className="container py-10">
      <Link
        href={`/skins?team=${teamSlug}&cat=${categoria}`}
        className="text-sm text-cyan-400 hover:text-cyan-300"
      >
        &larr; Voltar
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="font-orbitron text-3xl font-bold text-white">{titulo}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {subtitulo} · lado <strong className="text-gray-300">{lado}</strong>
        </p>
        {aviso && <p className="mt-3 text-sm text-amber-400/90">{aviso}</p>}

        {paintAtual != null && (
          <Link
            href={`/skins/${item}/${paintAtual}?team=${teamSlug}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-600/60 px-4 py-1.5 text-sm text-cyan-300 transition-colors hover:border-cyan-400 hover:bg-cyan-500/10"
          >
            Personalizar a skin equipada
            <span className="text-gray-500">· desgaste, seed, etiqueta</span>
          </Link>
        )}
      </header>

      <ItemGrid items={itens} filtravel vazio="Nenhuma skin encontrada." />
    </div>
  );
}

// --- Armas e facas -------------------------------------------------------
function montarArma({ item, team, loadout }) {
  const arma = weaponByName(item);
  if (!arma) return null;
  if (!weaponAllowedForTeam(arma.name, team)) {
    return {
      titulo: arma.label,
      subtitulo: 'Indisponível neste lado',
      categoria: arma.category,
      itens: [],
      aviso: `A ${arma.label} não existe no lado ${team === TEAM_CT ? 'CT' : 'TR'} — troque o time na tela anterior.`,
    };
  }

  const ehFaca = arma.category === 'knifes';
  const equipada = loadout.skins.get(String(arma.defindex));
  const paintAtual = equipada?.weapon_paint_id;

  // Faca padrao: nao tem skin para escolher, so a selecao do modelo.
  if (typeof arma.defindex !== 'number') {
    return {
      titulo: arma.label,
      subtitulo: 'Modelo padrão, sem skin',
      categoria: arma.category,
      itens: [
        {
          key: 'default',
          payload: { kind: 'skin', team, weaponName: arma.name, paint: 'default' },
          image: arma.image,
          label: arma.label,
          sublabel: 'Faca padrão',
          equipped: loadout.knife === arma.name,
        },
      ],
    };
  }

  const itens = skinsForWeapon(arma.name).map((skin) => ({
    key: `${skin.weapon_defindex}:${skin.paint}`,
    payload: { kind: 'skin', team, weaponName: arma.name, paint: skin.paint },
    image: skin.image,
    label: nomeDaSkin(skin.paint_name),
    sublabel: null,
    // Para faca, "equipado" exige que o modelo escolhido seja este.
    equipped:
      String(paintAtual) === String(skin.paint) &&
      (!ehFaca || loadout.knife === arma.name),
  }));

  return {
    titulo: arma.label,
    subtitulo: `${itens.length} skins disponíveis`,
    categoria: arma.category,
    itens,
    aviso: ehFaca
      ? 'Escolher uma skin aqui também define esta como a sua faca.'
      : null,
    // So oferece personalizar se a skin equipada for desta arma.
    paintAtual: paintAtual != null && (!ehFaca || loadout.knife === arma.name)
      ? paintAtual
      : null,
  };
}

// --- Luvas ---------------------------------------------------------------
function montarLuva({ item, team, loadout }) {
  const defindex = item.slice('gloves_'.length);
  const modelo = gloveByDefindex(defindex);
  if (!modelo) return null;

  const equipada = loadout.skins.get(String(defindex));
  const paintAtual = equipada?.weapon_paint_id;
  const modeloEquipado = String(loadout.glove) === String(defindex);

  const itens = glovePaints(defindex).map((luva) => ({
    key: `${luva.weapon_defindex}:${luva.paint}`,
    payload: { kind: 'glove', team, defindex: luva.weapon_defindex, paint: luva.paint },
    image: luva.image,
    label: nomeDaSkin(luva.paint_name),
    sublabel: null,
    equipped: modeloEquipado && String(paintAtual) === String(luva.paint),
  }));

  return {
    titulo: modelo.label,
    subtitulo: `${itens.length} cores disponíveis`,
    categoria: 'gloves',
    itens,
    paintAtual: modeloEquipado && paintAtual != null ? paintAtual : null,
  };
}
