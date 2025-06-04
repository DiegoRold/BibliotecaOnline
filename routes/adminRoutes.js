import express from 'express';
import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// import { isAdmin } from '../middlewares/authMiddleware.js'; // Ya no se usa esta forma
import authMiddleware, { authorize } from '../middlewares/authMiddleware.js'; // Corregido
// IMPORTACIONES DEL CONTROLADOR DE ESTADÍSTICAS
import { 
    getMonthlyGrowthStats, 
    getSalesByCategoryStats,
    getTopBooksStats,
    getTopCustomersStats
} from '../controllers/statsController.js';

console.log('[adminRoutes.js] Script cargado'); // Log al inicio del script

const projectRoot = process.cwd(); // Obtener el directorio raíz del proyecto
const uploadPathBase = path.join(projectRoot, 'public', 'assets', 'books');
console.log(`[adminRoutes.js] Ruta de subida base absoluta configurada: ${uploadPathBase}`);

// Asegurarse de que el directorio de subida exista al inicio
try {
    fs.mkdirSync(uploadPathBase, { recursive: true });
    console.log(`[adminRoutes.js] Directorio de subida ${uploadPathBase} asegurado.`);
} catch (err) {
    console.error(`[adminRoutes.js] Error creando directorio de subida ${uploadPathBase}:`, err);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log(`[multer storage.destination] Intentando guardar en: ${uploadPathBase}`);
        cb(null, uploadPathBase);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const newFilename = uniqueSuffix + path.extname(file.originalname);
        console.log(`[multer storage.filename] Nombre original: ${file.originalname}, Nuevo nombre: ${newFilename}`);
        cb(null, newFilename);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        console.log(`[multer fileFilter] Filtrando archivo: ${file.originalname}, mimetype: ${file.mimetype}`);
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            console.log(`[multer fileFilter] Archivo rechazado: ${file.originalname}`);
            return cb(new Error('Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp)'), false);
        }
        console.log(`[multer fileFilter] Archivo aceptado: ${file.originalname}`);
        cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB para archivos, por ejemplo
});

const router = express.Router();
console.log('[adminRoutes.js] Router de admin inicializado.'); 

router.use((req, res, next) => {
    console.log(`[adminRoutes.js] Petición recibida en adminRouter: ${req.method} ${req.url}`);
    next();
});

// --- ENDPOINTS DE ESTADÍSTICAS ---
router.get('/stats/total-users', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const [result] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
        res.json({ total: result[0].total });
    } catch (error) {
        console.error('Error fetching total users:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener total de usuarios' });
    }
});

router.get('/stats/total-books', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const [result] = await pool.query('SELECT COUNT(*) AS total FROM libros');
        res.json({ total: result[0].total });
    } catch (error) {
        console.error('Error fetching total books:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener total de libros' });
    }
});

router.get('/stats/pending-orders', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const [result] = await pool.query("SELECT COUNT(*) AS total FROM pedidos WHERE estado_pedido = 'Procesando'");
        res.json({ total: result[0].total });
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener pedidos pendientes' });
    }
});

router.get('/stats/monthly-growth', authMiddleware, authorize('admin'), getMonthlyGrowthStats);

// NUEVA RUTA PARA VENTAS POR CATEGORÍA
router.get('/stats/sales-by-category', authMiddleware, authorize('admin'), getSalesByCategoryStats);

// NUEVA RUTA PARA TOP LIBROS
router.get('/stats/top-books', authMiddleware, authorize('admin'), getTopBooksStats);

// NUEVA RUTA PARA TOP CLIENTES
router.get('/stats/top-customers', authMiddleware, authorize('admin'), getTopCustomersStats);

router.get('/stats/overview-chart-data', authMiddleware, authorize('admin'), async (req, res) => {
    console.warn('[adminRoutes] /stats/overview-chart-data está devolviendo datos de ejemplo.');
    res.json({
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
            { label: 'Usuarios Registrados (Ejemplo)', data: [10, 20, 15, 25, 30, 22], borderColor: 'rgb(75, 192, 192)', tension: 0.1 },
            { label: 'Libros Vendidos (Ejemplo)', data: [5, 15, 10, 20, 25, 18], borderColor: 'rgb(255, 99, 132)', tension: 0.1 }
        ]
    });
});

router.get('/stats/recent-activity', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const [users] = await pool.query('SELECT nombre, email, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC LIMIT 3');
        const [orders] = await pool.query('SELECT id, usuario_id, monto_total, fecha_pedido, estado_pedido FROM pedidos ORDER BY fecha_pedido DESC LIMIT 3');
        const activities = [];
        users.forEach(user => activities.push({ timestamp: user.fecha_creacion, message: `Nuevo usuario registrado: ${user.nombre} (${user.email})` }));
        orders.forEach(order => activities.push({ timestamp: order.fecha_pedido, message: `Nuevo pedido #${order.id} creado por usuario ${order.usuario_id}. Estado: ${order.estado_pedido}, Total: ${order.monto_total}` }));
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json({ activities: activities.slice(0, 5) });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener actividad reciente' });
    }
});

// --- Gestión de Usuarios (CRUD) ---
router.get('/users', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, nombre, email, rol, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener usuarios' });
    }
});

router.get('/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const [user] = await pool.query('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [id]);
        if (user.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(user[0]);
    } catch (error) {
        console.error(`Error fetching user ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error en el servidor al obtener el usuario' });
    }
});

router.post('/users', authMiddleware, authorize('admin'), async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password || !rol) return res.status(400).json({ message: 'Nombre, email, contraseña y rol son requeridos' });
    try {
        // NOTA: ¡Hashear la contraseña aquí antes de guardarla!
        const [result] = await pool.query('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)', [nombre, email, password, rol]); // Usar hashedPassword
        res.status(201).json({ id: result.insertId, nombre, email, rol });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'El email ya está registrado' });
        res.status(500).json({ message: 'Error en el servidor al crear el usuario' });
    }
});

router.put('/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !rol) return res.status(400).json({ message: 'Nombre, email y rol son requeridos' });
    let query = 'UPDATE usuarios SET nombre = ?, email = ?, rol = ?';
    const queryParams = [nombre, email, rol];
    if (password) {
        // NOTA: ¡Hashear la contraseña aquí!
        query += ', password_hash = ?';
        queryParams.push(password); // Usar hashedPassword
    }
    query += ' WHERE id = ?';
    queryParams.push(id);
    try {
        const [result] = await pool.query(query, queryParams);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Usuario no encontrado para actualizar' });
        res.json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'El email ya está en uso por otro usuario' });
        res.status(500).json({ message: 'Error en el servidor al actualizar el usuario' });
    }
});

router.delete('/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Usuario no encontrado para eliminar' });
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        res.status(500).json({ message: 'Error en el servidor al eliminar el usuario' });
    }
});

// --- Gestión de Libros (CRUD) ---
router.get('/books', authMiddleware, authorize('admin'), async (req, res) => {
    console.log('[GET /books] Accediendo a la ruta');
    try {
        const [books] = await pool.query('SELECT * FROM libros ORDER BY id DESC');
        const processedBooks = books.map(book => {
            if (book.tags && typeof book.tags === 'string') {
                try { book.tags = JSON.parse(book.tags); } 
                catch (e) { console.error('Error parsing tags for book in list:', book.id, e); book.tags = []; }
            }
            return book;
        });
        res.json(processedBooks);
    } catch (error) {
        console.error('[GET /books] Error fetching books:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener libros' });
    }
});

router.get('/books/:id', authMiddleware, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    console.log(`[GET /books/${id}] Accediendo a la ruta`);
    try {
        const [bookRows] = await pool.query('SELECT * FROM libros WHERE id = ?', [id]);
        if (bookRows.length === 0) return res.status(404).json({ message: 'Libro no encontrado' });
        const book = bookRows[0];
        if (book.tags && typeof book.tags === 'string') {
            try { book.tags = JSON.parse(book.tags); } 
            catch (e) { console.error('Error parsing tags for book:', book.id, e); book.tags = []; }
        }
        res.json(book);
    } catch (error) {
        console.error(`[GET /books/${id}] Error fetching book:`, error);
        res.status(500).json({ message: 'Error en el servidor al obtener el libro' });
    }
});

router.post('/books', authMiddleware, authorize('admin'), upload.single('bookCoverImage'), async (req, res) => {
    console.log('[POST /books] Ruta alcanzada.');
    if (req.file) console.log('[POST /books] Archivo recibido:', req.file);
    else console.log('[POST /books] No se recibió archivo.');
    console.log('[POST /books] req.body:', req.body);
    const { title, author, description, price, stock, publication_date, tags, publisher } = req.body;
    if (!title || !author || price === undefined || stock === undefined) {
        console.log('[POST /books] Error de validación: campos faltantes.');
        if (req.file) { try { fs.unlinkSync(req.file.path); console.log('[POST /books] Archivo temporal eliminado.'); } catch (e) { console.error('[POST /books] Error eliminando archivo temp:', e); } }
        return res.status(400).json({ message: 'Título, autor, precio y stock son requeridos.' });
    }
    let coverImageUrl = req.file ? path.join('assets', 'books', req.file.filename).replace(/\\/g, "/") : null;
    try {
        const tagsString = tags; 
        const query = 'INSERT INTO libros (title, author, description, price, stock, publication_date, cover_image_url, tags, publisher) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const params = [title, author, description, parseFloat(price), parseInt(stock, 10), publication_date, coverImageUrl, tagsString, publisher];
        const [result] = await pool.query(query, params);
        const newBookData = { ...req.body, id: result.insertId, cover_image_url: coverImageUrl, tags: JSON.parse(tagsString || '[]') };
        delete newBookData.bookCoverImage; delete newBookData.current_cover_image_url;
        res.status(201).json(newBookData);
    } catch (error) {
        console.error('[POST /books] Error al crear libro:', error);
        if (req.file) { try { fs.unlinkSync(req.file.path); console.log('[POST /books] Archivo temp eliminado por error BD.'); } catch (e) { console.error('[POST /books] Error eliminando archivo temp por error BD:', e); } }
        res.status(500).json({ message: 'Error en el servidor al crear el libro' });
    }
});

router.put('/books/:id', authMiddleware, authorize('admin'), upload.single('bookCoverImage'), async (req, res) => {
    const { id } = req.params;
    console.log('[PUT /books/:id] Archivo recibido:', req.file ? req.file.filename : 'Ninguno');
    console.log('[PUT /books/:id] req.body:', req.body);
    const { title, author, description, price, stock, publication_date, tags, publisher, current_cover_image_url } = req.body;
    if (!title || !author || price === undefined || stock === undefined) {
        if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) { console.error('Error eliminando temp:', e); } }
        return res.status(400).json({ message: 'Título, autor, precio y stock son requeridos.' });
    }
    let coverImageUrl = current_cover_image_url || null;
    if (req.file) {
        const newRelativePath = path.join('assets', 'books', req.file.filename).replace(/\\/g, "/");
        if (current_cover_image_url && current_cover_image_url !== newRelativePath) {
            const oldPathFull = path.join(projectRoot, 'public', current_cover_image_url);
            try { if (fs.existsSync(oldPathFull)) fs.unlinkSync(oldPathFull); } 
            catch (err) { console.warn('[PUT /books/:id] Error eliminando portada antigua:', err.message); }
        }
        coverImageUrl = newRelativePath;
    }
    try {
        const tagsString = tags; 
        const query = 'UPDATE libros SET title = ?, author = ?, description = ?, price = ?, stock = ?, publication_date = ?, cover_image_url = ?, tags = ?, publisher = ? WHERE id = ?';
        const params = [title, author, description, parseFloat(price), parseInt(stock, 10), publication_date, coverImageUrl, tagsString, publisher, id];
        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) { console.error('Error eliminando temp:', e); } }
            return res.status(404).json({ message: 'Libro no encontrado para actualizar' });
        }
        const updatedBookData = { ...req.body, id: parseInt(id), cover_image_url: coverImageUrl, tags: JSON.parse(tagsString || '[]') };
        delete updatedBookData.bookCoverImage; delete updatedBookData.current_cover_image_url;
        res.json(updatedBookData);
    } catch (error) {
        console.error('[PUT /books/:id] Error al actualizar libro:', error);
        if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) { console.error('Error eliminando temp:', e); } }
        res.status(500).json({ message: 'Error en el servidor al actualizar el libro' });
    }
});

router.delete('/books/:id', authMiddleware, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const [bookRows] = await pool.query('SELECT cover_image_url FROM libros WHERE id = ?', [id]);
        const bookToDelete = bookRows[0];
        const [result] = await pool.query('DELETE FROM libros WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Libro no encontrado para eliminar' });
        if (bookToDelete && bookToDelete.cover_image_url) {
            const imagePath = path.join(projectRoot, 'public', bookToDelete.cover_image_url);
            try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } 
            catch (err) { console.warn('[DELETE /books/:id] Error eliminando imagen:', err.message); }
        }
        res.status(204).send();
    } catch (error) {
        console.error('[DELETE /books/:id] Error deleting book:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'No se puede eliminar el libro porque tiene pedidos asociados.' });
        res.status(500).json({ message: 'Error en el servidor al eliminar el libro' });
    }
});

// --- Gestión de Pedidos (Admin) ---
router.get('/orders', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const { status, userId } = req.query;
        const sortBy = req.query.sortBy || 'fecha_pedido'; 
        const orderDirection = req.query.orderDirection || 'DESC';
        let baseQuery = `
            SELECT p.id, p.usuario_id, p.fecha_pedido, p.estado_pedido, p.monto_total, p.moneda, p.estado_pago, u.nombre AS nombre_usuario, u.email AS email_usuario    
            FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id`;
        const queryParams = [];
        const whereConditions = [];
        if (status) { whereConditions.push('p.estado_pedido = ?'); queryParams.push(status); }
        if (userId) { whereConditions.push('p.usuario_id = ?'); queryParams.push(userId); }
        if (whereConditions.length > 0) baseQuery += ' WHERE ' + whereConditions.join(' AND ');
        const allowedSortBy = ['id', 'fecha_pedido', 'monto_total', 'estado_pedido', 'usuario_id'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? `p.${sortBy}` : 'p.fecha_pedido';
        const safeOrderDirection = orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        baseQuery += ` ORDER BY ${safeSortBy} ${safeOrderDirection}`;
        const [orders] = await pool.query(baseQuery, queryParams);
        const formattedOrders = orders.map(order => ({ id: order.id, user_id: order.usuario_id, created_at: order.fecha_pedido, status: order.estado_pedido, total_price: order.monto_total }));
        res.json(formattedOrders);
    } catch (error) {
        console.error('[adminRoutes.js] Error en GET /api/admin/orders:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener los pedidos.', error: error.message });
    }
});

router.get('/orders/:orderId', authMiddleware, authorize('admin'), async (req, res) => {
    const { orderId } = req.params;
    try {
        const pedidoQuery = `
            SELECT p.id, p.usuario_id, p.fecha_pedido, p.estado_pedido, p.monto_total, p.moneda, p.estado_pago, p.direccion_envio_json, p.admin_notes, u.nombre AS nombre_usuario, u.email AS email_usuario
            FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?;`;
        const [pedidoResult] = await pool.query(pedidoQuery, [orderId]);
        if (pedidoResult.length === 0) return res.status(404).json({ message: 'Pedido no encontrado.' });
        const orderData = pedidoResult[0];
        const itemsQuery = `SELECT pi.id AS item_id, pi.libro_id, pi.cantidad, pi.precio_unitario_en_compra, pi.titulo_en_compra FROM pedido_items pi WHERE pi.pedido_id = ?;`;
        const [itemsResult] = await pool.query(itemsQuery, [orderId]);
        const formattedOrder = {
            id: orderData.id, user_id: orderData.usuario_id, created_at: orderData.fecha_pedido,
            status: orderData.estado_pedido, total_price: orderData.monto_total, admin_notes: orderData.admin_notes,
            user: { id: orderData.usuario_id, name: orderData.nombre_usuario, email: orderData.email_usuario },
            items: itemsResult.map(item => ({ book_id: item.libro_id, book_title: item.titulo_en_compra, quantity: item.cantidad, price_at_purchase: item.precio_unitario_en_compra })),
            shipping_address: (() => {
                if (orderData.direccion_envio_json) {
                    if (typeof orderData.direccion_envio_json === 'string' && orderData.direccion_envio_json.trim() !== "[object Object]") {
                        try { return JSON.parse(orderData.direccion_envio_json); } 
                        catch (e) { console.error(`Error parseando JSON dir. pedido ${orderId}:`, orderData.direccion_envio_json, e); return { error: "Formato de dirección inválido.", raw: orderData.direccion_envio_json }; }
                    } else if (orderData.direccion_envio_json === "[object Object]") {
                        console.warn(`direccion_envio_json para pedido ${orderId} es '[object Object]'.`); return { error: "Datos de dirección corruptos.", raw: orderData.direccion_envio_json };
                    } else { return orderData.direccion_envio_json; }
                } else { return null; }
            })()
        };
        res.json(formattedOrder);
    } catch (error) {
        console.error('[adminRoutes.js] Error en GET /api/admin/orders/:orderId:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener detalles del pedido', error: error.message });
    }
});

// PUT /api/admin/orders/:orderId - Actualizar el estado y/o notas de un pedido
router.put('/orders/:orderId', authMiddleware, authorize('admin'), async (req, res) => {
    const { orderId } = req.params;
    const { status, admin_notes } = req.body; // El frontend debería enviar 'status', no 'estado_pedido'
    console.log(`[adminRoutes.js] PUT /api/admin/orders/${orderId} - Solicitud recibida. Body:`, req.body);

    if (status === undefined && admin_notes === undefined) {
        return res.status(400).json({ message: 'Debe proporcionar al menos un estado o notas administrativas para actualizar.' });
    }

    try {
        let updateFields = [];
        let queryParams = [];

        if (status !== undefined) {
            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado']; // Permitir ambos
            // Normalizar el estado a minúsculas para la validación interna si es necesario, pero guardar el valor que se espera en la BBDD.
            // Aquí asumiremos que la BBDD espera los valores como se reciben o los normaliza.
            // Si la BBDD SOLO espera 'Entregado', 'Procesando', etc. (con mayúscula inicial), y el frontend envía 'delivered', 'processing',
            // entonces aquí se necesitaría un mapeo ANTES de la validación o la validación debería ser más flexible.
            // Por ahora, si tu BBDD y frontend usan los mismos strings (o la BBDD es case-insensitive para estos estados), está bien.
            // Si no, ajusta la validación o el valor que se guarda.
            
            // Para ser más robusto, podrías tener un mapeo:
            // const statusMap = { 'pending': 'Pendiente', 'processing': 'Procesando', ... };
            // const dbStatus = statusMap[status.toLowerCase()] || status; // Usar dbStatus para la query

            if (!validStatuses.some(s => s.toLowerCase() === status.toLowerCase())) {
                 console.log(`[adminRoutes.js] PUT /api/admin/orders/${orderId} - Estado no válido: ${status}`);
                return res.status(400).json({ message: `Estado de pedido no válido: ${status}.` });
            }
            updateFields.push('estado_pedido = ?');
            queryParams.push(status); // Guardar el estado como viene si la BBDD lo maneja
        }

        if (admin_notes !== undefined) {
            updateFields.push('admin_notes = ?');
            queryParams.push(admin_notes);
        }

        if (updateFields.length === 0) {
            // Esto no debería ocurrir si la validación inicial (status === undefined && admin_notes === undefined) funciona.
            return res.status(400).json({ message: 'No hay campos válidos para actualizar.' });
        }

        const query = `UPDATE pedidos SET ${updateFields.join(', ')} WHERE id = ?`;
        queryParams.push(orderId);

        console.log(`[adminRoutes.js] PUT /api/admin/orders/${orderId} - Query: ${query}`, queryParams);
        const [result] = await pool.query(query, queryParams);

        if (result.affectedRows === 0) {
            console.log(`[adminRoutes.js] PUT /api/admin/orders/${orderId} - Pedido no encontrado para actualizar.`);
            return res.status(404).json({ message: 'Pedido no encontrado para actualizar.' });
        }

        console.log(`[adminRoutes.js] PUT /api/admin/orders/${orderId} - Pedido actualizado.`);
        // Devolver el pedido actualizado podría ser útil para el frontend
        const [updatedOrderRows] = await pool.query(
            `SELECT p.id, p.usuario_id, p.fecha_pedido, p.estado_pedido, p.monto_total, p.admin_notes, u.nombre AS nombre_usuario, u.email AS email_usuario
             FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?`, [orderId]
        );
        res.json({ message: 'Pedido actualizado correctamente.', order: updatedOrderRows[0] });

    } catch (error) {
        console.error(`[adminRoutes.js] Error en PUT /api/admin/orders/${orderId}:`, error);
        res.status(500).json({ message: 'Error en el servidor al actualizar el pedido.', error: error.message });
    }
});


export default router;