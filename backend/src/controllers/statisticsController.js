const db = require('../config/db');

// Get player statistics overview
exports.getPlayerStatistics = async (req, res) => {
  try {
    const playerId = req.user.id;
    
    // Get or create statistics record
    let [stats] = await db.query(
      `SELECT * FROM player_statistics WHERE player_id = ?`,
      [playerId]
    );
    
    if (stats.length === 0) {
      // Create initial statistics record
      await db.query(
        `INSERT INTO player_statistics (player_id) VALUES (?)`,
        [playerId]
      );
      [stats] = await db.query(
        `SELECT * FROM player_statistics WHERE player_id = ?`,
        [playerId]
      );
    }
    
    // Get additional real-time stats
    const [playerData] = await db.query(
      `SELECT level, current_xp, gold, streak_days, rank_id FROM players WHERE id = ?`,
      [playerId]
    );
    
    const [rankData] = await db.query(
      `SELECT name, color FROM ranks WHERE id = ?`,
      [playerData[0].rank_id]
    );
    
    res.json({
      statistics: stats[0],
      player: {
        ...playerData[0],
        rank_name: rankData[0].name,
        rank_color: rankData[0].color
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Get productivity data (for charts)
exports.getProductivityData = async (req, res) => {
  try {
    const playerId = req.user.id;
    const { period = '30' } = req.query; // days
    
    // Get quest completion data for the period
    const [completedQuests] = await db.query(
      `SELECT 
        DATE(completed_at) as date,
        COUNT(*) as count,
        SUM(xp_reward) as total_xp
      FROM player_quests
      WHERE player_id = ? 
        AND status = 'completed'
        AND completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(completed_at)
      ORDER BY date ASC`,
      [playerId, parseInt(period)]
    );
    
    // Calculate productivity percentage
    const targetQuestsPerDay = 3; // configurable
    const totalDays = parseInt(period);
    const totalExpectedQuests = totalDays * targetQuestsPerDay;
    const totalCompletedQuests = completedQuests.reduce((sum, day) => sum + day.count, 0);
    const productivityPercentage = Math.min(100, Math.round((totalCompletedQuests / totalExpectedQuests) * 100));
    
    res.json({
      dailyData: completedQuests,
      productivityPercentage,
      totalCompleted: totalCompletedQuests,
      totalExpected: totalExpectedQuests
    });
  } catch (error) {
    console.error('Get productivity error:', error);
    res.status(500).json({ error: 'Failed to fetch productivity data' });
  }
};

// Get habit breakdown by category
exports.getHabitBreakdown = async (req, res) => {
  try {
    const playerId = req.user.id;
    
    const [breakdown] = await db.query(
      `SELECT 
        COALESCE(stat_type, 'general') as category,
        COUNT(*) as count,
        SUM(xp_reward) as total_xp
      FROM player_quests
      WHERE player_id = ? AND status = 'completed'
      GROUP BY stat_type
      ORDER BY count DESC`,
      [playerId]
    );
    
    res.json({ breakdown });
  } catch (error) {
    console.error('Get habit breakdown error:', error);
    res.status(500).json({ error: 'Failed to fetch habit breakdown' });
  }
};

// Get streak history
exports.getStreakHistory = async (req, res) => {
  try {
    const playerId = req.user.id;
    
    // Get activity log for streak calculation
    const [activities] = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as actions
      FROM activity_log
      WHERE player_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [playerId]
    );
    
    // Get current streak from player
    const [playerData] = await db.query(
      `SELECT streak_days FROM players WHERE id = ?`,
      [playerId]
    );
    
    // Get longest streak from statistics
    const [stats] = await db.query(
      `SELECT longest_streak FROM player_statistics WHERE player_id = ?`,
      [playerId]
    );
    
    res.json({
      currentStreak: playerData[0]?.streak_days || 0,
      longestStreak: stats[0]?.longest_streak || 0,
      history: activities
    });
  } catch (error) {
    console.error('Get streak history error:', error);
    res.status(500).json({ error: 'Failed to fetch streak history' });
  }
};

// Update player statistics (called internally when quests complete)
exports.updateStatistics = async (playerId, updates) => {
  try {
    const fields = Object.keys(updates).map(key => `${key} = ${key} + ?`).join(', ');
    const values = [...Object.values(updates), playerId];
    
    await db.query(
      `UPDATE player_statistics SET ${fields} WHERE player_id = ?`,
      values
    );
    
    // Also update productivity percentage
    const [quests] = await db.query(
      `SELECT COUNT(*) as total FROM player_quests 
       WHERE player_id = ? AND status = 'completed'`,
      [playerId]
    );
    
    const [days] = await db.query(
      `SELECT DATEDIFF(NOW(), created_at) as days FROM players WHERE id = ?`,
      [playerId]
    );
    
    const avgDaily = days[0].days > 0 ? quests[0].total / days[0].days : 0;
    const productivity = Math.min(100, avgDaily * 33.33); // 3 quests = 100%
    
    await db.query(
      `UPDATE player_statistics 
       SET average_daily_quests = ?, productivity_percentage = ?
       WHERE player_id = ?`,
      [avgDaily.toFixed(2), productivity.toFixed(2), playerId]
    );
    
  } catch (error) {
    console.error('Update statistics error:', error);
    throw error;
  }
};

module.exports = exports;
