import express from 'express';
import {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
} from '../controllers/bookController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas públicas (cualquiera puede acceder)
router.get('/', getAllBooks);
router.get('/:id', getBookById);

// Rutas protegidas solo para administradores
router.post('/', protect, authorize('admin'), createBook);
router.put('/:id', protect, authorize('admin'), updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);

export default router; 