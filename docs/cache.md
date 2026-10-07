# Cache de stats: como o site poupa o TiDB

> Última revisão: **06/10/2026**. Leia antes de mexer em qualquer consulta das
> páginas de stats.

## Por que existe

Os dois bancos (LAN e Online) estão no **plano gratuito do TiDB Cloud
Serverless**, que cobra por *Request Units*: cada consulta consome cota, e as
mais caras são as varreduras completas. O servidor Online, além disso, grava
direto no banco durante as partidas.

Antes deste cache, **cada render** de página consultava o banco:

| Página | Consultas por render |
|---|---|
| Home | 13–14 |
| Rankings | 13 |
| Jogador | 7 |
| Partida | 6 |
| Mapa | 5 |
| Jogadores, Partidas | 3 |

Como cada `/player/:id`, `/match/:id` e `/map/:nome` tem seu próprio cache ISR,
cada jogador, partida ou mapa visitado repetia essas consultas a cada 5 minutos.

## Como funciona

```
TiDB ──3 consultas──> retrato do servidor ──Data Cache do Next──> todas as páginas
       (partidas,      (src/lib/stats.js)    (tag stats:<servidor>)   (cálculo em
        mapas, linhas)                                                 memória)
```

- **`src/lib/stats.js`** é a única porta das páginas de stats para o banco.
  `getStats(servidor)` devolve partidas, mapas e linhas de jogador. Rankings,
  perfis, listas e totais são calculados em memória a partir dele.
- **Validade** (`cacheSegundos` em `src/lib/servidores.js`):
  - **LAN: 24 h.** Ela só muda quando o sync roda, e o sync renova o cache na hora.
  - **Online: 10 min.** O servidor grava direto e não avisa o site, então o
    cache expira sozinho. Uma partida que termina aparece em até ~15 min
    (cache de dados + ISR de 5 min da página).
- **Custo:** no máximo **3 consultas por servidor a cada janela de validade**,
  e só se alguém visitar o site. Sem visita, não há consulta nenhuma.

Medido em 06/10/2026, com o build de produção local e `LOG_QUERIES=1`:
- o build inteiro fez 9 consultas;
- navegar por 21 páginas dos dois servidores, incluindo jogadores, partidas e
  mapas nunca abertos, fez **0**;
- depois de uma renovação, a primeira visita fez 3 e as seguintes, 0.

## Renovar na hora

```bash
curl -X POST "https://SITE/api/revalidar?servidor=online" \
  -H "Authorization: Bearer $REVALIDATE_SECRET"
```

O parâmetro `servidor` aceita `lan`, `online` ou `todos`. O endpoint não
consulta o banco: só marca o retrato como velho, e a próxima visita recarrega.

O **sync da LAN** (`prisma/sync-sqlite-to-tidb.mjs`) chama o endpoint sozinho
quando insere partidas. Para isso, o `.env.local` precisa de:

| Variável | Onde |
|---|---|
| `REVALIDATE_SECRET` | `.env.local` **e** Vercel, com o mesmo valor |
| `SITE_URL` | só no `.env.local`: `https://bxd.servegame.com` (domínio de produção; também `web-casa.vercel.app`) |

Sem as duas, o sync avisa no terminal, e as partidas novas aparecem quando o
cache expirar, em até 24 h.

## Medir o custo de uma página

```bash
LOG_QUERIES=1 npm run build
LOG_QUERIES=1 npx next start
```

Cada consulta aparece no terminal como `[db:lan] 12ms SELECT ...`, e cada recarga
do retrato como `[stats:lan] retrato carregado do banco: ...`.

## Regras ao mexer no código

- **Página de stats não importa `getDb`.** Ela importa `getStats`. Um
  `getDb(servidor).playerStats...` dentro de uma página volta a consultar o
  banco a cada render, que é exatamente o que este cache evita.
- **Coluna nova no site** entra em `COLUNAS` em `lib/stats.js`. O retrato só
  carrega as colunas listadas ali.
- **Datas chegam como string ISO** e `steamid64` como string, porque o cache
  serializa em JSON. Para comparar datas, use `new Date(...)`.
- **As skins (`/skins`) não usam este cache.** Elas leem e gravam o loadout do
  jogador logado, por isso consultam o banco por requisição, e só o da LAN.
  `/api/me` não toca no banco: lê só o cookie de sessão.

## Limite de tamanho

O Data Cache da Vercel não guarda item acima de **2 MB**. Se o retrato passar
disso, ele simplesmente não é guardado, e cada render volta a consultar o banco
**em silêncio**. Por isso as linhas vão compactadas, como arrays sem o nome das
colunas: em 06/10/2026, a LAN (28 partidas) ocupava 29 KB, ou ~1 KB por
partida, o que dá margem para quase 2.000 partidas por servidor.

O log avisa quando o retrato passa de 1,5 MB (`PERTO DO LIMITE DE 2 MB`). Se isso
acontecer, o próximo passo é guardar **agregados** por jogador no lugar das linhas
cruas, ou separar o retrato por período.
