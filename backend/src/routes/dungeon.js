const express = require('express');
const router = express.Router();
const dungeonController = require('../controllers/dungeonController');
const auth = require('../middleware/auth');

router.get('/', auth, dungeonController.getDungeons);
router.get('/active', auth, dungeonController.getActiveDungeon);
router.post('/:dungeonId/start', auth, dungeonController.startDungeon);
router.post('/complete', auth, dungeonController.completeDungeon);

module.exports = router;

