const { Router } = require('express');
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

router.post('/search', authMiddleware, searchController.search);

module.exports = router;
