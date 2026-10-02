// Leitura do loadout do jogador nas tabelas wp_player_* (do plugin WeaponPaints).
//
// Quem e dono destas tabelas e o plugin, nao o Prisma — ver o aviso no topo de
// prisma/schema.prisma. Aqui so lemos; a escrita fica em src/app/skins/actions.js.
//
// Uso exclusivo em codigo servidor.

import prisma from '@/lib/prisma';
import { TEAM_T, TEAM_CT, slugFromTeam } from '@/lib/skins/times';
import {
  agentsForTeam,
  gloveByDefindex,
  glovePaints,
  musicKits,
  skinByDefindexPaint,
  weaponByDefindex,
  weaponByName,
} from '@/lib/skins/catalog';

// Busca tudo que o jogador tem equipado, nos dois times, em uma rodada de
// queries paralelas. E barato: sao 6 tabelas pequenas indexadas por steamid.
export async function getLoadout(steamid) {
  if (!steamid) return emptyLoadout();

  const [skins, knives, gloves, agent, music, pins] = await Promise.all([
    prisma.playerSkin.findMany({ where: { steamid } }),
    prisma.playerKnife.findMany({ where: { steamid } }),
    prisma.playerGlove.findMany({ where: { steamid } }),
    prisma.playerAgent.findUnique({ where: { steamid } }),
    prisma.playerMusic.findMany({ where: { steamid } }),
    prisma.playerPin.findMany({ where: { steamid } }),
  ]);

  const porTime = (team) => ({
    // weapon_defindex -> linha da skin equipada
    skins: new Map(
      skins.filter((s) => s.weapon_team === team).map((s) => [String(s.weapon_defindex), s])
    ),
    knife: knives.find((k) => k.weapon_team === team)?.knife ?? null,
    glove: gloves.find((g) => g.weapon_team === team)?.weapon_defindex ?? null,
    music: music.find((m) => m.weapon_team === team)?.music_id ?? null,
    pin: pins.find((p) => p.weapon_team === team)?.id ?? null,
    agent: team === TEAM_CT ? (agent?.agent_ct ?? null) : (agent?.agent_t ?? null),
  });

  return { [TEAM_T]: porTime(TEAM_T), [TEAM_CT]: porTime(TEAM_CT) };
}

function emptyLoadout() {
  const vazio = () => ({
    skins: new Map(),
    knife: null,
    glove: null,
    music: null,
    pin: null,
    agent: null,
  });
  return { [TEAM_T]: vazio(), [TEAM_CT]: vazio() };
}

// Resumo para a faixa no topo de /skins.
//
// Mostra so o que mora em OUTRA categoria: na grade de rifles o jogador ja ve
// quais rifles tem skin, mas nao faz ideia da faca, da luva, do agente ou da
// musica sem trocar de aba. Esses quatro sao os unicos por time, entao cabem
// numa linha; as armas viram contagem.
export function resumirLoadout(loadout, team) {
  const faca = loadout.knife ? weaponByName(loadout.knife) : null;
  const skinDaFaca =
    faca && typeof faca.defindex === 'number'
      ? loadout.skins.get(String(faca.defindex))
      : null;
  const entradaFaca = skinDaFaca
    ? skinByDefindexPaint(faca.defindex, skinDaFaca.weapon_paint_id)
    : null;

  const luva = loadout.glove != null ? gloveByDefindex(loadout.glove) : null;
  const skinDaLuva = luva ? loadout.skins.get(String(loadout.glove)) : null;
  const corDaLuva = skinDaLuva
    ? glovePaints(loadout.glove).find(
        (g) => String(g.paint) === String(skinDaLuva.weapon_paint_id)
      )
    : null;

  const agente = loadout.agent
    ? agentsForTeam(team).find((a) => a.model === loadout.agent)
    : null;

  const kit = loadout.music
    ? musicKits().find((k) => String(k.id) === String(loadout.music))
    : null;

  // Armas de verdade: a tabela de skins mistura arma, faca e luva.
  let armasComSkin = 0;
  for (const [defindex] of loadout.skins) {
    const arma = weaponByDefindex(defindex);
    if (arma && arma.category !== 'knifes') armasComSkin++;
  }

  const soNome = (texto) => String(texto || '').split('|')[0].trim();

  return {
    armasComSkin,
    itens: [
      {
        chave: 'knifes',
        rotulo: 'Faca',
        nome: faca?.label ?? null,
        detalhe: entradaFaca ? String(entradaFaca.paint_name).split('|').slice(1).join('|').trim() : null,
        imagem: entradaFaca?.image ?? faca?.image ?? null,
      },
      {
        chave: 'gloves',
        rotulo: 'Luvas',
        nome: luva?.label ?? null,
        detalhe: corDaLuva ? String(corDaLuva.paint_name).split('|').slice(1).join('|').trim() : null,
        imagem: corDaLuva?.image ?? luva?.image ?? null,
      },
      {
        chave: 'agents',
        rotulo: 'Agente',
        nome: agente ? soNome(agente.agent_name) : null,
        detalhe: null,
        imagem: agente?.image ?? null,
      },
      {
        chave: 'music',
        rotulo: 'Música',
        nome: kit?.name ?? null,
        detalhe: null,
        imagem: kit?.image ?? null,
      },
    ],
  };
}

// Transforma o loadout cru do banco em linhas prontas para exibir.
// Usado pela pagina /skins/loadout e pelo /profile, via LoadoutCompleto.
export function montarItensDoLoadout(loadout, team) {
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

function nomeDaSkin(paintName) {
  const partes = String(paintName || "").split("|");
  return partes.length > 1 ? partes.slice(1).join("|").trim() : "Padrão";
}
