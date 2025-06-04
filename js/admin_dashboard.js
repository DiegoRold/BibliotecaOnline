let currentChartInstance = null; // Variable para mantener la instancia del gráfico actual

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Admin Dashboard script loaded.');

    // Registrar el plugin ChartDataLabels globalmente
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
        console.log('ChartDataLabels plugin registrado globalmente.');
    } else {
        console.warn('ChartDataLabels plugin no encontrado. Asegúrate de que el script está cargado.');
    }

    const isAdmin = await checkAdminRole(); 
    if (!isAdmin) {
        alert('Acceso denegado. Debes ser administrador para ver esta página.');
        window.location.href = 'login.html'; // O a la página de inicio si prefieres
        return;
    }

    console.log('Acceso de administrador verificado. Cargando dashboard...');
    loadKPIs();
    displayChart('userGrowth'); // Cargar el gráfico inicial de crecimiento de usuarios
    loadRecentActivity();

    // Configurar listeners para los selectores de gráficos
    const chartSelectorButtons = document.querySelectorAll('.chart-selector-btn');
    chartSelectorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const chartType = button.dataset.charttype;
            displayChart(chartType);
        });
    });
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

async function fetchData(apiPath) {
    const token = localStorage.getItem('authToken');
    const baseUrl = 'http://localhost:3000'; // Define the base URL for the API
    const fullApiUrl = baseUrl + apiPath;     // Construct the full URL

    try {
        // Descomentar y usar cuando los endpoints estén listos y protegidos
        const response = await fetch(fullApiUrl, { // Use the full URL
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token inválido o no autorizado para este recurso admin
                alert('Sesión expirada o no autorizado. Por favor, inicie sesión como administrador.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'login.html';
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
        
        // --- DATOS DE EJEMPLO TEMPORALES (ELIMINAR O COMENTAR ESTA SECCIÓN) ---
        /* console.warn(`fetchData: Usando datos de ejemplo para ${apiUrl}. URL real sería: ${apiUrl}`);
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
        return {}; */
        // --- FIN DATOS DE EJEMPLO ---

    } catch (error) {
        console.error(`Error fetching data from ${fullApiUrl}:`, error); // Log fullApiUrl
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

async function displayChart(chartType) {
    console.log(`Solicitando cambio a gráfico: ${chartType}`);
    const chartTitleEl = document.getElementById('chartTitle');
    const chartDescriptionEl = document.getElementById('chartDescription');
    const overviewChartCanvas = document.getElementById('overviewChart');
    
    if (!overviewChartCanvas) {
        console.error('Elemento canvas overviewChart no encontrado.');
        return;
    }
    const ctx = overviewChartCanvas.getContext('2d');
    if (!ctx) {
        console.error('Contexto del canvas no encontrado para el gráfico.');
        return;
    }

    if (currentChartInstance) {
        currentChartInstance.destroy();
        currentChartInstance = null;
        console.log('Instancia de gráfico anterior destruida.');
    }
    
    ctx.clearRect(0, 0, overviewChartCanvas.width, overviewChartCanvas.height);

    document.querySelectorAll('.chart-selector-btn').forEach(btn => {
        // Ensure base 'border' and 'focus:ring-2' classes are present for consistent styling
        // The 'border' class allows border-color utilities to work.
        // The 'focus:ring-2' class (from original HTML) sets the ring width.
        if (!btn.classList.contains('border')) {
            btn.classList.add('border');
        }
        // focus:outline-none and focus:ring-2 are in the original HTML, so they should be fine.

        // Define all classes that will be dynamically managed for different states
        const inactiveBg = ['bg-gray-200', 'dark:bg-gray-600'];
        const inactiveText = ['text-gray-700', 'dark:text-gray-200'];
        const inactiveBorder = ['border-transparent'];
        const inactiveHover = ['hover:bg-gray-300', 'dark:hover:bg-gray-500']; // From original HTML
        const inactiveFocusRingColor = ['focus:ring-gray-400']; // From original HTML

        const activeMarker = ['active-chart-selector'];
        const activeBg = ['bg-sky-500', 'dark:bg-sky-500'];
        const activeText = ['text-white', 'dark:text-white'];
        const activeBorder = ['border-sky-500']; // Matches active background
        const activeHover = ['hover:bg-sky-600', 'dark:hover:bg-sky-600']; // Custom hover for active state
        const activeFocusRingColor = ['focus:ring-sky-300']; // Custom focus ring color for active state

        // Remove all potentially conflicting dynamic classes before applying the new state
        btn.classList.remove(
            ...inactiveBg, ...inactiveText, ...inactiveBorder, ...inactiveHover, ...inactiveFocusRingColor,
            ...activeMarker, ...activeBg, ...activeText, ...activeBorder, ...activeHover, ...activeFocusRingColor
        );

        if (btn.dataset.charttype === chartType) {
            // Set ACTIVE state
            btn.classList.add(...activeMarker, ...activeBg, ...activeText, ...activeBorder, ...activeHover, ...activeFocusRingColor);
        } else {
            // Set INACTIVE state (restore original dynamic classes + defined inactive border)
            btn.classList.add(...inactiveBg, ...inactiveText, ...inactiveBorder, ...inactiveHover, ...inactiveFocusRingColor);
        }
    });

    try {
        switch (chartType) {
            case 'userGrowth':
                chartTitleEl.textContent = 'Crecimiento Mensual (Usuarios)';
                chartDescriptionEl.textContent = 'Mostrando el crecimiento de nuevos usuarios en los últimos 6 meses.';
                await loadUserGrowthChart(ctx);
                break;
            case 'topBooks':
                chartTitleEl.textContent = 'Top 5 Libros Más Vendidos';
                chartDescriptionEl.textContent = 'Mostrando los 5 libros con más unidades vendidas.';
                await loadTopBooksChart(ctx);
                break;
            case 'salesByCategory':
                chartTitleEl.textContent = 'Ventas por Categoría';
                chartDescriptionEl.textContent = 'Mostrando el total de unidades vendidas por categoría.';
                await loadSalesByCategoryChart(ctx);
                break;
            case 'topCustomers':
                chartTitleEl.textContent = 'Top 5 Clientes (por Gasto)';
                chartDescriptionEl.textContent = 'Mostrando los 5 clientes que más han gastado.';
                await loadTopCustomersChart(ctx);
                break;
            default:
                console.warn(`Tipo de gráfico desconocido: ${chartType}`);
                chartTitleEl.textContent = 'Gráfico no disponible';
                chartDescriptionEl.textContent = 'Seleccione un tipo de gráfico válido.';
                showPlaceholderChart(ctx, 'Seleccione un gráfico');
        }
    } catch (error) {
        console.error(`Error al cargar el gráfico ${chartType}:`, error);
        ctx.clearRect(0, 0, overviewChartCanvas.width, overviewChartCanvas.height);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '16px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText(`Error al cargar: ${chartTitleEl.textContent}`, overviewChartCanvas.width / 2, overviewChartCanvas.height / 2);
        ctx.restore();
    }
}

async function loadUserGrowthChart(ctx) {
    console.log('Cargando gráfico de crecimiento de usuarios...');
    const chartDataResponse = await fetchData('/api/admin/stats/monthly-growth'); 
    
    if (chartDataResponse && chartDataResponse.labels && chartDataResponse.datasets) {
        currentChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartDataResponse.labels,
                datasets: chartDataResponse.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: { 
                            stepSize: 1 
                        }
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    title: { display: false } // El título ahora se maneja externamente por #chartTitle
                }
            }
        });
        console.log('Gráfico de crecimiento de usuarios cargado.');
    } else {
        console.error('No se pudo cargar el gráfico de crecimiento de usuarios: datos no disponibles o en formato incorrecto.', chartDataResponse);
        throw new Error('Datos para gráfico de crecimiento de usuarios no válidos');
    }
}

async function loadTopBooksChart(ctx) {
    console.log('Cargando gráfico de top libros vendidos...');
    const chartDataResponse = await fetchData('/api/admin/stats/top-books');
    console.log('Datos recibidos para top libros:', JSON.stringify(chartDataResponse, null, 2));

    if (chartDataResponse && 
        chartDataResponse.labels && chartDataResponse.labels.length > 0 &&
        chartDataResponse.datasets && chartDataResponse.datasets.length > 0 && 
        chartDataResponse.datasets[0].data && chartDataResponse.datasets[0].data.length > 0 &&
        chartDataResponse.datasets[0].data.some(value => value > 0)) {
        
        currentChartInstance = new Chart(ctx, {
            type: 'bar', 
            data: {
                labels: chartDataResponse.labels,
                datasets: chartDataResponse.datasets 
            },
            options: {
                indexAxis: 'y', // Para hacerlo un gráfico de barras horizontales
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0 // Mostrar números enteros en el eje X (cantidades)
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false // La leyenda del dataset no es tan útil aquí
                    },
                    title: {
                        display: false, 
                    },
                    datalabels: { 
                        anchor: 'end',
                        align: 'right',
                        formatter: (value, context) => {
                            return value; // Mostrar el valor numérico directamente
                        },
                        color: '#333', // Color del texto de la etiqueta
                        font: {
                            weight: 'normal',
                        },
                        offset: 4, // Pequeño desplazamiento para que no se pegue a la barra
                    }
                }
            }
        });
        console.log('Gráfico de top libros cargado.');
    } else {
        console.error('No se pudo cargar el gráfico de top libros: datos vacíos, no disponibles o en formato incorrecto.', chartDataResponse);
        showPlaceholderChart(ctx, 'No hay datos de top libros para mostrar.');
    }
}

async function loadSalesByCategoryChart(ctx) {
    console.log('Cargando gráfico de ventas por categoría...');
    const chartDataResponse = await fetchData('/api/admin/stats/sales-by-category');
    console.log('Datos recibidos para ventas por categoría:', JSON.stringify(chartDataResponse, null, 2));

    if (chartDataResponse && 
        chartDataResponse.labels && chartDataResponse.labels.length > 0 &&
        chartDataResponse.datasets && chartDataResponse.datasets.length > 0 && 
        chartDataResponse.datasets[0].data && chartDataResponse.datasets[0].data.length > 0 &&
        chartDataResponse.datasets[0].data.some(value => value > 0)) {
        
        currentChartInstance = new Chart(ctx, {
            type: 'pie', 
            data: {
                labels: chartDataResponse.labels,
                datasets: chartDataResponse.datasets 
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: false, 
                    },
                    datalabels: { 
                        formatter: (value, context) => {
                            // Log para depuración
                            console.log('Datalabels formatter - value:', value, 'context datasetIndex:', context.datasetIndex, 'dataIndex:', context.dataIndex);
                            
                            const chart = context.chart;
                            if (!chart || !chart.data || !chart.data.datasets || !chart.data.datasets[context.datasetIndex]) {
                                console.warn('Datalabels formatter: chart or dataset structure not found as expected.');
                                return 'Error';
                            }
                            const dataset = chart.data.datasets[context.datasetIndex];
                            if (!dataset.data || dataset.data.length === 0) {
                                console.warn('Datalabels formatter: dataset.data no encontrado o vacío.');
                                return 'N/A';
                            }
                            const datasetData = dataset.data;
                            
                            // Asegurarse de que los datos son numéricos antes de sumar
                            const sum = datasetData.reduce((a, b) => Number(a) + Number(b), 0);
                            
                            console.log('Datalabels formatter - datasetData:', datasetData, 'sum:', sum);

                            if (sum === 0) {
                                // Si la suma es 0, y el valor es 0, mostrar 0.0%.
                                return (Number(value) === 0) ? '0.0%' : 'Error (sum is 0)'; 
                            }
                            
                            const percentage = (Number(value) / sum * 100);
                            console.log('Datalabels formatter - calculated percentage for value', value, 'is:', percentage);

                            if (isNaN(percentage)) {
                                console.warn('Datalabels formatter: Percentage is NaN. Value:', value, 'Sum:', sum);
                                return 'Error NaN';
                            }
                            
                            return percentage.toFixed(1) + '%';
                        },
                        color: '#fff',
                        font: {
                            weight: 'bold',
                            size: 12,
                        },
                    }
                }
            }
        });
        console.log('Gráfico de ventas por categoría cargado.');
    } else {
        console.error('No se pudo cargar el gráfico de ventas por categoría: datos vacíos, no disponibles, en formato incorrecto o todos los valores son cero.', chartDataResponse);
        showPlaceholderChart(ctx, 'No hay datos de ventas por categoría para mostrar.');
    }
}

async function loadTopCustomersChart(ctx) {
    console.log('Cargando gráfico de top clientes...');
    const chartDataResponse = await fetchData('/api/admin/stats/top-customers');
    console.log('Datos recibidos para top clientes:', JSON.stringify(chartDataResponse, null, 2));

    if (chartDataResponse && 
        chartDataResponse.labels && chartDataResponse.labels.length > 0 &&
        chartDataResponse.datasets && chartDataResponse.datasets.length > 0 && 
        chartDataResponse.datasets[0].data && chartDataResponse.datasets[0].data.length > 0 &&
        chartDataResponse.datasets[0].data.some(value => parseFloat(value) > 0)) {
        
        currentChartInstance = new Chart(ctx, {
            type: 'bar', 
            data: {
                labels: chartDataResponse.labels,
                datasets: chartDataResponse.datasets.map(dataset => ({
                    ...dataset,
                    data: dataset.data.map(value => parseFloat(value)) // Asegurar que los datos sean numéricos
                }))
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0, // Sin decimales para el eje X (moneda)
                            callback: function(value) { // Formatear como moneda (ej. EUR)
                                return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false 
                    },
                    title: {
                        display: false, 
                    },
                    tooltip: { // Configuración de tooltips para mostrar moneda
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.x !== null) {
                                    label += context.parsed.x.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
                                }
                                return label;
                            }
                        }
                    },
                    datalabels: { 
                        anchor: 'end',
                        align: 'right',
                        formatter: (value, context) => {
                            // Formatear el valor como moneda para las etiquetas de datos
                            return parseFloat(value).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
                        },
                        color: '#333',
                        font: {
                            weight: 'normal',
                        },
                        offset: 4,
                    }
                }
            }
        });
        console.log('Gráfico de top clientes cargado.');
    } else {
        console.error('No se pudo cargar el gráfico de top clientes: datos vacíos, no disponibles o en formato incorrecto.', chartDataResponse);
        showPlaceholderChart(ctx, 'No hay datos de top clientes para mostrar.');
    }
}

function showPlaceholderChart(ctx, message) {
    // No es necesario destruir aquí currentChartInstance porque ya se hace en displayChart
    // Tampoco es necesario limpiar el ctx aquí porque ya se hace en displayChart
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '16px Arial';
    ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.restore();
    console.log(`Mostrando placeholder: ${message}`);
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
    const confirmAdminLogoutModal = document.getElementById('confirm-admin-logout-modal');
    const cancelAdminLogoutBtn = document.getElementById('cancel-admin-logout-btn');
    const confirmAdminLogoutActionBtn = document.getElementById('confirm-admin-logout-action-btn');

    if (adminLogoutLink && confirmAdminLogoutModal && cancelAdminLogoutBtn && confirmAdminLogoutActionBtn) {
        adminLogoutLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir la redirección inmediata del enlace
            if (confirmAdminLogoutModal.showModal) {
                confirmAdminLogoutModal.showModal(); // Mostrar el modal de confirmación
            } else {
                // Fallback si showModal no está soportado (muy improbable en navegadores modernos)
                console.error('El API de Dialog no está soportado por este navegador.');
                // Como fallback, realizar la acción de logout directamente como antes
                performAdminLogout(); 
            }
        });

        cancelAdminLogoutBtn.addEventListener('click', () => {
            if (confirmAdminLogoutModal.close) {
                confirmAdminLogoutModal.close();
            }
        });

        confirmAdminLogoutActionBtn.addEventListener('click', () => {
            performAdminLogout();
            if (confirmAdminLogoutModal.close) {
                confirmAdminLogoutModal.close();
            }
        });

        // Opcional: Cerrar el modal si se hace clic fuera (en el backdrop)
        confirmAdminLogoutModal.addEventListener('click', (event) => {
            if (event.target === confirmAdminLogoutModal) {
                confirmAdminLogoutModal.close();
            }
        });

    } else {
        console.warn('No se encontraron todos los elementos necesarios para el modal de logout de admin.');
        // Si faltan elementos del modal, el enlace de logout podría seguir usando la alerta como fallback (si no se elimina esa parte)
        // O añadir un listener de logout directo aquí si se quiere asegurar el funcionamiento básico
        if (adminLogoutLink && !confirmAdminLogoutModal) { // Solo si el modal es el que falta
             adminLogoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                performAdminLogout(); // Usar la función de logout directamente si no hay modal
            });
        }
    }
});

function performAdminLogout() {
    console.log('Admin cerrando sesión...');
    localStorage.removeItem('authToken'); 
    localStorage.removeItem('userData'); 
    // Considera si hay otros items específicos de admin en localStorage para limpiar
    // alert('Sesión de administrador cerrada. Serás redirigido.'); // Eliminamos la alerta
    
    // Opcional: Mostrar una notificación más sutil aquí si se desea, antes de redirigir
    // Por ejemplo, usando una librería de notificaciones o un mensaje en la propia página.
    
    window.location.href = 'index.html'; 
} 