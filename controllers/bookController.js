import { getConnection } from '../config/db.js';

// Obtener todos los libros (con paginación, filtros y ordenamiento)
export const getAllBooks = async (req, res) => {
    const connection = getConnection();
    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }
    try {
        // Paginación
        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);
        page = (isNaN(page) || page < 1) ? 1 : page;
        limit = (isNaN(limit) || limit < 1) ? 10 : limit;
        const offset = (page - 1) * limit;

        // Filtros y Ordenamiento
        const { autor, categoria, q, ordenarPor, direccion } = req.query;
        let whereClauses = [];
        let queryParams = [];

        if (q) {
            const searchTerm = `%${q}%`;
            whereClauses.push('(title LIKE ? OR author LIKE ? OR description LIKE ?)');
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (autor) {
            whereClauses.push('author LIKE ?');
            queryParams.push(`%${autor}%`);
        }
        if (categoria) {
            whereClauses.push('JSON_CONTAINS(categories, JSON_QUOTE(?))');
            queryParams.push(categoria);
        }

        let whereSql = '';
        if (whereClauses.length > 0) {
            whereSql = `WHERE ${whereClauses.join(' AND ')}`;
        }

        const allowedOrderByFields = { 
            'title': 'title', 'price': 'price', 'publication_date': 'publication_date', 'id': 'id'
        };
        const sortField = allowedOrderByFields[ordenarPor] || 'id';
        const sortDirection = (direccion && direccion.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
        const orderBySql = `ORDER BY ${sortField} ${sortDirection}`;

        const countQuery = `SELECT COUNT(*) as totalItems FROM libros ${whereSql}`;
        const [totalRows] = await connection.query(countQuery, queryParams);
        const totalItems = totalRows[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        if (page > totalPages && totalItems > 0) {
            return res.status(404).json({ 
                message: `Página solicitada (${req.query.page || 1}) excede el total de páginas (${totalPages}) para los filtros aplicados.`,
                pagination: { totalItems, totalPages, currentPage: parseInt(req.query.page, 10) || 1, itemsPerPage: limit, filtersApplied: { q: q || null, autor: autor || null, categoria: categoria || null }, sortApplied: { field: sortField, direction: sortDirection } }
            });
        }
        
        const booksQueryParams = [...queryParams, limit, offset];
        const booksQuery = `SELECT * FROM libros ${whereSql} ${orderBySql} LIMIT ? OFFSET ?`;
        const [books] = await connection.query(booksQuery, booksQueryParams);
        
        res.json({ data: books, pagination: { totalItems, totalPages, currentPage: page, itemsPerPage: limit, filtersApplied: { q: q || null, autor: autor || null, categoria: categoria || null }, sortApplied: { field: sortField, direction: sortDirection } } });
    } catch (error) {
        console.error('Error en getAllBooks:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener libros.', error: error.message });
    }
};

// Obtener un libro específico por su ID
export const getBookById = async (req, res) => {
    const connection = getConnection();
    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'El ID del libro debe ser un número.'});
        }
        const [rows] = await connection.query('SELECT * FROM libros WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Libro no encontrado.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(`Error en getBookById (ID: ${req.params.id}):`, error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el libro.' });
    }
};

// Crear un nuevo libro
export const createBook = async (req, res) => {
    const connection = getConnection();
    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }
    try {
        const { title, author, publication_date, cover_image_url, rating, price, description, tags, pages, publisher, stock, categories, isbn } = req.body;
        if (!title || !author || price === undefined || stock === undefined) {
            return res.status(400).json({ message: 'Los campos obligatorios son: title, author, price, stock.' });
        }
        const insertQuery = `INSERT INTO libros (title, author, publication_date, cover_image_url, rating, price, description, tags, pages, publisher, stock, categories, isbn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
        const params = [ title, author, publication_date || null, cover_image_url || null, rating !== undefined ? parseFloat(rating) : null, parseFloat(price), description || null, tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null, pages !== undefined ? parseInt(pages) : null, publisher || null, parseInt(stock), categories ? (typeof categories === 'string' ? categories : JSON.stringify(categories)) : null, isbn || null ];
        const [result] = await connection.execute(insertQuery, params);
        if (result.insertId) {
            const [newBookRows] = await connection.query('SELECT * FROM libros WHERE id = ?', [result.insertId]);
            res.status(201).json(newBookRows[0] || { message: 'Libro creado, pero no encontrado después.', id: result.insertId });
        } else {
            res.status(500).json({ message: 'Error al crear el libro, no se generó ID.' });
        }
    } catch (error) {
        console.error('Error en createBook:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el libro.', error: error.message });
    }
};

// Actualizar un libro existente por ID (PUT)
export const updateBook = async (req, res) => {
    const connection = getConnection();
    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'El ID del libro debe ser un número.'});
        }
        const { title, author, publication_date, cover_image_url, rating, price, description, tags, pages, publisher, stock, categories, isbn } = req.body;
        if (title === undefined || author === undefined || price === undefined || stock === undefined) {
             return res.status(400).json({ message: 'Los campos obligatorios son: title, author, price, stock.' });
        }
        const updateQuery = `UPDATE libros SET title = ?, author = ?, publication_date = ?, cover_image_url = ?, rating = ?, price = ?, description = ?, tags = ?, pages = ?, publisher = ?, stock = ?, categories = ?, isbn = ? WHERE id = ?;`;
        const params = [ title, author, publication_date || null, cover_image_url || null, rating !== undefined ? parseFloat(rating) : null, parseFloat(price), description || null, tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null, pages !== undefined ? parseInt(pages) : null, publisher || null, parseInt(stock), categories ? (typeof categories === 'string' ? categories : JSON.stringify(categories)) : null, isbn || null, id ];
        const [result] = await connection.execute(updateQuery, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado o datos sin cambios.' });
        }
        const [updatedBookRows] = await connection.query('SELECT * FROM libros WHERE id = ?', [id]);
        res.status(200).json(updatedBookRows[0] || { message: 'Libro actualizado, pero no encontrado después.'});
    } catch (error) {
        console.error(`Error en updateBook (ID: ${req.params.id}):`, error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el libro.', error: error.message });
    }
};

// Eliminar un libro por ID (DELETE)
export const deleteBook = async (req, res) => {
    const connection = getConnection();
    if (!connection || connection.connection._closing === true) {
        return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB).' });
    }
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'El ID del libro debe ser un número.'});
        }
        const deleteQuery = 'DELETE FROM libros WHERE id = ?';
        const [result] = await connection.execute(deleteQuery, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Libro no encontrado.' });
        }
        res.status(200).json({ message: 'Libro eliminado exitosamente.' });
    } catch (error) {
        console.error(`Error en deleteBook (ID: ${req.params.id}):`, error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el libro.', error: error.message });
    }
}; 