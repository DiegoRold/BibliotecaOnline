import { getConnection } from '../config/db.js';

// Obtener todos los pedidos del usuario autenticado
export const getUserOrders = async (req, res) => {
    const connection = getConnection();
    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }

    try {
        const userId = req.user.userId; // Obtenido del middleware 'protect'

        const [orders] = await connection.query(
            'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY fecha_pedido DESC',
            [userId]
        );

        if (orders.length === 0) {
            return res.status(200).json([]); // Devolver array vacío si no hay pedidos, no un 404
        }

        // Para cada pedido, podríamos querer añadir sus items, pero para una lista general puede ser mucho.
        // Por ahora, devolvemos solo la información principal de los pedidos.
        // Si se quieren los items, se puede llamar a getOrderById.
        res.status(200).json(orders);

    } catch (error) {
        console.error('Error en getUserOrders:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los pedidos.', error: error.message });
    }
};

// Obtener un pedido específico por su ID para el usuario autenticado
export const getOrderById = async (req, res) => {
    const connection = getConnection();
    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }

    try {
        const userId = req.user.userId;
        const orderId = parseInt(req.params.id, 10);

        if (isNaN(orderId)) {
            return res.status(400).json({ message: 'El ID del pedido debe ser un número.' });
        }

        // Primero, obtener el pedido y verificar que pertenece al usuario
        const [orderRows] = await connection.query(
            'SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?',
            [orderId, userId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado o no pertenece a este usuario.' });
        }

        const order = orderRows[0];

        // Luego, obtener los items de ese pedido
        const [orderItems] = await connection.query(
            `SELECT 
                pi.libro_id, 
                pi.cantidad, 
                pi.precio_unitario_en_compra, 
                pi.titulo_en_compra, 
                l.cover_image_url, -- Opcional: traer la URL de la portada actual del libro
                l.author AS autor_libro -- Opcional: traer el autor actual del libro
             FROM pedido_items pi 
             LEFT JOIN libros l ON pi.libro_id = l.id -- LEFT JOIN por si el libro fue eliminado
             WHERE pi.pedido_id = ?`,
            [orderId]
        );

        // Añadir los items al objeto del pedido
        order.items = orderItems;

        res.status(200).json(order);

    } catch (error) {
        console.error(`Error en getOrderById (Pedido ID: ${req.params.id}):`, error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el pedido.', error: error.message });
    }
};

// --- Funciones para Administradores ---

// Obtener todos los pedidos (para administradores, con paginación)
export const getAllOrdersAdmin = async (req, res) => {
    const connection = getConnection();
    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }

    try {
        // Paginación básica para la lista de pedidos de admin
        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);
        page = (isNaN(page) || page < 1) ? 1 : page;
        limit = (isNaN(limit) || limit < 10) ? 10 : limit; // Default 10 por página
        const offset = (page - 1) * limit;

        // Query para contar el total de pedidos
        const [totalResult] = await connection.query('SELECT COUNT(*) as totalItems FROM pedidos');
        const totalItems = totalResult[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        // Query para obtener los pedidos paginados
        // Podríamos añadir más JOINs si quisiéramos info del usuario, etc.
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
    }
};

// Obtener un pedido específico por ID (para administradores)
export const getOrderByIdAdmin = async (req, res) => {
    const connection = getConnection();
    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }

    try {
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
                    l.cover_image_url, l.author AS autor_libro 
             FROM pedido_items pi LEFT JOIN libros l ON pi.libro_id = l.id 
             WHERE pi.pedido_id = ?`,
            [orderId]
        );
        order.items = orderItems;

        res.status(200).json(order);

    } catch (error) {
        console.error(`Error en getOrderByIdAdmin (Pedido ID: ${req.params.id}):`, error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el pedido.', error: error.message });
    }
};

// Actualizar el estado de un pedido (para administradores)
export const updateOrderStatusAdmin = async (req, res) => {
    const connection = getConnection();
    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }

    try {
        const orderId = parseInt(req.params.id, 10);
        const { estado_pedido } = req.body; // El nuevo estado del pedido

        if (isNaN(orderId)) {
            return res.status(400).json({ message: 'El ID del pedido debe ser un número.' });
        }
        if (!estado_pedido) {
            return res.status(400).json({ message: 'El campo \'estado_pedido\' es requerido.' });
        }

        // Opcional: Validar que el estado_pedido sea uno de los permitidos
        const estadosPermitidos = ['Procesando', 'Enviado', 'Entregado', 'Cancelado', 'En Espera']; // Ejemplo
        if (!estadosPermitidos.includes(estado_pedido)) {
            return res.status(400).json({ message: `Estado de pedido no válido. Permitidos: ${estadosPermitidos.join(', ')}` });
        }

        const [result] = await connection.query(
            'UPDATE pedidos SET estado_pedido = ? WHERE id = ?',
            [estado_pedido, orderId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado o estado sin cambios.' });
        }

        // Devolver el pedido actualizado
        const [updatedOrderRows] = await connection.query(
             'SELECT p.*, u.nombre as nombre_cliente, u.email as email_cliente FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?',
             [orderId]
        );
        
        res.status(200).json(updatedOrderRows[0]);

    } catch (error) {
        console.error(`Error en updateOrderStatusAdmin (Pedido ID: ${req.params.id}):`, error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el estado del pedido.', error: error.message });
    }
}; 