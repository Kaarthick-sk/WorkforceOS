const express = require('express');
const router = express.Router();
const { recommendMembers, analyzeProject, projectSummary } = require('../controllers/ragController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/recommend-members', verifyToken, recommendMembers);
router.post('/analyze-project', verifyToken, analyzeProject);
router.post('/project-summary', verifyToken, projectSummary);

module.exports = router;
