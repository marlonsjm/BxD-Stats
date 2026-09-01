# BxD Stats

Bem-vindo ao BxD Stats, uma plataforma de estatísticas de Counter-Strike 2 desenvolvida para a comunidade de jogadores "BxD". O site exibe dados detalhados de partidas, rankings de jogadores e estatísticas de mapas, tudo coletado a partir de nossos jogos amistosos.

O projeto foi desenvolvido com a assistência do [Gemini CLI](https://google.com).

## ✨ Funcionalidades Principais

- **Rating 2.0 aproximado:** Cada jogador recebe um rating inspirado no Rating 2.0 da HLTV, calculado a partir de kills, mortes, assistências e dano por round. O rating aparece no ranking de jogadores, no perfil e no placar de cada partida (onde também define o destaque ⭐ da partida).
- **Rankings Detalhados:** Além do ranking geral, a plataforma oferece classificações específicas para métricas como Percentual de Headshots (HS%), Clutches Vencidos e Taxa de Sucesso em Entry Frags.
- **Histórico de Partidas:** Uma lista completa de todas as partidas jogadas, com placares detalhados, mapas e datas.
- **Páginas de Detalhes:**
  - **Jogador:** Estatísticas agregadas e histórico de partidas para cada jogador.
  - **Partida:** Placar completo, estatísticas de todos os jogadores na partida, agrupados por time.
  - **Mapa:** Ranking de melhores jogadores e histórico de partidas para cada mapa específico.
- **Galeria da Comunidade:** Uma galeria em mosaico com efeito lightbox para exibir os melhores momentos (fotos e vídeos) das partidas. O conteúdo é gerenciado dinamicamente através do Cloudinary, permitindo uploads sem a necessidade de novos deploys.
- **Design Responsivo:** Interface limpa e moderna inspirada em plataformas como a HLTV. Totalmente funcional em desktops e dispositivos móveis, com **tabelas de dados que se adaptam para um formato de cards em telas pequenas**, garantindo uma excelente experiência de usuário em qualquer dispositivo.

## 🚀 Stack Tecnológica

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Banco de Dados:** [TiDB Cloud](https://tidb.cloud/) (Compatível com MySQL)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Gerenciamento de Mídia:** [Cloudinary](https://cloudinary.com/) (para a galeria de imagens e vídeos)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/)
- **Deployment:** [Vercel](https://vercel.com/)

## ⚙️ Rodando o Projeto Localmente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/marlonsjm/BxD-Stats.git
    cd BxD-Stats
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    - Crie um arquivo `.env.local` na raiz do projeto.
    - Adicione as seguintes variáveis:
      ```
      # URL de conexão do seu banco de dados (TiDB, MySQL, etc.)
      DATABASE_URL="mysql://USER:PASSWORD@HOST/DATABASE?sslaccept=strict"

      # Credenciais do Cloudinary (para a galeria)
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="SEU_CLOUD_NAME"
      CLOUDINARY_API_KEY="SUA_API_KEY"
      CLOUDINARY_API_SECRET="SEU_API_SECRET"

      # Steam Web API (opcional - avatares dos jogadores)
      # Gere a sua key gratuitamente em https://steamcommunity.com/dev/apikey
      # Sem a key, o site exibe um avatar com a inicial do nick.
      STEAM_API_KEY="SUA_STEAM_API_KEY"
      ```

4.  **Gere o Prisma Client:**
    ```bash
    npx prisma generate
    ```

    > ⚠️ **Nunca rode `prisma migrate` ou `prisma db push` contra o banco.** Quem
    > cria e gerencia as tabelas `matchzy_stats_*` é o plugin MatchZy, no servidor
    > de CS2 — o Prisma aqui é **somente leitura**. Rodar `db push` reescreve o
    > schema e destrói os dados (foi o que aconteceu em 18/07/2026). Para
    > sincronizar mudanças feitas pelo plugin, use `npx prisma db pull` seguido de
    > `npx prisma generate`.

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

## 📚 Documentação

- **[CHANGELOG.md](CHANGELOG.md)** — histórico de mudanças do site.
- **[docs/pipeline-de-stats.md](docs/pipeline-de-stats.md)** — como os stats saem
  do servidor de CS2 e chegam no site, o que fazer depois de uma noite de jogo,
  como recuperar partidas perdidas e as armadilhas conhecidas.

## 🔄 De onde vêm os dados

O MatchZy (plugin do servidor de CS2) grava as partidas em um **SQLite local**, e
um script replica esses dados para o TiDB, que é o banco que este site lê. O
passo de sincronização é manual, rodado depois de cada noite de jogo:

```bash
node --env-file=.env.local prisma/sync-sqlite-to-tidb.mjs
```

O motivo de não ser gravação direta está documentado em
[docs/pipeline-de-stats.md](docs/pipeline-de-stats.md#o-bug-do-matchzy-diagnóstico-de-310826).