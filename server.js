import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectToDatabase } from './config/db.js'; // Importar solo la función de conexión
import bookRoutes from './routes/bookRoutes.js'; // Importar las rutas de libros
import authRoutes from './routes/authRoutes.js'; // Importar las rutas de autenticación
// import paymentRoutes from './routes/paymentRoutes.js'; // ELIMINADO
import orderRoutes from './routes/orderRoutes.js'; // Importar las rutas de pedidos
import wishlistRoutes from './routes/wishlistRoutes.js'; // Importar rutas de wishlist
import cartRoutes from './routes/cartRoutes.js'; // Importar rutas de carrito

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

// --- Rutas de la API ---

// Ruta de bienvenida/prueba
app.get('/', (req, res) => {
    res.send('¡Bienvenido al backend de Entre Hojas!');
});

// Usar las rutas de autenticación para cualquier petición a /api/auth
app.use('/api/auth', authRoutes);

// Usar las rutas de libros para cualquier petición a /api/libros
app.use('/api/libros', bookRoutes);

// Usar las rutas de pagos para cualquier petición a /api/payments  // ELIMINADO
// app.use('/api/payments', paymentRoutes); // ELIMINADO

// Usar las rutas de pedidos para cualquier petición a /api/pedidos
app.use('/api/pedidos', orderRoutes);

// Usar las rutas de wishlist para cualquier petición a /api/wishlist
app.use('/api/wishlist', wishlistRoutes);

// Usar las rutas de carrito para cualquier petición a /api/cart
app.use('/api/cart', cartRoutes);

// (Aquí se podrían añadir otras rutas para otros recursos, ej. app.use('/api/usuarios', userRoutes);)


// --- Manejo de Errores Centralizado (Opcional pero recomendado para el futuro) ---
// app.use((err, req, res, next) => {
//     console.error('Error no manejado:', err.stack);
//     res.status(500).send('¡Algo salió muy mal!');
// });


// --- Iniciar el Servidor ---
async function startServer() {
    try {
        await connectToDatabase(); // Primero conectamos a la DB
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo iniciar el servidor debido a un error de conexión con la DB:', error);
        process.exit(1); // Salir si no se puede conectar a la DB al inicio
    }
}

startServer();

// Exportamos la app para posibles pruebas futuras o arquitecturas más complejas (opcional por ahora)
// export default app; // Si usas esto, necesitarías ajustar cómo se inicia el servidor. 