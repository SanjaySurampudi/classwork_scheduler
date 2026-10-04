const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/student/login', authController.studentLogin);
router.post('/student/register', authController.studentRegister);
router.post('/admin/login', authController.adminLogin);
router.get('/me', verifyToken, authController.getCurrentUser);
router.get('/sections', authController.getSections);

module.exports = router;
