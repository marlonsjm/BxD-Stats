# Changelog

Todas as mudanças relevantes do BxD Stats. O formato segue
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e as entradas são
datadas (o projeto não usa versionamento semântico).

## [2026-10-01]

Migração do site de skins (WeaponPaints) de PHP para dentro do BxD-Stats. A
hospedagem na Hostinger foi perdida e o plugin do CS2 ficou desativado; em vez de
procurar outra hospedagem PHP com MySQL remoto, a área virou rotas `/skins` neste
projeto. Runbook em [`docs/skins.md`](docs/skins.md); o histórico das decisões,
incluindo as duas hospedagens que não deram certo, em
[`docs/plano-skins-next.md`](docs/plano-skins-next.md).

### Adicionado

- **Área `/skins`**: grade por categoria e lado, escolha de skin, customização
  (desgaste, seed, etiqueta, StatTrak), adesivos e chaveiro, preview 3D sob
  demanda, e loadout dos dois lados com cópia TR↔CT.
- Faixa de resumo no topo de `/skins` com faca, luvas, agente e música — os itens
  que moram em outras categorias e saem do campo de visão ao escolher uma arma.
- `src/app/api/skins/catalogo`: busca de adesivos e chaveiros no servidor. São
  10.461 adesivos (2 MB); o catálogo nunca vai para o navegador.
- `scripts/atualizar-catalogo-skins.mjs`: substitui o `config-gen.php` do site
  antigo. Idempotente, com `DRY_RUN=1` para simular.
- Modelos `PlayerSkin`, `PlayerKnife`, `PlayerGlove`, `PlayerAgent`,
  `PlayerMusic` e `PlayerPin` no `schema.prisma`, via `db pull`.
- `docs/skins.md` (runbook) e `docs/plano-skins-next.md` (histórico).

### Corrigido

Seis bugs herdados do site PHP, todos falhando em silêncio:

- **Login falsificável.** O `authorize.php` aceitava o SteamID cru de
  `openid_claimed_id`, sem verificar assinatura — dava para entrar como qualquer
  jogador. A versão Next reusa o login que já existia em
  `api/auth/steam/return`, com `check_authentication` server-to-server.
- **Nenhum agente para escolher.** O `agents_pt-BR.json` do upstream é um stub
  com 2 entradas contra 65 do `agents_en.json`, e o gerador usava pt-BR sempre.
- **Adesivos invisíveis.** A colocação customizada nunca foi implementada e a
  serialização gravava escala 0; o plugin aplica o valor literal.
- **CT sem luva padrão.** O objeto `$ctGlove` era montado e nunca inserido no
  array — código morto no gerador original.
- **Faca padrão sumindo** do catálogo após atualização: a entrada é sintética,
  fabricada pelo gerador, e precisa ser reproduzida.
- **Zero validação na escrita.** O `update.php` mandava o POST direto ao banco.
  Todo id agora é conferido contra o catálogo antes de virar INSERT.

### Infraestrutura

- Tabelas `wp_player_*` movidas para o database `test`, junto das
  `matchzy_stats_*` — um Prisma client atende o site inteiro.
- Plugin WeaponPaints reativado e apontado para o TiDB. **Funciona** onde o
  MatchZy falha, porque usa pool de conexão (uma por query) em vez de segurar uma
  conexão para sempre.
- `three` adicionado como dependência, carregado apenas sob demanda: nenhuma rota
  de `/skins` passa de 149 kB de First Load.

## [2026-08-31]

Sessão dedicada a recuperar as partidas de 29/08, que apareciam como
"Empate 0x0", e a corrigir a causa na origem. Detalhes técnicos em
[`docs/pipeline-de-stats.md`](docs/pipeline-de-stats.md).

### Adicionado

- Data da partida no cabeçalho de `/match/[match_id]`, com hora
  (ex.: "06/06/2026 às 21:06"). A página não exibia data nenhuma.
- Coluna **Data** no histórico de partidas de `/player/[steamid64]`.
- `src/lib/date.js`: formatação de datas centralizada e fixada em
  `America/Sao_Paulo`.
- `docs/pipeline-de-stats.md`: runbook de como os stats chegam no site,
  diagnóstico do bug do MatchZy e procedimento de recuperação.
- `prisma/sync-sqlite-to-tidb.mjs`: replica as partidas do SQLite local do
  MatchZy para o TiDB. Idempotente; ignora partidas incompletas.
- `prisma/parse-demos.mjs` e `prisma/rebuild-day.mjs`: extração de stats das
  demos e reconstrução **aditiva** de um dia no banco.
- Este changelog.

### Corrigido

- **Datas apareciam com um dia de diferença em produção.** As datas são
  gravadas em UTC e o site formatava com `toLocaleDateString('pt-BR')` sem fixar
  fuso, então o resultado dependia da máquina: uma partida das 21:06 BRT
  (00:06 UTC do dia seguinte) aparecia no dia errado na Vercel. Afetava
  `/matches` e `/map/[mapname]`.
- **Histórico do jogador fora de ordem cronológica.** Ordenava por
  `matchid: 'desc'`, mas os ids deixaram de ser cronológicos depois da
  recuperação (junho recebeu 19–28, acima de julho 7–16). Passou a ordenar por
  `start_time`.
- **8 partidas de 29/08 recuperadas** a partir das demos: 6 linhas vazias
  preenchidas (mantendo o matchid) e 2 partidas que não existiam inseridas.
- **README**: o passo 4 mandava rodar `npx prisma db push`, que reescreveria o
  schema pertencente ao MatchZy — foi exatamente isso que derrubou os stats de
  18/07.

### Alterado

- O MatchZy voltou a gravar em **SQLite local** em vez de escrever direto no
  TiDB, e um sync manual replica os dados. Motivo: o TiDB Serverless derruba
  conexão ociosa em menos de 5 minutos e o MatchZy nunca reconecta, o que fazia
  o `matchid` virar `-1` e descartar mapa e stats individuais.
- **10 partidas de 06/06** que só existiam no SQLite local entraram no site
  junto com o primeiro sync.
- `mapname` é normalizado para minúsculo no sync (o MatchZy gravou `DE_NUKE` em
  uma partida, o que duplicaria o mapa em `/maps`).

## [2026-07-23]

### Corrigido

- Removida a coluna `points` e o schema do Prisma foi realinhado ao que o
  MatchZy cria.

## [2026-07-11]

### Adicionado

- Login com Steam e página de perfil do jogador.

## [2026-06-12]

### Adicionado

- Rating 2.0 aproximado, avatares da Steam e ISR.

### Alterado

- Auditorias de UX para mobile e desktop.

## [2026-06-10]

### Adicionado

- Rankings de ADR, precisão e multi-kills.

### Alterado

- Ranking de pontos substituído por ranking de kills.

## [2026-02-14]

### Corrigido

- Vulnerabilidades de React Server Components (CVE).

## [2025-11-19]

### Adicionado

- Botão de link externo para o Skins MIX na navbar.
- Busca dinâmica de dados e script de limpeza do banco.

## [2025-09-10]

### Alterado

- Sistema de ranking por RP refatorado para performance; página de partida
  melhorada.

## [2025-08-29]

### Adicionado

- Ranking por WLR e tooltips nas métricas.

## [2025-08-28]

### Adicionado

- Galeria integrada ao Cloudinary.
- Rankings específicos, breadcrumbs e melhorias de responsividade.
