# Contexto do Projeto Gemini CLI

Este documento registra o contexto e o progresso do projeto `cs2-stats-site` conforme desenvolvido com a assistência do Gemini CLI.

## Objetivos Principais

*   **Publicação:** Fazer o upload do projeto para o GitHub (`https://github.com/marlonsjm/web-casa.git`).
*   **Deploy:** Realizar o deploy da aplicação na Vercel.
*   **Banco de Dados:** Utilizar o TiDB como banco de dados principal.
*   **Integração Futura:** Configurar o plugin MatchZy para se conectar diretamente ao TiDB, finalizando a pipeline de dados.

## Progresso Atual e Funcionalidades Implementadas

Até o momento, as seguintes funcionalidades foram implementadas e os problemas resolvidos:

1.  **Estrutura do Projeto:**
    *   Projeto Next.js com Prisma e Tailwind CSS.
    *   Configurado para usar MySQL (TiDB) como banco de dados.

2.  **Esquema do Banco de Dados:**
    *   Padronização do `prisma/schema.prisma` com base nas tabelas `matchzy_stats_matches`, `matchzy_stats_maps` e `matchzy_stats_players`.
    *   Inclusão de valores padrão e tipos de dados corretos para MySQL.

3.  **Importação de Dados:**
    *   Orientação para exportação de dados do SQLite para CSV.
    *   Auxílio na importação de dados para o TiDB, incluindo a resolução de erros de `DATETIME` e a exclusão de dados inconsistentes (`matchid = 4`).

4.  **Página Inicial (`/`):
    *   Exibição da lista de partidas.
    *   Placar da partida agora mostra os rounds do primeiro mapa (ex: "13 (1)").
    *   Exibição do nome do mapa jogado na listagem.

5.  **Página de Detalhes da Partida (`/match/[matchid]`):
    *   Correção do bug inicial de exibição das estatísticas dos jogadores (agregação correta por jogador na partida).
    *   Exibição do nome do mapa jogado no cabeçalho da partida.
    *   Adição das estatísticas: K, A, D, DIFF, MK, FK (First Kill), HS%, KDR.
    *   Remoção da estatística "Dano" da tabela de jogadores.
    *   Adição de balões explicativos (tooltips) para as abreviações das estatísticas.
    *   Reordenação das colunas das estatísticas dos jogadores para: K, A, D, DIFF, MK, FK, HS%, KDR.
    *   Nomes dos jogadores na tabela são clicáveis, direcionando para suas páginas de detalhes.
    *   Correção do cálculo do KDR para exibir "N/A" quando as mortes são zero.

6.  **Página de Ranking de Jogadores (`/players`):
    *   Criação da página com estatísticas agregadas de todos os jogadores.
    *   Exibição de SteamID64, Nicks, K, D, A, DIFF, MK, FK, HS%, KDR.
    *   Adição da coluna "Mapas Jogados".
    *   Ordenação fixa por "Kills" (decrescente).
    *   Tentativa e reversão da ordenação dinâmica.

7.  **Página de Detalhes do Jogador (`/player/[steamid64]`):
    *   Criação da página com estatísticas detalhadas e histórico de partidas do jogador.
    *   Inclusão de SteamID64, Nicks utilizados, Kills, Deaths, Assists, Dano Total, HS%, DIFF, KDR, MK, FK, Utilidade, Flashes, Precisão de Tiro, 1vs1, 1vs2, Entradas e Mapas Jogados.
    *   Remoção de estatísticas específicas (HP, Economia, Tempo Vivo).
    *   Adição de verificações de nulidade para lidar com inconsistências de dados (`stat.map` e `stat.map.match`).

## Próximos Passos (Conforme definido pelo usuário)

*   Continuar o processo de upload para o GitHub.
*   Realizar o deploy na Vercel.
*   Configurar o plugin MatchZy para se conectar ao TiDB.
