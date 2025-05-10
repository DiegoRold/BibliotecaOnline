import { getConnection } from '../config/db.js';

// Obtener la lista de deseos de un usuario
// GET /api/wishlist
export const getUserWishlist = async (req, res) => {
    const userId = req.user.userId; 
    const connection = getConnection();

    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }

    try {
        // Devolver solo los book_id (strings) de la wishlist del usuario.
        // El frontend se encargará de buscar los detalles en allBooks.
        const query = `
            SELECT wl.book_id, wl.added_at
            FROM wishlist_items wl
            WHERE wl.user_id = ?
            ORDER BY wl.added_at DESC
        `;
        const [wishlistItems] = await connection.query(query, [userId]);
        
        // Mapear para devolver solo un array de book_ids si se prefiere, o el objeto completo.
        // Por ahora devolvemos objetos con book_id y added_at para mantener la estructura.
        res.json(wishlistItems.map(item => ({ book_id: item.book_id, added_at: item.added_at }) ));
    } catch (error) {
        console.error('Error en getUserWishlist:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener la lista de deseos.', error: error.message });
    }
};

// Añadir un libro a la lista de deseos
// POST /api/wishlist
export const addToWishlist = async (req, res) => {
    const userId = req.user.userId;
    const { book_id } = req.body; // book_id es ahora un string (ej. "book-0")
    const connection = getConnection();

    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }

    if (!book_id) {
        return res.status(400).json({ message: 'El ID del libro (book_id) es requerido.' });
    }

    try {
        // Ya no verificamos si el libro existe en la tabla 'libros' mediante su ID numérico.
        // Asumimos que el frontend envía un ID válido que él maneja.

        const [existingItem] = await connection.query('SELECT id FROM wishlist_items WHERE user_id = ? AND book_id = ?', [userId, book_id]);
        if (existingItem.length > 0) {
            return res.status(409).json({ message: 'Este libro ya está en tu lista de deseos.' });
        }

        const insertQuery = 'INSERT INTO wishlist_items (user_id, book_id) VALUES (?, ?)';
        const [result] = await connection.execute(insertQuery, [userId, book_id]);

        if (result.insertId) {
            // Devolvemos el book_id que se añadió, además del nuevo ID de la tabla wishlist_items
            res.status(201).json({ message: 'Libro añadido a la lista de deseos exitosamente.', wishlistItemId: result.insertId, book_id: book_id });
        } else {
            res.status(500).json({ message: 'Error al añadir el libro a la lista de deseos.' });
        }
    } catch (error) {
        console.error('Error en addToWishlist:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este libro ya está en tu lista de deseos.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al añadir a la lista de deseos.', error: error.message });
    }
};

// Eliminar un libro de la lista de deseos
// DELETE /api/wishlist/:book_id (book_id es ahora un string)
export const removeFromWishlist = async (req, res) => {
    const userId = req.user.userId;
    const { book_id } = req.params; // book_id (string) viene de los parámetros de la ruta
    const connection = getConnection();

    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }

    try {
        const deleteQuery = 'DELETE FROM wishlist_items WHERE user_id = ? AND book_id = ?';
        const [result] = await connection.execute(deleteQuery, [userId, book_id]);

        if (result.affectedRows > 0) {
            res.json({ message: 'Libro eliminado de la lista de deseos exitosamente.', book_id: book_id });
        } else {
            res.status(404).json({ message: 'Libro no encontrado en tu lista de deseos o ya fue eliminado.' });
        }
    } catch (error) {
        console.error('Error en removeFromWishlist:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar de la lista de deseos.', error: error.message });
    }
}; 