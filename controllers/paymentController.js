import fetch from 'node-fetch'; // Para hacer peticiones HTTP
import { getConnection } from '../config/db.js';

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_URL } = process.env;

// Función para obtener un token de acceso de PayPal
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    try {
        const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error al obtener token de PayPal:', errorData);
            throw new Error(`PayPal OAuth Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Excepción al obtener token de PayPal:', error);
        throw error; // Re-lanzar para que el llamador lo maneje
    }
}

// Crear una orden de pago con PayPal
export const createPayPalOrder = async (req, res) => {
    // En un caso real, los detalles del pedido (items, monto) vendrían de req.body,
    // probablemente del carrito de compras del usuario.
    // Por ahora, usaremos un ejemplo hardcodeado.
    const { cart, totalAmount } = req.body; // Esperamos un objeto con el carrito y el monto total

    if (!cart || !Array.isArray(cart) || cart.length === 0 || totalAmount === undefined || isNaN(parseFloat(totalAmount))) {
        return res.status(400).json({ message: 'Datos del carrito y monto total son requeridos.' });
    }

    try {
        const accessToken = await getPayPalAccessToken();

        // Calcular el item_total a partir del carrito recibido
        const calculatedItemTotal = cart.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);

        // Validar que el totalAmount enviado por el cliente coincida con el calculado
        // Esto es una buena práctica para asegurar la integridad.
        // Se permite una pequeña diferencia por posibles errores de redondeo de punto flotante.
        if (Math.abs(parseFloat(totalAmount) - calculatedItemTotal) > 0.001) {
            console.warn(`Discrepancia en el monto total: Enviado ${totalAmount}, Calculado (item_total) ${calculatedItemTotal.toFixed(2)}`);
            // Podrías devolver un error aquí si la discrepancia es grande o simplemente usar el calculado.
            // Por ahora, usaremos el calculado para el desglose y el enviado para el total general,
            // pero idealmente deberían coincidir o el backend debería recalcular todo.
            // Para mayor precisión y evitar el error de PayPal, asegurémonos que el `value` general también sea la suma de los items
            // si no hay otros costos como impuestos o envío.
            if (parseFloat(totalAmount).toFixed(2) !== calculatedItemTotal.toFixed(2)) {
                 return res.status(400).json({
                    message: `El monto total enviado (${totalAmount}) no coincide con la suma calculada de los items del carrito (${calculatedItemTotal.toFixed(2)}). Por favor, verifique el carrito.`,
                    calculatedItemTotal: calculatedItemTotal.toFixed(2),
                    sentTotalAmount: parseFloat(totalAmount).toFixed(2)
                });
            }
        }

        const orderPayload = {
            intent: 'CAPTURE', // Intención de capturar el pago inmediatamente después de la aprobación del cliente
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: calculatedItemTotal.toFixed(2), // Usar el total calculado para el valor general
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: calculatedItemTotal.toFixed(2) // Usar el total calculado aquí
                        }
                        // Aquí podrías añadir tax_total, shipping, etc. si los tuvieras
                    }
                },
                items: cart.map(item => ({
                    name: item.name, // Nombre del libro/producto
                    quantity: item.quantity.toString(),
                    unit_amount: {
                        currency_code: 'USD',
                        value: parseFloat(item.price).toFixed(2) // Precio unitario del libro/producto
                    },
                    // sku: item.sku || 'N/A', // Opcional: SKU del producto
                    // category: 'PHYSICAL_GOODS' // Opcional, dependiendo del tipo de producto
                }))
            }],
            // Opcional: URLs de redirección después del pago
            application_context: {
                return_url: 'http://localhost:3001/payment-success', // URL a la que el cliente es redirigido si el pago es exitoso
                cancel_url: 'http://localhost:3001/payment-cancel'  // URL si el cliente cancela
            }
        };

        const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                // 'PayPal-Request-Id': 'SOME_UNIQUE_ID' // Opcional para idempotencia
            },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error al crear orden de PayPal:', errorData);
            let errorMessage = `Error al crear la orden de PayPal: ${response.status}`;
            if (errorData && errorData.details) {
                errorMessage += ` - Detalles: ${errorData.details.map(d => `${d.issue} (${d.description})`).join(', ')}`;
            }
            return res.status(response.status).json({ message: errorMessage, details: errorData.details });
        }

        const data = await response.json();
        // Devolvemos el ID de la orden de PayPal, el frontend lo usará para el checkout con PayPal
        res.status(201).json({ orderId: data.id, approvalUrl: data.links.find(link => link.rel === 'approve').href });

    } catch (error) {
        console.error('Excepción al crear orden de PayPal:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear la orden de pago.', error: error.message });
    }
};

// Aquí añadiremos la función para capturar el pago después...
export const capturePayPalOrder = async (req, res) => {
    console.log('Body recibido en capturePayPalOrder:', req.body);
    // AHORA ESPERAMOS orderId Y cart
    const { orderId, cart } = req.body; 

    if (!orderId) {
        return res.status(400).json({ message: 'El ID de la orden de PayPal (orderId) es requerido.' });
    }
    // Validar el carrito que se reenvía
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ message: 'Se requiere el array del carrito (cart) con los items del pedido.' });
    }
    for (const item of cart) {
        if (item.id === undefined || item.quantity === undefined || item.price === undefined || item.name === undefined) { // Asumimos que el cart tiene id (libro_id), quantity, price, name
            return res.status(400).json({ message: 'Cada item del carrito debe tener id (libro_id), quantity, price y name.' });
        }
    }

    const dbConnection = getConnection(); // Obtener la conexión a nuestra BD
    if (!dbConnection || dbConnection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }

    try {
        const accessToken = await getPayPalAccessToken(); // Token para API PayPal

        // 1. Capturar el pago en PayPal
        const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            }
        });
        
        const payPalTransactionData = await response.json();

        if (!response.ok) {
            console.error('Error al capturar orden de PayPal:', payPalTransactionData);
            let errorMessage = `Error al capturar la orden de PayPal ${orderId}: ${response.status}`;
            if (payPalTransactionData && payPalTransactionData.details) {
                errorMessage += ` - Detalles: ${payPalTransactionData.details.map(d => `${d.issue} (${d.description})`).join(', ')}`;
            }
            if (payPalTransactionData && payPalTransactionData.name === 'INSTRUMENT_DECLINED') {
                return res.status(400).json({ 
                    message: 'Pago rechazado por el procesador de pagos o el banco del cliente.', 
                    paypal_error: payPalTransactionData 
                });
            }
            return res.status(response.status).json({ message: errorMessage, details: payPalTransactionData.details, paypal_error: payPalTransactionData });
        }
        
        // Si la captura en PayPal fue exitosa (status COMPLETED es lo ideal)
        if (payPalTransactionData.status !== 'COMPLETED') {
            // Aunque la API de captura no dio error http, el estado puede no ser COMPLETED
            // Ej. podría ser PENDING si PayPal necesita revisar la transacción
            // Aquí deberías decidir cómo manejar estados no completados.
            // Por ahora, si no es COMPLETED, lo consideramos un fallo para nuestro sistema de pedidos.
            console.warn('El estado de la transacción de PayPal no es COMPLETED:', payPalTransactionData);
            return res.status(400).json({
                message: `El pago de PayPal no se completó exitosamente. Estado: ${payPalTransactionData.status}`,
                paypal_transaction: payPalTransactionData
            });
        }
        
        // 2. El pago en PayPal fue exitoso y COMPLETED. Proceder con la lógica de nuestra base de datos.
        console.log('Pago de PayPal capturado exitosamente:', payPalTransactionData);

        await dbConnection.beginTransaction(); // INICIAR TRANSACCIÓN

        try {
            // 2.1. Insertar en la tabla `pedidos`
            const userId = req.user.userId; // Obtenido del middleware 'protect'
            const paypalOrderId = payPalTransactionData.id;
            // Asumimos que hay una sola captura y es la principal
            const paypalTransactionId = payPalTransactionData.purchase_units[0]?.payments?.captures[0]?.id || null; 
            const montoTotal = parseFloat(payPalTransactionData.purchase_units[0]?.payments?.captures[0]?.amount?.value || '0');
            const moneda = payPalTransactionData.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code || 'USD';
            const estadoPago = payPalTransactionData.status; // Debería ser 'COMPLETED'
            const direccionEnvioJson = payPalTransactionData.purchase_units[0]?.shipping ? JSON.stringify(payPalTransactionData.purchase_units[0].shipping) : null;

            const [pedidoResult] = await dbConnection.query(
                `INSERT INTO pedidos (usuario_id, paypal_order_id, paypal_transaction_id, monto_total, moneda, estado_pago, direccion_envio_json) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, paypalOrderId, paypalTransactionId, montoTotal, moneda, estadoPago, direccionEnvioJson]
            );
            const nuevoPedidoId = pedidoResult.insertId;

            // 2.2. Insertar en `pedido_items` y actualizar stock
            for (const item of cart) {
                const libroId = parseInt(item.id); // Asumimos que el cart tiene el id del libro
                const cantidadComprada = parseInt(item.quantity);
                const precioUnitario = parseFloat(item.price);
                const tituloLibro = item.name; // Asumimos que el cart tiene el nombre/título del libro

                // Verificar stock antes de actualizar (opcional pero recomendado)
                const [stockRows] = await dbConnection.query('SELECT stock FROM libros WHERE id = ?', [libroId]);
                if (stockRows.length === 0) {
                    throw new Error(`Libro con ID ${libroId} no encontrado para el item del pedido.`);
                }
                const stockActual = stockRows[0].stock;
                if (stockActual < cantidadComprada) {
                    throw new Error(`Stock insuficiente para el libro '${tituloLibro}' (ID: ${libroId}). Stock disponible: ${stockActual}, Solicitado: ${cantidadComprada}.`);
                }

                // Insertar item del pedido
                await dbConnection.query(
                    `INSERT INTO pedido_items (pedido_id, libro_id, cantidad, precio_unitario_en_compra, titulo_en_compra)
                     VALUES (?, ?, ?, ?, ?)`,
                    [nuevoPedidoId, libroId, cantidadComprada, precioUnitario, tituloLibro]
                );

                // Actualizar stock
                await dbConnection.query(
                    'UPDATE libros SET stock = stock - ? WHERE id = ?',
                    [cantidadComprada, libroId]
                );
            }

            await dbConnection.commit(); // CONFIRMAR TRANSACCIÓN
            console.log(`Pedido ${nuevoPedidoId} creado exitosamente en la base de datos.`);

            res.status(200).json({ 
                message: 'Pago capturado y pedido creado exitosamente.', 
                pedidoIdEnSistema: nuevoPedidoId,
                paypalTransactionDetails: payPalTransactionData 
            });

        } catch (dbError) {
            await dbConnection.rollback(); // REVERTIR TRANSACCIÓN si hay error en la DB
            console.error('Error de base de datos al procesar el pedido después del pago:', dbError);
            // Aquí podrías necesitar lógica para reembolsar el pago de PayPal si la DB falla críticamente.
            // Por ahora, solo informamos un error interno.
            res.status(500).json({ 
                message: 'Pago de PayPal exitoso, pero ocurrió un error al registrar el pedido en nuestro sistema. Por favor, contacte a soporte.',
                error: dbError.message,
                paypal_transaction_id: payPalTransactionData.purchase_units[0]?.payments?.captures[0]?.id
            });
        }

    } catch (error) // Error en la llamada a PayPal o error general del controlador
    {
        console.error('Excepción general en capturePayPalOrder:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar el pago.', error: error.message });
    }
}; 