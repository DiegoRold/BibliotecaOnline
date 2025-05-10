import express from 'express';
import {
    getUserWishlist,
    addToWishlist,
    removeFromWishlist
} from '../controllers/wishlistController.js'; // Crearemos este controlador a continuación
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas de wishlist requieren autenticación
router.use(authMiddleware);

// Obtener la lista de deseos del usuario
// GET /api/wishlist
router.get('/', getUserWishlist);

// Añadir un libro a la lista de deseos
// POST /api/wishlist
// Body esperado: { "book_id": 123 }
router.post('/', addToWishlist);

// Eliminar un libro de la lista de deseos
// DELETE /api/wishlist/:book_id (donde :book_id es el ID del libro en la tabla 'libros')
router.delete('/:book_id', removeFromWishlist);

export default router; 