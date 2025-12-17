const db = require('../config/db');

// Compare two players head-to-head
exports.compareWithPlayer = async (req, res) => {
    try {
        const currentPlayerId = req.user.id;
        const { playerId: targetPlayerId } = req.params;

        // Get both players' data
        const [players] = await db.query(
            `SELECT 
        p.id, p.username, p.level, p.current_xp, p.gold, p.streak_days,
        r.name as rank_name, r.color as rank_color,
        ps.strength, ps.agility, ps.intelligence, ps.vitality, ps.luck,
        pst.total_quests_completed, pst.total_xp_earned, pst.total_gold_earned,
        pst.total_dungeons_completed, pst.total_challenges_completed,
        pst.longest_streak, pst.productivity_percentage
      FROM players p
      LEFT JOIN ranks r ON p.rank_id = r.id
      LEFT JOIN player_stats ps ON p.id = ps.player_id
      LEFT JOIN player_statistics pst ON p.id = pst.player_id
      WHERE p.id IN (?, ?)`,
            [currentPlayerId, targetPlayerId]
        );

        if (players.length !== 2) {
            return res.status(404).json({ error: 'One or both players not found' });
        }

        const currentPlayer = players.find(p => p.id === currentPlayerId);
        const targetPlayer = players.find(p => p.id === parseInt(targetPlayerId));

        // Get shared challenges comparison
        const [sharedChallenges] = await db.query(
            `SELECT 
        c.name,
        cp1.current_progress as player1_progress,
        cp2.current_progress as player2_progress,
        c.target_count,
        cp1.status as player1_status,
        cp2.status as player2_status
      FROM challenges c
      INNER JOIN challenge_participants cp1 ON c.id = cp1.challenge_id
      INNER JOIN challenge_participants cp2 ON c.id = cp2.challenge_id
      WHERE cp1.player_id = ? AND cp2.player_id = ?`,
            [currentPlayerId, targetPlayerId]
        );

        // Calculate comparison metrics
        const comparison = {
            currentPlayer: {
                ...currentPlayer,
                stats: {
                    strength: currentPlayer.strength || 10,
                    agility: currentPlayer.agility || 10,
                    intelligence: currentPlayer.intelligence || 10,
                    vitality: currentPlayer.vitality || 10,
                    luck: currentPlayer.luck || 5
                }
            },
            targetPlayer: {
                ...targetPlayer,
                stats: {
                    strength: targetPlayer.strength || 10,
                    agility: targetPlayer.agility || 10,
                    intelligence: targetPlayer.intelligence || 10,
                    vitality: targetPlayer.vitality || 10,
                    luck: targetPlayer.luck || 5
                }
            },
            differences: {
                level: currentPlayer.level - targetPlayer.level,
                xp: currentPlayer.current_xp - targetPlayer.current_xp,
                totalQuests: (currentPlayer.total_quests_completed || 0) - (targetPlayer.total_quests_completed || 0),
                streak: currentPlayer.streak_days - targetPlayer.streak_days,
                longestStreak: (currentPlayer.longest_streak || 0) - (targetPlayer.longest_streak || 0),
                productivity: (currentPlayer.productivity_percentage || 0) - (targetPlayer.productivity_percentage || 0)
            },
            sharedChallenges,
            winner: {
                level: currentPlayer.level > targetPlayer.level ? 'you' : 'them',
                xp: currentPlayer.current_xp > targetPlayer.current_xp ? 'you' : 'them',
                streak: currentPlayer.streak_days > targetPlayer.streak_days ? 'you' : 'them',
                quests: (currentPlayer.total_quests_completed || 0) > (targetPlayer.total_quests_completed || 0) ? 'you' : 'them'
            }
        };

        res.json(comparison);
    } catch (error) {
        console.error('Compare players error:', error);
        res.status(500).json({ error: 'Failed to compare players' });
    }
};

// Search for players by username
exports.searchPlayers = async (req, res) => {
    try {
        const { q } = req.query;
        const currentPlayerId = req.user.id;

        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Search query too short' });
        }

        const [players] = await db.query(
            `SELECT 
        p.id, p.username, p.level, p.current_xp,
        r.name as rank_name, r.color as rank_color,
        lc.rank_position
      FROM players p
      LEFT JOIN ranks r ON p.rank_id = r.id
      LEFT JOIN leaderboard_cache lc ON p.id = lc.player_id
      WHERE p.username LIKE ? AND p.id != ?
      ORDER BY p.level DESC
      LIMIT 20`,
            [`%${q}%`, currentPlayerId]
        );

        res.json({ players });
    } catch (error) {
        console.error('Search players error:', error);
        res.status(500).json({ error: 'Failed to search players' });
    }
};

// Get suggested players for comparison (similar level)
exports.getSuggestedComparisons = async (req, res) => {
    try {
        const playerId = req.user.id;

        // Get current player's level
        const [currentPlayer] = await db.query(
            `SELECT level FROM players WHERE id = ?`,
            [playerId]
        );

        if (currentPlayer.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        const level = currentPlayer[0].level;
        const levelRange = 10; // +/- 10 levels

        // Get players within level range
        const [suggestions] = await db.query(
            `SELECT 
        p.id, p.username, p.level, p.current_xp,
        r.name as rank_name, r.color as rank_color,
        lc.rank_position
      FROM players p
      LEFT JOIN ranks r ON p.rank_id = r.id
      LEFT JOIN leaderboard_cache lc ON p.id = lc.player_id
      WHERE p.id != ? 
        AND p.level BETWEEN ? AND ?
      ORDER BY ABS(p.level - ?) ASC, p.current_xp DESC
      LIMIT 10`,
            [playerId, level - levelRange, level + levelRange, level]
        );

        res.json({ suggestions });
    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
};

module.exports = exports;
