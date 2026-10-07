# Pipeline de stats — como os dados chegam no site

> Documento operacional. Jogamos ~1x por mês, então este arquivo existe para
> reconstruir o contexto rápido. Última revisão: **06/10/2026**.

## Dois servidores, dois bancos

Desde 06/10/2026 o site exibe dois servidores, escolhidos pela chave **LAN | Online**
no topo de cada página:

| | LAN | Online |
|---|---|---|
| URL no site | `/lan/...` | `/online/...` |
| Variável | `DATABASE_URL_LAN` | `DATABASE_URL_ONLINE` |
| Banco | cluster `us-east-1`, database `test` | cluster `sa-east-1`, database `matchzy` |
| Como o MatchZy grava | SQLite local + sync (abaixo) | **direto no TiDB** |
| Partidas incompletas | descartadas pelo sync | filtradas pelo site (`src/lib/partidas.js`) |
| Skins (WeaponPaints) | sim | não tem o plugin |

O resto deste documento descreve a **LAN**. O servidor Online não é nosso: só
temos a config do plugin, e não dá para rodar o sync lá. Ele grava direto no
TiDB, e confiamos que a versão do MatchZy de lá não tem o bug descrito abaixo.
**Sinal de que o bug voltou:** partidas sem stats, `matchid` 0 ou -1, ou demos
com `_-1_` no nome. Se aparecer, a seção [O bug do MatchZy](#o-bug-do-matchzy-diagnóstico-de-310826)
explica a causa.

**Partidas incompletas no Online.** Sem o sync, as partidas sem `end_time` chegam
ao banco. O site só conta partidas **finalizadas** em rankings, totais e perfis.
Na lista, a incompleta aparece como **Ao vivo** se for a última partida do
servidor e tiver começado há menos de 3 h. Qualquer outra é tratada como
abandonada e some da lista. Os `matchid` do Online pulam (2 → 30001): é o TiDB
reservando blocos de IDs, e não indica erro.

**Como o site guarda a escolha.** O servidor faz parte da URL, porque os IDs de
partida colidem entre os bancos e o prefixo mantém o cache ISR separado. A
preferência fica no cookie `bxd_servidor`, gravado pelo navegador a cada página
`/lan` ou `/online` visitada. URLs sem prefixo (`/rankings`, links antigos)
passam pelo `src/middleware.js`, que redireciona para o servidor preferido.
A exceção é `/match/:id` antigo, que vai sempre para a LAN.

## Fluxo atual (LAN)

```
CS2 + MatchZy  --grava-->  matchzy.db  (SQLite, local no servidor)
                                |
                    Sincronizar_stats.bat  (manual, após a noite de jogo)
                                |
                                v
                          TiDB Cloud  (banco `test`)
                                |
                                v
                     BxD-Stats na Vercel  (Prisma, somente leitura)
```

**Por que não é direto.** O MatchZy **não consegue** gravar de forma confiável no
TiDB Cloud Serverless. Ele grava no SQLite local, que é 100% estável, e um
script replica para o TiDB. Ver [O bug do MatchZy](#o-bug-do-matchzy-diagnóstico-de-310826).

### Caminhos no disco

| O quê | Onde |
|---|---|
| Servidor CS2 | `D:\steamcmd\cs2-server` |
| Plugin MatchZy | `...\addons\counterstrikesharp\plugins\MatchZy` |
| Banco local do MatchZy | `...\plugins\MatchZy\matchzy.db` |
| Config do banco | `...\csgo\cfg\MatchZy\database.json` |
| Demos | `...\csgo\MatchZy_demo\` |
| Este site | `D:\steamcmd\BxD-Stats` |
| Sobe o servidor | `D:\Iniciar_servidor.bat` |
| Sincroniza os stats | `D:\Sincronizar_stats.bat` |

## Rotina depois de uma noite de jogo

1. Rode **`D:\Sincronizar_stats.bat`** (ou, dentro de `BxD-Stats`,
   `node --env-file=.env.local prisma/sync-sqlite-to-tidb.mjs`).
2. Confira o `/lan/matches`. Se o `.env.local` tiver `SITE_URL` e
   `REVALIDATE_SECRET`, o sync renova o cache do site e as partidas aparecem na
   hora. Sem elas, aparecem em até 24 h. Ver [cache.md](cache.md).

O sync é **idempotente**: identifica a partida por
`start_time + team1_name + team2_name`, então rodar de novo não duplica nada.
Para ver o que ele faria sem gravar: `DRY_RUN=1 node --env-file=.env.local prisma/sync-sqlite-to-tidb.mjs`.

Ele **ignora partidas incompletas** (mapa sem `end_time`, ex.: partida
abortada). São exatamente essas que apareceriam no site como "Empate 0x0".

Não é preciso fazer deploy: o site lê o TiDB direto, então o dado vale em
produção assim que o sync roda.

## O bug do MatchZy (diagnóstico de 31/08/26)

**Sintoma.** Partidas do dia 29/08 apareciam no `/matches` como **Empate 0x0** e
sem nenhum stat individual.

**Estado no banco.** 6 linhas em `matchzy_stats_matches` com `end_time` nulo,
`winner` vazio e placar 0; **zero** linhas em `matchzy_stats_maps` e
`matchzy_stats_players`. Outras 2 partidas não geraram nem linha. O site não
tinha bug nenhum — estava exibindo fielmente o que havia no banco.

**Pista.** Demos e backups de round saíram nomeados com match ID **-1**
(`matchzy_-1_0_round01.txt`, `2026-08-29_13-53-18_-1_de_anubis_...dem`).

**Causa raiz — medida, não suposta.** O TiDB Serverless derruba conexão ociosa
entre 2 e 5 minutos:

```
[2min]  VIVA        [10min] ECONNRESET
[5min]  ECONNRESET  [15min] ECONNRESET
```

O MatchZy abre **uma única** conexão no load do plugin
(`DatabaseStats.cs::ConnectDatabase`) e nunca reconecta. Como as partidas
acontecem com ~1h de intervalo, ela está sempre morta na hora de gravar:

1. a primeira chamada depois da morte lança exceção → a partida não gera nem
   linha em `matchzy_stats_matches`;
2. o objeto `connection` fica `Closed`, e a partir daí o Dapper abre/fecha a
   conexão **a cada statement**;
3. `InitMatch` faz `INSERT matches` e depois `SELECT LAST_INSERT_ID()` em
   statements separados → sessões diferentes → retorna **0**;
4. `INSERT matchzy_stats_maps` com matchid 0 bate na foreign key (erro 1452) →
   cai no `catch`, que faz `return liveMatchId` = **-1**;
5. dali em diante mapa, stats individuais, `SetMapEndData` e o nome da
   demo/backup usam -1 e tudo se perde.

O bug está no upstream (release **0.8.15**, commit `3b7a583` — a mais recente),
então atualizar o plugin não resolve.

**Por que "antes funcionava".** Até julho existia uma linha com `matchid = 0` no
banco, então a foreign key passava e as partidas todas colapsavam em matchid 0
(o problema de 18/07). Depois que as tabelas foram recriadas limpas, a FK passou
a rejeitar — em vez de dado bagunçado, passou a não entrar dado nenhum.

**Correção adotada.** `cfg/MatchZy/database.json` voltou para
`"DatabaseType": "SQLite"` (backup em `database.json.bak-mysql`). No SQLite a
conexão é um arquivo local, fica aberta e o `last_insert_rowid()` funciona — o
próprio `matchzy.db` tinha 11 partidas de junho completas provando isso.

**Alternativas descartadas:** recompilar um fork do MatchZy (exigiria .NET SDK e
manutenção do fork a cada update) e usar `matchzy_loadmatch_url` com matchid
explícito (exigiria um comando antes de cada partida).

## Recuperar partidas perdidas a partir das demos

Só é necessário para partidas antigas que se perderam. Do fluxo atual em diante,
o SQLite já garante o dado.

```bash
# 1) extrai os stats finais das demos de um dia
npm install --no-save @laihoe/demoparser2
node prisma/parse-demos.mjs "D:/steamcmd/cs2-server/game/csgo/MatchZy_demo" \
     prisma/parsed-demos-AAAA-MM-DD.json AAAA-MM-DD

# 2) confira o plano antes de gravar
DRY_RUN=1 node --env-file=.env.local prisma/rebuild-day.mjs prisma/parsed-demos-AAAA-MM-DD.json

# 3) grava
node --env-file=.env.local prisma/rebuild-day.mjs prisma/parsed-demos-AAAA-MM-DD.json
```

O `rebuild-day.mjs` é **aditivo**: dá `UPDATE` nas linhas vazias que o MatchZy
chegou a criar (mantendo o matchid) e `INSERT` nas que faltam. Ele **nunca** faz
`deleteMany({})` — o `prisma/rebuild-from-demos.mjs` antigo fazia, e apagaria
todo o histórico.

**Limitação:** a demo não carrega todas as colunas. Ficam zeradas precisão
(`shots_fired/on_target`), entries, clutches (`v1/v2`), flashes
(`flash_count/successes`), economia e `live_time`. Ou seja, os rankings de
Precisão, Entry e Clutch não incluem partidas recuperadas por esse caminho.

## Regras e armadilhas

**O Prisma é somente leitura.** Quem cria e gerencia as tabelas
`matchzy_stats_*` é o plugin MatchZy. **Nunca** rode `prisma migrate` ou
`prisma db push` contra o banco — foi isso que quebrou o `AUTO_INCREMENT` em
18/07 e derrubou a noite inteira de stats. Para sincronizar mudanças de schema
use `prisma db pull` + `prisma generate`.

**Fuso horário.** As datas são gravadas em **UTC** (`NOW()` no MySQL,
`datetime('now')` no SQLite). Formatar sem fixar o fuso faz o resultado mudar
conforme a máquina: uma partida das 21:06 BRT fica gravada como 00:06 UTC do dia
seguinte e aparecia com a data errada na Vercel (que roda em UTC). Todo o site
formata por `src/lib/date.js`, sempre em `America/Sao_Paulo`. Não use
`toLocaleDateString` direto.

**matchid não é cronológico.** As partidas recuperadas receberam ids fora de
ordem (junho ficou com 19–28, acima de julho 7–16). Sempre ordene listagens por
`start_time`, nunca por `matchid`.

**`maps.winner` é VARCHAR(16)** no schema do MatchZy (`matches.winner` é
VARCHAR(255)). Nomes de time longos precisam ser truncados ao gravar.

**`mapname` pode vir em maiúsculo.** O MatchZy gravou `DE_NUKE` em uma partida,
o que criaria um mapa duplicado em `/maps`. O sync normaliza para minúsculo.

**O SQL Editor do TiDB Cloud pode estar em modo read-only** e "engolir" DDL:
`DROP TABLE` retorna OK mas não aplica nada. Para manutenção real use conexão
direta (`node --env-file=.env.local prisma/db-admin.mjs`).

**Log do servidor.** O `D:\Iniciar_servidor.bat` sobe o CS2 com `-condebug`,
então os erros do MatchZy (`[InsertMatchData - FATAL] ...`) ficam em
`csgo/console.log`. Antes disso o console não era gravado em lugar nenhum e o
erro era invisível.

## Diagnóstico rápido

Se depois de uma noite os stats parecerem errados, nesta ordem:

1. **Nome das demos** em `MatchZy_demo/`. Se tiver `_-1_` no lugar do match ID,
   o MatchZy não conseguiu o matchid e não gravou mapa nem stats.
2. **`csgo/console.log`** — procure por `[InsertMatchData - FATAL]` ou
   `[InitializeDatabase - FATAL]`.
3. **`matchzy.db`** — as partidas estão lá? Se sim, é só rodar o sync.
4. **TiDB** — partidas com `winner = ''` ou sem linha em `matchzy_stats_maps`
   são partidas quebradas.

## Scripts em `prisma/`

| Script | Para quê |
|---|---|
| `sync-sqlite-to-tidb.mjs` | **Rotina normal.** Replica o `matchzy.db` para o TiDB. |
| `parse-demos.mjs` | Extrai stats finais de um lote de demos para JSON. |
| `rebuild-day.mjs` | Reconstrói um dia no TiDB a partir do JSON das demos (aditivo). |
| `db-admin.mjs` | Manutenção direta no TiDB, contornando o SQL Editor read-only. |
| `verify.mjs`, `diagnose*.sql` | Conferências pontuais. |
| `rebuild-from-demos.mjs` | **Histórico — não use.** Faz `deleteMany({})` em tudo. Substituído por `rebuild-day.mjs`. |
| `reset-tables.sql` | **Destrutivo.** Dropa as tabelas do MatchZy. |
