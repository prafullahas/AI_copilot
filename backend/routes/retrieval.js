const { Router } = require('express');
const retrievalController = require('../controllers/retrievalController');

const router = Router();

router.post('/retrieve', retrievalController.retrieve);

module.exports = router;
