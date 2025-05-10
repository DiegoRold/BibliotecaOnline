import express from 'express';
import {
    getUserCart,
    addItemToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearUserCart
} from '../controllers/cartController.js'; // Crearemos este controlador
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas del carrito requieren autenticación
router.use(authMiddleware);

// Obtener el carrito del usuario
// GET /api/cart
router.get('/', getUserCart);

// Añadir un ítem al carrito (o incrementar cantidad si ya existe)
// POST /api/cart
// Body esperado: { "book_id": "book-123", "quantity": 1 }
router.post('/', addItemToCart);

// Actualizar la cantidad de un ítem en el carrito
// PUT /api/cart/:book_id
// Body esperado: { "quantity": 3 }
router.put('/:book_id', updateCartItemQuantity);

// Eliminar un ítem específico del carrito
// DELETE /api/cart/:book_id
router.delete('/:book_id', removeCartItem);

// Vaciar todo el carrito del usuario
// DELETE /api/cart
router.delete('/', clearUserCart);

export default router; 