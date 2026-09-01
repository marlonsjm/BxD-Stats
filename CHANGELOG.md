# Changelog

Todas as mudanças relevantes do BxD Stats. O formato segue
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e as entradas são
datadas (o projeto não usa versionamento semântico).

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
