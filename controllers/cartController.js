import pool from '../config/db.js';

// Obtener el carrito de un usuario
// GET /api/cart
export const getUserCart = async (req, res) => {
    const userId = req.user.userId;
    let connection;
    try {
        connection = await pool.getConnection();
        const query = `
            SELECT ci.book_id, ci.quantity, l.api_id
            FROM cart_items ci
            JOIN libros l ON ci.book_id = l.id
            WHERE ci.user_id = ?
            ORDER BY ci.added_at DESC
        `;
        const [cartItems] = await connection.query(query, [userId]);
        const frontendCart = cartItems.map(item => ({
            book_id: item.api_id,
            quantity: item.quantity
        }));
        res.json(frontendCart);
    } catch (error) {
        console.error('Error en getUserCart:', error);
        res.status(500).json({ message: 'Error al obtener el carrito.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Añadir ítem al carrito o actualizar cantidad si ya existe
// POST /api/cart
export const addItemToCart = async (req, res) => {
    const userId = req.user.userId;
    const { book_id, quantity = 1 } = req.body;
    let connection;

    if (!book_id || quantity < 1) {
        return res.status(400).json({ message: 'book_id y una cantidad válida son requeridos.' });
    }

    console.log('--- addItemToCart DEBUG ---');
    console.log('userId:', userId);
    console.log('book_id recibido:', book_id, '| typeof:', typeof book_id);
    console.log('quantity:', quantity);

    try {
        connection = await pool.getConnection();
        const [libro] = await connection.query('SELECT id, api_id, title FROM libros WHERE api_id = ?', [book_id]);
        console.log('Resultado de SELECT id, api_id, title FROM libros WHERE api_id = ?', libro);

        if (libro.length === 0) {
            console.log('No se encontró ningún libro con ese api_id.');
            return res.status(404).json({ message: 'Libro no encontrado.' });
        }
        const realBookId = libro[0].id;
        console.log('ID numérico real del libro encontrado:', realBookId);

        const [existingItem] = await connection.query(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND book_id = ?',
            [userId, realBookId]
        );
        console.log('Resultado de SELECT en cart_items:', existingItem);

        if (existingItem.length > 0) {
            const currentQuantity = existingItem[0].quantity;
            const newQuantity = currentQuantity + quantity;
            await connection.execute(
                'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
                [newQuantity, existingItem[0].id]
            );
            console.log('Cantidad actualizada en el carrito:', newQuantity);
            res.json({ message: 'Cantidad actualizada en el carrito.', book_id, quantity: newQuantity });
        } else {
            const [result] = await connection.execute(
                'INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, ?)',
                [userId, realBookId, quantity]
            );
            console.log('Libro añadido al carrito. ID del nuevo cart_item:', result.insertId);
            res.status(201).json({ message: 'Libro añadido al carrito.', cartItemId: result.insertId, book_id, quantity });
        }
    } catch (error) {
        console.error('Error en addItemToCart:', error);
        res.status(500).json({ message: 'Error al añadir al carrito.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Actualizar cantidad de un ítem específico en el carrito
// PUT /api/cart/:book_id
export const updateCartItemQuantity = async (req, res) => {
    const userId = req.user.userId;
    const { book_id } = req.params;
    const { quantity } = req.body;
    let connection;

    if (quantity === undefined || quantity < 0) {
        return res.status(400).json({ message: 'Cantidad inválida. Debe ser 0 o mayor.' });
    }
    if (quantity === 0) {
        // Crear un objeto req y res simulado o modificar la llamada para que sea compatible
        const fakeReq = { user: { userId }, params: { book_id } };
        const fakeRes = {
            json: (data) => res.json(data),
            status: (statusCode) => ({
                json: (data) => res.status(statusCode).json(data)
            }),
        };
        return removeCartItem(fakeReq, fakeRes); 
    }
    
    try {
        connection = await pool.getConnection();
        // Debes buscar el ID numérico del libro si book_id es el api_id
        const [libro] = await connection.query('SELECT id FROM libros WHERE api_id = ?', [book_id]);
        if (libro.length === 0) {
            return res.status(404).json({ message: 'Libro no encontrado (para actualizar carrito).' });
        }
        const realBookId = libro[0].id;

        const [result] = await connection.execute(
            'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE user_id = ? AND book_id = ?',
            [quantity, userId, realBookId] // Usar realBookId
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado en el carrito.' });
        }
        res.json({ message: 'Cantidad del libro actualizada en el carrito.', book_id, quantity });
    } catch (error) {
        console.error('Error en updateCartItemQuantity:', error);
        res.status(500).json({ message: 'Error al actualizar cantidad en el carrito.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Eliminar un ítem específico del carrito
// DELETE /api/cart/:book_id
export const removeCartItem = async (req, res) => {
    const userId = req.user.userId;
    const { book_id } = req.params; // Este es api_id
    let connection;

    try {
        connection = await pool.getConnection();
        // Debes buscar el ID numérico del libro si book_id es el api_id
        const [libro] = await connection.query('SELECT id FROM libros WHERE api_id = ?', [book_id]);
        if (libro.length === 0) {
            return res.status(404).json({ message: 'Libro no encontrado (para eliminar del carrito).' });
        }
        const realBookId = libro[0].id;

        const [result] = await connection.execute(
            'DELETE FROM cart_items WHERE user_id = ? AND book_id = ?',
            [userId, realBookId] // Usar realBookId
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado en el carrito para eliminar.' });
        }
        res.json({ message: 'Libro eliminado del carrito.', book_id });
    } catch (error) {
        console.error('Error en removeCartItem:', error);
        res.status(500).json({ message: 'Error al eliminar ítem del carrito.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Vaciar todo el carrito del usuario
// DELETE /api/cart
export const clearUserCart = async (req, res) => {
    const userId = req.user.userId;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        res.json({ message: 'Carrito vaciado exitosamente.' });
    } catch (error) {
        console.error('Error en clearUserCart:', error);
        res.status(500).json({ message: 'Error al vaciar el carrito.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
}; 