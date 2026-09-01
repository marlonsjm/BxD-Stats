-- ============================================================
-- Diagnóstico do banco BxD Stats (TiDB / MySQL)
-- Rode isso no console SQL do TiDB Cloud ou via mysql CLI
-- e cole o resultado aqui para eu montar o script de correção.
-- ============================================================

-- 1) Estrutura das tabelas (tipos de coluna, chaves, etc.)
DESCRIBE matchzy_stats_matches;
DESCRIBE matchzy_stats_maps;
DESCRIBE matchzy_stats_players;

-- 2) Contagens gerais
SELECT
  (SELECT COUNT(*) FROM matchzy_stats_matches) AS total_matches,
  (SELECT COUNT(*) FROM matchzy_stats_maps) AS total_maps,
  (SELECT COUNT(*) FROM matchzy_stats_players) AS total_player_stats;

-- 3) Verifica valores nulos na tabela de partidas
SELECT
  COUNT(*) AS total,
  COUNT(matchid) AS matchid_nao_nulo,
  COUNT(CASE WHEN matchid IS NULL THEN 1 END) AS matchid_nulo,
  COUNT(CASE WHEN winner IS NULL THEN 1 END) AS winner_nulo,
  COUNT(CASE WHEN team1_score IS NULL THEN 1 END) AS team1_score_nulo,
  COUNT(CASE WHEN team2_score IS NULL THEN 1 END) AS team2_score_nulo,
  COUNT(CASE WHEN start_time IS NULL THEN 1 END) AS start_time_nulo
FROM matchzy_stats_matches;

-- 4) Amostra completa das partidas (todos os registros se forem poucos)
SELECT * FROM matchzy_stats_matches ORDER BY start_time DESC LIMIT 50;

-- 5) Distribuição de mapas por matchid
SELECT matchid, COUNT(*) AS map_count
FROM matchzy_stats_maps
GROUP BY matchid
ORDER BY matchid;

-- 6) Amostra completa dos mapas
SELECT * FROM matchzy_stats_maps ORDER BY matchid, mapnumber LIMIT 50;

-- 7) Distribuição de player_stats por matchid/mapnumber
SELECT matchid, mapnumber, COUNT(*) AS player_count
FROM matchzy_stats_players
GROUP BY matchid, mapnumber
ORDER BY matchid, mapnumber;

-- 8) Top jogadores por kills (com contagem de registros por jogador)
SELECT
  steamid64,
  ANY_VALUE(name) AS name,
  SUM(kills) AS total_kills,
  COUNT(*) AS registros
FROM matchzy_stats_players
GROUP BY steamid64
ORDER BY total_kills DESC
LIMIT 30;

-- 9) Registros órfãos: player_stats sem mapa correspondente
SELECT p.matchid, p.mapnumber, COUNT(*) AS orphan_count
FROM matchzy_stats_players p
LEFT JOIN matchzy_stats_maps m
  ON p.matchid = m.matchid AND p.mapnumber = m.mapnumber
WHERE m.matchid IS NULL
GROUP BY p.matchid, p.mapnumber;

-- 10) Registros órfãos: mapas sem partida correspondente
SELECT m.matchid, COUNT(*) AS orphan_map_count
FROM matchzy_stats_maps m
LEFT JOIN matchzy_stats_matches mt ON m.matchid = mt.matchid
WHERE mt.matchid IS NULL
GROUP BY m.matchid;

-- 11) Verifica duplicatas na chave primária de players (matchid, mapnumber, steamid64)
SELECT matchid, mapnumber, steamid64, COUNT(*) AS c
FROM matchzy_stats_players
GROUP BY matchid, mapnumber, steamid64
HAVING c > 1;

-- 12) Verifica duplicatas na chave primária de maps (matchid, mapnumber)
SELECT matchid, mapnumber, COUNT(*) AS c
FROM matchzy_stats_maps
GROUP BY matchid, mapnumber
HAVING c > 1;
