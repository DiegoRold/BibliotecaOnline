import { getConnection } from '../config/db.js';

// Obtener el carrito de un usuario
// GET /api/cart
export const getUserCart = async (req, res) => {
    const userId = req.user.userId;
    const connection = getConnection();
    if (!connection) return res.status(503).json({ message: 'DB Service Unavailable' });

    try {
        // Devolver los ítems del carrito con detalles del libro (título, portada, precio actual del libro)
        // El precio en cart_items podría ser el precio al momento de añadir, si quisiéramos esa lógica.
        // Por ahora, obtenemos el precio actual de la tabla 'libros' si es posible, o usamos un placeholder.
        // Dado que book_id en cart_items es VARCHAR y libros.id es INT, un JOIN directo es complejo.
        // Similar a la wishlist, el frontend podría tener que buscar detalles en allBooks.
        // O, si tu tabla 'libros' también tuviera un campo VARCHAR con el ID de la API externa, podríamos hacer JOIN.
        
        // Versión Simplificada: Devolver items del carrito (book_id, quantity).
        // El frontend buscará los detalles en allBooks.
        const query = `SELECT ci.book_id, ci.quantity, ci.added_at, ci.updated_at 
                       FROM cart_items ci 
                       WHERE ci.user_id = ? 
                       ORDER BY ci.added_at DESC`;
        const [cartItems] = await connection.query(query, [userId]);
        res.json(cartItems);
    } catch (error) {
        console.error('Error en getUserCart:', error);
        res.status(500).json({ message: 'Error al obtener el carrito.', error: error.message });
    }
};

// Añadir ítem al carrito o actualizar cantidad si ya existe
// POST /api/cart
export const addItemToCart = async (req, res) => {
    const userId = req.user.userId;
    const { book_id, quantity = 1 } = req.body; // quantity por defecto a 1
    const connection = getConnection();
    if (!connection) return res.status(503).json({ message: 'DB Service Unavailable' });

    if (!book_id || quantity < 1) {
        return res.status(400).json({ message: 'book_id y una cantidad válida son requeridos.' });
    }

    try {
        const [existingItem] = await connection.query(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND book_id = ?',
            [userId, book_id]
        );

        if (existingItem.length > 0) {
            // El ítem ya existe, actualizar cantidad
            const currentQuantity = existingItem[0].quantity;
            const newQuantity = currentQuantity + quantity; // Sumar la cantidad recibida
            // Aquí deberíamos verificar contra el stock del libro si es posible
            await connection.execute(
                'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
                [newQuantity, existingItem[0].id]
            );
            res.json({ message: 'Cantidad actualizada en el carrito.', book_id, quantity: newQuantity });
        } else {
            // El ítem no existe, insertarlo
            // Aquí también deberíamos verificar stock antes de insertar
            const [result] = await connection.execute(
                'INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, ?)',
                [userId, book_id, quantity]
            );
            res.status(201).json({ message: 'Libro añadido al carrito.', cartItemId: result.insertId, book_id, quantity });
        }
    } catch (error) {
        console.error('Error en addItemToCart:', error);
        if (error.code === 'ER_DUP_ENTRY') { // Aunque ahora lo manejamos con update
            return res.status(409).json({ message: 'Error de duplicado, intente actualizar la cantidad.' });
        }
        res.status(500).json({ message: 'Error al añadir/actualizar ítem en el carrito.', error: error.message });
    }
};

// Actualizar cantidad de un ítem específico en el carrito
// PUT /api/cart/:book_id
export const updateCartItemQuantity = async (req, res) => {
    const userId = req.user.userId;
    const { book_id } = req.params;
    const { quantity } = req.body;
    const connection = getConnection();
    if (!connection) return res.status(503).json({ message: 'DB Service Unavailable' });

    if (quantity === undefined || quantity < 0) { // Permitir 0 para eliminar?
        return res.status(400).json({ message: 'Cantidad inválida. Debe ser 0 o mayor.' });
    }
    if (quantity === 0) { // Si la cantidad es 0, eliminar el ítem
        return removeCartItem(req, res); // Reutilizar la lógica de removeCartItem
    }

    // Aquí también se debería verificar el stock del libro antes de actualizar
    try {
        const [result] = await connection.execute(
            'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE user_id = ? AND book_id = ?',
            [quantity, userId, book_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado en el carrito.' });
        }
        res.json({ message: 'Cantidad del libro actualizada en el carrito.', book_id, quantity });
    } catch (error) {
        console.error('Error en updateCartItemQuantity:', error);
        res.status(500).json({ message: 'Error al actualizar cantidad en el carrito.', error: error.message });
    }
};

// Eliminar un ítem específico del carrito
// DELETE /api/cart/:book_id
export const removeCartItem = async (req, res) => {
    const userId = req.user.userId;
    const { book_id } = req.params;
    const connection = getConnection();
    if (!connection) return res.status(503).json({ message: 'DB Service Unavailable' });

    try {
        const [result] = await connection.execute(
            'DELETE FROM cart_items WHERE user_id = ? AND book_id = ?',
            [userId, book_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado en el carrito para eliminar.' });
        }
        res.json({ message: 'Libro eliminado del carrito.', book_id });
    } catch (error) {
        console.error('Error en removeCartItem:', error);
        res.status(500).json({ message: 'Error al eliminar ítem del carrito.', error: error.message });
    }
};

// Vaciar todo el carrito del usuario
// DELETE /api/cart
export const clearUserCart = async (req, res) => {
    const userId = req.user.userId;
    const connection = getConnection();
    if (!connection) return res.status(503).json({ message: 'DB Service Unavailable' });

    try {
        await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        res.json({ message: 'Carrito vaciado exitosamente.' });
    } catch (error) {
        console.error('Error en clearUserCart:', error);
        res.status(500).json({ message: 'Error al vaciar el carrito.', error: error.message });
    }
}; 