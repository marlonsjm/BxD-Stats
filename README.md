# BxD Stats

Bem-vindo ao BxD Stats, uma plataforma de estatísticas de Counter-Strike 2 desenvolvida para a comunidade de jogadores "BxD". O site exibe dados detalhados de partidas, rankings de jogadores e estatísticas de mapas, tudo coletado a partir de nossos jogos amistosos.

O projeto foi desenvolvido com a assistência do [Gemini CLI](https://google.com).

## ✨ Funcionalidades Principais

- **Histórico de Partidas:** Uma lista completa de todas as partidas jogadas, com placares detalhados, mapas e datas.
- **Ranking de Jogadores:** Tabela de classificação geral dos jogadores com base em kills, KDR, HS% e outras métricas.
- **Páginas de Detalhes:**
  - **Jogador:** Estatísticas agregadas e histórico de partidas para cada jogador.
  - **Partida:** Placar completo, estatísticas de todos os jogadores na partida, agrupados por time.
  - **Mapa:** Ranking de melhores jogadores e histórico de partidas para cada mapa específico.
- **Galeria da Comunidade:** Uma galeria em mosaico com efeito lightbox para exibir os melhores momentos (fotos e vídeos) das partidas.
- **Design Responsivo:** Interface limpa e moderna inspirada em plataformas como a HLTV, totalmente funcional em desktops e dispositivos móveis.

## 🚀 Stack Tecnológica

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Banco de Dados:** [TiDB Cloud](https://tidb.cloud/) (Compatível com MySQL)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/)
- **Deployment:** [Vercel](https://vercel.com/)

## ⚙️ Rodando o Projeto Localmente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/marlonsjm/web-casa.git
    cd web-casa
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    - Crie um arquivo `.env` na raiz do projeto.
    - Adicione a sua `DATABASE_URL` do TiDB Cloud (ou outro banco de dados) nele:
      ```
      DATABASE_URL="mysql://USER:PASSWORD@HOST/DATABASE?sslaccept=strict"
      ```

4.  **Sincronize o Schema do Banco:**
    ```bash
    npx prisma db push
    ```

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.
