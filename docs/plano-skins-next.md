# Plano — migrar o site de skins (PHP) para dentro do BxD-Stats

**Status:** ✅ **executado.** Fases 0 a 7 concluídas em 01/10/2026.

> **Este documento é histórico** — serve para entender *por que* cada decisão foi
> tomada. Para operar e manter a área de skins, leia [`skins.md`](skins.md).
**Data:** 01/10/2026

> **Decisões confirmadas depois da escrita deste plano:** o site de skins vira
> rotas `/skins` dentro do BxD-Stats (não um app separado), e a UI é **refeita em
> Tailwind** seguindo o design do BxD-Stats — caminho (b) da seção 7.

---

## 1. Por que estamos fazendo isso

O site de skins (WeaponPaints) rodava na Hostinger. A hospedagem foi perdida e o
plugin do CS2 ficou desativado (estava em `plugins_disabled/`).

Tentamos duas hospedagens antes de chegar aqui:

1. **Hospedagem nova sem MySQL remoto** — o plugin do CS2 precisa escrever no
   mesmo banco que o site lê. Sem MySQL remoto, inviável.
2. **InfinityFree** (`bxdskins.unaux.com`) — permite banco externo, mas, pelo que
   está documentado no fórum deles, **só na porta 3306**. O TiDB Cloud Serverless
   atende na **4000** e não oferece 3306. Abortado antes do teste final porque a
   senha de FTP não conferiu (o servidor aceitou o usuário e recusou a senha).

**A Vercel não tem nenhuma dessas restrições, e isso não é teoria:** o BxD-Stats
já conecta no TiDB:4000 a partir da Vercel, em produção.

### O que já está pronto e não se perde

- Database **`weaponpaints`** criado no TiDB (cluster que já existia).
- Plugin WeaponPaints reativado, apontado pro TiDB, **conectando por TLS** e com
  as 6 tabelas criadas por ele mesmo. Verificado em 01/10/2026.
- Descoberta que destrava tudo: o WeaponPaints usa **pool de conexão**
  (`Pooling = true`, uma conexão por query), ao contrário do MatchZy, que segura
  uma conexão para sempre. Por isso o TiDB Serverless funciona para ele e não
  para o MatchZy. Ver `matchzy-tidb-lastinsertid-bug` na memória.

---

## 2. Decisões já tomadas

| Decisão | Escolha |
|---|---|
| Onde mora | **Dentro do BxD-Stats**, em rotas `/skins` — não um app separado |
| Deploy | Vercel, mesmo projeto, mesmo domínio |
| Login | **Reusar o que já existe** (`src/app/api/auth/steam/`) |
| Banco | TiDB, o mesmo |

### Por que reusar o login é a decisão mais importante

O `src/app/api/auth/steam/return/route.js` já faz, corretamente:

- `check_authentication` server-to-server com a Steam;
- `claimed_id` extraído por regex estrita (17 dígitos, domínio fixo);
- `return_to` fixado no próprio endpoint, impedindo reuso da resposta em outra rota;
- sessão em cookie HMAC-SHA256 httpOnly, com comparação em tempo constante e expiração.

O PHP fazia **nada disso** — pegava o SteamID cru de `openid_claimed_id` e
confiava. (Isso foi corrigido no PHP em 01/10/2026, mas o PHP vai ser aposentado.)

---

## 3. Pré-requisito: unificar o database

Hoje as tabelas estão em `weaponpaints` e os stats em `test`, no mesmo cluster.
Para um app Next só, isso obriga dois datasources (o Prisma conecta a um database
por client).

**Proposta:** repontar o plugin para o database `test`. As tabelas `wp_player_*`
estão **vazias** — o plugin recria tudo sozinho na próxima subida do servidor.

1. Editar `DatabaseName` em `configs/plugins/WeaponPaints/WeaponPaints.json` → `test`
2. Subir o CS2, conferir as 6 tabelas em `test`
3. `DROP DATABASE weaponpaints`

Custo: ~5 minutos. Faz a diferença entre um Prisma client e dois.

---

## 4. O schema (quem manda nele)

**O plugin WeaponPaints é o dono do schema**, igual ao MatchZy. Mesma regra que
já está no topo do `schema.prisma`:

> Nunca rodar `prisma migrate` nem `prisma db push`. Sincronizar com `prisma db pull` + `prisma generate`.

**A diferença importante:** o site de stats é só-leitura, mas o site de skins
**precisa escrever** — é a função dele. Então: gravar dados **sim**, mexer no
schema **nunca**.

Schema real, lido do TiDB em 01/10/2026:

```
wp_player_skins   steamid varchar(18), weapon_team int, weapon_defindex int,
                  weapon_paint_id int, weapon_wear float, weapon_seed int,
                  weapon_nametag varchar(128) NULL, weapon_stattrak tinyint(1),
                  weapon_stattrak_count int, weapon_sticker_0..4 varchar(128),
                  weapon_keychain varchar(128)
wp_player_knife   steamid, weapon_team, knife varchar(64)
wp_player_gloves  steamid, weapon_team, weapon_defindex int
wp_player_agents  steamid (UNIQUE), agent_ct varchar(64) NULL, agent_t varchar(64) NULL
wp_player_music   steamid varchar(64), weapon_team, music_id int
wp_player_pins    steamid varchar(64), weapon_team, id int
```

Times: **2 = T, 3 = CT**. Stickers são string posicional `"0;0;0;0;0;0;0"`,
chaveiro é `"0;0;0;0;0"`.

> **Armadilha a não repetir:** o `update.php` faz
> `INSERT INTO wp_player_skins VALUES(?,?,...)` com **15 colunas posicionais, sem
> nomear nenhuma**. Se o plugin mudar a ordem das colunas numa atualização, isso
> passa a gravar lixo em silêncio. Na versão Next, **sempre nomear as colunas**.

---

## 5. Mapa de rotas: PHP → Next

| PHP | Next | O que faz | LOC PHP |
|---|---|---|---|
| `pages/signin.php` | — | Some: `/skins` usa a tela de login do `/profile` | 93 |
| `pages/authorize.php` | — | Some: já existe em `api/auth/steam/return` | 94 |
| `pages/signout.php` | — | Some: já existe em `api/auth/logout` | — |
| `imports/selectweapon.php` | `/skins` | Grade de categorias e armas, com o que já está equipado | 532 |
| `imports/selectskin.php` | `/skins/[categoria]` | Lista de skins daquela arma | 474 |
| `imports/viewskin.php` | `/skins/[categoria]/[arma]` | Customização: wear, seed, nametag, StatTrak, stickers, chaveiro, preview 3D | 539 |
| `pages/loadout.php` | `/skins/loadout` | Loadout completo dos dois times | 319 |
| `pages/update.php` | `POST /api/skins/update` | Grava a escolha | 164 |
| `pages/copyloadout.php` | `POST /api/skins/copy` | Copia loadout T↔CT | 89 |
| `pages/skins.php` | — | Dissolve: era roteador + carregador dos JSON | 185 |
| `imports/openid.php` | — | **Deleta** (901 linhas substituídas pelo que já existe) | 901 |
| `config-gen.php` | — | **Deleta** (já rodou; os JSON estão gerados) | 492 |
| `index.php`, `database.php`, `errorpage.php` | — | Dissolvem no roteamento do Next | 216 |

**~1.400 linhas morrem. ~2.100 linhas convertem de verdade** — e boa parte delas
é HTML, que vira JSX quase mecanicamente.

### Ajustes feitos na fase 3 (a tabela acima era a previsão)

- **A gravação virou server action**, não `POST /api/skins/update`. O projeto já
  usa server actions (`src/app/gallery/actions.js`), e assim não há endpoint
  público a proteger: a action lê o steamid da sessão assinada no servidor.
- **Rota `/skins/[item]`**, não `/skins/[categoria]`. A categoria é um filtro na
  query (`/skins?cat=rifles`), e o segmento identifica o item: `weapon_ak47` ou
  `gloves_5032`.
- **Agentes e kits de música não têm segunda tela.** Na grade de `/skins` o card
  já é a opção final, então um clique salva. Só armas, facas e luvas navegam.

---

## 6. Dados e assets

**Catálogo de skins** (`src/data/*.json`, 2,6 MB): copia inalterado. Atenção ao
que o PHP já fazia e precisa continuar — `stickers.json` (2 MB) e `keychains.json`
só são carregados na tela de customização, nunca nas listas. Em Next isso vira
import dinâmico na rota `[arma]`.

**Imagens: nenhuma para migrar.** Todas apontam para `raw.githubusercontent.com`.
Vale configurar `images.remotePatterns` no `next.config` se usarmos `next/image`.

---

## 7. CSS — correção de estimativa

Numa conversa anterior eu disse que as 1.657 linhas de CSS "carregam intactas".
**Isso vale para um app separado, não para a integração no BxD-Stats.** O
BxD-Stats usa Tailwind + shadcn/ui + tema escuro + fonte Orbitron; o site PHP tem
um sistema de design próprio. Misturar os dois sob a mesma navbar fica ruim.

Dois caminhos:

- **(a) Portar o CSS num escopo `/skins`** — rápido, mas duas linguagens visuais
  no mesmo site.
- **(b) Refazer a UI em Tailwind** seguindo o BxD-Stats — mais trabalho, resultado
  coeso. **Recomendado.**

`css/view.css` (363 linhas) vem junto de qualquer jeito: posiciona o canvas 3D.

---

## 8. O viewer 3D — o maior risco

`js/weaponviewer.js` são **1.161 linhas** de three.js: renderiza a arma, projeta a
textura da skin, posiciona sticker por sticker. Dependências externas:

- `https://unpkg.com/three-projected-material/build/ProjectedMaterial.module.js`
- `environment.hdr` e `none.png` do repositório do LielXD

Vira um client component (`'use client'`) com carregamento dinâmico
(`next/dynamic`, `ssr: false`). **Deve** portar direto — é JS de navegador puro,
sem nada de PHP. Mas é onde eu espero perder mais tempo, e é a parte que eu não
consigo garantir sem tentar.

Recomendo trazer o unpkg para dentro do projeto (`npm i three-projected-material`)
em vez de depender de CDN em produção.

---

## 9. Fases

| # | Entrega | Por que nessa ordem |
|---|---|---|
| 0 | ✅ Unificar o database no `test` | 5 min, destrava o Prisma client único |
| 1 | ✅ `prisma db pull` + modelar as 6 tabelas; helpers de leitura/escrita | Base de tudo |
| 2 | ✅ Rota `/skins` com login + grade de armas + o que está equipado | Primeira tela no ar; prova a ponta a ponta |
| 3 | ✅ `/skins/[item]` + gravação, sem customização | **Já dá pra usar de verdade:** escolher skin e ver no jogo |
| 4 | ✅ `/skins/[item]/[paint]`: desgaste, seed, etiqueta, StatTrak | Customização sem 3D |
| 5a | ✅ Adesivos (5 slots) + chaveiro | Dividido: a parte de dados entrega sozinha |
| 5b | ✅ Viewer 3D sob demanda | Só baixa three.js + modelo se o jogador pedir |
| 6 | ✅ `/skins/loadout` + copiar TR↔CT | Conveniência |
| 7 | Aposentar o PHP; arquivar `D:\steamcmd\webweaponpaints` | Fim |

**A fase 3 é o marco real.** Dali em diante o site já substitui o antigo para o
uso do dia a dia; 4 a 6 são incrementos.

---

## 10. Pontos em aberto

1. **Rotacionar a Steam Web API key.** A do `config.php` é a mesma que estava na
   Hostinger. O BxD-Stats tem uma key diferente, que é a que o app Next vai usar —
   convém rotacionar as duas.
2. **Skins de quem não joga no servidor?** Hoje qualquer um que logue na Steam
   escolhe skins. Como o BxD-Stats conhece quem jogou, dá pra restringir `/skins`
   a quem tem partida registrada. Decisão de produto, não técnica.
3. **O crash continua valendo.** Trocar skin em arma viva derruba o servidor;
   skins só se aplicam no respawn. Os comandos in-game seguem desligados no
   `WeaponPaints.json` e **nada neste plano muda isso.**
4. **Um deploy quebrado derruba stats e skins juntos.** É o preço de juntar os
   dois. Mitigação: preview deployments da Vercel antes de promover.

---

## 11. Bugs herdados do site PHP, achados e corrigidos na fase 2

Os três apareceram ao portar o catálogo (`src/data/skins/*.json`) e **existiam no
site antigo** — ninguém tinha percebido porque falhavam em silêncio. Todos estão
corrigidos em `scripts/atualizar-catalogo-skins.mjs`, que substitui o
`config-gen.php` e é idempotente.

1. **Nenhum agente para escolher.** O `config-gen.php` usava o arquivo `pt-BR`
   para tudo quando ele existia. Acontece que `agents_pt-BR.json` no upstream é um
   stub com **2 entradas**, contra **65** em `agents_en.json`. O site mostrava só
   "Default Agent". O script agora compara os dois e cai para o inglês quando o
   traduzido vier menor — nome em inglês é melhor que categoria vazia.

2. **A faca padrão não existe no upstream.** O `config-gen.php` fabricava a
   entrada `weapon_knife_default` e a colocava no início de `skins.json`
   (`array_unshift`). Sem replicar isso, a opção de voltar à faca padrão some da
   grade. Descoberto porque a contagem de facas caiu de 21 para 20 depois da
   primeira atualização do catálogo.

3. **O CT nunca pôde voltar à luva padrão.** O `config-gen.php` monta o objeto
   `$ctGlove` (linhas 45-49) com imagem e nome... e **nunca o insere no array**.
   Código morto. Só o lado TR tinha luva padrão. O script insere a do CT, que era
   claramente a intenção.

**Manutenção:** rode `node scripts/atualizar-catalogo-skins.mjs` quando a Valve
lançar skins novas (`DRY_RUN=1` para simular). O catálogo é estático e envelhece
— quando ele atrasa, a skin existe no jogo e não aparece no site.
