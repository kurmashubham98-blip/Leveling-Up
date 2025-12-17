const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const challengeController = require('../controllers/challengeController');

// All routes require authentication
router.use(auth);

// GET /api/challenges - Get available challenges
router.get('/', challengeController.getAvailableChallenges);

// GET /api/challenges/active - Get player's active challenges
router.get('/active', challengeController.getActiveChallenges);

// GET /api/challenges/completed - Get player's completed challenges
router.get('/completed', challengeController.getCompletedChallenges);

// POST /api/challenges/:id/join - Join a challenge
router.post('/:id/join', challengeController.joinChallenge);

// PUT /api/challenges/:id/progress - Update challenge progress
router.put('/:id/progress', challengeController.updateChallengeProgress);

// GET /api/challenges/:id/leaderboard - Get challenge leaderboard
router.get('/:id/leaderboard', challengeController.getChallengeLeaderboard);

module.exports = router;
