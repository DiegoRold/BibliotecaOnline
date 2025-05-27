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

export default router; 