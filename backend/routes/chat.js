const { Router } = require('express');
const chatController = require('../controllers/chatController');

const router = Router();

router.post('/chat', chatController.chat);

module.exports = router;
