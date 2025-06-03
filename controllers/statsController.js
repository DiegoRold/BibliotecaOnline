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