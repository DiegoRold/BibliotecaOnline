import express from 'express';
import {
    registerUser,
    loginUser
} from '../controllers/authController.js';

const router = express.Router();

// Ruta para registrar un nuevo usuario
// POST /api/auth/register
router.post('/register', registerUser);

// Ruta para iniciar sesión
// POST /api/auth/login
router.post('/login', loginUser);

// Aquí podrían ir otras rutas de autenticación en el futuro (ej. logout, forgot-password)

export default router; 