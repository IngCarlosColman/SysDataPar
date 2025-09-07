const express = require('express');
const router = express.Router();
const abogadosController = require('../controllers/abogados.controller');
const authenticateJWT = require('../middlewares/auth.middleware');

router.get('/abogados', authenticateJWT, abogadosController.getAbogadosData);
router.post('/abogados', authenticateJWT, abogadosController.createAbogado);
router.put('/abogados/:id', authenticateJWT, abogadosController.updateAbogado);
router.delete('/abogados/:id', authenticateJWT, abogadosController.deleteAbogado);

module.exports = router;