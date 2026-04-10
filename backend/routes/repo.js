const { Router } = require('express');
const repoController = require('../controllers/repoController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

router.post('/ingest-repo', authMiddleware, repoController.ingestRepo);
router.post('/switch-repo', authMiddleware, repoController.switchRepo);
router.get('/repos', authMiddleware, repoController.listRepos);

module.exports = router;
