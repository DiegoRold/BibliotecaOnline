import express from 'express';
import {
    getUserOrders,
    getOrderById,
    getAllOrdersAdmin,
    getOrderByIdAdmin,
    updateOrderStatusAdmin,
    createOrder
} from '../controllers/orderController.js';
import authMiddleware, { authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas para pedidos (requieren autenticación)

// GET /api/pedidos - Obtener historial de pedidos del usuario logueado
router.get('/', authMiddleware, getUserOrders);

// GET /api/pedidos/:id - Obtener detalles de un pedido específico del usuario logueado
router.get('/:id', authMiddleware, getOrderById);

// Ruta para crear un nuevo pedido
// POST /api/pedidos (la ruta base ya es /api/pedidos por como se monta en server.js)
router.post('/', authMiddleware, createOrder);

// Rutas para Administradores (requieren autenticación y rol de admin)

// GET /api/pedidos/admin/all - Obtener todos los pedidos (admin)
router.get('/admin/all', authMiddleware, authorize('admin'), getAllOrdersAdmin);

// GET /api/pedidos/admin/:id - Obtener detalles de un pedido específico (admin)
router.get('/admin/:id', authMiddleware, authorize('admin'), getOrderByIdAdmin);

// PUT /api/pedidos/admin/:id/actualizar-estado - Actualizar estado de un pedido (admin)
router.put('/admin/:id/actualizar-estado', authMiddleware, authorize('admin'), updateOrderStatusAdmin);

export default router; 