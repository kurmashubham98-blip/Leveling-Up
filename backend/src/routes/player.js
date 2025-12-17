const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const auth = require('../middleware/auth');

router.get('/profile', auth, playerController.getProfile);
router.get('/activity', auth, playerController.getActivity);
router.put('/stats', auth, playerController.allocateStats);
router.get('/inventory', auth, playerController.getInventory);
router.get('/shop', auth, playerController.getShop);
router.post('/shop/:itemId', auth, playerController.buyItem);

module.exports = router;

