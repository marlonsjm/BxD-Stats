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
