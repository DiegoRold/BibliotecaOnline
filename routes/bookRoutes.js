import express from 'express';
import {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
} from '../controllers/bookController.js';
import authMiddleware, { authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas públicas (cualquiera puede acceder)
router.get('/', getAllBooks);
router.get('/:id', getBookById);

// Rutas protegidas solo para administradores
router.post('/', authMiddleware, authorize('admin'), createBook);
router.put('/:id', authMiddleware, authorize('admin'), updateBook);
router.delete('/:id', authMiddleware, authorize('admin'), deleteBook);

export default router; 