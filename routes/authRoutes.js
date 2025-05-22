import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    registerUser,
    loginUser,
    verifyAdmin
} from '../controllers/authController.js';

const router = express.Router();

// Ruta para registrar un nuevo usuario
// POST /api/auth/register
router.post('/register', registerUser);

// Ruta para iniciar sesión
// POST /api/auth/login
router.post('/login', loginUser);

// Ruta para verificar si el usuario actual es administrador
// GET /api/auth/verify-admin
router.get('/verify-admin', authMiddleware, verifyAdmin);

// Aquí podrían ir otras rutas de autenticación en el futuro (ej. logout, forgot-password)

export default router; 