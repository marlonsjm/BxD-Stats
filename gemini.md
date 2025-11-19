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

### 12. Integração Externa (Skins MIX)

- **Novo Botão de Navegação:**
  - Adicionado um botão de destaque "Skins MIX" na barra de navegação (Navbar), tanto na versão Desktop quanto Mobile.
  - O botão possui um estilo diferenciado (gradiente roxo/rosa) para chamar a atenção e redireciona para uma URL externa (`https://powderblue-parrot-119938.hostingersite.com/`).