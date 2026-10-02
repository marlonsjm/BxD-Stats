# Skins — como funciona e o que quebra

Runbook da área `/skins`. **Leia isto primeiro ao voltar no assunto.**
O histórico de *por que* cada decisão foi tomada está em
[`plano-skins-next.md`](plano-skins-next.md).

Última revisão: 01/10/2026.

---

## 1. O fluxo, de ponta a ponta

```
  jogador no site                plugin no servidor CS2
  (Next.js na Vercel)            (CounterStrikeSharp)
        |                                 |
        | escreve                         | lê, UMA VEZ, no connect
        v                                 v
   +-------------------------------------------+
   |   TiDB Cloud Serverless, database `test`  |
   |   wp_player_skins / _knife / _gloves /    |
   |   _agents / _music / _pins                |
   +-------------------------------------------+
```

O site e o plugin compartilham as mesmas tabelas. **O plugin é o dono do
schema** — ele as cria com `CREATE TABLE IF NOT EXISTS` ao subir.

As tabelas `wp_player_*` e as `matchzy_stats_*` moram no **mesmo database**
(`test`), de propósito: assim um Prisma client só atende o site inteiro.

---

## 2. A pergunta que mais vai aparecer

> "Escolhi a skin e não apareceu no jogo."

**O servidor lê o banco uma única vez, quando o jogador conecta.** Confirmado no
`Events.cs` do upstream: `OnClientFullConnect` chama `WeaponSync.GetPlayerData()`,
e o `OnPlayerSpawn` apenas *aplica* o que já está em cache, sem reconsultar.

Logo: **trocar skin com o jogo aberto não faz efeito — tem que sair e entrar no
servidor.** Depois de reconectar, as skins aparecem ao renascer.

A página `/skins` avisa isso num banner âmbar. Não remova esse aviso.

### Por que não existe `!refresh`

O comando resolveria, mas o `OnCommandRefresh` chama `RefreshWeapons(player)`
**sem checar se o jogador está vivo** — é o caminho do crash de arma viva que
derruba o servidor inteiro. Por isso `CommandRefresh` e todos os outros comandos
de skin estão vazios no `WeaponPaints.json`. **Não reative.**

---

## 3. Modelo de dados

| Tabela | Chave única | Conteúdo |
|---|---|---|
| `wp_player_skins` | `(steamid, weapon_team, weapon_defindex)` | a skin de cada item |
| `wp_player_knife` | `(steamid, weapon_team)` | qual faca usar |
| `wp_player_gloves` | `(steamid, weapon_team)` | qual luva usar |
| `wp_player_music` | `(steamid, weapon_team)` | kit de música |
| `wp_player_pins` | `(steamid, weapon_team)` | **não usado pelo site** |
| `wp_player_agents` | `steamid` | uma linha, colunas `agent_t` e `agent_ct` |

Times: **2 = TR, 3 = CT**.

`wp_player_skins` guarda **arma, faca e luva na mesma tabela**, distinguidas só
pelo `weapon_defindex`. Para saber o que é o quê, use `weaponByDefindex()` —
se não achar, é luva.

### Strings posicionais

```
weapon_sticker_0..4   id;schema;x;y;wear;scale;rotation     (7 campos)
weapon_keychain       id;x;y;z;seed                         (5 campos)
```

O plugin **exige a contagem exata de campos** — string malformada é ignorada em
silêncio. `id = 0` significa slot vazio. Parse e serialização em
`src/lib/skins/adesivos.js`.

### Colunas que o site NÃO escreve

- **`weapon_stattrak_count`** — quem conta as mortes é o plugin
  (`SyncStatTrakToDatabase`, no disconnect). Incluir essa coluna numa gravação
  zeraria o contador do jogador.

---

## 4. Rotas

| Rota | O que faz |
|---|---|
| `/skins` | Grade por categoria e por lado. Agentes e música salvam no clique; armas, facas e luvas navegam |
| `/skins/[item]` | Skins daquela arma, ou cores daquela luva. `item` = `weapon_ak47` ou `gloves_5032` |
| `/skins/[item]/[paint]` | Desgaste, seed, etiqueta, StatTrak, adesivos, chaveiro e preview 3D |
| `/skins/loadout` | Os dois lados lado a lado + copiar TR↔CT |
| `/api/skins/catalogo` | Busca de adesivos e chaveiros (sessão obrigatória) |

Toda a escrita passa por **server actions** em `src/app/skins/actions.js`. Não há
endpoint público de escrita: o steamid vem sempre da sessão assinada no servidor,
nunca do payload.

---

## 5. Manutenção

### Atualizar o catálogo (skins novas da Valve)

```bash
DRY_RUN=1 node scripts/atualizar-catalogo-skins.mjs   # simula
node scripts/atualizar-catalogo-skins.mjs             # aplica
```

Baixa de `Nereziel/cs2-WeaponPaints` para `src/data/skins/`. É idempotente.
**Commite o resultado** — os JSON vão para o repositório.

O script substitui o `config-gen.php` do site antigo e reproduz as entradas
sintéticas que ele inventava (ver seção 6).

### Sincronizar schema depois de atualizar o plugin

```bash
npx prisma db pull && npx prisma generate
```

⚠️ **`prisma db pull` apaga os comentários do `schema.prisma`** — inclusive o
aviso de "nunca rode migrate/push". Restaure depois de cada pull. Os modelos
também voltam com nome de tabela (`wp_player_skins`); renomeie para PascalCase
com `@@map`.

---

## 6. Armadilhas (todas já custaram tempo)

### Importar o catálogo num client component infla o bundle

`src/lib/skins/catalog.js` faz `import skins.json` (523 KB) no topo. Qualquer
componente `'use client'` que importe dele arrasta o catálogo inteiro para o
navegador.

**Aconteceu duas vezes**, custando ~40 KB por rota cada: no formulário de
customização e no botão de copiar loadout. Por isso existem dois módulos sem
nenhum JSON, feitos para o cliente:

- `src/lib/skins/times.js` — TEAM_T, TEAM_CT, TEAMS, conversões de slug
- `src/lib/skins/desgaste.js` — faixas de desgaste, limites de seed e etiqueta
- `src/lib/skins/adesivos.js` — parse/serialização das strings

**Confira o `npm run build` depois de mexer em componente cliente.** Se uma rota
de `/skins` passar de ~150 kB de First Load, provavelmente é isso.

### Nunca rodar `npm run build` com o `npm run dev` ligado

O build reescreve o `.next` debaixo do dev, que passa a dar 500 em tudo com
mensagens inúteis ("Jest worker encountered child process exceptions", ENOENT de
manifest). Pior: parar o processo do harness **não mata o `next dev`** — ele
sobrevive segurando a porta 3000, o dev novo sobe na 3002, e você fica testando o
servidor velho achando que é o novo.

Procedimento: matar quem escuta a 3000, `rm -rf .next`, subir um dev só.

### `export { X } from '...'` não traz X para o escopo local

Reexportar não é importar. O `catalog.js` reexporta os times de `times.js` e
**também** precisa importá-los, porque usa `TEAM_T` internamente. O lint não pega.

### Server action com aba aberta durante um deploy

O id de uma server action muda a cada build. Aba antiga manda um id que o
servidor novo desconhece → `Failed to find Server Action`. Sem tratamento, isso
sobe até o error boundary do app, que diz "o banco pode estar acordando" e manda
investigar o lugar errado.

Tratado em `src/components/skins/AvisoErro.js`: o erro vira um aviso honesto com
botão de recarregar. Qualquer componente novo que chame server action deve usar
`ehActionDesatualizada()`.

### Nunca gravar `INSERT` com colunas posicionais

O `update.php` do site antigo fazia
`INSERT INTO wp_player_skins VALUES(?,?,...)` com **15 colunas sem nomear**. Se o
plugin mudar a ordem das colunas numa atualização, isso passa a gravar lixo em
silêncio. **Sempre nomeie as colunas.**

---

## 7. Bugs do site antigo que foram corrigidos aqui

Todos existiam no PHP e falhavam calados.

1. **Login falsificável.** O `authorize.php` pegava o SteamID cru de
   `openid_claimed_id`, sem verificar assinatura — qualquer um entrava como
   qualquer jogador. A versão Next reusa `api/auth/steam/return`, que faz
   `check_authentication` server-to-server.
2. **Nenhum agente para escolher.** O `agents_pt-BR.json` do upstream é um stub
   com 2 entradas contra 65 do `agents_en.json`, e o gerador usava pt-BR sempre.
   O script novo cai para o inglês quando o traduzido vem menor.
3. **Adesivos com escala 0.** A colocação customizada nunca foi implementada, e a
   serialização caía toda no `|| 0` — inclusive a escala. O plugin aplica o valor
   literal, então o adesivo ficava invisível. Hoje o padrão é 1, e a leitura
   converte as linhas antigas.
4. **CT sem luva padrão.** O `config-gen.php` montava o objeto `$ctGlove` e nunca
   o inseria no array. Código morto; só o TR tinha a opção de voltar ao padrão.
5. **Faca padrão sumindo.** A entrada `weapon_knife_default` não existe no
   upstream — era fabricada pelo gerador. O script novo reproduz isso.
6. **Zero validação na escrita.** O `update.php` mandava o POST direto para o
   banco. Hoje todo id é conferido contra o catálogo antes de virar INSERT.

---

## 8. Limitações conhecidas

- **Adesivos não aparecem no preview 3D.** A projeção dependia de
  `ProjectedMaterial` e de uma colocação customizada que nunca existiu nem no
  upstream. Eles são escolhidos e salvos normalmente.
- **Pinos (`wp_player_pins`) não têm tela.** O site antigo também não tinha.
- **Nomes de agentes em inglês** — o catálogo traduzido não os tem.
- **Modelos 3D pesam 1 a 5 MB** e vêm do GitHub do LielXD. Por isso o 3D é
  carregado sob demanda, num botão.

---

## 9. Arquivos

```
src/app/skins/                 páginas e server actions
src/app/api/skins/catalogo/    busca de adesivos e chaveiros
src/components/skins/          UI (grade, formulário, viewer 3D, avisos)
src/lib/skins/
  catalog.js                   catálogo — IMPORTA OS JSON, só servidor
  times.js, desgaste.js        constantes sem JSON, seguras no cliente
  adesivos.js                  strings posicionais de adesivo/chaveiro
  modelo3d.js                  URLs dos modelos e texturas
  loadout.js                   leitura do loadout e resumo
src/data/skins/*.json          catálogo (2,6 MB) — gerado pelo script
scripts/atualizar-catalogo-skins.mjs
```

O site PHP original está arquivado em `D:\steamcmd\webweaponpaints` e **não é
mais usado**. Os backups do que foi alterado nele estão em
`D:\steamcmd\webweaponpaints-backups\`.
