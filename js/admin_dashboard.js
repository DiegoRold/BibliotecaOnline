document.addEventListener('DOMContentLoaded', async () => {
    console.log('Admin Dashboard script loaded.');

    const isAdmin = await checkAdminRole(); 
    if (!isAdmin) {
        alert('Acceso denegado. Debes ser administrador para ver esta página.');
        window.location.href = 'login.html'; // O a la página de inicio si prefieres
        return;
    }

    console.log('Acceso de administrador verificado. Cargando dashboard...');
    loadKPIs();
    loadChart();
    loadRecentActivity();
});

async function checkAdminRole() {
    const token = localStorage.getItem('authToken'); 
    if (!token) {
        console.log('No se encontró authToken. Redirigiendo...');
        return false; 
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/verify-admin', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.isAdmin === true;
        } else {
            // Si el token es inválido (401, 403) o hay otro error de servidor
            console.error('Error verificando rol de admin con el backend:', response.status);
            // Podrías querer limpiar el token inválido aquí
            // localStorage.removeItem('authToken');
            // localStorage.removeItem('userData');
            return false;
        }
    } catch (error) {
        console.error('Error de red o excepción al verificar rol de admin:', error);
        return false;
    }
}

async function fetchData(apiUrl) {
    const token = localStorage.getItem('authToken');
    if (!token && !apiUrl.includes('example-data')) { // No requerir token para datos de ejemplo si se usan
        console.error('No se encontró authToken para la solicitud a API:', apiUrl);
        // Podría redirigir a login o manejar de otra forma
        // window.location.href = 'login.html'; 
        // throw new Error('Token no encontrado');
        // Por ahora, para desarrollo, si no hay token y no son datos de ejemplo, podría fallar suavemente
    }

    try {
        // Descomentar y usar cuando los endpoints estén listos y protegidos
        // const response = await fetch(apiUrl, { 
        //     headers: {
        //         'Authorization': `Bearer ${token}`,
        //         'Content-Type': 'application/json'
        //     }
        // });
        // if (!response.ok) {
        //     if (response.status === 401 || response.status === 403) {
        //         // Token inválido o no autorizado para este recurso admin
        //         alert('Sesión expirada o no autorizado. Por favor, inicie sesión como administrador.');
        //         localStorage.removeItem('authToken');
        //         localStorage.removeItem('userData');
        //         window.location.href = 'login.html';
        //     }
        //     throw new Error(`Error ${response.status}: ${response.statusText}`);
        // }
        // return await response.json();
        
        // --- DATOS DE EJEMPLO TEMPORALES (Mantener hasta que el backend esté listo) ---
        console.warn(`fetchData: Usando datos de ejemplo para ${apiUrl}. URL real sería: ${apiUrl}`);
        if (apiUrl.includes('total-users')) return { total: Math.floor(Math.random() * 1000) + 50 };
        if (apiUrl.includes('total-books')) return { total: Math.floor(Math.random() * 5000) + 200 };
        if (apiUrl.includes('pending-orders')) return { total: Math.floor(Math.random() * 50) };
        if (apiUrl.includes('overview-chart-data')) return {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Usuarios Registrados',
                data: [65, 59, 80, 81, 56, 55],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Libros Vendidos',
                data: [28, 48, 40, 19, 86, 27],
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        };
        if (apiUrl.includes('recent-activity')) return {
            activities: [
                { timestamp: new Date().toISOString(), message: 'Nuevo usuario registrado: Admin User.' },
                { timestamp: new Date().toISOString(), message: 'Nuevo pedido #12345 procesado.' },
                { timestamp: new Date().toISOString(), message: 'Libro \'Aprende JavaScript\' actualizado.' }
            ]
        };
        return {}; 
        // --- FIN DATOS DE EJEMPLO ---

    } catch (error) {
        console.error(`Error fetching data from ${apiUrl}:`, error);
        // No redirigir desde aquí directamente para no interrumpir todas las llamadas si una falla,
        // a menos que sea un error de autenticación manejado arriba.
        return null; 
    }
}

async function loadKPIs() {
    console.log('Cargando KPIs...');
    const totalUsersEl = document.getElementById('kpi-total-users');
    const totalBooksEl = document.getElementById('kpi-total-books');
    const pendingOrdersEl = document.getElementById('kpi-pending-orders');

    if (totalUsersEl) {
        const usersData = await fetchData('/api/admin/stats/total-users'); // URL del endpoint real
        totalUsersEl.textContent = usersData ? usersData.total : 'Error';
    }
    if (totalBooksEl) {
        const booksData = await fetchData('/api/admin/stats/total-books'); // URL del endpoint real
        totalBooksEl.textContent = booksData ? booksData.total : 'Error';
    }
    if (pendingOrdersEl) {
        const ordersData = await fetchData('/api/admin/stats/pending-orders'); // URL del endpoint real
        pendingOrdersEl.textContent = ordersData ? ordersData.total : 'Error';
    }
    console.log('KPIs cargados.');
}

async function loadChart() {
    console.log('Cargando gráfico...');
    const chartData = await fetchData('/api/admin/stats/overview-chart-data'); // URL del endpoint real
    const ctx = document.getElementById('overviewChart')?.getContext('2d');
    
    if (ctx && chartData) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Actividad General de la Plataforma' }
                }
            }
        });
        console.log('Gráfico cargado e inicializado.');
    } else {
        console.error('No se pudo cargar el gráfico: contexto no encontrado o datos no disponibles.');
        const chartContainer = document.getElementById('overviewChart')?.parentElement;
        if (chartContainer) chartContainer.innerHTML = '<p class="text-center text-red-500">Error al cargar datos del gráfico.</p>';
    }
}

async function loadRecentActivity() {
    console.log('Cargando actividad reciente...');
    const activityLogEl = document.getElementById('recent-activity-log');
    if (!activityLogEl) {
        console.warn('Elemento recent-activity-log no encontrado.');
        return;
    }

    const activityData = await fetchData('/api/admin/stats/recent-activity'); // URL del endpoint real
    
    if (activityData && activityData.activities && activityData.activities.length > 0) {
        activityLogEl.innerHTML = '';
        const ul = document.createElement('ul');
        ul.className = 'space-y-2';
        activityData.activities.forEach(activity => {
            const li = document.createElement('li');
            li.className = 'p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm';
            const date = new Date(activity.timestamp);
            const formattedTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            li.innerHTML = `<span class="font-semibold text-sky-600 dark:text-sky-400">[${formattedTime}]</span> ${activity.message}`;
            ul.appendChild(li);
        });
        activityLogEl.appendChild(ul);
    } else if (activityData) {
        activityLogEl.innerHTML = '<p>No hay actividad reciente para mostrar.</p>';
    } else {
        activityLogEl.innerHTML = '<p class="text-red-500">Error al cargar la actividad reciente.</p>';
    }
    console.log('Actividad reciente cargada.');
}

// Listener para el evento DOMContentLoaded para el logout, separado para claridad
document.addEventListener('DOMContentLoaded', () => {
    const adminLogoutLink = document.getElementById('admin-logout-link');
    if (adminLogoutLink) {
        adminLogoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Admin cerrando sesión...');
            localStorage.removeItem('authToken'); 
            localStorage.removeItem('userData'); 
            // Considera si hay otros items específicos de admin en localStorage para limpiar
            alert('Sesión de administrador cerrada. Serás redirigido.');
            window.location.href = 'index.html'; 
        });
    }
}); 