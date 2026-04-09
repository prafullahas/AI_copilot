const { Router } = require('express');
const infoController = require('../controllers/infoController');

const router = Router();

router.get('/info', infoController.getInfo);

module.exports = router;
