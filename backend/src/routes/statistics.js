const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const statisticsController = require('../controllers/statisticsController');

// All routes require authentication
router.use(auth);

// GET /api/statistics - Get player statistics overview
router.get('/', statisticsController.getPlayerStatistics);

// GET /api/statistics/productivity - Get productivity data
router.get('/productivity', statisticsController.getProductivityData);

// GET /api/statistics/habits - Get habit breakdown
router.get('/habits', statisticsController.getHabitBreakdown);

// GET /api/statistics/streaks - Get streak history
router.get('/streaks', statisticsController.getStreakHistory);

module.exports = router;
