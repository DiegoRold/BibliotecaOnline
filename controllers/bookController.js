import pool from '../config/db.js';

// Obtener todos los libros (público) con paginación
export const getAllBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // Mismo límite que en js/books.js
        const offset = (page - 1) * limit;

        // Consulta para obtener el total de libros (para calcular totalPages)
        const countQuery = 'SELECT COUNT(*) as totalBooks FROM libros WHERE stock > 0';
        const [countResult] = await pool.promise().query(countQuery);
        const totalBooks = countResult[0].totalBooks;
        const totalPages = Math.ceil(totalBooks / limit);

        // Consulta para obtener los libros de la página actual
        const booksQuery = `
            SELECT id, title, author, cover_image_url, price, stock 
            FROM libros 
            WHERE stock > 0 
            ORDER BY title 
            LIMIT ? 
            OFFSET ?`;
        const [books] = await pool.promise().query(booksQuery, [limit, offset]);

        res.json({
            books,
            pagination: {
                currentPage: page,
                totalPages,
                totalBooks,
                limit
            }
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
        // Seleccionar todos los campos para la vista de detalle del libro
        const [books] = await pool.promise().query('SELECT * FROM libros WHERE id = ?', [id]);
        if (books.length === 0) {
            return res.status(404).json({ message: 'Libro no encontrado.' });
        }
        res.json(books[0]);
    } catch (error) {
        console.error('Error en getBookById:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el libro.', error: error.message });
    }
};

// --- Funciones solo para Administradores ---

// Crear un nuevo libro (solo admin)
export const createBook = async (req, res) => {
    const { title, author, publication_date, cover_image_url, rating, price, description, tags, pages, publisher, stock, categories, isbn } = req.body;

    if (!title || !price || stock === undefined) {
        return res.status(400).json({ message: 'Título, precio y stock son requeridos.' });
    }

    try {
        const query = `INSERT INTO libros (title, author, publication_date, cover_image_url, rating, price, description, tags, pages, publisher, stock, categories, isbn)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.promise().execute(query, [
            title, author || null, publication_date || null, cover_image_url || null, rating || 0,
            price, description || null, tags || null, pages || 0, publisher || null, stock || 0,
            categories || null, isbn || null
        ]);
        res.status(201).json({ message: 'Libro creado exitosamente.', bookId: result.insertId });
    } catch (error) {
        console.error('Error en createBook:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el libro.', error: error.message });
    }
};

// Actualizar un libro existente (solo admin)
export const updateBook = async (req, res) => {
    const { id } = req.params;
    const { title, author, publication_date, cover_image_url, rating, price, description, tags, pages, publisher, stock, categories, isbn } = req.body;

    let fieldsToUpdate = [];
    let values = [];
    if (title !== undefined) { fieldsToUpdate.push('title = ?'); values.push(title); }
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
        const [result] = await pool.promise().execute(query, values);
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
        const [result] = await pool.promise().execute('DELETE FROM libros WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado para eliminar.' });
        }
        res.json({ message: 'Libro eliminado exitosamente.' });
    } catch (error) {
        console.error('Error en deleteBook:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el libro.', error: error.message });
    }
}; 