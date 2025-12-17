const pool = require('../config/db');
const { processLevelUp, calculateQuestXp } = require('../services/xpService');

// Get player's quests
exports.getQuests = async (req, res) => {
  const { type } = req.query; // daily, weekly, side

  try {
    let query = 'SELECT * FROM player_quests WHERE player_id = ?';
    const params = [req.player.id];

    if (type) {
      query += ' AND quest_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const [quests] = await pool.query(query, params);
    res.json({ quests });
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create custom quest
exports.createQuest = async (req, res) => {
  const { name, description, questType, difficulty, targetCount, statType } = req.body;

  if (!name || !questType) {
    return res.status(400).json({ error: 'Name and quest type are required' });
  }

  const xpReward = calculateQuestXp(20, difficulty || 'easy');
  const goldReward = Math.floor(xpReward / 2);

  try {
    const [result] = await pool.query(`
      INSERT INTO player_quests 
      (player_id, custom_name, custom_description, quest_type, difficulty, xp_reward, gold_reward, target_count, stat_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.player.id, name, description, questType, difficulty || 'easy', xpReward, goldReward, targetCount || 1, statType]);

    res.status(201).json({ 
      message: 'Quest created',
      questId: result.insertId 
    });
  } catch (error) {
    console.error('Create quest error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update quest progress
exports.updateProgress = async (req, res) => {
  const { questId } = req.params;
  const { progress } = req.body;

  try {
    const [quests] = await pool.query(
      'SELECT * FROM player_quests WHERE id = ? AND player_id = ?',
      [questId, req.player.id]
    );

    if (quests.length === 0) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    await pool.query(
      'UPDATE player_quests SET current_progress = ? WHERE id = ?',
      [progress, questId]
    );

    res.json({ message: 'Progress updated' });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Complete quest
exports.completeQuest = async (req, res) => {
  const { questId } = req.params;

  try {
    // Get quest
    const [quests] = await pool.query(
      'SELECT * FROM player_quests WHERE id = ? AND player_id = ? AND status = "active"',
      [questId, req.player.id]
    );

    if (quests.length === 0) {
      return res.status(404).json({ error: 'Quest not found or already completed' });
    }

    const quest = quests[0];

    // Get player
    const [players] = await pool.query('SELECT * FROM players WHERE id = ?', [req.player.id]);
    const player = players[0];

    // Calculate new XP and check for level up
    const newXp = player.current_xp + quest.xp_reward;
    const levelResult = processLevelUp(player.level, newXp, player.xp_to_next_level);

    // Update player
    await pool.query(`
      UPDATE players SET 
        current_xp = ?,
        level = ?,
        xp_to_next_level = ?,
        rank_id = ?,
        gold = gold + ?,
        stat_points = stat_points + ?
      WHERE id = ?
    `, [
      levelResult.currentXp,
      levelResult.level,
      levelResult.xpToNextLevel,
      levelResult.rankId,
      quest.gold_reward,
      levelResult.statPointsGained,
      req.player.id
    ]);

    // Update stat if quest has stat_type
    if (quest.stat_type) {
      await pool.query(
        `UPDATE player_stats SET ${quest.stat_type} = ${quest.stat_type} + 1 WHERE player_id = ?`,
        [req.player.id]
      );
    }

    // Mark quest complete
    await pool.query(
      'UPDATE player_quests SET status = "completed", completed_at = NOW() WHERE id = ?',
      [questId]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_log (player_id, action_type, xp_gained, gold_gained, details) VALUES (?, ?, ?, ?, ?)',
      [req.player.id, 'quest_complete', quest.xp_reward, quest.gold_reward, JSON.stringify({ questName: quest.custom_name })]
    );

    res.json({
      message: 'Quest completed!',
      xpGained: quest.xp_reward,
      goldGained: quest.gold_reward,
      levelUp: levelResult.level > player.level,
      newLevel: levelResult.level
    });
  } catch (error) {
    console.error('Complete quest error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete quest
exports.deleteQuest = async (req, res) => {
  const { questId } = req.params;

  try {
    await pool.query(
      'DELETE FROM player_quests WHERE id = ? AND player_id = ?',
      [questId, req.player.id]
    );
    res.json({ message: 'Quest deleted' });
  } catch (error) {
    console.error('Delete quest error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

