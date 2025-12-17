const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const auth = require('../middleware/auth');

router.get('/', auth, questController.getQuests);
router.post('/', auth, questController.createQuest);
router.put('/:questId/progress', auth, questController.updateProgress);
router.post('/:questId/complete', auth, questController.completeQuest);
router.delete('/:questId', auth, questController.deleteQuest);

module.exports = router;

