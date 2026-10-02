// Atualiza o catalogo de skins em src/data/skins/ a partir do repositorio do
// plugin (Nereziel/cs2-WeaponPaints).
//
// Por que existe: o catalogo e estatico e envelhece. Quando a Valve lanca skins
// novas, o plugin publica os JSON atualizados e o site precisa acompanhar,
// senao a skin existe no jogo mas nao aparece aqui.
//
// A armadilha que este script resolve: alguns arquivos `_pt-BR.json` do upstream
// sao STUBS — o agents_pt-BR.json tem 2 entradas contra 65 do agents_en.json.
// O gerador original do site (config-gen.php) usava pt-BR para tudo quando o
// arquivo existia, entao o site ficava sem agente nenhum para escolher, em
// silencio. Aqui cada arquivo e comparado com a versao em ingles e, se o pt-BR
// vier menor, usamos o ingles (nome em ingles e melhor que catalogo vazio).
//
// Rodar:      node scripts/atualizar-catalogo-skins.mjs
// Simular:    DRY_RUN=1 node scripts/atualizar-catalogo-skins.mjs

import fs from 'node:fs/promises';
import path from 'node:path';

const BASE =
  'https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/refs/heads/main/website/data';
const NEREZIEL_IMG =
  'https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins';
const LIELXD =
  'https://raw.githubusercontent.com/LielXD/CS2-WeaponPaints-Website/refs/heads/main/src';

const DESTINO = path.join(process.cwd(), 'src', 'data', 'skins');
const IDIOMA = 'pt-BR';
const DRY_RUN = process.env.DRY_RUN === '1';

const ARQUIVOS = ['skins', 'gloves', 'agents', 'music', 'stickers', 'keychains'];

async function baixar(nome, idioma) {
  const url = `${BASE}/${nome}_${idioma}.json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Entradas sinteticas
//
// Nem tudo que o site precisa vem do upstream. O gerador original
// (config-gen.php) inventava algumas entradas "padrao" antes de gravar os JSON,
// e sem elas o jogador perde a opcao de VOLTAR ao item padrao. Replicado aqui.
// ---------------------------------------------------------------------------

// A faca padrao nao existe no catalogo do plugin: o config-gen.php a criava e
// colocava na frente da lista (array_unshift).
function aplicarFacaPadrao(skins) {
  if (skins.some((s) => s.weapon_name === 'weapon_knife_default')) return skins;

  skins.unshift({
    weapon_defindex: 'weapon_knife_default',
    weapon_name: 'weapon_knife_default',
    paint: 'default',
    image: `${NEREZIEL_IMG}/weapon_knife.png`,
    paint_name: 'Default Knife | Default',
    legacy_model: false,
  });

  return skins;
}

// A primeira luva do upstream e sobrescrita para virar a luva padrao do TR.
//
// E a do CT? O config-gen.php MONTA o objeto (`$ctGlove`) e nunca o insere no
// array — codigo morto. Resultado: no site antigo o jogador do CT nao tinha como
// voltar para a luva padrao. Inserimos aqui, que era claramente a intencao.
function aplicarLuvasPadrao(luvas) {
  if (!Array.isArray(luvas) || luvas.length === 0) return luvas;

  luvas[0] = {
    ...luvas[0],
    weapon_defindex: 'gloves_default',
    paint: 't',
    image: `${LIELXD}/gloves/default_t.png`,
    paint_name: 'Default Gloves | Terrorist Default',
  };

  const temCt = luvas.some(
    (g) => String(g.weapon_defindex) === 'gloves_default' && g.paint === 'ct'
  );

  if (!temCt) {
    luvas.splice(1, 0, {
      weapon_defindex: 'gloves_default',
      paint: 'ct',
      image: `${LIELXD}/gloves/default_ct.webp`,
      paint_name: 'Default Gloves | Counter-Terrorist Default',
    });
  }

  return luvas;
}

// Reproduz o que o config-gen.php fazia: as duas primeiras entradas de agents
// sao os "sem agente" de cada time, e vem vazias do upstream.
function aplicarAgentesPadrao(agentes) {
  if (!Array.isArray(agentes) || agentes.length < 2) return agentes;

  agentes[0] = {
    ...agentes[0],
    team: 2,
    image: `${LIELXD}/agents/t_agent_default.png`,
    model: 'default',
    agent_name: 'Default Agent | Default',
  };
  agentes[1] = {
    ...agentes[1],
    team: 3,
    image: `${LIELXD}/agents/ct_agent_default.png`,
    model: 'default',
    agent_name: 'Default Agent | Default',
  };

  return agentes;
}

async function main() {
  await fs.mkdir(DESTINO, { recursive: true });
  if (DRY_RUN) console.log('(DRY_RUN: nada sera gravado)\n');

  for (const nome of ARQUIVOS) {
    const [traduzido, ingles] = await Promise.all([
      baixar(nome, IDIOMA),
      baixar(nome, 'en'),
    ]);

    let escolhido = traduzido;
    let origem = IDIOMA;

    // Stub: o arquivo traduzido existe mas tem menos entradas que o ingles.
    if (!traduzido || (ingles && ingles.length > traduzido.length)) {
      escolhido = ingles;
      origem = 'en';
    }

    if (!escolhido) {
      console.log(`  ${nome.padEnd(11)} FALHOU (nao baixou nem pt-BR nem en)`);
      continue;
    }

    if (nome === 'agents') escolhido = aplicarAgentesPadrao(escolhido);
    if (nome === 'gloves') escolhido = aplicarLuvasPadrao(escolhido);
    if (nome === 'skins') escolhido = aplicarFacaPadrao(escolhido);

    const destino = path.join(DESTINO, `${nome}.json`);
    let antes = 0;
    try {
      antes = JSON.parse(await fs.readFile(destino, 'utf8')).length;
    } catch {
      /* arquivo ainda nao existe */
    }

    const delta = escolhido.length - antes;
    const sinal = delta > 0 ? `+${delta}` : String(delta);

    if (!DRY_RUN) {
      await fs.writeFile(destino, JSON.stringify(escolhido));
    }

    console.log(
      `  ${nome.padEnd(11)} ${String(antes).padStart(5)} -> ${String(escolhido.length).padStart(5)} (${sinal.padStart(5)})  origem: ${origem}`
    );
  }

  console.log(
    DRY_RUN
      ? '\nSimulacao concluida.'
      : '\nCatalogo atualizado. Confira o diff antes de commitar.'
  );
}

await main();
