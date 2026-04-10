const { Router } = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

router.post('/chat', authMiddleware, chatController.chat);

module.exports = router;
