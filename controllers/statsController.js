import pool from '../config/db.js';

// Función para obtener los nombres de los meses en español
const getMonthName = (monthNumber) => {
    const GTM_OFFSET = 0; // Ajusta si tu servidor está en una zona horaria diferente a la que quieres mostrar
    const date = new Date();
    date.setMonth(monthNumber - 1 + GTM_OFFSET); // monthNumber es 1-12
    date.setDate(1); // Asegurar que es el primer día del mes para evitar problemas con meses cortos
    return date.toLocaleString('es-ES', { month: 'long' });
};

// Obtener estadísticas de crecimiento mensual de usuarios (últimos 6 meses por defecto)
export const getMonthlyGrowthStats = async (req, res) => {
    let connection;
    const numberOfMonths = 6; // Período para las estadísticas

    try {
        connection = await pool.getConnection();
        console.log('[statsController] Conexión a BD establecida para getMonthlyGrowthStats (solo usuarios)');

        const labels = [];
        const usersData = [];
        // const booksData = []; // Eliminado booksData

        const currentDate = new Date();
        currentDate.setDate(1); // Empezar desde el primer día del mes actual

        for (let i = 0; i < numberOfMonths; i++) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1; // 1-12
            
            // Nombre del mes para la etiqueta (del más antiguo al más reciente)
            // Lo insertamos al principio para que el orden sea cronológico en el gráfico
            labels.unshift(getMonthName(month).charAt(0).toUpperCase() + getMonthName(month).slice(1));

            // Nuevos usuarios ese mes
            // El campo de fecha de creación en la tabla 'usuarios' es 'fecha_creacion'
            const [userRows] = await connection.query(
                `SELECT COUNT(*) as count 
                 FROM usuarios 
                 WHERE YEAR(fecha_creacion) = ? AND MONTH(fecha_creacion) = ?`, // Corregido de fecha_registro a fecha_creacion
                [year, month]
            );
            usersData.unshift(userRows[0].count || 0);

            // Lógica para libros eliminada
            // const [bookRows] = await connection.query(...);
            // booksData.unshift(bookRows[0].count || 0);

            // Retroceder al mes anterior para la siguiente iteración
            currentDate.setMonth(currentDate.getMonth() - 1);
        }
        
        console.log('[statsController] Datos de crecimiento mensual (solo usuarios) generados:', { labels, usersData });
        res.status(200).json({
            labels,
            datasets: [
                {
                    label: 'Nuevos Usuarios',
                    data: usersData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true,
                }
                // Dataset de libros eliminado
                // {
                //     label: 'Nuevos Libros',
                //     data: booksData,
                //     borderColor: 'rgb(255, 99, 132)',
                //     backgroundColor: 'rgba(255, 99, 132, 0.2)',
                //     tension: 0.1,
                //     fill: true,
                // }
            ]
        });

    } catch (error) {
        console.error('[statsController] Error en getMonthlyGrowthStats (solo usuarios):', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener estadísticas de crecimiento de usuarios.', error: error.message });
    } finally {
        if (connection) {
            console.log('[statsController] Liberando conexión de BD para getMonthlyGrowthStats (solo usuarios)');
            connection.release();
        }
    }
};

// NUEVA FUNCIÓN AÑADIDA
export const getSalesByCategoryStats = async (req, res) => {
    let connection;
    console.log('[statsController] Solicitud para getSalesByCategoryStats');

    // Asumimos que contamos ventas de pedidos 'Entregado'
    // CAMBIA 'Entregado' SI TU ESTADO ES DIFERENTE (ej: 'Completado', 'Pagado')
    const estadoPedidoConsiderado = 'delivered'; 

    try {
        connection = await pool.getConnection();
        console.log('[statsController] Conexión a BD establecida para getSalesByCategoryStats');

        const query = `
            SELECT 
                COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.categories, '$[0]')), 'Sin Categoría') AS categoria, 
                SUM(pi.cantidad) AS totalVendido
            FROM pedido_items pi
            JOIN libros l ON pi.libro_id = l.id
            JOIN pedidos p ON pi.pedido_id = p.id
            WHERE p.estado_pedido = ? 
            GROUP BY categoria
            ORDER BY totalVendido DESC;
        `;

        const [rows] = await connection.query(query, [estadoPedidoConsiderado]);
        console.log('[statsController] Datos de ventas por categoría obtenidos:', rows);

        const labels = rows.map(row => row.categoria);
        const data = rows.map(row => row.totalVendido);

        const backgroundColors = rows.map((_, index) => {
            const hue = (index * (360 / (rows.length || 1))) % 360;
            return `hsl(${hue}, 70%, 60%)`;
        });

        res.status(200).json({
            labels,
            datasets: [{
                label: 'Ventas por Categoría',
                data,
                backgroundColor: backgroundColors,
                hoverOffset: 4
            }]
        });

    } catch (error) {
        console.error('[statsController] Error en getSalesByCategoryStats:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener estadísticas de ventas por categoría.', error: error.message });
    } finally {
        if (connection) {
            console.log('[statsController] Liberando conexión de BD para getSalesByCategoryStats');
            connection.release();
        }
    }
};

// NUEVA FUNCIÓN PARA TOP LIBROS VENDIDOS
export const getTopBooksStats = async (req, res) => {
    let connection;
    const limit = 5; // Obtener el Top 5 de libros más vendidos
    console.log(`[statsController] Solicitud para getTopBooksStats (Top ${limit})`);

    const estadoPedidoConsiderado = 'delivered';

    try {
        connection = await pool.getConnection();
        console.log('[statsController] Conexión a BD establecida para getTopBooksStats');

        const query = `
            SELECT 
                l.title AS libroTitulo,
                SUM(pi.cantidad) AS totalVendido
            FROM pedido_items pi
            JOIN libros l ON pi.libro_id = l.id
            JOIN pedidos p ON pi.pedido_id = p.id
            WHERE p.estado_pedido = ? 
            GROUP BY l.title
            ORDER BY totalVendido DESC
            LIMIT ?;
        `;

        const [rows] = await connection.query(query, [estadoPedidoConsiderado, limit]);
        console.log('[statsController] Datos de top libros obtenidos:', rows);

        const labels = rows.map(row => row.libroTitulo);
        const data = rows.map(row => row.totalVendido);

        // Generar colores dinámicamente si es necesario, o usar un conjunto predefinido
        const backgroundColors = rows.map((_, index) => {
            // Colores base de ejemplo, puedes expandir o mejorar esto
            const colors = [
                'rgba(255, 99, 132, 0.7)',  // Rojo
                'rgba(54, 162, 235, 0.7)', // Azul
                'rgba(255, 206, 86, 0.7)', // Amarillo
                'rgba(75, 192, 192, 0.7)', // Verde Teal
                'rgba(153, 102, 255, 0.7)' // Púrpura
            ];
            return colors[index % colors.length];
        });
         const borderColors = backgroundColors.map(color => color.replace('0.7', '1')); // Hacer borde más opaco

        res.status(200).json({
            labels,
            datasets: [{
                label: `Top ${limit} Libros Vendidos`,
                data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        });

    } catch (error) {
        console.error('[statsController] Error en getTopBooksStats:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener estadísticas de top libros.', error: error.message });
    } finally {
        if (connection) {
            console.log('[statsController] Liberando conexión de BD para getTopBooksStats');
            connection.release();
        }
    }
}; 

// NUEVA FUNCIÓN PARA TOP CLIENTES
export const getTopCustomersStats = async (req, res) => {
    let connection;
    const limit = 5; // Obtener el Top 5 de clientes
    console.log(`[statsController] Solicitud para getTopCustomersStats (Top ${limit})`);

    const estadoPedidoConsiderado = 'delivered';

    try {
        connection = await pool.getConnection();
        console.log('[statsController] Conexión a BD establecida para getTopCustomersStats');

        const query = `
            SELECT 
                u.nombre AS nombreCliente,
                u.email AS emailCliente, 
                SUM(p.monto_total) AS totalGastado
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.estado_pedido = ?
            GROUP BY p.usuario_id, u.nombre, u.email
            ORDER BY totalGastado DESC
            LIMIT ?;
        `;

        const [rows] = await connection.query(query, [estadoPedidoConsiderado, limit]);
        console.log('[statsController] Datos de top clientes obtenidos:', rows);

        const labels = rows.map(row => row.nombreCliente || row.emailCliente); // Usar email si el nombre no está
        const data = rows.map(row => parseFloat(row.totalGastado).toFixed(2)); // Asegurar que sea un número con 2 decimales

        const backgroundColors = rows.map((_, index) => {
            const colors = [
                'rgba(255, 159, 64, 0.7)', // Naranja
                'rgba(75, 192, 192, 0.7)', // Verde Teal
                'rgba(54, 162, 235, 0.7)',  // Azul
                'rgba(153, 102, 255, 0.7)',// Púrpura
                'rgba(255, 206, 86, 0.7)'  // Amarillo
            ];
            return colors[index % colors.length];
        });
        const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

        res.status(200).json({
            labels,
            datasets: [{
                label: `Top ${limit} Clientes (por Gasto Total)`,
                data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        });

    } catch (error) {
        console.error('[statsController] Error en getTopCustomersStats:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener estadísticas de top clientes.', error: error.message });
    } finally {
        if (connection) {
            console.log('[statsController] Liberando conexión de BD para getTopCustomersStats');
            connection.release();
        }
    }
}; 