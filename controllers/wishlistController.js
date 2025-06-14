import pool from '../config/db.js';

// Obtener la lista de deseos de un usuario
// GET /api/wishlist
export const getUserWishlist = async (req, res) => {
    console.log('[wishlistController] Entrando a getUserWishlist');
    console.log('[wishlistController] req.user:', JSON.stringify(req.user, null, 2));
    const userId = req.user ? req.user.id : undefined;
    console.log('[wishlistController] userId (obtenido de req.user.id):', userId);

    if (!userId) {
        console.error('[wishlistController getUserWishlist] Error: userId no definido. El usuario podría no estar autenticado correctamente o req.user.id no está disponible.');
        return res.status(401).json({ message: 'Usuario no autenticado o ID de usuario no disponible.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        console.log(`[wishlistController getUserWishlist] Ejecutando query para userId: ${userId}`);
        const query = `
            SELECT wl.book_id, wl.added_at
            FROM wishlist_items wl
            WHERE wl.user_id = ?
            ORDER BY wl.added_at DESC
        `;
        const [wishlistItems] = await connection.query(query, [userId]);
        console.log(`[wishlistController getUserWishlist] Wishlist items de DB para userId ${userId}:`, wishlistItems.length);
        res.json({ wishlist: wishlistItems.map(item => ({ id: item.book_id, added_at: item.added_at })) });
    } catch (error) {
        console.error('[wishlistController getUserWishlist] Error al obtener la lista de deseos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener la lista de deseos.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Añadir un libro a la lista de deseos
// POST /api/wishlist
export const addToWishlist = async (req, res) => {
    console.log('[wishlistController] Entrando a addToWishlist');
    console.log('[wishlistController] req.user:', JSON.stringify(req.user, null, 2));
    const userId = req.user ? req.user.id : undefined;
    console.log('[wishlistController] userId (obtenido de req.user.id):', userId);
    const { book_id } = req.body;
    console.log(`[wishlistController addToWishlist] book_id del body: ${book_id}`);

    if (!userId) {
        console.error('[wishlistController addToWishlist] Error: userId no definido.');
        return res.status(401).json({ message: 'Usuario no autenticado o ID de usuario no disponible.' });
    }
    if (!book_id) {
        return res.status(400).json({ message: 'El ID del libro (book_id) es requerido.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        console.log(`[wishlistController addToWishlist] Intentando añadir libro ${book_id} para userId: ${userId}`);
        const [existingItem] = await connection.query('SELECT id FROM wishlist_items WHERE user_id = ? AND book_id = ?', [userId, book_id]);
        if (existingItem.length > 0) {
            console.log(`[wishlistController addToWishlist] Libro ${book_id} ya existe para userId ${userId}`);
            return res.status(409).json({ message: 'Este libro ya está en tu lista de deseos.' });
        }

        const insertQuery = 'INSERT INTO wishlist_items (user_id, book_id) VALUES (?, ?)';
        const [result] = await connection.execute(insertQuery, [userId, book_id]);

        if (result.insertId) {
            console.log(`[wishlistController addToWishlist] Libro ${book_id} añadido para userId ${userId}, insertId: ${result.insertId}`);
            res.status(201).json({ message: 'Libro añadido a la lista de deseos exitosamente.', wishlistItemId: result.insertId, book_id: book_id });
        } else {
            console.error('[wishlistController addToWishlist] Error: No se pudo obtener insertId al añadir.');
            res.status(500).json({ message: 'Error al añadir el libro a la lista de deseos.' });
        }
    } catch (error) {
        console.error('[wishlistController addToWishlist] Error al añadir a la lista de deseos:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este libro ya está en tu lista de deseos.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al añadir a la lista de deseos.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Eliminar un libro de la lista de deseos
// DELETE /api/wishlist/:book_id
export const removeFromWishlist = async (req, res) => {
    console.log('[wishlistController] Entrando a removeFromWishlist');
    console.log('[wishlistController] req.user:', JSON.stringify(req.user, null, 2));
    const userId = req.user ? req.user.id : undefined;
    console.log('[wishlistController] userId (obtenido de req.user.id):', userId);
    const { book_id } = req.params;
    console.log(`[wishlistController removeFromWishlist] book_id de params: ${book_id}`);

    if (!userId) {
        console.error('[wishlistController removeFromWishlist] Error: userId no definido.');
        return res.status(401).json({ message: 'Usuario no autenticado o ID de usuario no disponible.' });
    }
    if (!book_id) {
        return res.status(400).json({ message: 'El ID del libro (book_id) es requerido en los parámetros de la ruta.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        console.log(`[wishlistController removeFromWishlist] Intentando eliminar libro ${book_id} para userId: ${userId}`);
        const deleteQuery = 'DELETE FROM wishlist_items WHERE user_id = ? AND book_id = ?';
        const [result] = await connection.execute(deleteQuery, [userId, book_id]);

        if (result.affectedRows > 0) {
            console.log(`[wishlistController removeFromWishlist] Libro ${book_id} eliminado para userId ${userId}`);
            res.json({ message: 'Libro eliminado de la lista de deseos exitosamente.', book_id: book_id });
        } else {
            console.log(`[wishlistController removeFromWishlist] Libro ${book_id} no encontrado para eliminar para userId ${userId}`);
            res.status(404).json({ message: 'Libro no encontrado en tu lista de deseos o ya fue eliminado.' });
        }
    } catch (error) {
        console.error('[wishlistController removeFromWishlist] Error al eliminar de la lista de deseos:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar de la lista de deseos.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
}; 