import express from 'express';
import {
    getUserOrders,
    getOrderById,
    getAllOrdersAdmin,
    getOrderByIdAdmin,
    updateOrderStatusAdmin
} from '../controllers/orderController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas para pedidos (requieren autenticación)

// GET /api/pedidos - Obtener historial de pedidos del usuario logueado
router.get('/', protect, getUserOrders);

// GET /api/pedidos/:id - Obtener detalles de un pedido específico del usuario logueado
router.get('/:id', protect, getOrderById);

// Rutas para Administradores (requieren autenticación y rol de admin)

// GET /api/pedidos/admin/all - Obtener todos los pedidos (admin)
router.get('/admin/all', protect, authorize('admin'), getAllOrdersAdmin);

// GET /api/pedidos/admin/:id - Obtener detalles de un pedido específico (admin)
router.get('/admin/:id', protect, authorize('admin'), getOrderByIdAdmin);

// PUT /api/pedidos/admin/:id/actualizar-estado - Actualizar estado de un pedido (admin)
router.put('/admin/:id/actualizar-estado', protect, authorize('admin'), updateOrderStatusAdmin);

export default router; 