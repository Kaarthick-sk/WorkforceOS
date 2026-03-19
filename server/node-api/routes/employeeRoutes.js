const express = require('express');
const router = express.Router();
const { getEmployees, createEmployee, deleteEmployee } = require('../controllers/employeeController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, getEmployees);
router.post('/', verifyToken, createEmployee);
router.delete('/:id', verifyToken, deleteEmployee);

module.exports = router;
