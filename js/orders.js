document.addEventListener('DOMContentLoaded', async () => {
    const ordersListContainer = document.getElementById('orders-list-container');
    const loadingOrdersMessage = document.getElementById('loading-orders-message');
    const noOrdersMessage = document.getElementById('no-orders-message');

    // Verificar si los elementos existen para evitar errores si esta página no los tiene
    if (!ordersListContainer || !loadingOrdersMessage || !noOrdersMessage) {
        console.error('Elementos necesarios para la página de pedidos no encontrados.');
        return;
    }

    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        // Usuario no autenticado
        loadingOrdersMessage.classList.add('hidden');
        ordersListContainer.innerHTML = '<p class="text-center text-red-500 dark:text-red-400">Debes <a href="login.html" class="underline">iniciar sesión</a> para ver tus pedidos.</p>';
        // Opcionalmente, redirigir a login.html después de un breve retraso
        // setTimeout(() => { window.location.href = 'login.html'; }, 3000);
        return;
    }

    try {
        // fetchWithAuth está definido en app.js, que se carga antes que orders.js
        // Asegúrate de que app.js define fetchWithAuth globalmente o exportándolo y orders.js importándolo si usas módulos.
        // Por simplicidad, asumimos que fetchWithAuth está disponible globalmente como en el contexto del proyecto.
        const response = await fetchWithAuth('http://localhost:3000/api/pedidos'); 

        if (!response.ok) {
            if (response.status === 401) {
                // Token inválido o expirado. app.js debería tener una función global para manejar esto.
                // Si logoutUser() no está disponible globalmente, se debe asegurar su acceso.
                // Asumiendo que logoutUser de app.js está disponible:
                if (typeof logoutUser === 'function') {
                    logoutUser(); // Limpia localStorage y actualiza UI general
                }
                ordersListContainer.innerHTML = '<p class="text-center text-red-500 dark:text-red-400">Tu sesión ha expirado. Por favor, <a href="login.html" class="underline">inicia sesión</a> de nuevo.</p>';
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido al obtener pedidos.' }));
                throw new Error(errorData.message || `Error del servidor: ${response.status}`);
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
        ordersListContainer.innerHTML = `<p class="text-center text-red-500 dark:text-red-400">Error al cargar tus pedidos: ${error.message}. Inténtalo de nuevo más tarde.</p>`;
    }
});

function renderOrders(orders, container) {
    container.innerHTML = ''; // Limpiar mensajes previos o de carga

    orders.sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido)); // Mostrar más recientes primero

    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6';

        const formattedDate = new Date(order.fecha_pedido).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const formattedTime = new Date(order.fecha_pedido).toLocaleTimeString('es-ES', {
            hour: '2-digit', minute: '2-digit'
        });

        let estadoPagoClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100';
        if (order.estado_pago === 'COMPLETADO') {
            estadoPagoClass = 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100';
        } else if (order.estado_pago === 'FALLIDO' || order.estado_pago === 'RECHAZADO') {
            estadoPagoClass = 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100';
        }
        
        let estadoPedidoClass = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
        // Ejemplo de clases según estado del pedido (puedes expandir esto)
        switch (order.estado_pedido.toUpperCase()) {
            case 'PENDIENTE':
                estadoPedidoClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100';
                break;
            case 'PROCESANDO':
                estadoPedidoClass = 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100';
                break;
            case 'ENVIADO':
                estadoPedidoClass = 'bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100';
                break;
            case 'ENTREGADO':
                estadoPedidoClass = 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100';
                break;
            case 'CANCELADO':
                estadoPedidoClass = 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100';
                break;
        }

        let itemsHtml = '<p class="text-sm text-gray-500 dark:text-gray-400">No hay detalles de artículos disponibles para este pedido.</p>';
        if (order.items && order.items.length > 0) {
            itemsHtml = '<ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 pl-2">';
            order.items.forEach(item => {
                itemsHtml += `<li>${item.titulo_en_compra || 'Nombre no disponible'} (x${item.cantidad}) - ${(item.precio_unitario_en_compra * item.cantidad).toFixed(2)} ${order.moneda || 'EUR'}</li>`;
            });
            itemsHtml += '</ul>';
        }

        orderCard.innerHTML = `
            <div class="flex flex-wrap justify-between items-start mb-3">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-white">Pedido #${order.id}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Fecha: ${formattedDate} a las ${formattedTime}</p>
                </div>
                <div class="flex flex-col items-end space-y-1 mt-2 sm:mt-0">
                     <span class="px-3 py-1 text-xs font-semibold rounded-full ${estadoPagoClass}">
                        Pago: ${order.estado_pago || 'Desconocido'}
                    </span>
                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${estadoPedidoClass}">
                        Pedido: ${order.estado_pedido || 'Desconocido'}
                    </span>
                </div>
            </div>
            <div class="mb-4">
                <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-1">Artículos:</h4>
                ${itemsHtml}
            </div>
            <div class="border-t dark:border-gray-700 pt-3 mt-3">
                 <div class="text-right">
                    <p class="text-lg font-bold text-gray-800 dark:text-white">Total: ${parseFloat(order.monto_total).toFixed(2)} ${order.moneda || 'EUR'}</p>
                    <!-- Enlace a detalles del pedido (funcionalidad futura) -->
                    <!-- <a href="order-details.html?id=${order.id}" class="text-blue-600 hover:underline dark:text-blue-400 text-sm mt-1 inline-block">Ver Detalles del Pedido</a> -->
                </div>
            </div>
        `;
        container.appendChild(orderCard);
    });
} 