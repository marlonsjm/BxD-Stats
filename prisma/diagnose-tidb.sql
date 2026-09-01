-- ============================================================
-- Diagnóstico do banco BxD Stats para TiDB Cloud SQL Editor
-- Execute CADA bloco abaixo separadamente (o editor pode rejeitar
-- múltiplos statements de uma vez).
-- ============================================================

-- BLOCO 1: tipos das colunas
SHOW COLUMNS FROM matchzy_stats_matches;

-- BLOCO 2: tipos das colunas
SHOW COLUMNS FROM matchzy_stats_maps;

-- BLOCO 3: tipos das colunas
SHOW COLUMNS FROM matchzy_stats_players;

-- BLOCO 4: contagens gerais
SELECT
  (SELECT COUNT(*) FROM matchzy_stats_matches) AS total_matches,
  (SELECT COUNT(*) FROM matchzy_stats_maps) AS total_maps,
  (SELECT COUNT(*) FROM matchzy_stats_players) AS total_player_stats;

-- BLOCO 5: valores nulos em matches
SELECT
  COUNT(*) AS total,
  COUNT(matchid) AS matchid_nao_nulo,
  COUNT(CASE WHEN matchid IS NULL THEN 1 END) AS matchid_nulo,
  COUNT(CASE WHEN winner IS NULL THEN 1 END) AS winner_nulo,
  COUNT(CASE WHEN team1_score IS NULL THEN 1 END) AS team1_score_nulo,
  COUNT(CASE WHEN team2_score IS NULL THEN 1 END) AS team2_score_nulo,
  COUNT(CASE WHEN start_time IS NULL THEN 1 END) AS start_time_nulo
FROM matchzy_stats_matches;

-- BLOCO 6: todos os registros de matches (limite 50)
SELECT * FROM matchzy_stats_matches ORDER BY start_time DESC LIMIT 50;

-- BLOCO 7: distribuição de mapas por matchid
SELECT matchid, COUNT(*) AS map_count
FROM matchzy_stats_maps
GROUP BY matchid
ORDER BY matchid;

-- BLOCO 8: todos os mapas (limite 50)
SELECT * FROM matchzy_stats_maps ORDER BY matchid, mapnumber LIMIT 50;

-- BLOCO 9: distribuição de player_stats por matchid/mapnumber
SELECT matchid, mapnumber, COUNT(*) AS player_count
FROM matchzy_stats_players
GROUP BY matchid, mapnumber
ORDER BY matchid, mapnumber;

-- BLOCO 10: top jogadores por kills (com contagem de registros)
SELECT
  steamid64,
  ANY_VALUE(name) AS name,
  SUM(kills) AS total_kills,
  COUNT(*) AS registros
FROM matchzy_stats_players
GROUP BY steamid64
ORDER BY total_kills DESC
LIMIT 30;

-- BLOCO 11: player_stats sem mapa correspondente
SELECT p.matchid, p.mapnumber, COUNT(*) AS orphan_count
FROM matchzy_stats_players p
LEFT JOIN matchzy_stats_maps m
  ON p.matchid = m.matchid AND p.mapnumber = m.mapnumber
WHERE m.matchid IS NULL
GROUP BY p.matchid, p.mapnumber;

-- BLOCO 12: mapas sem partida correspondente
SELECT m.matchid, COUNT(*) AS orphan_map_count
FROM matchzy_stats_maps m
LEFT JOIN matchzy_stats_matches mt ON m.matchid = mt.matchid
WHERE mt.matchid IS NULL
GROUP BY m.matchid;

-- BLOCO 13: duplicatas na PK de players
SELECT matchid, mapnumber, steamid64, COUNT(*) AS c
FROM matchzy_stats_players
GROUP BY matchid, mapnumber, steamid64
HAVING c > 1;

-- BLOCO 14: duplicatas na PK de maps
SELECT matchid, mapnumber, COUNT(*) AS c
FROM matchzy_stats_maps
GROUP BY matchid, mapnumber
HAVING c > 1;
