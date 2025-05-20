import pool from '../config/db.js';

// Obtener todos los pedidos del usuario autenticado
export const getUserOrders = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const userId = req.user.id; // Cambiado de req.user.userId

        const [orders] = await connection.query(
            'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY fecha_pedido DESC',
            [userId]
        );

        if (orders.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(orders);

    } catch (error) {
        console.error('Error en getUserOrders:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los pedidos.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Obtener un pedido específico por su ID para el usuario autenticado
export const getOrderById = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const userId = req.user.id; // Cambiado de req.user.userId
        const orderId = parseInt(req.params.id, 10);

        if (isNaN(orderId)) {
            return res.status(400).json({ message: 'El ID del pedido debe ser un número.' });
        }

        const [orderRows] = await connection.query(
            'SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?',
            [orderId, userId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado o no pertenece a este usuario.' });
        }

        const order = orderRows[0];

        const [orderItems] = await connection.query(
            `SELECT 
                pi.libro_id, 
                pi.cantidad, 
                pi.precio_unitario_en_compra, 
                pi.titulo_en_compra, 
                l.cover_image_url,
                l.author AS autor_libro
             FROM pedido_items pi 
             LEFT JOIN libros l ON pi.libro_id = l.id
             WHERE pi.pedido_id = ?`,
            [orderId]
        );

        order.items = orderItems;
        res.status(200).json(order);

    } catch (error) {
        console.error(`Error en getOrderById (Pedido ID: ${req.params.id}):`, error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el pedido.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Crear un nuevo pedido
export const createOrder = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const userId = req.user.id; // Cambiado de req.user.userId
        const { items, totalAmount } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'El carrito está vacío. No se puede crear un pedido.' });
        }
        if (typeof totalAmount !== 'number' || totalAmount <= 0) {
            return res.status(400).json({ message: 'El monto total del pedido no es válido.' });
        }

        await connection.beginTransaction();

        const pedidoResult = await connection.query(
            'INSERT INTO pedidos (usuario_id, monto_total, moneda, estado_pago, estado_pedido, fecha_pedido) VALUES (?, ?, ?, ?, ?, NOW())',
            [userId, totalAmount, 'EUR', 'Pagado', 'Procesando']
        );
        const newOrderId = pedidoResult[0].insertId;

        if (!newOrderId) {
            throw new Error('No se pudo obtener el ID del nuevo pedido.');
        }

        for (const item of items) {
            if (!item.book_id || typeof item.quantity !== 'number' || item.quantity <= 0 || typeof item.price !== 'number' || item.price < 0 || !item.title) {
                throw new Error(`Datos inválidos para el item del pedido: ${JSON.stringify(item)}`);
            }

            const [bookRows] = await connection.query('SELECT id, stock FROM libros WHERE api_id = ?', [item.book_id]);
            if (bookRows.length === 0) {
                throw new Error(`Libro con ID ${item.book_id} no encontrado.`);
            }
            const realBookId = bookRows[0].id;
            const currentStock = bookRows[0].stock;
            if (currentStock < item.quantity) {
                throw new Error(`Stock insuficiente para el libro "${item.title}" (ID: ${item.book_id}). Solicitado: ${item.quantity}, Disponible: ${currentStock}`);
            }

            await connection.query(
                'INSERT INTO pedido_items (pedido_id, libro_id, cantidad, precio_unitario_en_compra, titulo_en_compra) VALUES (?, ?, ?, ?, ?)',
                [newOrderId, realBookId, item.quantity, item.price, item.title]
            );

            const newStock = currentStock - item.quantity;
            await connection.query(
                'UPDATE libros SET stock = ? WHERE id = ?',
                [newStock, realBookId]
            );
        }

        await connection.commit();

        res.status(201).json({ 
            success: true, 
            message: 'Pedido creado con éxito.', 
            orderId: newOrderId 
        });

    } catch (error) {
        console.error('Error en createOrder:', error);
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Error al hacer rollback de la transacción:', rollbackError);
            }
        }
        if (error.message.includes('Stock insuficiente') || error.message.includes('Libro con ID') || error.message.includes('Datos inválidos para el item')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear el pedido.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// --- Funciones para Administradores ---

// Obtener todos los pedidos (para administradores, con paginación)
export const getAllOrdersAdmin = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);
        page = (isNaN(page) || page < 1) ? 1 : page;
        limit = (isNaN(limit) || limit < 10) ? 10 : limit;
        const offset = (page - 1) * limit;

        const [totalResult] = await connection.query('SELECT COUNT(*) as totalItems FROM pedidos');
        const totalItems = totalResult[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        const [orders] = await connection.query(
            'SELECT p.*, u.nombre as nombre_cliente, u.email as email_cliente FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.fecha_pedido DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        res.status(200).json({
            data: orders,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error('Error en getAllOrdersAdmin:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener todos los pedidos.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Obtener un pedido específico por ID (para administradores)
export const getOrderByIdAdmin = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const orderId = parseInt(req.params.id, 10);
        if (isNaN(orderId)) {
            return res.status(400).json({ message: 'El ID del pedido debe ser un número.' });
        }

        const [orderRows] = await connection.query(
            'SELECT p.*, u.nombre as nombre_cliente, u.email as email_cliente FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?',
            [orderId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        const order = orderRows[0];

        const [orderItems] = await connection.query(
            `SELECT pi.libro_id, pi.cantidad, pi.precio_unitario_en_compra, pi.titulo_en_compra, 
                    l.cover_image_url, l.author as autor_libro
             FROM pedido_items pi
             LEFT JOIN libros l ON pi.libro_id = l.id
             WHERE pi.pedido_id = ?`,
            [orderId]
        );
        order.items = orderItems;
        res.status(200).json(order);

    } catch (error) {
        console.error('Error en getOrderByIdAdmin:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el pedido del administrador.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Actualizar el estado de un pedido (para administradores)
export const updateOrderStatusAdmin = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const orderId = parseInt(req.params.id, 10);
        const { estado_pedido } = req.body; // Ejemplo: "Enviado", "Entregado", "Cancelado"

        if (isNaN(orderId)) {
            return res.status(400).json({ message: 'El ID del pedido debe ser un número.' });
        }
        if (!estado_pedido) {
            return res.status(400).json({ message: 'El nuevo estado del pedido es requerido.' });
        }
        // Aquí podrías añadir validación para los valores permitidos de estado_pedido

        await connection.beginTransaction();

        const [result] = await connection.query(
            'UPDATE pedidos SET estado_pedido = ? WHERE id = ?',
            [estado_pedido, orderId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback(); // Revertir si no se actualizó nada (pedido no encontrado)
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Opcional: Podrías querer añadir lógica aquí si, por ejemplo, al cancelar un pedido se debe reponer el stock.
        // if (estado_pedido === 'Cancelado') { ... lógica de reponer stock ... }

        await connection.commit();
        res.status(200).json({ message: `Estado del pedido ${orderId} actualizado a ${estado_pedido}.` });

    } catch (error) {
        console.error('Error en updateOrderStatusAdmin:', error);
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Error al hacer rollback de la transacción:', rollbackError);
            }
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el estado del pedido.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
}; 