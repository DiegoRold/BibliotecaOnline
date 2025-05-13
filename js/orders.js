document.addEventListener('DOMContentLoaded', async () => {
    const ordersListContainer = document.getElementById('orders-list-container');
    const loadingOrdersMessage = document.getElementById('loading-orders-message');
    const noOrdersMessage = document.getElementById('no-orders-message');

    // Verificar si los elementos existen
    if (!ordersListContainer || !loadingOrdersMessage || !noOrdersMessage) {
        console.error('Elementos necesarios para la página de pedidos no encontrados.');
        return;
    }

    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        loadingOrdersMessage.classList.add('hidden');
        ordersListContainer.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-lock text-4xl text-gray-400 dark:text-gray-600 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Debes iniciar sesión para ver tus pedidos.</p>
                <a href="login.html" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
                    Iniciar Sesión
                </a>
            </div>`;
        return;
    }

    try {
        const response = await fetchWithAuth('/api/pedidos');
        
        if (!response.ok) {
            if (response.status === 401) {
                if (typeof logoutUser === 'function') {
                    logoutUser();
                }
                ordersListContainer.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">Tu sesión ha expirado. Por favor, inicia sesión de nuevo.</p>
                        <a href="login.html" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
                            Iniciar Sesión
                        </a>
                    </div>`;
            } else {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            loadingOrdersMessage.classList.add('hidden');
            return;
        }

        const orders = await response.json();
        loadingOrdersMessage.classList.add('hidden');

        if (orders && orders.length > 0) {
            renderOrders(orders, ordersListContainer);
        } else {
            noOrdersMessage.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error al cargar los pedidos:', error);
        loadingOrdersMessage.classList.add('hidden');
        ordersListContainer.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Ha ocurrido un error al cargar tus pedidos.</p>
                <button onclick="window.location.reload()" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
                    Reintentar
                </button>
            </div>`;
    }
});

function renderOrders(orders, container) {
    container.innerHTML = ''; // Limpiar mensajes previos

    // Ordenar pedidos por fecha (más recientes primero)
    orders.sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido));

    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6 transform transition duration-200 hover:shadow-xl';

        const formattedDate = new Date(order.fecha_pedido).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Clases para los estados
        const estadoPagoClass = getEstadoPagoClass(order.estado_pago);
        const estadoPedidoClass = getEstadoPedidoClass(order.estado_pedido);

        // Renderizar items del pedido
        let itemsHtml = '<p class="text-sm text-gray-500 dark:text-gray-400">No hay detalles de artículos disponibles.</p>';
        if (order.items && order.items.length > 0) {
            itemsHtml = `
                <div class="space-y-2">
                    ${order.items.map(item => `
                        <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                            <div class="flex items-center space-x-3">
                                ${item.cover_image_url ? `
                                    <img src="${item.cover_image_url}" alt="${item.titulo_en_compra}" 
                                         class="w-12 h-16 object-cover rounded shadow-sm">
                                ` : `
                                    <div class="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                        <i class="fas fa-book text-gray-400 dark:text-gray-500"></i>
                                    </div>
                                `}
                                <div>
                                    <h4 class="font-medium text-gray-800 dark:text-white">${item.titulo_en_compra}</h4>
                                    ${item.autor_libro ? `
                                        <p class="text-sm text-gray-500 dark:text-gray-400">${item.autor_libro}</p>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-gray-600 dark:text-gray-300">${item.cantidad} x ${item.precio_unitario_en_compra.toFixed(2)} €</p>
                                <p class="font-medium text-gray-800 dark:text-white">${(item.cantidad * item.precio_unitario_en_compra).toFixed(2)} €</p>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        }

        orderCard.innerHTML = `
            <div class="flex flex-wrap justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-white">Pedido #${order.id}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${formattedDate}</p>
                </div>
                <div class="flex flex-col items-end space-y-2 mt-2 sm:mt-0">
                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${estadoPagoClass}">
                        Pago: ${order.estado_pago || 'Desconocido'}
                    </span>
                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${estadoPedidoClass}">
                        Pedido: ${order.estado_pedido || 'Desconocido'}
                    </span>
                </div>
            </div>
            <div class="mb-4">
                <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Artículos:</h4>
                ${itemsHtml}
            </div>
            <div class="border-t dark:border-gray-700 pt-4 mt-4">
                <div class="flex justify-between items-center">
                    <p class="text-lg font-bold text-gray-800 dark:text-white">Total: ${parseFloat(order.monto_total).toFixed(2)} ${order.moneda || 'EUR'}</p>
                    <button onclick="verDetallesPedido(${order.id})" 
                            class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                        Ver Detalles
                    </button>
                </div>
            </div>`;

        container.appendChild(orderCard);
    });
}

function getEstadoPagoClass(estado) {
    switch (estado?.toUpperCase()) {
        case 'PAGADO':
            return 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100';
        case 'PENDIENTE':
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100';
        case 'FALLIDO':
        case 'RECHAZADO':
            return 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
    }
}

function getEstadoPedidoClass(estado) {
    switch (estado?.toUpperCase()) {
        case 'PENDIENTE':
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100';
        case 'PROCESANDO':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100';
        case 'ENVIADO':
            return 'bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100';
        case 'ENTREGADO':
            return 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100';
        case 'CANCELADO':
            return 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
    }
}

// Función para ver detalles del pedido (se puede expandir según necesidades)
function verDetallesPedido(orderId) {
    // Por ahora, solo mostramos un alert con el ID
    // En el futuro, podríamos:
    // 1. Abrir un modal con más detalles
    // 2. Navegar a una página específica de detalles
    // 3. Expandir/colapsar la información en la misma tarjeta
    alert(`Detalles del pedido #${orderId}`);
} 