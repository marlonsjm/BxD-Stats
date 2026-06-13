# Contexto do Projeto BxD Stats

Este documento registra o contexto e o progresso do projeto BxD Stats conforme desenvolvido com a assistência do Gemini CLI.

## Objetivos Principais

- **Publicação:** Fazer o upload do projeto para o GitHub (https://github.com/marlonsjm/web-casa.git).
- **Deploy:** Realizar o deploy da aplicação na Vercel.
- **Banco de Dados:** Utilizar o TiDB (MySQL) como banco de dados principal.
- **Integração Futura:** Confirmar se o plugin MatchZy consegue se conectar diretamente ao TiDB, finalizando a pipeline de dados.

## Stack Tecnológica

- **Framework:** Next.js
- **Estilização:** Tailwind CSS
- **UI:** shadcn/ui
- **Banco:** TiDB (compatível com MySQL) via TiDBCloud
- **ORM:** Prisma
- **Hospedagem:** Vercel
- **Controle de versão:** GitHub

---

## Resumo das Alterações Recentes

Nesta sessão de desenvolvimento, realizamos uma reestruturação completa do design e da funcionalidade do site, além de corrigir diversos bugs.

### 1. Novo Design System (Inspirado em HLTV)

- **Tema Escuro:** O site inteiro foi migrado para um tema escuro (`dark mode`) consistente, com fundo `bg-gray-900` e elementos em `bg-gray-800`.
- **Tabelas Padronizadas:** Todas as tabelas de estatísticas (ranking, histórico de partidas, etc.) foram redesenhadas para um estilo limpo e denso, similar ao da HLTV.
- **Componentes:** O `Navbar` e o `Footer` foram completamente redesenhados para se alinharem ao novo design, incluindo responsividade e indicadores de página ativa.

### 2. Correções de Erros e Otimizações

- **Conexão com Banco:** Corrigido erro de inicialização do Prisma que ocorria quando o banco de dados estava hibernando.
- **Erros de Client-Side:** Resolvidos múltiplos erros (`PrismaClient is unable to run in this browser environment`) ao mover as chamadas de banco de dados de componentes de cliente para funções de servidor (`async function`).
- **Chaves Duplicadas no React:** Corrigidos avisos de chaves duplicadas em listas, garantindo que cada elemento renderizado tenha uma `key` única.
- **Lógica de Agregação:** Otimizada a forma como os dados de ranking são agregados, trocando a agregação manual em JavaScript por chamadas `groupBy` e `aggregate` no Prisma sempre que possível.

### 3. Novas Funcionalidades e Páginas

- **Branding:** A marca do site foi alterada de "CS2 STATS" para "BxD STATS" em todos os locais.
- **Página de Histórico de Partidas (`/matches`):** Criada uma nova página dedicada que lista todas as partidas jogadas, com um placar detalhado que mostra tanto os rounds quanto o resultado da MD1 (ex: `13 (1) : 5 (0)`).
- **Página de Galeria (`/gallery`):** Criada uma nova página dedicada para a galeria de mídia. A galeria possui um layout de mosaico (masonry) e um efeito "lightbox" para visualização de imagens e vídeos em tela cheia.
- **Melhorias de UX:**
  - O placar em todas as listas de partidas agora é colorido (verde para vencedor, vermelho para perdedor).
  - A página de detalhes do jogador agora exibe todos os nicks já utilizados por ele, caso haja mais de um.
  - A home foi enriquecida com um card de "Estatísticas Gerais do Servidor".

### 4. Documentação

- O `GEMINI.md` foi atualizado com este resumo.
- O `README.md` foi reescrito para ser um documento profissional de apresentação do projeto no GitHub.

### 5. Melhorias de Navegação e Rankings Específicos

Nesta sessão, o foco foi aprofundar as estatísticas disponíveis e melhorar drasticamente a usabilidade e a navegação em todo o site.

- **Criação de Rankings Específicos:**
  - Implementada uma nova página `/rankings` para exibir classificações detalhadas de jogadores por **Headshot %**, **Clutches Vencidos** e taxa de sucesso de **Entry Frag**.
  - As queries no Prisma foram otimizadas com o uso da cláusula `having` para filtrar corretamente os jogadores que atendem aos critérios mínimos após a agregação dos dados.

- **Melhorias na Home Page:**
  - A página inicial foi enriquecida com uma nova seção "Destaques do Servidor", que exibe o **Top 5** de cada um dos novos rankings específicos, aumentando o engajamento e a visibilidade dos dados.

- **Aprofundamento das Estatísticas do Jogador:**
  - A página de perfil individual (`/player/[steamid64]`) agora exibe cards com o **total de Clutches vencidos** e a **taxa de sucesso de Entry Frag**, fornecendo uma visão mais completa do estilo de jogo de cada um.

- **Implementação de Breadcrumbs:**
  - Foi criado um componente reutilizável `Breadcrumbs` e implementado em **todas as seções do site** (Jogadores, Rankings, Partidas, Mapas, Galeria e suas subpáginas). Isso padronizou a navegação e melhorou a orientação do usuário.

- **Melhorias Gerais de UX:**
  - Os nomes dos jogadores em todas as tabelas de ranking se tornaram **links clicáveis** que levam diretamente para a página de perfil correspondente.
  - Foi corrigido um **bug de navegação** na página de detalhes da partida, onde o link "voltar" apontava para a home em vez do histórico de partidas.

### 6. Otimização de Responsividade (Mobile UX)

- **Tabelas Responsivas:** Foi implementada uma solução global para responsividade de tabelas. Em todo o site, as tabelas de dados (rankings, históricos de partidas, placares) agora se transformam em um layout de "cards" verticais em dispositivos móveis. Isso garante total legibilidade e uma excelente experiência de usuário em telas pequenas, resolvendo um problema clássico de usabilidade.

---

### 7. Galeria Dinâmica com Cloudinary e Melhorias Gerais

Nesta sessão, o foco foi resolver problemas de deploy, integrar um sistema de gerenciamento de mídia para a galeria e refinar a experiência do usuário em várias páginas.

- **Integração com Cloudinary:**
  - A página de galeria foi completamente refeita para buscar imagens e vídeos dinamicamente de uma conta Cloudinary.
  - Isso permite a adição de novas mídias sem a necessidade de realizar um novo deploy, bastando fazer o upload no painel do Cloudinary.
  - O `README.md` foi atualizado para refletir o uso do Cloudinary na stack do projeto.

- **Correções de Deploy e Configuração:**
  - Resolvido um erro de build na Vercel causado pela diretiva `'use client'` mal posicionada.
  - Corrigido um erro de runtime ao configurar o domínio do Cloudinary (`res.cloudinary.com`) no `next.config.js` para permitir o uso do componente `next/image`.
  - Otimizada a gestão de chaves de API, utilizando variáveis de ambiente no Vercel para a integração segura com o Cloudinary.

- **Melhorias na Home Page:**
  - Adicionada uma prévia da galeria na página inicial, exibindo 3 imagens aleatórias do Cloudinary para aumentar o apelo visual.
  - Realizados ajustes textuais e de layout, como a adição do título "Estatísticas Gerais" e a renomeação de seções para "Players em Destaque" e "Top 5 Kills", melhorando a clareza das informações.

- **Refinamentos de UX e Layout:**
  - Corrigido um problema de layout no mobile onde nicks de jogadores muito longos quebravam o design. A classe `break-all` foi aplicada para forçar a quebra de linha.
  - A página de rankings (`/rankings`) foi padronizada com o resto do site, centralizando o título e adicionando um texto descritivo.

- **Lógica de Ranking Aprimorada:**
  - O ranking principal de jogadores (`/players`) foi alterado. A classificação agora é baseada no **KDR** (Kill/Death Ratio) como critério principal, utilizando o número de **assistências** como fator de desempate.

### 8. Refinamento do Ranking e Implementação Global de Tooltips

Nesta sessão, o foco foi refinar a principal métrica de ranking do site e melhorar drasticamente a usabilidade através da adição de explicações claras para todas as estatísticas.

- **Nova Lógica de Ranking (WLR):**
  - O ranking principal de jogadores (`/players`) foi reestruturado para usar a **Razão de Vitórias/Derrotas (Win/Loss Ratio - WLR)** como o principal critério de classificação.
  - O KDR (Kill/Death Ratio) e as Assistências (A) foram mantidos como critérios de desempate, criando uma classificação mais completa que valoriza o impacto do jogador na vitória.

- **Implementação de Tooltips de Métricas:**
  - Foi implementada uma nova funcionalidade de **tooltips (balões de ajuda)** em todo o site para explicar o significado de cada métrica estatística.
  - Para garantir consistência e manutenibilidade, um componente reutilizável `MetricHeader` foi criado para os cabeçalhos de tabelas e um `StatCard` para os cards de estatísticas.
  - A funcionalidade foi aplicada de forma global em todas as páginas de estatísticas, incluindo rankings, históricos e perfis de jogadores/partidas.

- **Correções de Build e CSS:**
  - Resolvido um erro de build (`Module not found`) causado por um comando `shadcn` depreciado.
  - Corrigido um desalinhamento de CSS na tabela de ranking principal após a adição de novas colunas.

### 9. Novo Sistema de Ranking por Pontos (RP) e Correções

Nesta sessão, o foco foi implementar um sistema de ranking mais robusto e corrigir bugs críticos na agregação de dados.

- **Novo Sistema de Ranking (Inspirado na Gamers Club):**
  - Foi desenvolvido e implementado um novo sistema de **Ranking por Pontos (RP)**. A lógica, inspirada em plataformas como a Gamers Club, tem a **vitória/derrota como fator principal**.
  - A pontuação base (+20 para vitória, -15 para derrota) é modulada pelo desempenho individual do jogador na partida (ADR, Kills, Assists, Impacto, etc.).
  - Este novo ranking foi adicionado à página `/rankings` como o ranking principal.

- **Melhorias na Home Page:**
  - A seção "Destaques do Servidor" na página inicial agora exibe o **Top 5 do novo Ranking por Pontos**, com uma breve explicação sobre como o sistema funciona, aumentando a visibilidade da métrica mais importante.

- **Correções de Bugs Críticos:**
  - **Cálculo do ADR:** Foi corrigido um bug crítico na página `/players` onde o **ADR (Dano Médio por Round)** estava sendo calculado incorretamente (dividindo o dano pelo número de mapas em vez do número de rounds), o que inflava os valores.
  - **Agregação de Dados:** Foi corrigido um bug subsequente na lógica de agregação que fazia com que as estatísticas da primeira partida de cada jogador fossem ignoradas, resultando em um ranking desordenado e impreciso.

- **Melhorias de Documentação:**
  - O `GEMINI.md` e o `README.md` foram atualizados para refletir as novas funcionalidades e a lógica de ranking aprimorada.

### 10. Refatoração do Sistema de Ranking para Performance e Novas Features

Nesta sessão, o foco foi a refatoração completa do sistema de Ranking por Pontos (RP) para garantir performance e escalabilidade, além da implementação de novas funcionalidades e melhorias de usabilidade.

- **Refatoração do Ranking por Pontos (RP):**
  - O sistema foi alterado de um cálculo em tempo real para um modelo de **pontos armazenados**. Isso resolve um grande gargalo de performance, garantindo que o site continue rápido mesmo com milhares de partidas.
  - Foi adicionada uma coluna `points` à tabela `PlayerStats` (`matchzy_stats_players`) no banco de dados para armazenar o ganho/perda de RP de cada jogador em cada partida individualmente.
  - A página de ranking (`/rankings`) foi otimizada para fazer uma agregação `SUM` desses pontos, uma operação extremamente rápida no banco de dados.

- **Correção de Dados e Backfilling:**
  - Foi detectado um problema de integridade nos dados que foram importados pelo usuário, onde existiam estatísticas de jogadores "órfãs" (sem um mapa correspondente).
  - Foi criado e executado um script (`prisma/cleanOrphans.js`) para identificar e remover esses dados inconsistentes, garantindo a integridade do banco.
  - Foi criado e executado um segundo script (`prisma/updatePoints.js`) para calcular e preencher retroativamente os pontos de RP corretos para todas as partidas já existentes no banco.

- **Melhorias na Página de Partida:**
  - Adicionada a **posição do jogador no ranking geral** ao placar da partida, fornecendo mais contexto sobre os jogadores.
  - Corrigido o **alinhamento das colunas** na tabela de estatísticas, centralizando os valores para uma aparência mais limpa e profissional.

- **Resolução de Erros:**
  - Solucionados múltiplos erros de `build` e de runtime do Prisma, incluindo problemas de `EPERM` (bloqueio de arquivo no Windows), `PrismaClientValidationError` (cliente dessincronizado com o schema) e `Inconsistent query result` (causado pelos dados órfãos).

### 11. Limpeza de Dados e Configuração de Cache Dinâmico

Nesta sessão, o foco foi resolver problemas de persistência de dados após a limpeza do banco e garantir que o site exiba informações em tempo real.

- **Script de Limpeza do Banco de Dados:**
  - Criado o script `prisma/clean.js` para limpar corretamente todas as tabelas do banco de dados (`PlayerStats`, `Map`, `Match`), respeitando as dependências e evitando registros órfãos.
  - Isso foi necessário pois a exclusão manual de tabelas no banco SQL não acionava a remoção em cascata devido ao `relationMode = "prisma"`.

- **Configuração de Fetching Dinâmico (Real-time):**
  - Identificado que o Next.js estava fazendo cache das páginas estáticas (SSG), o que causava delay na atualização dos dados no site de produção.
  - Implementada a configuração `export const dynamic = 'force-dynamic'` nas principais páginas do site:
    - Home (`/`)
    - Histórico de Partidas (`/matches`)
    - Rankings (`/rankings`)
    - Jogadores (`/players`)
    - Mapas (`/maps`)
  - Essa mudança garante que o site busque dados frescos do banco de dados a cada requisição, eliminando qualquer atraso na exibição dos resultados das partidas, ideal para o volume de tráfego esperado.

### 12. Integração Externa (Skins MIX)

- **Novo Botão de Navegação:**
  - Adicionado um botão de destaque "Skins MIX" na barra de navegação (Navbar), tanto na versão Desktop quanto Mobile.
  - O botão possui um estilo diferenciado (gradiente roxo/rosa) para chamar a atenção e redireciona para uma URL externa (`https://powderblue-parrot-119938.hostingersite.com/`).

---

### 13. Correção Crítica na Rota `/players` e Migração do Projeto (Claude Code)

Nesta sessão, o foco foi diagnosticar e corrigir a rota `/players` que estava quebrando, e documentar o processo correto de setup local.

- **Diagnóstico e Correção da Rota `/players`:**
  - **Bug 1 — Prisma client não gerado:** O erro `@prisma/client did not initialize yet. Please run "prisma generate"` ocorria porque o cliente do Prisma não é gerado automaticamente após um `git clone`. O passo `npx prisma generate` é obrigatório no setup inicial e foi adicionado ao fluxo documentado.
  - **Bug 2 — Instância duplicada do PrismaClient:** A `players/page.js` criava `new PrismaClient()` diretamente no módulo em vez de usar o singleton compartilhado de `@/lib/prisma`. Isso causa conflito de conexões e falha no module loader do Next.js. Corrigido substituindo pela importação `import prisma from '@/lib/prisma'`.
  - **Bug 3 — Registros órfãos no banco quebrando o `include`:** A query usava `include: { map }` em uma relação obrigatória, mas existem registros em `PlayerStats` sem um `Map` correspondente no banco (órfãos). O Prisma lança `PrismaClientUnknownRequestError: Inconsistent query result: Field map is required to return data, got null instead`. Corrigido separando a query em dois `findMany` paralelos (`playerStats` e `map`) e fazendo o join manualmente via objeto de lookup (`mapLookup`). Essa abordagem tolera órfãos sem quebrar a página.
  - **Bug 4 — `steamid64` como `BigInt`:** O campo `steamid64` retornado pelo Prisma é um `BigInt`, que pode causar erros de serialização no React Server Components. Corrigido adicionando `.toString()` ao criar o objeto do jogador no agregador.

- **Problema de Ambiente — Projeto no OneDrive:**
  - O erro `EPERM: operation not permitted, rename ... query_engine-windows.dll.node` ocorre porque o projeto está dentro da pasta do OneDrive. O OneDrive trava arquivos binários durante a sincronização, impedindo que o `prisma generate` sobrescreva o query engine.
  - **Solução paliativa:** Pausar a sincronização do OneDrive antes de rodar `npx prisma generate`.
  - **Solução definitiva:** Mover o projeto para fora do OneDrive (ex: `C:\Projects\BxD-Stats`). O versionamento via `git push` ao GitHub já garante o backup do código, tornando o OneDrive desnecessário para esse fim.

- **Setup Local Correto (ordem dos comandos):**
  ```bash
  git clone https://github.com/marlonsjm/BxD-Stats.git
  cd BxD-Stats
  npm install
  npx prisma generate   # ← obrigatório, não pular
  npm run dev
  ```

---

### 14. Novos Stats, Correções de Bugs e Compatibilidade com Next.js 15 (Claude Code)

Nesta sessão, o foco foi auditar o projeto completo, corrigir bugs críticos que persistiam no código e adicionar novas estatísticas inspiradas no HLTV.

#### Bugs Corrigidos

- **Bug 1 — `new PrismaClient()` nas rotas de detalhe:** As páginas `player/[steamid64]/page.js` e `match/[match_id]/page.js` ainda criavam `new PrismaClient()` diretamente, ignorando o singleton de `@/lib/prisma`. Causava conflito de conexões em produção. Corrigido substituindo pela importação do singleton em ambos os arquivos.

- **Bug 2 — `params` não awaited (Next.js 15):** No Next.js 15, o objeto `params` das rotas dinâmicas é uma `Promise` e deve ser aguardado com `await` antes de acessar suas propriedades. O acesso direto (`params.steamid64`, `params.match_id`, `params.mapname`) lança um erro de runtime. Corrigido com `const { steamid64 } = await params` nas três rotas dinâmicas: `/player/[steamid64]`, `/match/[match_id]` e `/map/[mapname]`.

- **Bug 3 — Órfãos em `PlayerStats` sem `Map` quebrando o perfil do jogador:** A função `getPlayerMatchHistory` usava `include: { map: { include: { match: true } } }`, que lança `Inconsistent query result: Field map is required to return data, got null instead` quando existem registros em `PlayerStats` sem um `Map` correspondente. Corrigido com a mesma estratégia de três queries separados: `playerStats.findMany` sem includes, `map.findMany` e `match.findMany` com lookup manual, filtrando silenciosamente os órfãos.

- **Bug 4 — Key incorreta no histórico de partidas do jogador:** A tabela de histórico usava `stat.mapid` como chave React, mas esse campo não existe em `PlayerStats`. Corrigido para `${stat.matchid}-${stat.mapnumber}`.

#### Novos Stats no Perfil do Jogador (`/player/[steamid]`)

- **ADR (Dano Médio por Round):** Adicionado ao card de estatísticas gerais. Calculado corretamente dividindo o dano total pelo total de rounds jogados (somando `team1_score + team2_score` de cada mapa). A query foi estendida com `damage` no aggregate e uma query adicional para buscar os `Map` do jogador e calcular `totalRounds`.

- **Accuracy (Precisão):** Novo stat calculado como `shots_on_target_total / shots_fired_total * 100`. Exibido no card de estatísticas gerais.

- **Seção Multi-Kills:** Nova seção dedicada no perfil com cards coloridos para **3K** (amarelo), **4K** (laranja) e **ACE/5K** (vermelho), usando os campos `enemy3ks`, `enemy4ks` e `enemy5ks` já disponíveis no banco.

- **Histórico de Partidas aprimorado:** Adicionadas as colunas **Assists** e **ADR por mapa** à tabela de histórico individual, com ADR calculado por `stat.damage / (map.team1_score + map.team2_score)`.

#### Novo Ranking (`/rankings`)

- **Top Multi-Kills:** Nova função `getMultiKillRankings()` adicionada a `src/lib/rankings.js`, agregando `enemy3ks + enemy4ks + enemy5ks` por jogador. Na página `/rankings`, exibida como tabela customizada `MultiKillTable` com colunas separadas para **Total**, **3K**, **4K** e **ACE**, posicionada logo abaixo do ranking geral por pontos.

---

### 15. Auditorias de UX (Mobile + Desktop), Performance, Rating 2.0, Avatares Steam e Remoção do RP (Claude Code — 12/06/2026)

Sessão extensa de auditoria e melhorias incrementais, **preservando a arquitetura atual** (sem trocar bibliotecas nem reescrever do zero). Todas as alterações foram validadas com `npm run build` + `next start` contra o banco real, testando todas as rotas.

#### Decisão de produto: feature de upload de demos descartada
- Avaliamos uma feature de upload automático de demos (GOTV/MatchZy → endpoint HTTP). Demos de CS2 chegam a **500MB**, inviabilizando soluções gratuitas sem cartão de crédito (Cloudflare Workers free limita corpo a 100MB; R2 e similares pedem cartão).
- Como o servidor de CS2 roda no **PC local do Marlon** (ligado só durante as partidas), a feature foi **descartada**. As demos são compartilhadas manualmente via Google Drive/WhatsApp. Não repropor armazenamento de demos em nuvem.

#### Auditoria de UX Mobile
- **Fundação:** `tailwind.config.js` com padding de container responsivo (1rem mobile → 2rem desktop) e fonte `orbitron` registrada. `layout.js` com skip link ("Pular para o conteúdo"), `themeColor`, template de `<title>` e `<main>` único (removido `<main>` aninhado e padding triplicado em todas as páginas).
- **Tabelas responsivas (`globals.css`):** reescritas de `pl-24` absoluto para **flexbox** (`data-label` de qualquer tamanho sem sobreposição); breakpoint corrigido de `768px` para `767.98px` (evita conflito com `md:` exatamente em 768px).
- **Navbar:** o menu mobile (Sheet) agora **fecha ao navegar** (`SheetClose`), tem `SheetTitle` (exigência de a11y do Radix), `aria-label`, touch targets de 44px, CTA "Skins MIX" no menu mobile e `aria-current` no link ativo.
- **Componentes:** `Footer` com `flex-wrap` e contraste AA; `Breadcrumbs` como `<ol>` semântico com wrap; `TopRankings`/`PlayerCard` com `truncate` em vez de `break-all`.
- **Home:** CTAs no hero ("Ver Partidas"/"Ver Rankings"), `sizes` nas imagens.
- **Galeria:** refatorada para **SSR** (fetch movido do `useEffect` client para server component) + novo `GalleryGrid` client com lightbox acessível (fecha com Escape, trava scroll do body, `role="dialog"`, botão 44px).
- **`loading.js` global:** spinner nas trocas de rota.

#### Performance: troca de `force-dynamic` por ISR
- **Todas as páginas** trocaram `export const dynamic = 'force-dynamic'` por `export const revalidate = 300` (cache de 5 minutos).
- Rotas dinâmicas (`/match/[id]`, `/player/[id]`, `/map/[nome]`) receberam também `generateStaticParams()` retornando `[]` — **necessário** para o ISR funcionar por caminho (sem isso, o Next renderiza a cada visita e ignora o `revalidate`).
- **Ganho medido:** páginas em cache HIT respondem em ~15-40ms (zero queries) vs ~1-2,6s antes. Crucial porque o **TiDB free é compartilhado e hiberna** — menos queries = banco pode hibernar sem afetar visitantes (ISR serve a versão cacheada).
- **Trade-off:** estatísticas de partida recém-terminada levam até 5 min para aparecer. Ajustável mudando o número `300` (segundos) nos arquivos.

#### Auditoria de UX Desktop (foco em tabelas competitivas)
- **Tabelas (`stats-table` em `globals.css`):** separadores de linha + hover no desktop (antes as linhas não tinham divisão visual).
- **Alinhamento numérico:** todos os números à direita com `tabular-nums` (dígitos alinhados verticalmente para comparação); decimais padronizados (ADR=1 casa, KDR=2, percentuais=1 — antes havia "48.57%" vs "48.5%").
- **Destaque do top 3:** cores ouro/prata/bronze no rank em todas as tabelas.
- **`/players` — tabela ordenável (`PlayersTable.js`, client component):** ordenação por qualquer coluna (com `aria-sort` e indicador visual), **busca por nome**, cabeçalho **sticky** ao rolar, coluna ordenada destacada.
- **`/match/[id]`:** ⭐ destaque da partida (MVP), 🏆 + verde no time vencedor dentro da tabela, jogadores ordenados por rating.
- **`/matches`:** séries MD3 agora listam **todos os mapas** (antes só o primeiro — informação incorreta).
- **`/rankings`:** as 5 tabelas de 3 colunas agora em **grid de 2 colunas** no desktop (antes: valor a ~1200px do nome em telas largas); navegação por chips com âncoras.
- **Navegação:** link ativo no Navbar com sublinhado ciano; `Footer` com rótulos consistentes ("Jogadores"/"Rankings") + link de Rankings que faltava.
- **SEO:** `metadata.title` por página (estático nas listagens, dinâmico via `generateMetadata` nos detalhes — ex.: "LUCAS77 - Estatísticas"). Usa React `cache()` para deduplicar a query entre `generateMetadata` e a página.
- **Estados:** `TableSkeleton.js` + `loading.js` por rota de dados (skeleton no formato da tabela, não spinner genérico); nota "dados atualizados a cada 5 minutos".

#### Nova feature: Rating 2.0 aproximado (`src/lib/rating.js`)
- Aproximação da fórmula pública do Rating 2.0 da HLTV usando KPR, DPR, assists/round, impacto e ADR.
- **Limitação documentada:** o MatchZy não registra **KAST**, então usamos um valor fixo de 68%. Isso desloca todos os ratings pela mesma constante, **preservando a comparação entre jogadores**. O tooltip do site (e o "*" em "Rating 2.0*") explicam isso ao usuário.
- Exibido em: tabela `/players` (coluna ordenável), perfil (badge grande, verde se ≥1.00), e `/match/[id]` (coluna + define o MVP).

#### Nova feature: Avatares Steam (`src/lib/steam.js`, `PlayerAvatar.js`)
- Busca em lote via `GetPlayerSummaries` (até 100 ids/chamada), **cache de 24h**, requer env var **`STEAM_API_KEY`** (gratuita em https://steamcommunity.com/dev/apikey).
- **Fallback gracioso:** sem a key, perfil privado ou erro na API → círculo com a inicial do nick. O site funciona normalmente sem a key.
- `next.config.mjs` liberou os 3 CDNs de avatar da Steam (`avatars.steamstatic.com`, `akamai`, `fastly`).
- **Pendência para o Marlon:** gerar a `STEAM_API_KEY` e adicionar no `.env.local` e no painel da Vercel (sem ela, as iniciais são exibidas).
- Exibido em: tabela `/players` (28px), perfil (80px com borda), `/match/[id]` (28px) e Top 5 da home (36px).

#### Remoção do sistema antigo de Ranking Points (RP)
- O RP (seção #9-10 acima) foi **removido por completo** do código por ter sido substituído pelo Rating 2.0:
  - `src/app/match/[match_id]/page.js`: coluna "RP" removida (era o último lugar que a exibia).
  - `prisma/seed.js`: função `calculateRp()` e campo `points` removidos do seed.
  - `README.md`: bullet "Ranking por Pontos (RP)" trocado pela descrição do Rating 2.0.
- **Mantido de propósito:** a coluna `points` no `schema.prisma` (com comentário marcando-a como legado). Removê-la exigiria `prisma db push` destrutivo que dropa a coluna no banco. A aplicação não depende mais dela. Para limpar de vez: apagar o campo do schema e rodar `npx prisma db push`.

#### Tratamento de erro do banco (TiDB hibernando)
- O erro `Can't reach database server at gateway01...tidbcloud.com:4000` é o **TiDB serverless hibernando** após inatividade (não era bug de código). A primeira conexão acorda o cluster e pode falhar.
- Criado **`src/app/error.js`** (error boundary): mensagem amigável ("O banco pode estar acordando...") com botão "Tentar novamente" que re-renderiza.
- **Bug corrigido no caminho:** `generateMetadata` em `/match/[id]` e `/player/[id]` consulta o banco, e erros ali **não passam pelo error boundary** (geram 500 seco sem o shell). Adicionado try/catch com título de fallback em ambos.

#### Refinamento final: espaçamento das tabelas
- Após alinhar números à direita, a última coluna ficava colada na borda do card (só 12px). Adicionado `md:pr-6` (24px) na última coluna de todas as tabelas que encostam na borda: `/match/[id]` (Rating), `/players` (Mapas), `/matches` (Data), perfil (HS%), `/map/[nome]` (+/- e Data). No mobile não muda (vira card com padding próprio).

#### Arquivos novos desta sessão
`src/app/error.js`, `src/app/loading.js`, `src/app/{matches,players,rankings}/loading.js`, `src/components/{GalleryGrid,PlayerAvatar,PlayersTable,TableSkeleton}.js`, `src/lib/{rating,steam}.js`.