import mysql from 'mysql2/promise'; // Para conectar con MySQL
import fetch from 'node-fetch'; // Para hacer peticiones HTTP a la API

// --- Configuración de la Base de Datos ---
const dbConfig = {
    host: 'localhost', // O la IP de tu servidor MySQL
    user: 'root',  
    password: 'QWERTY-qwerty258', 
    database: 'entre_hojas_db'   
};

// --- URL de la API de Libros ---
const API_URL = 'https://books-foniuhqsba-uc.a.run.app/';

// Función para obtener los libros de la API
async function fetchBooksFromAPI() {
    console.log('Obteniendo libros de la API...');
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error al llamar a la API: ${response.status} ${response.statusText}`);
        }
        const books = await response.json();
        console.log(`Se encontraron ${books.length} libros en la API.`);
        return books;
    } catch (error) {
        console.error('Error al obtener libros de la API:', error);
        throw error; // Re-lanzamos el error para que main lo maneje
    }
}

// Función para insertar los libros en la base de datos
async function insertBooksIntoDB(books) {
    if (!books || books.length === 0) {
        console.log('No hay libros para insertar.');
        return;
    }

    let connection;
    try {
        console.log('Conectando a la base de datos MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Conexión a MySQL establecida.');

        // Preparamos la sentencia SQL para insertar un libro
        // Asegúrate que los nombres de columna coincidan con tu tabla `libros`
        const insertQuery = `
            INSERT INTO libros (
                title, author, publication_date, categories, pages,
                publisher, price, stock, cover_image_url, description, isbn
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        // NOTA: Se eliminó ON DUPLICATE KEY UPDATE. Si se ejecuta varias veces, se insertarán duplicados.
        // Esto se puede mejorar después si es necesario (ej. usando ISBN si es único y fiable).

        let librosInsertados = 0;
        // let librosActualizados = 0; // Ya no se actualiza con esta query simple

        for (const book of books) {
            const params = [
                book.title !== undefined ? book.title : null,
                book.author !== undefined ? book.author : null,
                book.year !== undefined ? book.year : null, // MySQL puede ser flexible con DATE y un año. Considerar formatear a YYYY-01-01 si da problemas.
                book.category !== undefined ? JSON.stringify(typeof book.category === 'string' ? [book.category] : book.category) : null,
                book.pages !== undefined ? book.pages : null,
                book.editorial !== undefined ? book.editorial : null, // Mapeado a 'publisher'
                book.price !== undefined ? book.price : null,
                book.stock !== undefined ? book.stock : null,
                book.cover !== undefined ? book.cover : null, // Mapeado a 'cover_image_url'
                book.synopsis !== undefined ? book.synopsis : null, // Mapeado a 'description'
                null // ISBN (no disponible en la API, siempre null por ahora)
            ];
            
            try {
                const [result] = await connection.execute(insertQuery, params);
                if (result.affectedRows > 0 && result.insertId !== 0) { // affectedRows debería ser 1 para un INSERT exitoso
                    librosInsertados++;
                }
            } catch (error) {
                 console.error(`Error al insertar libro (API ID podría ser ${book.id || 'desconocido'}): ${book.title || 'Título desconocido'}`, error.message);
            }
        }

        console.log(`Proceso de inserción completado. ${librosInsertados} libros nuevos insertados.`);
        // console.log(`Proceso de inserción completado. ${librosInsertados} libros nuevos insertados, ${librosActualizados} libros actualizados/verificados.`);

    } catch (error) {
        console.error('Error durante la inserción en la base de datos:', error);
    } finally {
        if (connection) {
            console.log('Cerrando conexión a MySQL.');
            await connection.end();
        }
    }
}

// Función principal para ejecutar el script
async function main() {
    try {
        const books = await fetchBooksFromAPI();
        if (books && books.length > 0) {
            await insertBooksIntoDB(books);
            console.log('¡Población de la base de datos completada exitosamente!');
        } else {
            console.log('No se obtuvieron libros de la API, no se realizará la inserción.');
        }
    } catch (error) {
        console.error('Error en el script de población:', error.message);
        // No es necesario volver a imprimir el error completo si ya se hizo en las funciones internas
    }
}

// Ejecutamos la función principal
main();
