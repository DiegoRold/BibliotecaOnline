import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Asegúrate de que las variables de entorno estén cargadas

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'entre_hojas_db'
};

let connection;

async function connectToDatabase() {
    try {
        if (connection && connection.connection && connection.connection._closing === false) {
            // Ya existe una conexión activa y no se está cerrando
            console.log('Reutilizando conexión a la base de datos MySQL existente.');
            return connection;
        }
        connection = await mysql.createConnection(dbConfig);
        console.log('Nueva conexión a la base de datos MySQL establecida exitosamente.');
        return connection;
    } catch (error) {
        console.error('Error al conectar con la base de datos MySQL:', error);
        // Es importante manejar este error, quizás reintentar o terminar la app
        // Por ahora, relanzamos para que el llamador lo maneje o la app termine si es en el inicio.
        throw error;
    }
}

function getConnection() {
    if (!connection || connection.connection._closing === true) {
        console.warn('Se intentó obtener una conexión a la DB no establecida o cerrada.');
        // Podrías intentar reconectar aquí o lanzar un error más específico
        // throw new Error('La conexión a la base de datos no está disponible.');
        // Por ahora, devolvemos la conexión (que podría estar cerrada o ser undefined)
        // el controlador debería verificarla.
    }
    return connection;
}

// Exportamos la función para conectar y la función para obtener la conexión
export { connectToDatabase, getConnection }; 