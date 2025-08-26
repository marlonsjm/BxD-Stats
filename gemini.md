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
