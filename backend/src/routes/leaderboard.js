const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const leaderboardController = require('../controllers/leaderboardController');

// All routes require authentication
router.use(auth);

// GET /api/leaderboard - Get global leaderboard
router.get('/', leaderboardController.getGlobalLeaderboard);

// GET /api/leaderboard/me - Get current player's rank
router.get('/me', leaderboardController.getPlayerRank);

// GET /api/leaderboard/rank/:rankName - Get leaderboard by rank
router.get('/rank/:rankName', leaderboardController.getLeaderboardByRank);

// POST /api/leaderboard/update - Update leaderboard cache (admin/scheduled)
router.post('/update', leaderboardController.updateLeaderboardCache);

module.exports = router;
