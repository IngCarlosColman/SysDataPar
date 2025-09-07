const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authenticateJWT = require('../middlewares/auth.middleware');

// Ruta para obtener al usuario autenticado
router.get('/user', authenticateJWT, usersController.getAuthenticatedUser);

// Ruta para obtener todos los usuarios (requiere autenticación)
router.get('/users', authenticateJWT, usersController.getAllUsers);

module.exports = router;