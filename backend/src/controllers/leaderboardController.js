const db = require('../config/db');

// Get global leaderboard with pagination
exports.getGlobalLeaderboard = async (req, res) => {
    try {
        const { page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM leaderboard_cache`
        );
        const totalPlayers = countResult[0].total;

        // Get leaderboard page
        const [leaderboard] = await db.query(
            `SELECT 
        rank_position,
        username,
        level,
        total_xp,
        total_quests,
        current_streak,
        rank_name,
        rank_color,
        player_id,
        last_active
      FROM leaderboard_cache
      ORDER BY rank_position ASC
      LIMIT ? OFFSET ?`,
            [parseInt(limit), offset]
        );

        res.json({
            leaderboard,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalPlayers,
                totalPages: Math.ceil(totalPlayers / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
};

// Get current player's rank and nearby players
exports.getPlayerRank = async (req, res) => {
    try {
        const playerId = req.user.id;

        // Get player's rank
        const [playerRank] = await db.query(
            `SELECT * FROM leaderboard_cache WHERE player_id = ?`,
            [playerId]
        );

        if (playerRank.length === 0) {
            // Player not in cache yet, update it
            await exports.updateSinglePlayerCache(playerId);
            const [updated] = await db.query(
                `SELECT * FROM leaderboard_cache WHERE player_id = ?`,
                [playerId]
            );
            playerRank[0] = updated[0];
        }

        const currentRank = playerRank[0].rank_position;

        // Get nearby players (5 above, 5 below)
        const [nearbyPlayers] = await db.query(
            `SELECT * FROM leaderboard_cache 
       WHERE rank_position BETWEEN ? AND ?
       ORDER BY rank_position ASC`,
            [Math.max(1, currentRank - 5), currentRank + 5]
        );

        res.json({
            playerRank: playerRank[0],
            nearbyPlayers
        });
    } catch (error) {
        console.error('Get player rank error:', error);
        res.status(500).json({ error: 'Failed to fetch player rank' });
    }
};

// Get leaderboard filtered by rank
exports.getLeaderboardByRank = async (req, res) => {
    try {
        const { rankName } = req.params;
        const { page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [leaderboard] = await db.query(
            `SELECT * FROM leaderboard_cache 
       WHERE rank_name = ?
       ORDER BY rank_position ASC
       LIMIT ? OFFSET ?`,
            [rankName, parseInt(limit), offset]
        );

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM leaderboard_cache WHERE rank_name = ?`,
            [rankName]
        );

        res.json({
            leaderboard,
            rankName,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get rank leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch rank leaderboard' });
    }
};

// Update single player's leaderboard cache
exports.updateSinglePlayerCache = async (playerId) => {
    try {
        // Get player data
        const [player] = await db.query(
            `SELECT p.*, r.name as rank_name, r.color as rank_color,
              ps.total_quests_completed
       FROM players p
       LEFT JOIN ranks r ON p.rank_id = r.id
       LEFT JOIN player_statistics ps ON p.id = ps.player_id
       WHERE p.id = ?`,
            [playerId]
        );

        if (player.length === 0) return;

        const playerData = player[0];

        // Upsert into leaderboard_cache
        await db.query(
            `INSERT INTO leaderboard_cache 
       (player_id, level, total_xp, total_quests, current_streak, rank_name, rank_color, username, last_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         level = VALUES(level),
         total_xp = VALUES(total_xp),
         total_quests = VALUES(total_quests),
         current_streak = VALUES(current_streak),
         rank_name = VALUES(rank_name),
         rank_color = VALUES(rank_color),
         last_active = NOW()`,
            [
                playerId,
                playerData.level,
                playerData.current_xp,
                playerData.total_quests_completed || 0,
                playerData.streak_days,
                playerData.rank_name,
                playerData.rank_color,
                playerData.username
            ]
        );

        // Recalculate all rankings
        await exports.recalculateRankings();

    } catch (error) {
        console.error('Update player cache error:', error);
        throw error;
    }
};

// Recalculate all rankings
exports.recalculateRankings = async () => {
    try {
        await db.query(
            `SET @rank = 0;
       UPDATE leaderboard_cache
       SET rank_position = (@rank := @rank + 1)
       ORDER BY level DESC, total_xp DESC, current_streak DESC`
        );
    } catch (error) {
        console.error('Recalculate rankings error:', error);
        throw error;
    }
};

// Update entire leaderboard cache (scheduled job)
exports.updateLeaderboardCache = async (req, res) => {
    try {
        // Clear cache
        await db.query(`TRUNCATE TABLE leaderboard_cache`);

        // Rebuild cache
        const [players] = await db.query(
            `SELECT p.id, p.username, p.level, p.current_xp, p.streak_days,
              r.name as rank_name, r.color as rank_color,
              ps.total_quests_completed
       FROM players p
       LEFT JOIN ranks r ON p.rank_id = r.id
       LEFT JOIN player_statistics ps ON p.id = ps.player_id
       ORDER BY p.level DESC, p.current_xp DESC, p.streak_days DESC`
        );

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            await db.query(
                `INSERT INTO leaderboard_cache 
         (player_id, rank_position, level, total_xp, total_quests, current_streak, rank_name, rank_color, username, last_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    player.id,
                    i + 1,
                    player.level,
                    player.current_xp,
                    player.total_quests_completed || 0,
                    player.streak_days,
                    player.rank_name,
                    player.rank_color,
                    player.username
                ]
            );
        }

        if (res) {
            res.json({ message: 'Leaderboard updated', playersRanked: players.length });
        }
    } catch (error) {
        console.error('Update leaderboard cache error:', error);
        if (res) {
            res.status(500).json({ error: 'Failed to update leaderboard' });
        }
    }
};

module.exports = exports;
