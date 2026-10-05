const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, studentController.getAllStudents);
router.post('/', requireAdmin, studentController.createStudent);
router.delete('/:id', requireAdmin, studentController.deleteStudent);

module.exports = router;
