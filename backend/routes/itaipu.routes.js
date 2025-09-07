const express = require('express');
const router = express.Router();
const itaipuController = require('../controllers/itaipu.controller');
const authenticateJWT = require('../middlewares/auth.middleware');

router.get('/itaipu', authenticateJWT, itaipuController.getItaipuData);
router.post('/itaipu', authenticateJWT, itaipuController.createItaipu);
router.put('/itaipu/:id', authenticateJWT, itaipuController.updateItaipu);
router.delete('/itaipu/:id', authenticateJWT, itaipuController.deleteItaipu);

module.exports = router;