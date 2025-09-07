const express = require('express');
const router = express.Router();
const funcpublicController = require('../controllers/funcpublic.controller');
const authenticateJWT = require('../middlewares/auth.middleware');

router.get('/funcpublic', authenticateJWT, funcpublicController.getFuncPublicData);
router.post('/funcpublic', authenticateJWT, funcpublicController.createFuncPublic);
router.put('/funcpublic/:id', authenticateJWT, funcpublicController.updateFuncPublic);
router.delete('/funcpublic/:id', authenticateJWT, funcpublicController.deleteFuncPublic);

module.exports = router;