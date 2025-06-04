import pool from '../config/db.js';

// Obtener todos los libros (público) con paginación
export const getAllBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 16;
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) as totalBooks FROM libros WHERE stock > 0';
        const [countResult] = await pool.query(countQuery);
        const totalBooks = countResult[0].totalBooks;
        const totalPages = Math.ceil(totalBooks / limit);

        const booksQuery = `
            SELECT 
                id AS id,
                api_id,
                title, author, cover_image_url AS cover, price, stock,
                rating, description, publication_date, pages, publisher, categories, isbn, tags
            FROM libros 
            WHERE stock > 0 ORDER BY title LIMIT ? OFFSET ?`;
        const [booksFromDB] = await pool.query(booksQuery, [limit, offset]);

        // Asegurar que el precio sea numérico
        const books = booksFromDB.map(book => ({
            ...book,
            price: parseFloat(book.price) // Convertir a número de punto flotante
        }));

        res.json({
            books,
            pagination: { currentPage: page, totalPages, totalBooks, limit }
        });
    } catch (error) {
        console.error('Error en getAllBooks con paginación:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los libros.', error: error.message });
    }
};

// Obtener un libro por su ID (público)
export const getBookById = async (req, res) => {
    const { id } = req.params;
    try {
        const [booksFromDB] = await pool.query('SELECT id AS numeric_id, api_id AS id, title, author, cover_image_url, price, stock, rating, description, publication_date, pages, publisher, categories, isbn, tags FROM libros WHERE id = ?', [id]);
        if (booksFromDB.length === 0) {
            return res.status(404).json({ message: 'Libro no encontrado.' });
        }
        // Asegurar que el precio sea numérico para el libro individual
        const book = {
            ...booksFromDB[0],
            price: parseFloat(booksFromDB[0].price)
        };
        res.json(book);
    } catch (error) {
        console.error('Error en getBookById:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el libro.', error: error.message });
    }
};

// Obtener un libro por su API_ID (público)
export const getBookByApiId = async (req, res) => {
    const { api_id } = req.params;
    try {
        // Devolver todos los campos, incluyendo el id numérico como numeric_id y el api_id como id
        const query = `
            SELECT 
                id AS numeric_id, api_id AS id, title, author, cover_image_url, price, stock,
                rating, description, publication_date, pages, publisher, categories, isbn, tags
            FROM libros 
            WHERE api_id = ?`;
        const [booksFromDB] = await pool.query(query, [api_id]);
        
        if (booksFromDB.length === 0) {
            return res.status(404).json({ message: 'Libro no encontrado con el API ID proporcionado.' });
        }
        // Asegurar que el precio sea numérico para el libro individual
        const book = {
            ...booksFromDB[0],
            price: parseFloat(booksFromDB[0].price)
        };
        res.json(book); // Devuelve el primer libro encontrado (debería ser único)
    } catch (error) {
        console.error('Error en getBookByApiId:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el libro por API ID.', error: error.message });
    }
};

// Nueva función para buscar libros por nombre, autor o género
export const searchBooksByNameAuthorGenre = async (req, res) => {
    const { q } = req.query; // Término de búsqueda

    if (!q || q.trim() === '') {
        return res.status(400).json({ message: 'Por favor, proporciona un término de búsqueda.' });
    }

    try {
        const searchTerm = `%${q.trim()}%`;

        // Consulta para buscar en título, autor y categorías (o tags si es el campo correcto)
        // Asegúrate de que el campo 'categories' o el que uses para género sea adecuado para LIKE
        // Si 'categories' es un JSON array, esta consulta necesitará ser más compleja (ej. JSON_CONTAINS o buscar en la cadena JSON)
        // Por simplicidad, se asume que categories es un TEXT o VARCHAR y se busca en él.
        const searchQuery = `
            SELECT 
                id AS numeric_id, api_id AS id, title, author, cover_image_url AS cover, price, stock,
                rating, description, publication_date, pages, publisher, categories, isbn, tags
            FROM libros 
            WHERE title LIKE ? OR author LIKE ? OR categories LIKE ? OR tags LIKE ?
            AND stock > 0 
            ORDER BY title;
        `;

        const [booksFromDB] = await pool.query(searchQuery, [searchTerm, searchTerm, searchTerm, searchTerm]);

        if (booksFromDB.length === 0) {
            return res.json({ books: [], pagination: {} }); // Devuelve un array vacío si no hay resultados
        }

        // Asegurar que el precio sea numérico y devolver el mismo formato que getAllBooks
        const books = booksFromDB.map(book => ({
            ...book,
            price: parseFloat(book.price)
        }));

        // Para la búsqueda no implementaremos paginación compleja por ahora, 
        // pero mantenemos una estructura similar para la respuesta.
        res.json({
            books,
            pagination: { totalBooks: books.length } // Información básica de paginación
        });

    } catch (error) {
        console.error('Error en searchBooksByNameAuthorGenre:', error);
        res.status(500).json({ message: 'Error interno del servidor al realizar la búsqueda.', error: error.message });
    }
};

// --- Funciones solo para Administradores ---

// Crear un nuevo libro (solo admin)
export const createBook = async (req, res) => {
    const { title, author, publication_date, cover_image_url, rating, price, description, tags, pages, publisher, stock, categories, isbn, api_id } = req.body;
    if (!title || !price || stock === undefined || !api_id) {
        return res.status(400).json({ message: 'Título, api_id, precio y stock son requeridos.' });
    }
    try {
        const query = `INSERT INTO libros (title, author, publication_date, cover_image_url, rating, price, description, tags, pages, publisher, stock, categories, isbn, api_id)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.execute(query, [
            title, author || null, publication_date || null, cover_image_url || null, rating || 0,
            price, description || null, tags || null, pages || 0, publisher || null, stock || 0,
            categories || null, isbn || null, api_id
        ]);
        res.status(201).json({ message: 'Libro creado exitosamente.', bookId: result.insertId, api_id });
    } catch (error) {
        console.error('Error en createBook:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el libro.', error: error.message });
    }
};

// Actualizar un libro existente (solo admin)
export const updateBook = async (req, res) => {
    const { id } = req.params;
    const { title, author, publication_date, cover_image_url, rating, price, description, tags, pages, publisher, stock, categories, isbn, api_id } = req.body;
    let fieldsToUpdate = [];
    let values = [];
    if (title !== undefined) { fieldsToUpdate.push('title = ?'); values.push(title); }
    if (api_id !== undefined) { fieldsToUpdate.push('api_id = ?'); values.push(api_id); }
    if (author !== undefined) { fieldsToUpdate.push('author = ?'); values.push(author); }
    if (publication_date !== undefined) { fieldsToUpdate.push('publication_date = ?'); values.push(publication_date); }
    if (cover_image_url !== undefined) { fieldsToUpdate.push('cover_image_url = ?'); values.push(cover_image_url); }
    if (rating !== undefined) { fieldsToUpdate.push('rating = ?'); values.push(rating); }
    if (price !== undefined) { fieldsToUpdate.push('price = ?'); values.push(price); }
    if (description !== undefined) { fieldsToUpdate.push('description = ?'); values.push(description); }
    if (tags !== undefined) { fieldsToUpdate.push('tags = ?'); values.push(tags); }
    if (pages !== undefined) { fieldsToUpdate.push('pages = ?'); values.push(pages); }
    if (publisher !== undefined) { fieldsToUpdate.push('publisher = ?'); values.push(publisher); }
    if (stock !== undefined) { fieldsToUpdate.push('stock = ?'); values.push(stock); }
    if (categories !== undefined) { fieldsToUpdate.push('categories = ?'); values.push(categories); }
    if (isbn !== undefined) { fieldsToUpdate.push('isbn = ?'); values.push(isbn); }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
    }
    values.push(id);
    try {
        const query = `UPDATE libros SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
        const [result] = await pool.execute(query, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado para actualizar.' });
        }
        res.json({ message: 'Libro actualizado exitosamente.' });
    } catch (error) {
        console.error('Error en updateBook:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el libro.', error: error.message });
    }
};

// Eliminar un libro (solo admin)
export const deleteBook = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.execute('DELETE FROM libros WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado para eliminar.' });
        }
        res.json({ message: 'Libro eliminado exitosamente.' });
    } catch (error) {
        console.error('Error en deleteBook:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el libro.', error: error.message });
    }
}; 