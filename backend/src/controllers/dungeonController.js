const pool = require('../config/db');
const { processLevelUp } = require('../services/xpService');

// Get available dungeons
exports.getDungeons = async (req, res) => {
  try {
    const [players] = await pool.query('SELECT level FROM players WHERE id = ?', [req.player.id]);
    const playerLevel = players[0].level;

    const [dungeons] = await pool.query(
      'SELECT * FROM dungeons WHERE min_level <= ? ORDER BY min_level',
      [playerLevel]
    );

    res.json({ dungeons });
  } catch (error) {
    console.error('Get dungeons error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Start dungeon
exports.startDungeon = async (req, res) => {
  const { dungeonId } = req.params;

  try {
    // Check for active dungeon
    const [active] = await pool.query(
      'SELECT * FROM dungeon_progress WHERE player_id = ? AND status = "active"',
      [req.player.id]
    );

    if (active.length > 0) {
      return res.status(400).json({ error: 'Already in a dungeon' });
    }

    // Get dungeon
    const [dungeons] = await pool.query('SELECT * FROM dungeons WHERE id = ?', [dungeonId]);
    if (dungeons.length === 0) {
      return res.status(404).json({ error: 'Dungeon not found' });
    }

    const dungeon = dungeons[0];
    const endsAt = new Date(Date.now() + dungeon.time_limit_minutes * 60 * 1000);

    await pool.query(
      'INSERT INTO dungeon_progress (player_id, dungeon_id, ends_at) VALUES (?, ?, ?)',
      [req.player.id, dungeonId, endsAt]
    );

    res.json({
      message: 'Dungeon started',
      dungeon: dungeon.name,
      endsAt
    });
  } catch (error) {
    console.error('Start dungeon error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Complete dungeon
exports.completeDungeon = async (req, res) => {
  try {
    const [progress] = await pool.query(`
      SELECT dp.*, d.xp_reward, d.gold_reward, d.name
      FROM dungeon_progress dp
      JOIN dungeons d ON dp.dungeon_id = d.id
      WHERE dp.player_id = ? AND dp.status = "active"
    `, [req.player.id]);

    if (progress.length === 0) {
      return res.status(404).json({ error: 'No active dungeon' });
    }

    const dungeon = progress[0];
    const now = new Date();

    if (now > new Date(dungeon.ends_at)) {
      await pool.query('UPDATE dungeon_progress SET status = "failed" WHERE id = ?', [dungeon.id]);
      return res.status(400).json({ error: 'Dungeon time expired - FAILED' });
    }

    // Get player and process rewards
    const [players] = await pool.query('SELECT * FROM players WHERE id = ?', [req.player.id]);
    const player = players[0];

    const newXp = player.current_xp + dungeon.xp_reward;
    const levelResult = processLevelUp(player.level, newXp, player.xp_to_next_level);

    await pool.query(`
      UPDATE players SET 
        current_xp = ?, level = ?, xp_to_next_level = ?, rank_id = ?,
        gold = gold + ?, stat_points = stat_points + ?
      WHERE id = ?
    `, [
      levelResult.currentXp, levelResult.level, levelResult.xpToNextLevel, levelResult.rankId,
      dungeon.gold_reward, levelResult.statPointsGained, req.player.id
    ]);

    await pool.query('UPDATE dungeon_progress SET status = "completed" WHERE id = ?', [dungeon.id]);

    res.json({
      message: 'Dungeon cleared!',
      xpGained: dungeon.xp_reward,
      goldGained: dungeon.gold_reward,
      levelUp: levelResult.level > player.level,
      newLevel: levelResult.level
    });
  } catch (error) {
    console.error('Complete dungeon error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get active dungeon status
exports.getActiveDungeon = async (req, res) => {
  try {
    const [progress] = await pool.query(`
      SELECT dp.*, d.name, d.description, d.time_limit_minutes
      FROM dungeon_progress dp
      JOIN dungeons d ON dp.dungeon_id = d.id
      WHERE dp.player_id = ? AND dp.status = "active"
    `, [req.player.id]);

    if (progress.length === 0) {
      return res.json({ activeDungeon: null });
    }

    res.json({ activeDungeon: progress[0] });
  } catch (error) {
    console.error('Get active dungeon error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

