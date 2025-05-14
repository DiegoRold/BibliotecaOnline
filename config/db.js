import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Cargar variables de entorno

// Crear el pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Ajusta según tus necesidades
    queueLimit: 0
});

// Función para verificar la conexión (opcional, para usar en server.js al arrancar)
export const checkDatabaseConnection = async () => {
    try {
        // Intenta obtener una conexión para probar el pool
        const connection = await pool.getConnection();
        console.log('Conectado exitosamente a la base de datos MySQL.');
        connection.release(); // Libera la conexión
    } catch (error) {
        console.error('Error al conectar con la base de datos MySQL:', error);
        throw error; // Propagar el error para que el servidor falle si no puede conectar
    }
};

// Exportar el pool como el default export para que otros módulos puedan usarlo
export default pool; 