const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const comparisonController = require('../controllers/comparisonController');

// All routes require authentication
router.use(auth);

// GET /api/comparison/search - Search players
router.get('/search', comparisonController.searchPlayers);

// GET /api/comparison/suggestions - Get suggested comparisons
router.get('/suggestions', comparisonController.getSuggestedComparisons);

// GET /api/comparison/:playerId - Compare with specific player
router.get('/:playerId', comparisonController.compareWithPlayer);

module.exports = router;
