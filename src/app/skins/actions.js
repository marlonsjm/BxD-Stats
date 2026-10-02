'use server';

// Escrita do loadout nas tabelas wp_player_* do plugin WeaponPaints.
//
// REGRA DE OURO: nada vindo do cliente e confiado.
//   - o steamid vem SEMPRE da sessao assinada, nunca do payload;
//   - todo id (arma, paint, luva, agente, kit) e conferido contra o catalogo
//     antes de virar INSERT. O site PHP nao validava nada: mandava o que viesse
//     no POST direto para o banco, entao dava para gravar paint inexistente ou
//     arma do time errado forjando a requisicao.
//
// Semantica copiada de pages/update.php do site antigo — ver docs/plano-skins-next.md.
// Diferenca proposital: ao trocar so a skin, NAO sobrescrevemos desgaste, seed,
// nametag nem StatTrak. O PHP reenviava tudo a cada clique porque a tela sempre
// tinha esses campos; aqui a fase 3 so mexe no paint, e apagar o que o jogador
// ajustou na fase 4 seria perda silenciosa.

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NAMETAG_MAX, SEED_MAX } from '@/lib/skins/desgaste';
import {
  ADESIVO_PADRAO,
  CHAVEIRO_PADRAO,
  SEED_CHAVEIRO_MAX,
  SLOTS_ADESIVO,
  serializarAdesivo,
  serializarChaveiro,
} from '@/lib/skins/adesivos';
import {
  TEAM_CT,
  TEAM_T,
  agentsForTeam,
  glovePaints,
  glovesForTeam,
  musicKits,
  skinByDefindexPaint,
  weaponAllowedForTeam,
  weaponByName,
} from '@/lib/skins/catalog';

const ok = () => ({ ok: true });
const erro = (motivo) => ({ ok: false, erro: motivo });

function validarTime(team) {
  const n = Number(team);
  return n === TEAM_T || n === TEAM_CT ? n : null;
}

// Ponto unico de entrada das escolhas. O `kind` decide a tabela.
export async function aplicarEscolha(payload) {
  const session = await getSession();
  if (!session) return erro('Sua sessão expirou. Entre com a Steam de novo.');

  const steamid = session.steamid;
  const team = validarTime(payload?.team);
  if (!team) return erro('Time inválido.');

  try {
    switch (payload?.kind) {
      case 'skin':
        await salvarSkin({ steamid, team, payload });
        break;
      case 'glove':
        await salvarLuva({ steamid, team, payload });
        break;
      case 'agent':
        await salvarAgente({ steamid, team, payload });
        break;
      case 'music':
        await salvarMusica({ steamid, team, payload });
        break;
      default:
        return erro('Tipo de item desconhecido.');
    }
  } catch (e) {
    console.error('[skins] falha ao gravar escolha:', e);
    return erro('Não foi possível salvar. Tente de novo.');
  }

  revalidatePath('/skins');
  return ok();
}

// Customizacao de uma skin ja escolhida: desgaste, seed, nametag e StatTrak.
// Diferente de aplicarEscolha, aqui o paint vem junto — personalizar uma skin
// que ainda nao estava equipada equipa ela de uma vez.
export async function salvarCustomizacao(payload) {
  const session = await getSession();
  if (!session) return erro('Sua sessão expirou. Entre com a Steam de novo.');

  const steamid = session.steamid;
  const team = validarTime(payload?.team);
  if (!team) return erro('Time inválido.');

  const ehLuva = String(payload?.item ?? '').startsWith('gloves_');

  let defindex;
  let paintId;

  try {
    if (ehLuva) {
      const alvo = String(payload.item).slice('gloves_'.length);
      const luva = glovesForTeam(team).find((g) => String(g.defindex) === alvo);
      if (!luva || String(luva.defindex) === 'gloves_default') {
        return erro('Luva inválida.');
      }
      const existe = glovePaints(luva.defindex).some(
        (g) => String(g.paint) === String(payload.paint)
      );
      if (!existe) return erro('Cor de luva inválida.');

      defindex = Number(luva.defindex);
      paintId = Number(payload.paint);
    } else {
      const arma = weaponByName(payload?.item);
      if (!arma) return erro('Arma desconhecida.');
      if (!weaponAllowedForTeam(arma.name, team)) return erro('Arma indisponível neste lado.');
      if (typeof arma.defindex !== 'number') {
        return erro('A faca padrão não tem o que personalizar.');
      }
      if (!skinByDefindexPaint(arma.defindex, payload.paint)) {
        return erro('Skin inválida para esta arma.');
      }

      defindex = arma.defindex;
      paintId = Number(payload.paint);

      // Personalizar a skin de uma faca tambem define qual faca usar.
      if (arma.category === 'knifes') {
        await prisma.playerKnife.upsert({
          where: { steamid_weapon_team: { steamid, weapon_team: team } },
          update: { knife: arma.name },
          create: { steamid, weapon_team: team, knife: arma.name },
        });
      }
    }

    if (!Number.isInteger(defindex) || !Number.isInteger(paintId)) {
      return erro('Item inválido.');
    }

    // --- Validacao dos campos ---
    const wear = Number(payload?.wear);
    if (!Number.isFinite(wear) || wear < 0 || wear > 1) {
      return erro('Desgaste precisa ficar entre 0 e 1.');
    }

    const seed = Number(payload?.seed);
    if (!Number.isInteger(seed) || seed < 0 || seed > SEED_MAX) {
      return erro(`Seed precisa ser um número inteiro entre 0 e ${SEED_MAX}.`);
    }

    const bruto = typeof payload?.nametag === 'string' ? payload.nametag.trim() : '';
    if (bruto.length > NAMETAG_MAX) {
      return erro(`A etiqueta aceita no máximo ${NAMETAG_MAX} caracteres.`);
    }
    // Luva nao aceita etiqueta nem StatTrak no jogo.
    const nametag = ehLuva || bruto === '' ? null : bruto;
    const stattrak = ehLuva ? false : Boolean(payload?.stattrak);

    const dados = {
      weapon_paint_id: paintId,
      // o plugin grava 0.000001 como "zero"; manter isso evita float 0 exato
      weapon_wear: wear === 0 ? 0.000001 : wear,
      weapon_seed: seed,
      weapon_nametag: nametag,
      weapon_stattrak: stattrak,
    };

    // Adesivos e chaveiro: luva nao aceita nenhum dos dois no jogo.
    if (!ehLuva) {
      const adesivos = await validarAdesivos(payload?.adesivos);
      if (adesivos.erro) return erro(adesivos.erro);

      const chaveiro = await validarChaveiro(payload?.chaveiro);
      if (chaveiro.erro) return erro(chaveiro.erro);

      for (let i = 0; i < SLOTS_ADESIVO; i++) {
        dados[`weapon_sticker_${i}`] = serializarAdesivo(adesivos.lista[i]);
      }
      dados.weapon_keychain = serializarChaveiro(chaveiro.valor);
    }

    if (ehLuva) {
      await prisma.playerGlove.upsert({
        where: { steamid_weapon_team: { steamid, weapon_team: team } },
        update: { weapon_defindex: defindex },
        create: { steamid, weapon_team: team, weapon_defindex: defindex },
      });
    }

    await prisma.playerSkin.upsert({
      where: {
        steamid_weapon_team_weapon_defindex: {
          steamid,
          weapon_team: team,
          weapon_defindex: defindex,
        },
      },
      update: dados,
      // weapon_stattrak_count fica de fora de proposito: quem conta as mortes
      // e o plugin (SyncStatTrakToDatabase no disconnect).
      create: { steamid, weapon_team: team, weapon_defindex: defindex, ...dados },
    });
  } catch (e) {
    console.error('[skins] falha ao salvar customizacao:', e);
    return erro('Não foi possível salvar. Tente de novo.');
  }

  revalidatePath('/skins');
  return ok();
}

// Copia o loadout inteiro de um lado para o outro.
//
// E DESTRUTIVO: sobrescreve tudo do time de destino. A confirmacao fica na
// interface (ver CopiarLoadout.js).
//
// Semantica do pages/copyloadout.php: para cada tabela indexada por
// weapon_team, le a origem, apaga o destino e reinsere com o outro time.
// Agentes sao a excecao — uma linha so, com uma coluna por time.
//
// Pinos (wp_player_pins) ficam de fora, como no site antigo: nao ha tela para
// escolher pino, entao nao ha o que copiar.
export async function copiarLoadout({ de, para }) {
  const session = await getSession();
  if (!session) return erro('Sua sessão expirou. Entre com a Steam de novo.');

  const steamid = session.steamid;
  const origem = validarTime(de);
  const destino = validarTime(para);

  if (!origem || !destino) return erro('Time inválido.');
  if (origem === destino) return erro('Origem e destino são o mesmo time.');

  try {
    const [skins, facas, luvas, musicas, agente] = await Promise.all([
      prisma.playerSkin.findMany({ where: { steamid, weapon_team: origem } }),
      prisma.playerKnife.findMany({ where: { steamid, weapon_team: origem } }),
      prisma.playerGlove.findMany({ where: { steamid, weapon_team: origem } }),
      prisma.playerMusic.findMany({ where: { steamid, weapon_team: origem } }),
      prisma.playerAgent.findUnique({ where: { steamid } }),
    ]);

    // Troca o time e tira o id da linha de origem antes de reinserir.
    const paraDestino = (linhas) =>
      linhas.map(({ ...linha }) => ({ ...linha, weapon_team: destino }));

    const operacoes = [
      prisma.playerSkin.deleteMany({ where: { steamid, weapon_team: destino } }),
      prisma.playerKnife.deleteMany({ where: { steamid, weapon_team: destino } }),
      prisma.playerGlove.deleteMany({ where: { steamid, weapon_team: destino } }),
      prisma.playerMusic.deleteMany({ where: { steamid, weapon_team: destino } }),
    ];

    if (skins.length) operacoes.push(prisma.playerSkin.createMany({ data: paraDestino(skins) }));
    if (facas.length) operacoes.push(prisma.playerKnife.createMany({ data: paraDestino(facas) }));
    if (luvas.length) operacoes.push(prisma.playerGlove.createMany({ data: paraDestino(luvas) }));
    if (musicas.length) operacoes.push(prisma.playerMusic.createMany({ data: paraDestino(musicas) }));

    // Agente: copia a coluna do time de origem para a do destino.
    const colunaOrigem = origem === TEAM_CT ? 'agent_ct' : 'agent_t';
    const colunaDestino = destino === TEAM_CT ? 'agent_ct' : 'agent_t';
    const valorAgente = agente?.[colunaOrigem] ?? null;

    if (agente) {
      operacoes.push(
        prisma.playerAgent.update({
          where: { steamid },
          data: { [colunaDestino]: valorAgente },
        })
      );
    }

    await prisma.$transaction(operacoes);
  } catch (e) {
    console.error('[skins] falha ao copiar loadout:', e);
    return erro('Não foi possível copiar. Tente de novo.');
  }

  revalidatePath('/skins');
  revalidatePath('/skins/loadout');
  return ok();
}

// --- Validacao de adesivos e chaveiro ------------------------------------
//
// O catalogo (2 MB) so e carregado aqui, sob demanda. O Node mantem o modulo em
// cache depois da primeira vez, entao isto nao custa a cada gravacao.

const limitar = (v, min, max, padrao) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, n));
};

async function validarAdesivos(entrada) {
  const lista = Array.isArray(entrada) ? entrada : [];
  if (lista.length > SLOTS_ADESIVO) {
    return { erro: `No máximo ${SLOTS_ADESIVO} adesivos.` };
  }

  const usados = lista.map((a) => Math.trunc(Number(a?.id) || 0)).filter((id) => id > 0);

  if (usados.length > 0) {
    const catalogo = (await import('@/data/skins/stickers.json')).default;
    const validos = new Set(catalogo.map((s) => Number(s.id)));
    const invalido = usados.find((id) => !validos.has(id));
    if (invalido) return { erro: `Adesivo ${invalido} não existe.` };
  }

  const saida = [];
  for (let i = 0; i < SLOTS_ADESIVO; i++) {
    const a = lista[i];
    const id = Math.trunc(Number(a?.id) || 0);
    if (id <= 0) {
      saida.push({ ...ADESIVO_PADRAO });
      continue;
    }
    saida.push({
      id,
      schema: Math.trunc(Number(a?.schema) || 0),
      x: limitar(a?.x, -10, 10, 0),
      y: limitar(a?.y, -10, 10, 0),
      wear: limitar(a?.wear, 0, 1, 0),
      // escala 0 deixaria o adesivo invisivel — ver src/lib/skins/adesivos.js
      scale: limitar(a?.scale, 0.1, 2, 1),
      rotation: limitar(a?.rotation, -180, 180, 0),
    });
  }

  return { lista: saida };
}

async function validarChaveiro(entrada) {
  const id = Math.trunc(Number(entrada?.id) || 0);
  if (id <= 0) return { valor: { ...CHAVEIRO_PADRAO } };

  const catalogo = (await import('@/data/skins/keychains.json')).default;
  if (!catalogo.some((k) => Number(k.id) === id)) {
    return { erro: `Chaveiro ${id} não existe.` };
  }

  return {
    valor: {
      id,
      x: limitar(entrada?.x, -10, 10, 0),
      y: limitar(entrada?.y, -10, 10, 0),
      z: limitar(entrada?.z, -10, 10, 0),
      seed: Math.trunc(limitar(entrada?.seed, 0, SEED_CHAVEIRO_MAX, 0)),
    },
  };
}

// --- Armas e facas -------------------------------------------------------
//
// Para faca, alem da skin existe a escolha de QUAL faca usar, que mora numa
// tabela propria (wp_player_knife).
async function salvarSkin({ steamid, team, payload }) {
  const arma = weaponByName(payload.weaponName);
  if (!arma) throw new Error(`arma desconhecida: ${payload.weaponName}`);
  if (!weaponAllowedForTeam(arma.name, team)) {
    throw new Error(`${arma.name} nao e do time ${team}`);
  }

  const ehFaca = arma.category === 'knifes';

  if (ehFaca) {
    await prisma.playerKnife.upsert({
      where: { steamid_weapon_team: { steamid, weapon_team: team } },
      update: { knife: arma.name },
      create: { steamid, weapon_team: team, knife: arma.name },
    });
  }

  // A faca padrao tem defindex textual ('weapon_knife_default') e nao cabe na
  // coluna INT de wp_player_skins. Nesse caso so a escolha da faca e gravada —
  // o plugin entrega o modelo padrao, sem skin.
  if (typeof arma.defindex !== 'number') return;

  const skin = skinByDefindexPaint(arma.defindex, payload.paint);
  if (!skin) throw new Error(`paint ${payload.paint} nao existe para ${arma.name}`);

  const paintId = Number(payload.paint);
  if (!Number.isInteger(paintId)) throw new Error(`paint invalido: ${payload.paint}`);

  await prisma.playerSkin.upsert({
    where: {
      steamid_weapon_team_weapon_defindex: {
        steamid,
        weapon_team: team,
        weapon_defindex: arma.defindex,
      },
    },
    // So o paint muda; desgaste/seed/nametag/StatTrak ficam como estavam.
    update: { weapon_paint_id: paintId },
    create: {
      steamid,
      weapon_team: team,
      weapon_defindex: arma.defindex,
      weapon_paint_id: paintId,
      // demais colunas usam o DEFAULT definido pelo plugin
    },
  });
}

// --- Luvas ---------------------------------------------------------------
//
// A luva "padrao" nao e uma luva: e a ausencia de linha. O PHP apagava a linha
// quando o paint era 't'/'ct' (as entradas sinteticas de default), e fazemos o
// mesmo.
async function salvarLuva({ steamid, team, payload }) {
  const disponiveis = glovesForTeam(team);
  const escolhida = disponiveis.find(
    (g) => String(g.defindex) === String(payload.defindex)
  );
  if (!escolhida) throw new Error(`luva desconhecida: ${payload.defindex}`);

  const ehPadrao = String(escolhida.defindex) === 'gloves_default';

  if (ehPadrao) {
    await prisma.playerGlove.deleteMany({ where: { steamid, weapon_team: team } });
    return;
  }

  const defindex = Number(escolhida.defindex);
  const paintId = Number(payload.paint);
  if (!Number.isInteger(defindex) || !Number.isInteger(paintId)) {
    throw new Error('luva ou paint invalido');
  }

  await prisma.playerGlove.upsert({
    where: { steamid_weapon_team: { steamid, weapon_team: team } },
    update: { weapon_defindex: defindex },
    create: { steamid, weapon_team: team, weapon_defindex: defindex },
  });

  // A luva tambem precisa de uma linha em wp_player_skins com o paint escolhido:
  // e de la que o plugin le a textura.
  await prisma.playerSkin.upsert({
    where: {
      steamid_weapon_team_weapon_defindex: {
        steamid,
        weapon_team: team,
        weapon_defindex: defindex,
      },
    },
    update: { weapon_paint_id: paintId },
    create: {
      steamid,
      weapon_team: team,
      weapon_defindex: defindex,
      weapon_paint_id: paintId,
    },
  });
}

// --- Agentes -------------------------------------------------------------
//
// Tabela com uma linha por jogador e uma coluna por time. Voltar ao padrao
// zera a coluna do time; se o outro time tambem estiver vazio, a linha some.
async function salvarAgente({ steamid, team, payload }) {
  const coluna = team === TEAM_CT ? 'agent_ct' : 'agent_t';
  const outra = team === TEAM_CT ? 'agent_t' : 'agent_ct';

  if (payload.model === 'default') {
    const atual = await prisma.playerAgent.findUnique({ where: { steamid } });
    if (!atual) return;

    if (!atual[outra]) {
      await prisma.playerAgent.delete({ where: { steamid } });
    } else {
      await prisma.playerAgent.update({
        where: { steamid },
        data: { [coluna]: null },
      });
    }
    return;
  }

  const existe = agentsForTeam(team).some((a) => a.model === payload.model);
  if (!existe) throw new Error(`agente desconhecido para o time ${team}: ${payload.model}`);

  await prisma.playerAgent.upsert({
    where: { steamid },
    update: { [coluna]: payload.model },
    create: { steamid, [coluna]: payload.model },
  });
}

// --- Kit de musica -------------------------------------------------------
//
// O PHP nao tinha como REMOVER o kit — uma vez escolhido, ficava para sempre.
// Aqui o id 'default' apaga a linha.
async function salvarMusica({ steamid, team, payload }) {
  if (payload.musicId === 'default') {
    await prisma.playerMusic.deleteMany({ where: { steamid, weapon_team: team } });
    return;
  }

  const existe = musicKits().some((k) => String(k.id) === String(payload.musicId));
  if (!existe) throw new Error(`kit de musica desconhecido: ${payload.musicId}`);

  const musicId = Number(payload.musicId);
  if (!Number.isInteger(musicId)) throw new Error('id de musica invalido');

  await prisma.playerMusic.upsert({
    where: { steamid_weapon_team: { steamid, weapon_team: team } },
    update: { music_id: musicId },
    create: { steamid, weapon_team: team, music_id: musicId },
  });
}
