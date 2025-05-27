import express from 'express';
import pool from '../config/db.js';
// import { isAdmin } from '../middlewares/authMiddleware.js'; // Lo añadiremos después

const router = express.Router();

// Endpoint para obtener el total de usuarios
// GET /api/admin/stats/total-users
router.get('/stats/total-users', async (req, res) => {
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
router.get('/stats/total-books', async (req, res) => {
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
router.get('/stats/pending-orders', async (req, res) => {
    try {
        // Asumimos que 'Procesando' es el estado para pedidos pendientes
        const [result] = await pool.query("SELECT COUNT(*) AS total FROM pedidos WHERE estado_pedido = 'Procesando'");
        res.json({ total: result[0].total });
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener pedidos pendientes' });
    }
});

// Endpoint para obtener datos del gráfico de visión general
// GET /api/admin/stats/overview-chart-data
router.get('/stats/overview-chart-data', async (req, res) => {
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
router.get('/stats/recent-activity', async (req, res) => {
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
router.get('/users', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, nombre, email, rol, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener usuarios' });
    }
});

// GET /api/admin/users/:id - Obtener un usuario por ID (para editar)
router.get('/users/:id', async (req, res) => {
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
router.post('/users', async (req, res) => {
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
router.put('/users/:id', async (req, res) => {
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
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado para eliminar' });
        }
        res.status(204).send(); // No content
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        res.status(500).json({ message: 'Error en el servidor al eliminar el usuario' });
    }
});

// --- Gestión de Libros (CRUD) ---

// GET /api/admin/books - Obtener todos los libros
router.get('/books', async (req, res) => {
    try {
        const [books] = await pool.query('SELECT * FROM libros ORDER BY id DESC'); // o el orden que prefieras
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener libros' });
    }
});

// GET /api/admin/books/:id - Obtener un libro por ID
router.get('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [book] = await pool.query('SELECT * FROM libros WHERE id = ?', [id]);
        if (book.length === 0) {
            return res.status(404).json({ message: 'Libro no encontrado' });
        }
        // Asegurarse de que los tags se devuelvan como array si están almacenados como JSON string
        const resultBook = book[0];
        if (resultBook.tags && typeof resultBook.tags === 'string') {
            try {
                resultBook.tags = JSON.parse(resultBook.tags);
            } catch (e) {
                console.error('Error parsing tags for book:', resultBook.id, e);
                resultBook.tags = []; // o null, o dejar como string con advertencia
            }
        }
        res.json(resultBook);
    } catch (error) {
        console.error(`Error fetching book ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error en el servidor al obtener el libro' });
    }
});

// POST /api/admin/books - Crear un nuevo libro
router.post('/books', async (req, res) => {
    // Asegúrate de que los nombres de campo coincidan con tu tabla `libros` y el frontend
    const { title, author, description, price, stock, publication_date, cover_image_url, tags, publisher } = req.body;
    
    // Validación básica (puedes añadir más según tus necesidades)
    if (!title || !author || !price || stock === undefined || stock === null) {
        return res.status(400).json({ message: 'Título, autor, precio y stock son requeridos.' });
    }

    try {
        const tagsString = Array.isArray(tags) ? JSON.stringify(tags) : null;
        const query = 'INSERT INTO libros (title, author, description, price, stock, publication_date, cover_image_url, tags, publisher) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const params = [title, author, description, parseFloat(price), parseInt(stock, 10), publication_date, cover_image_url, tagsString, publisher];
        
        const [result] = await pool.query(query, params);
        res.status(201).json({ id: result.insertId, ...req.body, tags: tags }); // Devolver el libro creado, con tags como array
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ message: 'Error en el servidor al crear el libro' });
    }
});

// PUT /api/admin/books/:id - Actualizar un libro
router.put('/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, description, price, stock, publication_date, cover_image_url, tags, publisher } = req.body;

    if (!title || !author || !price || stock === undefined || stock === null) {
        return res.status(400).json({ message: 'Título, autor, precio y stock son requeridos.' });
    }

    try {
        const tagsString = Array.isArray(tags) ? JSON.stringify(tags) : null;
        const query = 'UPDATE libros SET title = ?, author = ?, description = ?, price = ?, stock = ?, publication_date = ?, cover_image_url = ?, tags = ?, publisher = ? WHERE id = ?';
        const params = [title, author, description, parseFloat(price), parseInt(stock, 10), publication_date, cover_image_url, tagsString, publisher, id];

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado para actualizar' });
        }
        res.json({ message: 'Libro actualizado correctamente', id: id, ...req.body, tags: tags });
    } catch (error) {
        console.error(`Error updating book ${id}:`, error);
        res.status(500).json({ message: 'Error en el servidor al actualizar el libro' });
    }
});

// DELETE /api/admin/books/:id - Eliminar un libro
router.delete('/books/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM libros WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado para eliminar' });
        }
        res.status(204).send(); // No content
    } catch (error) {
        console.error(`Error deleting book ${id}:`, error);
        res.status(500).json({ message: 'Error en el servidor al eliminar el libro' });
    }
});

export default router; 