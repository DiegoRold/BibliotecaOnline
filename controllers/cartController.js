import pool from '../config/db.js';

// Obtener el carrito de un usuario
// GET /api/cart
export const getUserCart = async (req, res) => {
    const userId = req.user.id;
    let connection;
    try {
        connection = await pool.getConnection();
        const query = `
            SELECT 
                ci.quantity,
                l.api_id, 
                l.id as numeric_id,
                l.title, 
                l.author, 
                l.cover_image_url,
                l.price, 
                l.stock,
                l.publication_date -- Si esta columna no existe en tu tabla 'libros', elimínala también.
                -- l.categories,    -- Eliminada temporalmente
                -- l.rating,        -- Eliminada temporalmente
                -- l.pages,         -- Eliminada temporalmente
                -- l.language       -- Eliminada temporalmente
            FROM cart_items ci
            JOIN libros l ON ci.book_id = l.api_id
            WHERE ci.user_id = ?
            ORDER BY ci.added_at DESC
        `;
        const [dbCartItems] = await connection.query(query, [userId]);

        const frontendCart = dbCartItems.map(item => ({
            id: item.api_id,
            numeric_id: item.numeric_id, 
            title: item.title,
            author: item.author,
            price: parseFloat(item.price) || 0,
            cover: item.cover_image_url ? `public/${item.cover_image_url}` : 'public/assets/books/placeholder.png',
            quantity: item.quantity,
            stock: parseInt(item.stock) || 0,
            year: item.publication_date ? new Date(item.publication_date).getFullYear().toString() : 'N/A',
            // Dejar estos como N/A o string vacío si las columnas no se seleccionan
            category: 'N/A', // item.categories ? (Array.isArray(item.categories) ? item.categories.join(', ') : item.categories) : 'N/A',
            rating: 'N/A',   // item.rating ? item.rating.toString() : 'N/A',
            pages: 'N/A',    // item.pages ? item.pages.toString() : 'N/A',
            language: 'N/A' // item.language || 'N/A'
        }));

        console.log('[getUserCart] Carrito enviado al frontend:', JSON.stringify(frontendCart));
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
    const userId = req.user.id;
    const { book_id, quantity = 1 } = req.body;
    let connection;

    if (!book_id || quantity < 1) {
        return res.status(400).json({ message: 'book_id y una cantidad válida son requeridos.' });
    }

    console.log('--- addItemToCart DEBUG ---');
    console.log('userId:', userId);
    console.log('book_id recibido (api_id):', book_id, '| typeof:', typeof book_id);
    console.log('quantity:', quantity);

    try {
        connection = await pool.getConnection();
        const [libroCheck] = await connection.query('SELECT api_id FROM libros WHERE api_id = ?', [book_id]);
        if (libroCheck.length === 0) {
            console.log('Intento de añadir al carrito un libro (api_id) que no existe en la tabla libros:', book_id);
            return res.status(404).json({ message: 'Libro no encontrado en el catálogo.' });
        }

        const [existingItem] = await connection.query(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND book_id = ?',
            [userId, book_id]
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
                [userId, book_id, quantity]
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
    const userId = req.user.id;
    const { book_id } = req.params;
    const { quantity } = req.body;
    let connection;

    console.log('[updateCartItemQuantity] Inicio:', { userId, book_id_param: book_id, quantity_body: quantity });

    if (quantity === undefined || quantity < 0) {
        console.log('[updateCartItemQuantity] Cantidad inválida (undefined o < 0):', quantity);
        return res.status(400).json({ message: 'Cantidad inválida. Debe ser mayor o igual a 0.' });
    }
    if (quantity === 0) {
        console.log('[updateCartItemQuantity] Cantidad es 0, llamando a removeCartItem.');
        const fakeReq = { user: { id: userId }, params: { book_id } };
        const fakeRes = {
            json: (data) => res.json(data),
            status: (statusCode) => ({ json: (data) => res.status(statusCode).json(data) }),
        };
        return removeCartItem(fakeReq, fakeRes); 
    }
    
    try {
        connection = await pool.getConnection();
        console.log('[updateCartItemQuantity] Parámetros ANTES de execute:', { quantity, userId, book_id_from_param: book_id });

        const [result] = await connection.execute(
            'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE user_id = ? AND book_id = ?',
            [quantity, userId, book_id]
        );

        if (result.affectedRows === 0) {
            console.log('[updateCartItemQuantity] Libro no encontrado en carrito para actualizar (affectedRows 0):', { userId, book_id });
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
    const userId = req.user.id;
    const { book_id } = req.params;
    let connection;

    console.log('[removeCartItem] Intentando eliminar:', { userId, book_id_param: book_id });

    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM cart_items WHERE user_id = ? AND book_id = ?',
            [userId, book_id]
        );

        if (result.affectedRows === 0) {
            console.log('[removeCartItem] Libro no encontrado en carrito para eliminar (affectedRows 0):', { userId, book_id });
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
    const userId = req.user.id;
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