-- ARISE - Solo Leveling Habit Tracker Database Schema
-- Run this script to initialize the database

-- USE Leveling; (database already exists in TiDB)
-- If running locally, uncomment below:
-- CREATE DATABASE IF NOT EXISTS Leveling;
-- USE Leveling;

-- Ranks Table (E-Rank to Monarch)
CREATE TABLE ranks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  min_level INT NOT NULL,
  color VARCHAR(20) DEFAULT '#888888'
);

INSERT INTO ranks (name, min_level, color) VALUES
  ('E-Rank', 1, '#808080'),
  ('D-Rank', 10, '#32CD32'),
  ('C-Rank', 25, '#4169E1'),
  ('B-Rank', 50, '#9932CC'),
  ('A-Rank', 80, '#FFD700'),
  ('S-Rank', 100, '#FF4500'),
  ('National Level', 150, '#DC143C'),
  ('Monarch', 200, '#000000');

-- Players Table
CREATE TABLE players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  level INT DEFAULT 1,
  current_xp INT DEFAULT 0,
  xp_to_next_level INT DEFAULT 100,
  rank_id INT DEFAULT 1,
  gold INT DEFAULT 0,
  stat_points INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_login DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rank_id) REFERENCES ranks(id)
);

-- Player Stats Table
CREATE TABLE player_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT UNIQUE NOT NULL,
  strength INT DEFAULT 10,
  agility INT DEFAULT 10,
  intelligence INT DEFAULT 10,
  vitality INT DEFAULT 10,
  luck INT DEFAULT 5,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Quest Templates (System-defined quests)
CREATE TABLE quest_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  quest_type ENUM('daily', 'weekly', 'side') NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard', 'nightmare') DEFAULT 'easy',
  xp_reward INT DEFAULT 10,
  gold_reward INT DEFAULT 5,
  stat_type ENUM('strength', 'agility', 'intelligence', 'vitality', 'luck') DEFAULT NULL,
  target_count INT DEFAULT 1,
  is_system_quest BOOLEAN DEFAULT FALSE
);

-- Player Quests (Assigned quests with progress)
CREATE TABLE player_quests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  template_id INT,
  custom_name VARCHAR(100),
  custom_description TEXT,
  quest_type ENUM('daily', 'weekly', 'side') NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard', 'nightmare') DEFAULT 'easy',
  xp_reward INT DEFAULT 10,
  gold_reward INT DEFAULT 5,
  stat_type ENUM('strength', 'agility', 'intelligence', 'vitality', 'luck') DEFAULT NULL,
  current_progress INT DEFAULT 0,
  target_count INT DEFAULT 1,
  status ENUM('active', 'completed', 'failed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  reset_at TIMESTAMP NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES quest_templates(id)
);

-- Dungeons Table
CREATE TABLE dungeons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  difficulty ENUM('easy', 'medium', 'hard', 'nightmare') DEFAULT 'medium',
  time_limit_minutes INT DEFAULT 60,
  xp_reward INT DEFAULT 100,
  gold_reward INT DEFAULT 50,
  min_level INT DEFAULT 1
);

-- Dungeon Progress
CREATE TABLE dungeon_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  dungeon_id INT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP NOT NULL,
  status ENUM('active', 'completed', 'failed') DEFAULT 'active',
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (dungeon_id) REFERENCES dungeons(id)
);

-- Items Table
CREATE TABLE items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  item_type ENUM('consumable', 'cosmetic', 'boost') NOT NULL,
  effect_type VARCHAR(50),
  effect_value INT DEFAULT 0,
  price INT DEFAULT 100,
  rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common'
);

INSERT INTO items (name, description, item_type, effect_type, effect_value, price, rarity) VALUES
  ('Health Potion', 'Restores streak if missed a day', 'consumable', 'streak_restore', 1, 100, 'common'),
  ('XP Boost', 'Double XP for 1 hour', 'boost', 'xp_multiplier', 2, 250, 'uncommon'),
  ('Shadow Monarch Theme', 'Dark purple UI theme', 'cosmetic', 'theme', 0, 1000, 'epic');

-- Inventory Table
CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT DEFAULT 1,
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Achievements Table
CREATE TABLE achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  requirement_type VARCHAR(50),
  requirement_value INT DEFAULT 1,
  xp_reward INT DEFAULT 50,
  icon VARCHAR(100)
);

INSERT INTO achievements (name, description, requirement_type, requirement_value, xp_reward) VALUES
  ('First Steps', 'Complete your first quest', 'quests_completed', 1, 25),
  ('Week Warrior', 'Maintain a 7-day streak', 'streak_days', 7, 100),
  ('Centurion', 'Reach Level 100', 'level', 100, 500),
  ('Dungeon Master', 'Complete 10 dungeons', 'dungeons_completed', 10, 200);

-- Activity Log Table
CREATE TABLE activity_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  details JSON,
  xp_gained INT DEFAULT 0,
  gold_gained INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Default System Quests
INSERT INTO quest_templates (name, description, quest_type, difficulty, xp_reward, gold_reward, stat_type, target_count, is_system_quest) VALUES
  ('Daily Training', 'Complete 30 minutes of exercise', 'daily', 'medium', 30, 15, 'strength', 1, TRUE),
  ('Hydration Quest', 'Drink 8 glasses of water', 'daily', 'easy', 20, 10, 'vitality', 8, TRUE),
  ('Knowledge Seeker', 'Read for 30 minutes', 'daily', 'medium', 25, 12, 'intelligence', 1, TRUE),
  ('Early Bird', 'Wake up before 7 AM', 'daily', 'hard', 40, 20, 'agility', 1, TRUE),
  ('Weekly Marathon', 'Exercise 5 times this week', 'weekly', 'hard', 100, 50, 'strength', 5, TRUE);

-- Default Dungeons
INSERT INTO dungeons (name, description, difficulty, time_limit_minutes, xp_reward, gold_reward, min_level) VALUES
  ('Shadow Extraction', 'Study intensely for 2 hours straight', 'medium', 120, 150, 75, 1),
  ('Demon Castle', 'Complete a full workout routine', 'hard', 60, 200, 100, 10),
  ('Double Dungeon', 'No phone/social media for 4 hours', 'nightmare', 240, 500, 250, 25);

-- Challenges Table (for Statistics & Challenges feature)
CREATE TABLE challenges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  challenge_type ENUM('individual', 'group', 'competitive') DEFAULT 'individual',
  difficulty ENUM('easy', 'medium', 'hard', 'nightmare') DEFAULT 'medium',
  duration_days INT DEFAULT 7,
  max_participants INT DEFAULT 100,
  xp_reward INT DEFAULT 200,
  gold_reward INT DEFAULT 100,
  target_count INT DEFAULT 1,
  target_type VARCHAR(50) DEFAULT 'quests',
  start_date DATE,
  end_date DATE,
  status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Challenge Participants (tracks who joined challenges)
CREATE TABLE challenge_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  challenge_id INT NOT NULL,
  player_id INT NOT NULL,
  current_progress INT DEFAULT 0,
  status ENUM('active', 'completed', 'failed') DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  rank_position INT DEFAULT 0,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participant (challenge_id, player_id)
);

-- Player Statistics (pre-aggregated for performance)
CREATE TABLE player_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT UNIQUE NOT NULL,
  total_quests_completed INT DEFAULT 0,
  total_xp_earned INT DEFAULT 0,
  total_gold_earned INT DEFAULT 0,
  total_dungeons_completed INT DEFAULT 0,
  total_challenges_completed INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  current_month_quests INT DEFAULT 0,
  current_week_quests INT DEFAULT 0,
  average_daily_quests DECIMAL(4,2) DEFAULT 0.00,
  productivity_percentage DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Sample Challenges
INSERT INTO challenges (name, description, challenge_type, difficulty, duration_days, max_participants, xp_reward, gold_reward, target_count, target_type, status) VALUES
  ('Cut the Clutter Challenge', 'Organize your workspace daily for 7 days', 'individual', 'easy', 7, 50, 150, 75, 7, 'habit_days', 'active'),
  ('Happy Morning Challenge', 'Wake up before 7 AM for 5 days', 'individual', 'medium', 7, 100, 200, 100, 5, 'early_wake', 'active'),
  ('Social Media Detox Challenge', 'Limit social media to 30 min/day for a week', 'group', 'hard', 7, 75, 300, 150, 7, 'detox_days', 'active'),
  ('No Alcohol Challenge', 'Stay alcohol-free for 30 days', 'competitive', 'nightmare', 30, 200, 1000, 500, 30, 'sober_days', 'upcoming');

-- Leaderboard Cache (for Multiplayer features)
CREATE TABLE leaderboard_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT UNIQUE NOT NULL,
  rank_position INT,
  level INT,
  total_xp INT,
  total_quests INT,
  current_streak INT,
  rank_name VARCHAR(50),
  rank_color VARCHAR(20),
  username VARCHAR(50),
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  INDEX idx_rank_position (rank_position),
  INDEX idx_level (level DESC),
  INDEX idx_total_xp (total_xp DESC)
);

-- Add visibility to player_quests (for future 'everyone's quest' feature)
-- This prepares the architecture but doesn't expose the feature yet
ALTER TABLE player_quests 
ADD COLUMN visibility ENUM('private', 'friends', 'public') DEFAULT 'private' AFTER status;

