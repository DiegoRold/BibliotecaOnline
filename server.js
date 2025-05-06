import express from 'express';
import mysql from 'mysql2/promise';

// --- Configuración de la Aplicación Express ---
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON en las peticiones
app.use(express.json());

// --- Configuración de la Base de Datos ---
// POR FAVOR, ASEGÚRATE DE QUE ESTAS CREDENCIALES SEAN CORRECTAS
// Y considera usar variables de entorno para un proyecto real.
const dbConfig = {
    host: 'localhost',         // O la IP de tu servidor MySQL
    user: 'root',              // Tu usuario de MySQL (el mismo que usaste en populate_db.js)
    password: 'QWERTY-qwerty258', // Tu contraseña de MySQL (la misma que usaste en populate_db.js)
    database: 'entre_hojas_db'   // El nombre de tu base de datos
};

let connection;

async function connectToDatabase() {
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Conexión a la base de datos MySQL establecida exitosamente.');
    } catch (error) {
        console.error('Error al conectar con la base de datos MySQL:', error);
        // Si no podemos conectar, es un error crítico, así que salimos o reintentamos.
        // Por ahora, saldremos para evitar que la app corra sin DB.
        process.exit(1); 
    }
}

// --- Rutas de la API ---

// Ruta de bienvenida/prueba
app.get('/', (req, res) => {
    res.send('¡Bienvenido al backend de Entre Hojas!');
});

// Ruta para obtener todos los libros
app.get('/api/libros', async (req, res) => {
    if (!connection) {
        return res.status(500).json({ message: 'Error de conexión con la base de datos.' });
    }
    try {
        // Paginación
        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);

        // Valores por defecto y validación
        page = (isNaN(page) || page < 1) ? 1 : page;
        limit = (isNaN(limit) || limit < 1) ? 10 : limit;
        // Opcional: establecer un límite máximo para 'limit' para evitar sobrecargas
        // if (limit > 100) limit = 100;

        const offset = (page - 1) * limit;

        // Obtener el total de libros para calcular el total de páginas
        const [totalRows] = await connection.query('SELECT COUNT(*) as totalItems FROM libros');
        const totalItems = totalRows[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        // Asegurarse de que la página solicitada no exceda el total de páginas
        if (page > totalPages && totalItems > 0) { // Si hay items pero la pagina no existe
            // Podrías devolver un 404 o la última página disponible
            // Por ahora, devolvemos un mensaje y quizás la última página.
            // O simplemente un array vacío si así se prefiere, pero ajustando `page` para la metadata.
            // page = totalPages;
            // offset = (page - 1) * limit;
            return res.status(404).json({ 
                message: `Página solicitada (${req.query.page}) excede el total de páginas (${totalPages}).`,
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: parseInt(req.query.page, 10), // Mostramos la pagina que pidieron
                    itemsPerPage: limit
                }
            });
        }

        // Obtener los libros para la página actual
        const [books] = await connection.query('SELECT * FROM libros LIMIT ? OFFSET ?', [limit, offset]);
        
        res.json({
            data: books,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error('Error al obtener libros:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener libros.' });
    }
});

// Ruta para obtener un libro específico por su ID
app.get('/api/libros/:id', async (req, res) => {
    if (!connection) {
        return res.status(500).json({ message: 'Error de conexión con la base de datos.' });
    }
    try {
        const { id } = req.params;
        // Validar que el ID es un número
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'El ID del libro debe ser un número.'});
        }

        const [rows] = await connection.query('SELECT * FROM libros WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Libro no encontrado.' });
        }
        
        res.json(rows[0]); // Devolvemos el primer (y único) libro encontrado
    } catch (error) {
        console.error(`Error al obtener el libro con ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el libro.' });
    }
});

// Ruta para CREAR un nuevo libro
app.post('/api/libros', async (req, res) => {
    if (!connection) {
        return res.status(500).json({ message: 'Error de conexión con la base de datos.' });
    }

    try {
        const { 
            title, 
            author, 
            publication_date, // Espera formato YYYY-MM-DD o algo que MySQL pueda convertir
            cover_image_url,
            rating, 
            price, 
            description, 
            tags, // Espera un objeto/array JSON o string que se pueda parsear
            pages, 
            publisher, 
            stock, 
            categories, // Espera un objeto/array JSON o string que se pueda parsear
            isbn 
        } = req.body;

        // Validación básica (puedes hacerla más robusta)
        if (!title || !author || price === undefined || stock === undefined) {
            return res.status(400).json({
                message: 'Los campos obligatorios son: title, author, price, stock.'
            });
        }

        const insertQuery = `
            INSERT INTO libros (
                title, author, publication_date, cover_image_url, rating, price, 
                description, tags, pages, publisher, stock, categories, isbn
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

        const params = [
            title,
            author,
            publication_date || null, // Si no se provee, se inserta NULL
            cover_image_url || null,
            rating !== undefined ? parseFloat(rating) : null,
            parseFloat(price), // Asegúrate de que sea un número
            description || null,
            tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null, // Almacena como string JSON
            pages !== undefined ? parseInt(pages) : null,
            publisher || null,
            parseInt(stock), // Asegúrate de que sea un número
            categories ? (typeof categories === 'string' ? categories : JSON.stringify(categories)) : null, // Almacena como string JSON
            isbn || null
        ];

        const [result] = await connection.execute(insertQuery, params);

        if (result.insertId) {
            // Devolvemos el libro recién creado (opcionalmente consultándolo de nuevo)
            const [newBookRows] = await connection.query('SELECT * FROM libros WHERE id = ?', [result.insertId]);
            if (newBookRows.length > 0) {
                res.status(201).json(newBookRows[0]);
            } else {
                // Esto no debería pasar si la inserción fue exitosa
                res.status(201).json({ message: 'Libro creado exitosamente, pero no se pudo recuperar.', id: result.insertId });
            }
        } else {
            res.status(500).json({ message: 'Error al crear el libro, no se generó ID.' });
        }

    } catch (error) {
        console.error('Error al crear el libro:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el libro.', error: error.message });
    }
});

// Ruta para ACTUALIZAR un libro existente por ID (PUT)
app.put('/api/libros/:id', async (req, res) => {
    if (!connection) {
        return res.status(500).json({ message: 'Error de conexión con la base de datos.' });
    }

    try {
        const { id } = req.params;
        // Validar que el ID es un número
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'El ID del libro debe ser un número.'});
        }

        const { 
            title, 
            author, 
            publication_date, 
            cover_image_url,
            rating, 
            price, 
            description, 
            tags, 
            pages, 
            publisher, 
            stock, 
            categories, 
            isbn 
        } = req.body;

        // Validación básica - Asegúrate de que los campos obligatorios estén presentes
        // Para PUT, usualmente se espera la representación completa, pero aquí seremos flexibles
        // y actualizaremos lo que se envíe, aunque validaremos los campos clave si se incluyen.
        if (title === undefined || author === undefined || price === undefined || stock === undefined) {
             return res.status(400).json({
                message: 'Los campos obligatorios son: title, author, price, stock.'
            });
        }
        
        // Prepara los parámetros y la consulta dinámicamente (más seguro que concatenar strings)
        const updateQuery = `
            UPDATE libros SET 
                title = ?, author = ?, publication_date = ?, cover_image_url = ?, 
                rating = ?, price = ?, description = ?, tags = ?, pages = ?, 
                publisher = ?, stock = ?, categories = ?, isbn = ?
            WHERE id = ?;
        `;

        const params = [
            title,
            author,
            publication_date || null,
            cover_image_url || null,
            rating !== undefined ? parseFloat(rating) : null,
            parseFloat(price),
            description || null,
            tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null,
            pages !== undefined ? parseInt(pages) : null,
            publisher || null,
            parseInt(stock),
            categories ? (typeof categories === 'string' ? categories : JSON.stringify(categories)) : null,
            isbn || null,
            id // El ID para la cláusula WHERE
        ];

        const [result] = await connection.execute(updateQuery, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado o datos sin cambios.' });
        }
        
        // Devolvemos el libro actualizado consultándolo de nuevo
        const [updatedBookRows] = await connection.query('SELECT * FROM libros WHERE id = ?', [id]);
        if (updatedBookRows.length > 0) {
            res.status(200).json(updatedBookRows[0]);
        } else {
             // Esto sería muy raro si affectedRows fue > 0
            res.status(404).json({ message: 'Libro actualizado, pero no se pudo recuperar.'});
        }

    } catch (error) {
        console.error(`Error al actualizar el libro con ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el libro.', error: error.message });
    }
});

// Ruta para ELIMINAR un libro por ID (DELETE)
app.delete('/api/libros/:id', async (req, res) => {
    if (!connection) {
        return res.status(500).json({ message: 'Error de conexión con la base de datos.' });
    }

    try {
        const { id } = req.params;
        // Validar que el ID es un número
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'El ID del libro debe ser un número.'});
        }

        const deleteQuery = 'DELETE FROM libros WHERE id = ?';
        const [result] = await connection.execute(deleteQuery, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado.' });
        }

        res.status(200).json({ message: 'Libro eliminado exitosamente.' });
        // Alternativamente, podrías devolver un 204 No Content, que no envía cuerpo:
        // res.status(204).send();

    } catch (error) {
        console.error(`Error al eliminar el libro con ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el libro.', error: error.message });
    }
});

// --- Iniciar el Servidor ---
async function startServer() {
    await connectToDatabase(); // Primero conectamos a la DB
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}

startServer();

// Exportamos la app para posibles pruebas futuras o arquitecturas más complejas (opcional por ahora)
// export default app; // Si usas esto, necesitarías ajustar cómo se inicia el servidor. 