const db = require('../config/db');

// Get available challenges (not yet joined by player)
exports.getAvailableChallenges = async (req, res) => {
    try {
        const playerId = req.user.id;

        const [challenges] = await db.query(
            `SELECT c.*, 
        COUNT(DISTINCT cp.player_id) as participant_count
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE c.status IN ('active', 'upcoming')
        AND c.id NOT IN (
          SELECT challenge_id FROM challenge_participants 
          WHERE player_id = ?
        )
      GROUP BY c.id
      ORDER BY c.created_at DESC`,
            [playerId]
        );

        res.json({ challenges });
    } catch (error) {
        console.error('Get available challenges error:', error);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
};

// Get player's active challenges
exports.getActiveChallenges = async (req, res) => {
    try {
        const playerId = req.user.id;

        const [challenges] = await db.query(
            `SELECT c.*, cp.current_progress, cp.status as participation_status,
        cp.joined_at, cp.rank_position,
        COUNT(DISTINCT cp2.player_id) as participant_count
      FROM challenges c
      INNER JOIN challenge_participants cp ON c.id = cp.challenge_id
      LEFT JOIN challenge_participants cp2 ON c.id = cp2.challenge_id
      WHERE cp.player_id = ? AND cp.status = 'active'
      GROUP BY c.id, cp.id
      ORDER BY cp.joined_at DESC`,
            [playerId]
        );

        res.json({ challenges });
    } catch (error) {
        console.error('Get active challenges error:', error);
        res.status(500).json({ error: 'Failed to fetch active challenges' });
    }
};

// Get completed challenges
exports.getCompletedChallenges = async (req, res) => {
    try {
        const playerId = req.user.id;

        const [challenges] = await db.query(
            `SELECT c.*, cp.current_progress, cp.status as participation_status,
        cp.joined_at, cp.completed_at, cp.rank_position,
        COUNT(DISTINCT cp2.player_id) as participant_count
      FROM challenges c
      INNER JOIN challenge_participants cp ON c.id = cp.challenge_id
      LEFT JOIN challenge_participants cp2 ON c.id = cp2.challenge_id
      WHERE cp.player_id = ? AND cp.status IN ('completed', 'failed')
      GROUP BY c.id, cp.id
      ORDER BY cp.completed_at DESC`,
            [playerId]
        );

        res.json({ challenges });
    } catch (error) {
        console.error('Get completed challenges error:', error);
        res.status(500).json({ error: 'Failed to fetch completed challenges' });
    }
};

// Join a challenge
exports.joinChallenge = async (req, res) => {
    try {
        const playerId = req.user.id;
        const { id: challengeId } = req.params;

        // Check if challenge exists and is available
        const [challenge] = await db.query(
            `SELECT * FROM challenges WHERE id = ? AND status IN ('active', 'upcoming')`,
            [challengeId]
        );

        if (challenge.length === 0) {
            return res.status(404).json({ error: 'Challenge not found or not available' });
        }

        // Check participant limit
        const [participants] = await db.query(
            `SELECT COUNT(*) as count FROM challenge_participants WHERE challenge_id = ?`,
            [challengeId]
        );

        if (participants[0].count >= challenge[0].max_participants) {
            return res.status(400).json({ error: 'Challenge is full' });
        }

        // Check if already joined
        const [existing] = await db.query(
            `SELECT * FROM challenge_participants WHERE challenge_id = ? AND player_id = ?`,
            [challengeId, playerId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already joined this challenge' });
        }

        // Join the challenge
        await db.query(
            `INSERT INTO challenge_participants (challenge_id, player_id) VALUES (?, ?)`,
            [challengeId, playerId]
        );

        res.json({ message: 'Successfully joined challenge', challenge: challenge[0] });
    } catch (error) {
        console.error('Join challenge error:', error);
        res.status(500).json({ error: 'Failed to join challenge' });
    }
};

// Update challenge progress
exports.updateChallengeProgress = async (req, res) => {
    try {
        const playerId = req.user.id;
        const { id: challengeId } = req.params;
        const { progress } = req.body;

        // Get challenge details
        const [challenge] = await db.query(
            `SELECT * FROM challenges WHERE id = ?`,
            [challengeId]
        );

        if (challenge.length === 0) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        // Update progress
        await db.query(
            `UPDATE challenge_participants 
       SET current_progress = ?
       WHERE challenge_id = ? AND player_id = ? AND status = 'active'`,
            [progress, challengeId, playerId]
        );

        // Check if challenge is complete
        if (progress >= challenge[0].target_count) {
            await db.query(
                `UPDATE challenge_participants 
         SET status = 'completed', completed_at = NOW()
         WHERE challenge_id = ? AND player_id = ?`,
                [challengeId, playerId]
            );

            // Award XP and gold
            await db.query(
                `UPDATE players 
         SET current_xp = current_xp + ?, gold = gold + ?
         WHERE id = ?`,
                [challenge[0].xp_reward, challenge[0].gold_reward, playerId]
            );

            // Update statistics
            await db.query(
                `UPDATE player_statistics 
         SET total_challenges_completed = total_challenges_completed + 1,
             total_xp_earned = total_xp_earned + ?,
             total_gold_earned = total_gold_earned + ?
         WHERE player_id = ?`,
                [challenge[0].xp_reward, challenge[0].gold_reward, playerId]
            );

            return res.json({
                message: 'Challenge completed!',
                completed: true,
                rewards: {
                    xp: challenge[0].xp_reward,
                    gold: challenge[0].gold_reward
                }
            });
        }

        res.json({ message: 'Progress updated', completed: false });
    } catch (error) {
        console.error('Update challenge progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
};

// Get challenge leaderboard
exports.getChallengeLeaderboard = async (req, res) => {
    try {
        const { id: challengeId } = req.params;

        const [leaderboard] = await db.query(
            `SELECT 
        cp.player_id,
        p.username,
        p.level,
        r.name as rank_name,
        r.color as rank_color,
        cp.current_progress,
        cp.status,
        cp.completed_at,
        RANK() OVER (ORDER BY cp.current_progress DESC, cp.completed_at ASC) as position
      FROM challenge_participants cp
      INNER JOIN players p ON cp.player_id = p.id
      INNER JOIN ranks r ON p.rank_id = r.id
      WHERE cp.challenge_id = ?
      ORDER BY position ASC
      LIMIT 100`,
            [challengeId]
        );

        // Update rank positions
        for (let i = 0; i < leaderboard.length; i++) {
            await db.query(
                `UPDATE challenge_participants 
         SET rank_position = ?
         WHERE challenge_id = ? AND player_id = ?`,
                [leaderboard[i].position, challengeId, leaderboard[i].player_id]
            );
        }

        res.json({ leaderboard });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
};

module.exports = exports;
