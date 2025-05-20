import express from 'express';
import {
    getAllBooks,
    getBookById,
    getBookByApiId,
    createBook,
    updateBook,
    deleteBook,
    searchBooksByNameAuthorGenre
} from '../controllers/bookController.js';
import authMiddleware, { authorize } from '../middlewares/authMiddleware.js';

console.log('[routes/bookRoutes.js] Módulo cargado.'); // Log para verificar carga del módulo

const router = express.Router();

// Rutas públicas (cualquiera puede acceder)
router.get('/', (req, res, next) => {
    console.log(`[routes/bookRoutes.js] Petición GET recibida en ruta base ('/'). Query:`, req.query); // Log para verificar si la petición llega aquí
    next(); // Continuar al siguiente manejador (getAllBooks)
}, getAllBooks);

router.get('/search', searchBooksByNameAuthorGenre);

router.get('/:id', getBookById);
router.get('/details/:api_id', getBookByApiId);

// Rutas protegidas solo para administradores
router.post('/', authMiddleware, authorize('admin'), createBook);
router.put('/:id', authMiddleware, authorize('admin'), updateBook);
router.delete('/:id', authMiddleware, authorize('admin'), deleteBook);

export default router; 