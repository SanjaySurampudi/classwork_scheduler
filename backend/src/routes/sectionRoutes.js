const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', sectionController.getAllSections);
router.post('/', requireAdmin, sectionController.createSection);
router.delete('/:name', requireAdmin, sectionController.deleteSection);

module.exports = router;
