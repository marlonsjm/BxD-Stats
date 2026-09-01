-- ============================================================================
-- RESET das tabelas do MatchZy no TiDB
-- ============================================================================
-- Contexto: uma query manual rodada no TiDB removeu o AUTO_INCREMENT e a
-- PRIMARY KEY de `matchzy_stats_matches` e `matchzy_stats_maps`. Isso fez o
-- `matchid` entrar como NULL/0 e TODAS as partidas de 18/07 colapsarem.
--
-- Este script APAGA as 3 tabelas do MatchZy (dados de 18/07 sao lixo/perdidos
-- no banco, mas recuperaveis a partir das demos em prisma/parsed-demos.json).
--
-- Passo a passo:
--   1. Faca backup antes (o dump em ./ticloud ja serve como backup).
--   2. Rode este script no TiDB (SQL Editor do TiDB Cloud, ou mysql CLI).
--   3. REINICIE o servidor CS2. Na inicializacao o MatchZy roda
--      InitializeDatabase() e recria as 3 tabelas com o schema CORRETO
--      (matchid INT PRIMARY KEY AUTO_INCREMENT).
--   4. (Opcional) Rode o rebuild das demos para restaurar os stats de 18/07.
--
-- NAO apague a tabela `_prisma_migrations` por aqui — ela e do site. Se quiser
-- que o Prisma pare de "gerenciar" schema, basta nunca rodar migrate/push
-- (ver aviso no topo de schema.prisma). A _prisma_migrations pode ficar como esta.
-- ============================================================================

-- ATENCAO: as tabelas ficam no database `test` (ver prefixo test. no dump).
-- Sem o USE abaixo, o DROP ... IF EXISTS roda no database errado e retorna
-- "OK" sem apagar nada. Ajuste o nome se seu database nao for `test`.
USE `test`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `matchzy_stats_players`;
DROP TABLE IF EXISTS `matchzy_stats_maps`;
DROP TABLE IF EXISTS `matchzy_stats_matches`;

SET FOREIGN_KEY_CHECKS = 1;

-- Verifique (deve voltar VAZIO):
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'test' AND table_name LIKE 'matchzy%';

-- Depois deste script, reinicie o servidor CS2 para o MatchZy recriar as tabelas.
