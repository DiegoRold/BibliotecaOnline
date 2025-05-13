// routes/userRoutes.js
import express from 'express';
const router = express.Router();

// Importa el controlador de perfil (ajusta la ruta si es necesario)
import * as profileController from '../controllers/profileController.js';

// Importa tu middleware de autenticación (ajusta la ruta si es necesario)
import { verifyToken } from '../middlewares/authMiddleware.js';

// Ruta para actualizar el perfil del usuario autenticado (nombre, email, dirección)
// Esta ruta será accesible como PUT http://localhost:3000/api/perfil
router.put('/perfil', verifyToken, profileController.updateUserProfile);

// Ruta para cambiar la contraseña del usuario autenticado
// Esta ruta será accesible como PUT http://localhost:3000/api/perfil/cambiar-contrasena
router.put('/perfil/cambiar-contrasena', verifyToken, profileController.changeUserPassword);

export default router; 