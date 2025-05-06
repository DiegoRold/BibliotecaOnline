import express from 'express';
import {
    createPayPalOrder,
    capturePayPalOrder
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js'; // Protegeremos estas rutas

const router = express.Router();

// Ruta para crear una orden de pago con PayPal
// POST /api/payments/paypal/create-order
router.post('/paypal/create-order', protect, createPayPalOrder);

// Ruta para capturar un pago de PayPal después de la aprobación del cliente
// POST /api/payments/paypal/capture-order
router.post('/paypal/capture-order', protect, capturePayPalOrder);

export default router; 