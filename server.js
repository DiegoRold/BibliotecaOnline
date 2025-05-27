import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { checkDatabaseConnection } from './config/db.js'; // Cambiado: Importar checkDatabaseConnection

console.log('[server.js] Iniciando ejecución del servidor...'); // Log 1

console.log('[server.js] Intentando importar bookRoutes...'); // Log 2
import bookRoutes from './routes/bookRoutes.js'; // Importar las rutas de libros
console.log('[server.js] bookRoutes importado.', typeof bookRoutes); // Log 3 - Verificamos el tipo

import authRoutes from './routes/authRoutes.js'; // Importar las rutas de autenticación
// import paymentRoutes from './routes/paymentRoutes.js'; // ELIMINADO
import orderRoutes from './routes/orderRoutes.js'; // Importar las rutas de pedidos
import wishlistRoutes from './routes/wishlistRoutes.js'; // Importar rutas de wishlist
import cartRoutes from './routes/cartRoutes.js'; // Importar rutas de carrito
import userRoutes from './routes/userRoutes.js'; // <--- AÑADIR ESTA LÍNEA
import adminRoutes from './routes/adminRoutes.js'; // <--- AÑADIR ESTA LÍNEA PARA ADMIN

// Cargar variables de entorno desde .env
dotenv.config();

// --- Configuración de la Aplicación Express ---
const app = express();
// Usar el puerto de las variables de entorno, o 3000 por defecto
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON en las peticiones
app.use(express.json());

// Middleware para habilitar CORS para todas las rutas
app.use(cors());

// Servir archivos estáticos desde el directorio raíz del proyecto
// (HTML, CSS, JS del cliente, imágenes en assets/, etc.)
// Debe ir ANTES de las rutas de la API para evitar conflictos.
app.use(express.static('.'));

console.log('[server.js] Configurando middlewares y rutas...'); // Log 4

// --- Rutas de la API ---

// Ruta de bienvenida/prueba
app.get('/', (req, res) => {
    res.send('¡Bienvenido al backend de Entre Hojas!');
});

// Usar las rutas de autenticación para cualquier petición a /api/auth
app.use('/api/auth', authRoutes);

console.log('[server.js] Intentando usar bookRoutes para /api/libros...'); // Log 5
// Usar las rutas de libros para cualquier petición a /api/libros
app.use('/api/libros', bookRoutes);
console.log('[server.js] bookRoutes configurado para /api/libros.'); // Log 6

// Usar las rutas de pagos para cualquier petición a /api/payments  // ELIMINADO
// app.use('/api/payments', paymentRoutes); // ELIMINADO

// Usar las rutas de pedidos para cualquier petición a /api/pedidos
app.use('/api/pedidos', orderRoutes);

// Usar las rutas de wishlist para cualquier petición a /api/wishlist
app.use('/api/wishlist', wishlistRoutes);

// Usar las rutas de carrito para cualquier petición a /api/cart
app.use('/api/cart', cartRoutes);

// Usar las rutas de usuario para cualquier petición a /api (ej. /api/perfil, /api/perfil/cambiar-contrasena)
app.use('/api', userRoutes); // <--- AÑADIR ESTA LÍNEA

// Usar las rutas de administrador para cualquier petición a /api/admin
app.use('/api/admin', adminRoutes); // <--- AÑADIR ESTA LÍNEA PARA ADMIN

// (Aquí se podrían añadir otras rutas para otros recursos, ej. app.use('/api/usuarios', userRoutes);)


// --- Manejo de Errores Centralizado (Opcional pero recomendado para el futuro) ---
// app.use((err, req, res, next) => {
//     console.error('Error no manejado:', err.stack);
//     res.status(500).send('¡Algo salió muy mal!');
// });


// --- Iniciar el Servidor ---
async function startServer() {
    console.log('[server.js] Iniciando función startServer...'); // Log 7
    try {
        await checkDatabaseConnection(); // Cambiado: Llamar a checkDatabaseConnection
        console.log('[server.js] Conexión a la base de datos establecida.'); // Log 8
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            console.log('[server.js] bookRoutes debería estar cargado y las rutas de libros activas.'); // Log final de confirmación
        });
    } catch (error) {
        console.error('[server.js] No se pudo iniciar el servidor:', error);
        process.exit(1); // Salir si no se puede conectar a la DB al inicio
    }
}

startServer();

// Exportamos la app para posibles pruebas futuras o arquitecturas más complejas (opcional por ahora)
// export default app; // Si usas esto, necesitarías ajustar cómo se inicia el servidor. 