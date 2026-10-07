# Changelog

Todas as mudanças relevantes do BxD Stats. O formato segue
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e as entradas são
datadas (o projeto não usa versionamento semântico).

## [2026-10-07]

Segundo servidor de stats. O site passa a exibir a LAN e o servidor Online, que
grava em outro banco TiDB. Detalhes em
[`docs/pipeline-de-stats.md`](docs/pipeline-de-stats.md#dois-servidores-dois-bancos).

### Adicionado

- **Chave LAN | Online** na Navbar, visível também no mobile. Ao trocar, o
  usuário continua na página equivalente do outro servidor. Na página de uma
  partida, vai para a lista de partidas, porque os IDs não se correspondem.
- Páginas de stats com o servidor na URL: `/lan/rankings`, `/online/match/12`.
  O cache ISR continua valendo, agora por servidor.
- A preferência é lembrada no cookie `bxd_servidor`. URLs sem prefixo (links
  antigos, `/rankings`) redirecionam para o servidor preferido, e `/match/:id`
  antigo vai sempre para a LAN.
- Selo do servidor na trilha de navegação e no título da aba.
- Selo **Ao vivo** para a partida em andamento.
- Jogador sem partidas em um servidor vê o atalho para o perfil no outro, em vez
  de "não encontrado".
- `/profile` segue o servidor escolhido.
- Faixa fixa em toda a área `/skins` avisando que as skins valem só na LAN,
  com link para o site de skins do servidor Online
  ([inventory.cstrike.app](https://inventory.cstrike.app/)).

- **Cache de stats para poupar o TiDB gratuito** ([`docs/cache.md`](docs/cache.md)).
  O site lê um retrato de cada servidor (3 consultas) e guarda no Data Cache do
  Next: 24 h para a LAN e 10 min para o Online. Todas as páginas de stats são
  calculadas a partir dele. Antes, cada render fazia de 2 a 14 consultas. Agora,
  navegar pelo site inteiro com o cache quente não faz nenhuma.
- `POST /api/revalidar` renova o cache de um servidor na hora, protegido por
  `REVALIDATE_SECRET`. O sync da LAN chama esse endpoint sozinho quando insere
  partidas.
- `LOG_QUERIES=1` imprime cada consulta ao banco, para medir o custo de uma
  página.

### Removido

- O loadout de skins saiu do `/profile`, porque deixava a página longa demais.
  As skins ficam em `/skins`, com o atalho "Minhas Skins" no menu do avatar.

### Alterado

- Rankings, totais, perfis e mapas contam só partidas **finalizadas**. Na LAN
  não muda nada, porque o sync já descartava as incompletas. No Online, o MatchZy
  grava direto no banco, então o filtro passou a ser feito pelo site.
- **`DATABASE_URL` passa a se chamar `DATABASE_URL_LAN`**, simétrica a
  `DATABASE_URL_ONLINE`. Renomeie no `.env.local` e na Vercel. Os scripts de
  `prisma/` continuam usando a LAN.
- O nick exibido nos rankings é o da partida mais recente do jogador. Antes
  era um nick qualquer entre os que ele já usou.

- **Mínimo de amostra dos rankings proporcional ao servidor.** Headshots (50
  abates), Entry (20 tentativas), ADR (5 mapas) e Precisão (500 tiros) passam a
  usar o menor entre o padrão e metade do maior valor do servidor. Na LAN nada
  muda. No Online, com 2 partidas, esses rankings estavam vazios, inclusive os
  tops de Headshots e Entry da Home. A dica de cada ranking mostra o mínimo em
  vigor e avisa quando ele está reduzido.
- Clutches e Multi-kills não listam mais jogadores com 0. Ranking sem dados
  mostra um aviso em vez de um card vazio.

### Corrigido

- **O `Sincronizar_stats.bat` estava quebrado.** O `better-sqlite3`, instalado
  com `--no-save`, tinha sido removido por um `npm install`, e o sync falhava
  com `ERR_MODULE_NOT_FOUND`. O `.bat` (fora do repositório, em `D:\`) agora
  reinstala o pacote quando ele falta.
- O ranking "Dano por Mapa" calculava dano por **round**. Agora o título e a
  descrição dizem ADR.
- Os mínimos dos rankings eram exclusivos (`> 50`), mas a descrição dizia
  "mínimo de 50". Agora são inclusivos. Na LAN, o ranking de ADR ganha 2
  jogadores que tinham exatamente 5 mapas.
- `/player/abc` e `/match/abc` derrubavam a página com erro 500 (`BigInt` e
  `parseInt` inválidos). Agora mostram o estado de "não encontrado".

## [2026-10-02]

### Adicionado

- Loadout completo no topo do `/profile`, e atalho "Minhas Skins" no menu do
  avatar (desktop e mobile).
- `scripts/limpar-skins-orfas.mjs`: remove skins de arma exclusiva gravadas no
  lado errado.

### Corrigido

- **A cópia TR↔CT levava armas exclusivas do outro lado** — a AK ia parar no CT,
  a M4 no TR. Essas linhas nunca são aplicadas: arma pega do chão preserva a
  skin do dono original. Agora a cópia filtra, e as linhas antigas ficam num
  grupo à parte no loadout, sem link e fora da contagem.

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
