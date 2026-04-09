const { Router } = require('express');
const repoController = require('../controllers/repoController');

const router = Router();

router.post('/ingest-repo', repoController.ingestRepo);

module.exports = router;
