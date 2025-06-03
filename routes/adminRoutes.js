import express from 'express';
import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// import { isAdmin } from '../middlewares/authMiddleware.js'; // Ya no se usa esta forma
import authMiddleware, { authorize } from '../middlewares/authMiddleware.js'; // Corregido
import { getMonthlyGrowthStats } from '../controllers/statsController.js'; // <--- AÑADIR ESTA LÍNEA

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
console.log('[adminRoutes.js] Router de admin inicializado.'); // Log temporal

router.use((req, res, next) => {
    console.log(`[adminRoutes.js] Petición recibida en adminRouter: ${req.method} ${req.url}`); // Log temporal
    next();
});

// Endpoint para obtener el total de usuarios
// GET /api/admin/stats/total-users
router.get('/stats/total-users', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const [result] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
        res.json({ total: result[0].total });
    } catch (error) {
        console.error('Error fetching total users:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener total de usuarios' });
    }
});

// Endpoint para obtener el total de libros
// GET /api/admin/stats/total-books
router.get('/stats/total-books', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const [result] = await pool.query('SELECT COUNT(*) AS total FROM libros');
        res.json({ total: result[0].total });
    } catch (error) {
        console.error('Error fetching total books:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener total de libros' });
    }
});

// Endpoint para obtener el total de pedidos pendientes
// GET /api/admin/stats/pending-orders
router.get('/stats/pending-orders', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        // Asumimos que 'Procesando' es el estado para pedidos pendientes
        const [result] = await pool.query("SELECT COUNT(*) AS total FROM pedidos WHERE estado_pedido = 'Procesando'");
        res.json({ total: result[0].total });
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener pedidos pendientes' });
    }
});

// Endpoint para los datos de crecimiento mensual para el gráfico principal
// GET /api/admin/stats/monthly-growth
router.get('/stats/monthly-growth', authMiddleware, authorize('admin'), getMonthlyGrowthStats);

// Endpoint para obtener datos del gráfico de visión general
// GET /api/admin/stats/overview-chart-data
router.get('/stats/overview-chart-data', authMiddleware, authorize('admin'), async (req, res) => {
    // TODO: Implementar lógica para obtener datos reales del gráfico
    // Por ahora, devolvemos la misma estructura de ejemplo que espera el frontend
    console.warn('[adminRoutes] /stats/overview-chart-data está devolviendo datos de ejemplo.');
    res.json({
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Usuarios Registrados (Ejemplo)',
                data: [10, 20, 15, 25, 30, 22],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Libros Vendidos (Ejemplo)',
                data: [5, 15, 10, 20, 25, 18],
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }
        ]
    });
});

// Endpoint para obtener la actividad reciente
// GET /api/admin/stats/recent-activity
router.get('/stats/recent-activity', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        // Obtener los últimos 3 usuarios registrados
        const [users] = await pool.query('SELECT nombre, email, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC LIMIT 3');
        // Obtener los últimos 3 pedidos
        const [orders] = await pool.query('SELECT id, usuario_id, monto_total, fecha_pedido, estado_pedido FROM pedidos ORDER BY fecha_pedido DESC LIMIT 3');

        const activities = [];
        users.forEach(user => {
            activities.push({
                timestamp: user.fecha_creacion,
                message: `Nuevo usuario registrado: ${user.nombre} (${user.email})`
            });
        });
        orders.forEach(order => {
            activities.push({
                timestamp: order.fecha_pedido,
                message: `Nuevo pedido #${order.id} creado por usuario ${order.usuario_id}. Estado: ${order.estado_pedido}, Total: ${order.monto_total}`
            });
        });

        // Ordenar actividades combinadas por fecha (más recientes primero)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({ activities: activities.slice(0, 5) }); // Devolver las 5 actividades más recientes
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener actividad reciente' });
    }
});

// --- Gestión de Usuarios (CRUD) ---

// GET /api/admin/users - Obtener todos los usuarios
router.get('/users', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, nombre, email, rol, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener usuarios' });
    }
});

// GET /api/admin/users/:id - Obtener un usuario por ID (para editar)
router.get('/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const [user] = await pool.query('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user[0]);
    } catch (error) {
        console.error(`Error fetching user ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error en el servidor al obtener el usuario' });
    }
});

// POST /api/admin/users - Crear un nuevo usuario
// NOTA: La creación de usuarios desde el panel de admin usualmente requiere hashing de contraseña.
// Aquí se asume que la contraseña se envía en texto plano y se hashea antes de guardar, 
// o que se usa la misma lógica de hashing que en el registro normal.
// Por simplicidad, aquí no se incluye el hashing, pero DEBERÍA implementarse en un entorno real.
router.post('/users', authMiddleware, authorize('admin'), async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ message: 'Nombre, email, contraseña y rol son requeridos' });
    }
    try {
        // Aquí deberías hashear la contraseña antes de guardarla
        // Ejemplo: const hashedPassword = await bcrypt.hash(password, 10);
        // Y guardar hashedPassword en lugar de password
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
            [nombre, email, password, rol] // Usar hashedPassword aquí
        );
        res.status(201).json({ id: result.insertId, nombre, email, rol });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email ya está registrado' });
        }
        res.status(500).json({ message: 'Error en el servidor al crear el usuario' });
    }
});

// PUT /api/admin/users/:id - Actualizar un usuario
router.put('/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !rol) {
        return res.status(400).json({ message: 'Nombre, email y rol son requeridos' });
    }

    let query = 'UPDATE usuarios SET nombre = ?, email = ?, rol = ?';
    const queryParams = [nombre, email, rol];

    if (password) {
        // Si se provee una contraseña, hashearla y añadirla a la query
        // const hashedPassword = await bcrypt.hash(password, 10);
        query += ', password_hash = ?';
        queryParams.push(password); // Usar hashedPassword aquí
    }

    query += ' WHERE id = ?';
    queryParams.push(id);

    try {
        const [result] = await pool.query(query, queryParams);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado para actualizar' });
        }
        res.json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email ya está en uso por otro usuario' });
        }
        res.status(500).json({ message: 'Error en el servidor al actualizar el usuario' });
    }
});

// DELETE /api/admin/users/:id - Eliminar un usuario
router.delete('/users/:id', authMiddleware, authorize('admin'), async (req, res) => { // Asegurar isAdmin aquí también
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado para eliminar' });
        }
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        res.status(500).json({ message: 'Error en el servidor al eliminar el usuario' });
    }
});

// --- Gestión de Libros (CRUD) ---

// GET /api/admin/books - Obtener todos los libros
router.get('/books', authMiddleware, authorize('admin'), async (req, res) => {
    console.log('[GET /books] Accediendo a la ruta');
    try {
        const [books] = await pool.query('SELECT * FROM libros ORDER BY id DESC');
        
        const processedBooks = books.map(book => {
            if (book.tags && typeof book.tags === 'string') {
                try {
                    book.tags = JSON.parse(book.tags);
                } catch (e) {
                    console.error('Error parsing tags for book in list:', book.id, e);
                    book.tags = []; 
                }
            }
            return book;
        });
        res.json(processedBooks);
    } catch (error) {
        console.error('[GET /books] Error fetching books:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener libros' });
    }
});

// GET /api/admin/books/:id - Obtener un libro por ID
router.get('/books/:id', authMiddleware, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    console.log(`[GET /books/${id}] Accediendo a la ruta`);
    try {
        const [bookRows] = await pool.query('SELECT * FROM libros WHERE id = ?', [id]);
        if (bookRows.length === 0) {
            return res.status(404).json({ message: 'Libro no encontrado' });
        }
        const book = bookRows[0];
        if (book.tags && typeof book.tags === 'string') {
            try {
                book.tags = JSON.parse(book.tags);
            } catch (e) {
                console.error('Error parsing tags for book:', book.id, e);
                book.tags = [];
            }
        }
        res.json(book);
    } catch (error) {
        console.error(`[GET /books/${id}] Error fetching book:`, error);
        res.status(500).json({ message: 'Error en el servidor al obtener el libro' });
    }
});

// POST /api/admin/books - Crear un nuevo libro
router.post('/books', authMiddleware, authorize('admin'), upload.single('bookCoverImage'), async (req, res) => {
    console.log('[POST /books] Ruta alcanzada.');
    if (req.file) {
        console.log('[POST /books] Archivo recibido por multer:', req.file);
    } else {
        console.log('[POST /books] No se recibió archivo (req.file está indefinido).');
    }
    console.log('[POST /books] req.body:', req.body);

    const { title, author, description, price, stock, publication_date, tags, publisher } = req.body;
    
    if (!title || !author || price === undefined || stock === undefined) {
        console.log('[POST /books] Error de validación: campos faltantes.');
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('[POST /books] Archivo temporal eliminado por validación fallida.');
            } catch (e) {
                console.error('[POST /books] Error eliminando archivo temporal por validación:', e);
            }
        }
        return res.status(400).json({ message: 'Título, autor, precio y stock son requeridos.' });
    }

    let coverImageUrl = null;
    if (req.file) {
        coverImageUrl = path.join('assets', 'books', req.file.filename).replace(/\\/g, "/");
        console.log(`[POST /books] coverImageUrl generada: ${coverImageUrl}`);
    }

    try {
        const tagsString = tags;
        const query = 'INSERT INTO libros (title, author, description, price, stock, publication_date, cover_image_url, tags, publisher) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const params = [title, author, description, parseFloat(price), parseInt(stock, 10), publication_date, coverImageUrl, tagsString, publisher];
        
        console.log('[POST /books] Ejecutando query de inserción...');
        const [result] = await pool.query(query, params);
        console.log('[POST /books] Libro insertado con ID:', result.insertId);
        const newBookData = { ...req.body, id: result.insertId, cover_image_url: coverImageUrl, tags: JSON.parse(tagsString || '[]') };
        delete newBookData.bookCoverImage; // Eliminar si multer lo añade al body
        delete newBookData.current_cover_image_url;
        res.status(201).json(newBookData);
    } catch (error) {
        console.error('[POST /books] Error al crear libro en BD:', error);
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('[POST /books] Archivo temporal eliminado por error en BD.');
            } catch (e) {
                console.error('[POST /books] Error eliminando archivo temporal por error en BD:', e);
            }
        }
        res.status(500).json({ message: 'Error en el servidor al crear el libro' });
    }
});

// PUT /api/admin/books/:id - Actualizar un libro
router.put('/books/:id', authMiddleware, authorize('admin'), upload.single('bookCoverImage'), async (req, res) => {
    const { id } = req.params;
    console.log('[PUT /books/:id] Ruta alcanzada para ID:', id);
    if (req.file) {
        console.log('[PUT /books/:id] Archivo recibido por multer para ID:', id, req.file);
    } else {
        console.log('[PUT /books/:id] No se recibió archivo nuevo para ID:', id);
    }
    console.log('[PUT /books/:id] req.body para ID:', id, req.body);

    const { title, author, description, price, stock, publication_date, tags, publisher, current_cover_image_url } = req.body;

    if (!title || !author || price === undefined || stock === undefined) {
        console.log('[PUT /books/:id] Error de validación: campos faltantes para ID:', id);
        if (req.file) { try { fs.unlinkSync(req.file.path); console.log('[PUT /books] Archivo temporal eliminado por validación fallida.') } catch (e) {console.error('[PUT /books] Error eliminando archivo temporal por validación:',e)} }
        return res.status(400).json({ message: 'Título, autor, precio y stock son requeridos.' });
    }

    let coverImageUrl = current_cover_image_url || null;
    console.log('[PUT /books/:id] coverImageUrl inicial (current) para ID:', id, coverImageUrl);

    if (req.file) {
        const newServerPath = req.file.path; // Ruta completa en el servidor
        const newRelativePath = path.join('assets', 'books', req.file.filename).replace(/\\/g, "/");
        console.log('[PUT /books/:id] Nueva imagen subida, nueva ruta relativa para ID:', id, newRelativePath);
        
        if (current_cover_image_url && current_cover_image_url !== newRelativePath) {
            const oldPathFull = path.join(projectRoot, 'public', current_cover_image_url);
            console.log('[PUT /books/:id] Intentando eliminar portada antigua para ID:', id, oldPathFull);
            try {
                if (fs.existsSync(oldPathFull)) {
                    fs.unlinkSync(oldPathFull);
                    console.log('[PUT /books/:id] Portada antigua eliminada para ID:', id, oldPathFull);
                } else {
                    console.log('[PUT /books/:id] Portada antigua no encontrada para eliminar ID:', id, oldPathFull);
                }
            } catch (err) {
                console.warn('[PUT /books/:id] Error eliminando portada antigua para ID:', id, err.message);
            }
        }
        coverImageUrl = newRelativePath;
    }

    try {
        const tagsString = tags;
        const query = 'UPDATE libros SET title = ?, author = ?, description = ?, price = ?, stock = ?, publication_date = ?, cover_image_url = ?, tags = ?, publisher = ? WHERE id = ?';
        const params = [title, author, description, parseFloat(price), parseInt(stock, 10), publication_date, coverImageUrl, tagsString, publisher, id];
        
        console.log('[PUT /books/:id] Ejecutando query de actualización para ID:', id);
        const [result] = await pool.query(query, params);
        
        if (result.affectedRows === 0) {
            console.log('[PUT /books/:id] Libro no encontrado para actualizar ID:', id);
            if (req.file) { try { fs.unlinkSync(req.file.path); console.log('[PUT /books] Archivo temporal eliminado por no encontrar libro.') } catch (e) {console.error('[PUT /books] Error eliminando archivo temporal por no encontrar libro:',e)} }
            return res.status(404).json({ message: 'Libro no encontrado para actualizar' });
        }
        console.log('[PUT /books/:id] Libro actualizado ID:', id);
        const updatedBookData = { ...req.body, id: parseInt(id), cover_image_url: coverImageUrl, tags: JSON.parse(tagsString || '[]') };
        delete updatedBookData.bookCoverImage;
        delete updatedBookData.current_cover_image_url;
        res.json(updatedBookData);
    } catch (error) {
        console.error('[PUT /books/:id] Error al actualizar libro en BD ID:', id, error);
        if (req.file) { try { fs.unlinkSync(req.file.path); console.log('[PUT /books] Archivo temporal eliminado por error BD.') } catch (e) {console.error('[PUT /books] Error eliminando archivo temporal por error BD:',e)} }
        res.status(500).json({ message: 'Error en el servidor al actualizar el libro' });
    }
});

// DELETE /api/admin/books/:id - Eliminar un libro (borrado físico)
router.delete('/books/:id', authMiddleware, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    console.log('[DELETE /books/:id] Solicitud para ELIMINAR libro ID:', id);
    try {
        // Opcional: Obtener la URL de la imagen para eliminarla si el libro se borra de la BD
        const [bookRows] = await pool.query('SELECT cover_image_url FROM libros WHERE id = ?', [id]);
        const bookToDelete = bookRows[0];

        const [result] = await pool.query('DELETE FROM libros WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado para eliminar' });
        }

        // Si el libro se eliminó y tenía una imagen, intentar eliminarla del servidor
        if (bookToDelete && bookToDelete.cover_image_url) {
            const imagePath = path.join(projectRoot, 'public', bookToDelete.cover_image_url);
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('[DELETE /books/:id] Imagen de portada eliminada para ID:', id, imagePath);
                }
            } catch (err) {
                console.warn('[DELETE /books/:id] Error eliminando imagen de portada para ID:', id, imagePath, err.message);
            }
        }
        console.log('[DELETE /books/:id] Libro ID:', id, 'eliminado físicamente.');
        res.status(204).send();
    } catch (error) {
        console.error('[DELETE /books/:id] Error deleting book ID:', id, error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'No se puede eliminar el libro porque tiene pedidos asociados.' });
        }
        res.status(500).json({ message: 'Error en el servidor al eliminar el libro' });
    }
});

// --- Gestión de Pedidos (Admin) ---

// GET /api/admin/orders - Obtener todos los pedidos con filtros y ordenación
router.get('/orders', authMiddleware, authorize('admin'), async (req, res) => {
    console.log('[adminRoutes.js] GET /api/admin/orders - Solicitud recibida');
    try {
        const { status, userId } = req.query;
        const sortBy = req.query.sortBy || 'fecha_pedido'; 
        const orderDirection = req.query.orderDirection || 'DESC';

        let baseQuery = `
            SELECT 
                p.id, 
                p.usuario_id, 
                p.fecha_pedido, 
                p.estado_pedido, 
                p.monto_total,
                p.moneda, 
                p.estado_pago,
                u.nombre AS nombre_usuario, 
                u.email AS email_usuario    
            FROM pedidos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
        `;
        
        const queryParams = [];
        const whereConditions = [];

        if (status) {
            whereConditions.push('p.estado_pedido = ?');
            queryParams.push(status);
        }
        if (userId) {
            whereConditions.push('p.usuario_id = ?');
            queryParams.push(userId);
        }

        if (whereConditions.length > 0) {
            baseQuery += ' WHERE ' + whereConditions.join(' AND ');
        }

        const allowedSortBy = ['id', 'fecha_pedido', 'monto_total', 'estado_pedido', 'usuario_id'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? `p.${sortBy}` : 'p.fecha_pedido';
        const safeOrderDirection = orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        baseQuery += ` ORDER BY ${safeSortBy} ${safeOrderDirection}`;

        console.log(`[adminRoutes.js] GET /api/admin/orders - Query: ${baseQuery}`, queryParams);
        const [orders] = await pool.query(baseQuery, queryParams);
        console.log(`[adminRoutes.js] GET /api/admin/orders - Pedidos encontrados: ${orders.length}`);

        const formattedOrders = orders.map(order => ({
            id: order.id,
            user_id: order.usuario_id,
            created_at: order.fecha_pedido,
            status: order.estado_pedido,
            total_price: order.monto_total,
        }));
        res.json(formattedOrders);
    } catch (error) {
        console.error('[adminRoutes.js] Error en GET /api/admin/orders:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener los pedidos.', error: error.message });
    }
});

// GET /api/admin/orders/:orderId - Obtener detalles de un pedido específico
router.get('/orders/:orderId', authMiddleware, authorize('admin'), async (req, res) => {
    const { orderId } = req.params;
    console.log(`[adminRoutes.js] GET /api/admin/orders/${orderId} - Solicitud recibida`);
    try {
        const pedidoQuery = `
            SELECT 
                p.id, p.usuario_id, p.fecha_pedido, p.estado_pedido, p.monto_total,
                p.moneda, p.estado_pago, p.direccion_envio_json, p.admin_notes,
                u.nombre AS nombre_usuario, u.email AS email_usuario
            FROM pedidos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = ?;
        `;
        const [pedidoResult] = await pool.query(pedidoQuery, [orderId]);
        if (pedidoResult.length === 0) {
            console.log(`[adminRoutes.js] GET /api/admin/orders/${orderId} - Pedido no encontrado.`);
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        const orderData = pedidoResult[0];
        const itemsQuery = `
            SELECT pi.id AS item_id, pi.libro_id, pi.cantidad, pi.precio_unitario_en_compra, pi.titulo_en_compra 
            FROM pedido_items pi 
            WHERE pi.pedido_id = ?;
        `;
        const [itemsResult] = await pool.query(itemsQuery, [orderId]);
        console.log(`[adminRoutes.js] GET /api/admin/orders/${orderId} - Items encontrados: ${itemsResult.length}`);
        const formattedOrder = {
            id: orderData.id, user_id: orderData.usuario_id, created_at: orderData.fecha_pedido,
            status: orderData.estado_pedido, total_price: orderData.monto_total, admin_notes: orderData.admin_notes,
            user: { id: orderData.usuario_id, name: orderData.nombre_usuario, email: orderData.email_usuario },
            items: itemsResult.map(item => ({
                book_id: item.libro_id, book_title: item.titulo_en_compra,
                quantity: item.cantidad, price_at_purchase: item.precio_unitario_en_compra
            })),
            shipping_address: (() => {
                if (orderData.direccion_envio_json) {
                    if (typeof orderData.direccion_envio_json === 'string' && orderData.direccion_envio_json.trim() !== "[object Object]") {
                        try {
                            return JSON.parse(orderData.direccion_envio_json);
                        } catch (e) {
                            console.error(`[adminRoutes.js] Error al parsear JSON de dirección para pedido ${orderId} (contenido no es "[object Object]" pero sí inválido):`, orderData.direccion_envio_json, e);
                            return { error: "Formato de dirección inválido.", raw: orderData.direccion_envio_json };
                        }
                    } else if (orderData.direccion_envio_json === "[object Object]") {
                        console.warn(`[adminRoutes.js] direccion_envio_json para pedido ${orderId} es '[object Object]'. Se devolverá como null.`);
                        return { error: "Datos de dirección corruptos (es '[object Object]').", raw: orderData.direccion_envio_json };
                    } else {
                        // Si ya es un objeto (aunque no debería serlo si viene de la BBDD como JSON string)
                        // Esto es un caso improbable si la columna es TEXT/VARCHAR, pero por si acaso.
                        console.warn(`[adminRoutes.js] direccion_envio_json para pedido ${orderId} no es un string JSON válido para parsear, podría ser ya un objeto:`, orderData.direccion_envio_json);
                        return orderData.direccion_envio_json; 
                    }
                } else {
                    return null; // No hay dirección
                }
            })()
        };
        console.log(`[adminRoutes.js] GET /api/admin/orders/${orderId} - Pedido formateado enviado.`);
        res.json(formattedOrder);
    } catch (error) {
        console.error(`[adminRoutes.js] Error en GET /api/admin/orders/${orderId}:`, error);
        if (error instanceof SyntaxError && error.message.includes('JSON.parse')) { 
            console.error(`[adminRoutes.js] Error al parsear direccion_envio_json para pedido ${orderId}.`);
            const orderData = (await pool.query('SELECT * FROM pedidos WHERE id = ?', [orderId]))[0][0];
            const itemsResultOnError = (await pool.query('SELECT pi.id AS item_id, pi.libro_id, pi.cantidad, pi.precio_unitario_en_compra, pi.titulo_en_compra FROM pedido_items pi WHERE pi.pedido_id = ?;', [orderId]))[0];
            const partialFormattedOrder = {
                id: orderData.id, user_id: orderData.usuario_id, created_at: orderData.fecha_pedido, status: orderData.estado_pedido,
                total_price: orderData.monto_total, admin_notes: orderData.admin_notes,
                user: { id: orderData.usuario_id, name: orderData.nombre_usuario, email: orderData.email_usuario }, // Asume que nombre_usuario e email_usuario pueden ser null si el join falla o no se rehace
                items: itemsResultOnError.map(item => ({ book_id: item.libro_id, book_title: item.titulo_en_compra, quantity: item.cantidad, price_at_purchase: item.precio_unitario_en_compra })),
                shipping_address: { error: "Error al parsear la dirección de envío.", raw: orderData.direccion_envio_json }
            };
            return res.status(200).json(partialFormattedOrder);
        }
        res.status(500).json({ message: 'Error en el servidor al obtener los detalles del pedido.', error: error.message });
    }
});

// PUT /api/admin/orders/:orderId - Actualizar el estado y/o notas de un pedido
router.put('/orders/:orderId', authMiddleware, authorize('admin'), async (req, res) => {
    const { orderId } = req.params;
    const { status, admin_notes } = req.body;
    console.log(`[adminRoutes.js] PUT /api/admin/orders/${orderId} - Solicitud recibida. Body:`, req.body);
    if (status === undefined && admin_notes === undefined) {
        return res.status(400).json({ message: 'Debe proporcionar al menos un estado o notas administrativas para actualizar.' });
    }
    try {
        let updateQuery = 'UPDATE pedidos SET ';
        const queryParams = [];
        const setClauses = [];
        if (status !== undefined) {
            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status.toLowerCase())) { // Convertir a minúscula para comparar
                 console.log(`[adminRoutes.js] PUT /api/admin/orders/${orderId} - Estado no válido: ${status}`);
                return res.status(400).json({ message: `Estado de pedido no válido: ${status}. Estados permitidos: ${validStatuses.join(', ')}` });
            }
            setClauses.push('estado_pedido = ?');
            // Guardar el estado como viene del frontend (ej. 'pending') o como lo tengas en tu BBDD (ej. 'Pendiente')
            // Si tu BBDD espera 'Pendiente', 'Procesando', etc. y el frontend envía 'pending', 'processing', necesitarás mapear.
            // Por ahora, asumiré que la BBDD espera los mismos valores que el frontend envía.
            queryParams.push(status);
        }
        if (admin_notes !== undefined) {
            setClauses.push('admin_notes = ?');
            queryParams.push(admin_notes);
        }
        if (setClauses.length === 0) {
            return res.status(400).json({ message: 'No hay campos para actualizar.' });
        }
        updateQuery += setClauses.join(', ') + ' WHERE id = ?';
        queryParams.push(orderId);
        console.log(`[adminRoutes.js] PUT /api/admin/orders/${orderId} - Query: ${updateQuery}`, queryParams);
        const [result] = await pool.query(updateQuery, queryParams);
        if (result.affectedRows === 0) {
            console.log(`[adminRoutes.js] PUT /api/admin/orders/${orderId} - Pedido no encontrado para actualizar.`);
            return res.status(404).json({ message: 'Pedido no encontrado para actualizar.' });
        }
        console.log(`[adminRoutes.js] PUT /api/admin/orders/${orderId} - Pedido actualizado.`);
        res.json({ message: 'Pedido actualizado correctamente.' });
    } catch (error) {
        console.error(`[adminRoutes.js] Error en PUT /api/admin/orders/${orderId}:`, error);
        res.status(500).json({ message: 'Error en el servidor al actualizar el pedido.', error: error.message });
    }
});

export default router; 