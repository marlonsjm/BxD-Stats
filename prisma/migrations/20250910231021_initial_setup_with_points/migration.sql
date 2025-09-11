-- CreateTable
CREATE TABLE `matchzy_stats_matches` (
    `matchid` INTEGER NOT NULL AUTO_INCREMENT,
    `start_time` DATETIME(0) NOT NULL,
    `end_time` DATETIME(0) NULL,
    `winner` VARCHAR(255) NOT NULL DEFAULT '',
    `series_type` VARCHAR(255) NOT NULL DEFAULT '',
    `team1_name` VARCHAR(255) NOT NULL DEFAULT '',
    `team1_score` INTEGER NOT NULL DEFAULT 0,
    `team2_name` VARCHAR(255) NOT NULL DEFAULT '',
    `team2_score` INTEGER NOT NULL DEFAULT 0,
    `server_ip` VARCHAR(255) NOT NULL DEFAULT '0',

    PRIMARY KEY (`matchid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matchzy_stats_maps` (
    `matchid` INTEGER NOT NULL,
    `mapnumber` INTEGER NOT NULL,
    `start_time` DATETIME(0) NOT NULL,
    `end_time` DATETIME(0) NULL,
    `winner` VARCHAR(191) NOT NULL DEFAULT '',
    `mapname` VARCHAR(191) NOT NULL DEFAULT '',
    `team1_score` INTEGER NOT NULL DEFAULT 0,
    `team2_score` INTEGER NOT NULL DEFAULT 0,

    INDEX `matchzy_stats_maps_mapnumber_idx`(`mapnumber`),
    PRIMARY KEY (`matchid`, `mapnumber`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matchzy_stats_players` (
    `matchid` INTEGER NOT NULL,
    `mapnumber` INTEGER NOT NULL,
    `steamid64` BIGINT NOT NULL,
    `team` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `kills` INTEGER NOT NULL,
    `deaths` INTEGER NOT NULL,
    `damage` INTEGER NOT NULL,
    `assists` INTEGER NOT NULL,
    `enemy5ks` INTEGER NOT NULL,
    `enemy4ks` INTEGER NOT NULL,
    `enemy3ks` INTEGER NOT NULL,
    `enemy2ks` INTEGER NOT NULL,
    `utility_count` INTEGER NOT NULL,
    `utility_damage` INTEGER NOT NULL,
    `utility_successes` INTEGER NOT NULL,
    `utility_enemies` INTEGER NOT NULL,
    `flash_count` INTEGER NOT NULL,
    `flash_successes` INTEGER NOT NULL,
    `health_points_removed_total` INTEGER NOT NULL,
    `health_points_dealt_total` INTEGER NOT NULL,
    `shots_fired_total` INTEGER NOT NULL,
    `shots_on_target_total` INTEGER NOT NULL,
    `v1_count` INTEGER NOT NULL,
    `v1_wins` INTEGER NOT NULL,
    `v2_count` INTEGER NOT NULL,
    `v2_wins` INTEGER NOT NULL,
    `entry_count` INTEGER NOT NULL,
    `entry_wins` INTEGER NOT NULL,
    `equipment_value` INTEGER NOT NULL,
    `money_saved` INTEGER NOT NULL,
    `kill_reward` INTEGER NOT NULL,
    `live_time` INTEGER NOT NULL,
    `head_shot_kills` INTEGER NOT NULL,
    `cash_earned` INTEGER NOT NULL,
    `enemies_flashed` INTEGER NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`matchid`, `mapnumber`, `steamid64`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
