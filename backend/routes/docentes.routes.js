const express = require('express');
const router = express.Router();
const docentesController = require('../controllers/docentes.controller');
const authenticateJWT = require('../middlewares/auth.middleware');

// Rutas protegidas para la API de docentes
router.get('/docentes', authenticateJWT, docentesController.getDocentesData);
router.post('/docentes', authenticateJWT, docentesController.createDocente);
router.put('/docentes/:id', authenticateJWT, docentesController.updateDocente);
router.delete('/docentes/:id', authenticateJWT, docentesController.deleteDocente);

module.exports = router;