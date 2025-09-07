const express = require('express');
const router = express.Router();
const generalController = require('../controllers/general.controller');
const authenticateJWT = require('../middlewares/auth.middleware');

router.get('/general', authenticateJWT, generalController.getGeneralData);
router.post('/general', authenticateJWT, generalController.createGeneral);
router.put('/general/:id', authenticateJWT, generalController.updateGeneral);
router.delete('/general/:id', authenticateJWT, generalController.deleteGeneral);

module.exports = router;