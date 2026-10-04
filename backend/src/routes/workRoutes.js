const express = require('express');
const router = express.Router();
const workController = require('../controllers/workController');
const { verifyToken, requireAdmin, requireStudent } = require('../middleware/auth');

// Optional auth for reading classworks (if student is logged in, their completion status is returned)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return verifyToken(req, res, next);
  }
  next();
}

router.get('/', optionalAuth, workController.getAllClassworks);
router.get('/stats', verifyToken, workController.getOverviewStats);
router.get('/:id', optionalAuth, workController.getClassworkById);
router.post('/', requireAdmin, workController.createClasswork);
router.put('/:id', requireAdmin, workController.updateClasswork);
router.delete('/:id', requireAdmin, workController.deleteClasswork);

// Student toggle completion
router.post('/:id/complete', requireStudent, workController.toggleComplete);

// Admin view completions / roster
router.get('/:id/completions', requireAdmin, workController.getClassworkCompletions);

module.exports = router;
