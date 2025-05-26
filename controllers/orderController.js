import pool from '../config/db.js';

// Obtener todos los pedidos del usuario autenticado
export const getUserOrders = async (req, res) => {
    if (!req.user || typeof req.user.id === 'undefined') {
        console.error('Error en getUserOrders: Usuario no autenticado o ID de usuario no disponible en req.user.');
        return res.status(401).json({ message: 'Autenticación requerida o información de usuario incompleta.' });
    }

    let connection;
    try {
        const userId = req.user.id;
        connection = await pool.getConnection();

        const [ordersData] = await connection.query(
            'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY fecha_pedido DESC',
            [userId]
        );

        if (ordersData.length === 0) {
            return res.status(200).json([]);
        }

        // Para cada pedido, obtener sus items (solo título y cantidad para la lista)
        const ordersWithItems = [];
        for (const order of ordersData) {
            console.log(`[getUserOrders] Procesando pedido ID: ${order.id}`); // Log del ID del pedido actual
            try {
                const [items] = await connection.query(
                    `SELECT 
                        pi.titulo_en_compra, 
                        pi.cantidad,
                        pi.precio_unitario_en_compra,
                        l.cover_image_url
                     FROM pedido_items pi
                     LEFT JOIN libros l ON pi.libro_id = l.id
                     WHERE pi.pedido_id = ?`,
                    [order.id]
                );
                console.log(`[getUserOrders] Items obtenidos para pedido ID ${order.id}:`, items.length); // Log de items obtenidos
                ordersWithItems.push({
                    ...order,
                    items: items // Añadir el array de items al objeto del pedido
                });
            } catch (itemError) {
                console.error(`[getUserOrders] Error al procesar items para pedido ID ${order.id}:`, itemError);
                // Decide cómo manejar el error: omitir el pedido, devolver un error parcial, o lanzar y que lo coja el catch general
                // Por ahora, vamos a lanzar para que el catch general de getUserOrders se active
                throw itemError; // Esto hará que el catch general de getUserOrders se active
            }
        }

        res.status(200).json(ordersWithItems);

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
        const userId = req.user.id;
        const orderId = parseInt(req.params.id, 10);

        console.log(`[getOrderById] Intentando obtener pedido. Usuario ID: ${userId}, Pedido ID (param): ${req.params.id}, Pedido ID (parsed): ${orderId}`);

        if (isNaN(orderId)) {
            console.log(`[getOrderById] Error: El ID del pedido "${req.params.id}" no es un número.`);
            return res.status(400).json({ message: 'El ID del pedido debe ser un número.' });
        }

        // Modificamos la query para seleccionar explícitamente los campos que necesitamos de 'pedidos'
        // incluyendo direccion_envio_json
        const [orderRows] = await connection.query(
            'SELECT id, usuario_id, monto_total, moneda, estado_pago, estado_pedido, direccion_envio_json, fecha_pedido FROM pedidos WHERE id = ? AND usuario_id = ?',
            [orderId, userId]
        );

        console.log(`[getOrderById] Resultado de la query a 'pedidos': ${orderRows.length} fila(s) encontrada(s).`);

        if (orderRows.length === 0) {
            console.log(`[getOrderById] Pedido ${orderId} no encontrado para el usuario ${userId} o no existe.`);
            return res.status(404).json({ message: 'Pedido no encontrado o no pertenece a este usuario.' });
        }

        const orderData = orderRows[0]; // Renombrar a orderData para claridad
        console.log(`[getOrderById] Pedido encontrado (datos base):`, JSON.stringify(orderData, null, 2));

        // Determinar tipo_entrega y procesar dirección
        let tipo_entrega;
        let direccion_envio_detallada = null;

        if (orderData.direccion_envio_json && Object.keys(orderData.direccion_envio_json).length > 0) {
            tipo_entrega = 'domicilio';
            // Asumimos que direccion_envio_json es un objeto JSON válido con los campos de dirección
            // Si es una cadena JSON, necesitaría JSON.parse()
            // Por tu tabla, es tipo JSON, así que la BD debería devolverlo ya parseado o como objeto.
            direccion_envio_detallada = typeof orderData.direccion_envio_json === 'string' ? 
                                        JSON.parse(orderData.direccion_envio_json) : 
                                        orderData.direccion_envio_json;
            console.log(`[getOrderById] Pedido a domicilio. Dirección parseada:`, direccion_envio_detallada);
        } else {
            tipo_entrega = 'recogida';
            console.log(`[getOrderById] Pedido para recogida en tienda.`);
        }

        // Añadir tipo_entrega y direccion_envio_detallada al objeto que se enviará
        const orderResponse = {
            ...orderData, // Todos los campos de la tabla pedidos
            tipo_entrega: tipo_entrega, // Añadimos el tipo_entrega determinado
            direccion_envio_detallada: direccion_envio_detallada // y la dirección detallada si aplica
        };
        // Eliminar el campo json original si no quieres enviarlo duplicado o si ya está procesado
        delete orderResponse.direccion_envio_json; 

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
        
        console.log(`[getOrderById] Items encontrados para el pedido ${orderId}: ${orderItems.length}`);
        orderResponse.items = orderItems; // Añadir items a la respuesta
        
        console.log(`[getOrderById] Enviando respuesta completa del pedido:`, JSON.stringify(orderResponse, null, 2));
        res.status(200).json(orderResponse);

    } catch (error) {
        console.error(`[getOrderById] CATCH ERROR para Pedido ID ${req.params.id}:`, error);
        // Verificar si el error es por JSON.parse si direccion_envio_json no es un JSON válido
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
            console.error(`[getOrderById] Error al parsear direccion_envio_json. Contenido:`, orderRows[0]?.direccion_envio_json);
             return res.status(500).json({ message: 'Error interno: Formato de dirección inválido en el pedido.', error: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al obtener el pedido.', error: error.message });
    } finally {
        if (connection) {
            console.log(`[getOrderById] Liberando conexión para Pedido ID ${req.params.id}`);
            connection.release();
        }
    }
};

// Crear un nuevo pedido
export const createOrder = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const userId = req.user.id;
        // Extraer deliveryMethod y shippingAddress del body
        const { items, totalAmount, deliveryMethod, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'El carrito está vacío. No se puede crear un pedido.' });
        }
        if (typeof totalAmount !== 'number' || totalAmount <= 0) {
            return res.status(400).json({ message: 'El monto total del pedido no es válido.' });
        }
        if (!deliveryMethod || (deliveryMethod === 'domicilio' && !shippingAddress)) {
            console.log('[createOrder] Datos de envío incompletos:', { deliveryMethod, shippingAddress });
            return res.status(400).json({ message: 'Método de envío o dirección faltante para envío a domicilio.' });
        }

        // Validar la estructura de shippingAddress si es a domicilio
        if (deliveryMethod === 'domicilio') {
            if (typeof shippingAddress !== 'object' || shippingAddress === null ||
                !shippingAddress.nombre_completo || 
                !shippingAddress.direccion_calle || 
                !shippingAddress.direccion_cp || 
                !shippingAddress.direccion_ciudad || 
                !shippingAddress.direccion_pais) {
                console.log('[createOrder] Estructura de shippingAddress inválida:', shippingAddress);
                return res.status(400).json({ message: 'La dirección de envío proporcionada no es válida o le faltan campos requeridos.' });
            }
        }

        await connection.beginTransaction();

        // Convertir shippingAddress a JSON string para guardarlo si es a domicilio, sino null
        const direccionEnvioJsonParaDB = deliveryMethod === 'domicilio' && shippingAddress 
            ? JSON.stringify(shippingAddress) 
            : null;

        console.log('[createOrder] Guardando pedido con:');
        console.log('  userId:', userId);
        console.log('  totalAmount:', totalAmount);
        console.log('  deliveryMethod (para lógica, no se guarda directo como campo separado aún):', deliveryMethod);
        console.log('  direccion_envio_json (para DB):', direccionEnvioJsonParaDB);

        // Asegúrate que tu tabla `pedidos` tiene la columna `direccion_envio_json` de tipo JSON
        // y que los otros campos coincidan (estado_pago, estado_pedido son valores por defecto aquí)
        const pedidoResult = await connection.query(
            'INSERT INTO pedidos (usuario_id, monto_total, moneda, estado_pago, estado_pedido, direccion_envio_json, fecha_pedido) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [userId, totalAmount, 'EUR', 'Pagado', 'Procesando', direccionEnvioJsonParaDB] // Usar la variable preparada
        );
        const newOrderId = pedidoResult[0].insertId;

        if (!newOrderId) {
            throw new Error('No se pudo obtener el ID del nuevo pedido.');
        }
        console.log('[createOrder] Pedido base creado con ID:', newOrderId);

        for (const item of items) {
            if (!item.book_id || typeof item.quantity !== 'number' || item.quantity <= 0 || typeof item.price !== 'number' || item.price < 0 || !item.title) {
                throw new Error(`Datos inválidos para el item del pedido: ${JSON.stringify(item)}`);
            }

            const [bookRows] = await connection.query('SELECT id, stock FROM libros WHERE api_id = ?', [item.book_id]);
            if (bookRows.length === 0) {
                throw new Error(`Libro con api_id ${item.book_id} no encontrado.`);
            }
            const realBookId = bookRows[0].id;
            const currentStock = bookRows[0].stock;
            if (currentStock < item.quantity) {
                throw new Error(`Stock insuficiente para el libro "${item.title}" (api_id: ${item.book_id}). Solicitado: ${item.quantity}, Disponible: ${currentStock}`);
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
        console.log('[createOrder] Items del pedido procesados y stock actualizado.');

        await connection.commit();
        console.log('[createOrder] Transacción completada (commit).');

        res.status(201).json({ 
            success: true, 
            message: 'Pedido creado con éxito.', 
            orderId: newOrderId 
        });

    } catch (error) {
        console.error('[createOrder] CATCH ERROR:', error);
        if (connection) {
            try {
                console.log('[createOrder] Error detectado, haciendo rollback...');
                await connection.rollback();
                console.log('[createOrder] Rollback completado.');
            } catch (rollbackError) {
                console.error('[createOrder] Error al hacer rollback de la transacción:', rollbackError);
            }
        }
        // Devolver mensajes de error específicos si es posible
        if (error.message.includes('Stock insuficiente') || error.message.includes('Libro con api_id') || error.message.includes('Datos inválidos para el item') || error.message.includes('La dirección de envío')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear el pedido.', error: error.message });
    } finally {
        if (connection) {
            console.log('[createOrder] Liberando conexión.');
            connection.release();
        }
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