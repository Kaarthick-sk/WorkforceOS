const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProjectById,
    getProjectByUser,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, getProjects);
router.get('/user/:userId', verifyToken, getProjectByUser);
router.get('/:id', verifyToken, getProjectById);
router.post('/', verifyToken, createProject);
router.put('/:id', verifyToken, updateProject);
router.delete('/:id', verifyToken, deleteProject);

module.exports = router;
