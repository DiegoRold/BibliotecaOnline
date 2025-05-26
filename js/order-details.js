document.addEventListener('DOMContentLoaded', async () => {
    const orderDetailsContainer = document.getElementById('order-details-container');
    const orderIdElement = document.getElementById('order-id');
    const orderDatetimeElement = document.getElementById('order-datetime');
    const orderStatusElement = document.getElementById('order-status');
    const orderDeliveryTypeElement = document.getElementById('order-delivery-type');
    const orderTotalElement = document.getElementById('order-total');
    const orderAddressSection = document.getElementById('order-address-section');
    const orderAddressElement = document.getElementById('order-address');
    const orderItemsListElement = document.getElementById('order-items-list');

    function showNotification(message, type = 'info') {
        console.log(`[Notification] ${type.toUpperCase()}: ${message}`);
        const notificationContainer = document.getElementById('notification-container');
        if (notificationContainer && window.showGlobalNotification) {
            window.showGlobalNotification(message, type);
        } else {
            const notif = document.createElement('div');
            notif.className = `p-4 mb-2 rounded-md shadow-lg ${type === 'error' ? 'bg-red-500 text-white' : type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`;
            notif.textContent = message;
            notificationContainer?.appendChild(notif);
            setTimeout(() => notif.remove(), 5000);
        }
    }

    const params = new URLSearchParams(window.location.search);
    const orderIdFromUrl = params.get('orderId');

    if (!orderIdFromUrl) {
        orderDetailsContainer.innerHTML = '<p class="text-red-500 text-center">No se ha especificado un ID de pedido.</p>';
        showNotification('No se pudo cargar el pedido: ID no encontrado en la URL.', 'error');
        return;
    }

    orderIdElement.textContent = orderIdFromUrl;

    const simulateApiCall = false;
    let orderData;

    if (simulateApiCall) {
        console.log(`[order-details.js] Simulando API call para orderId: ${orderIdFromUrl}`);
        const mockData = await getMockOrderData(orderIdFromUrl);
        orderData = mockData.order;
        orderData.items = mockData.items;
    } else {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                showNotification('Debes iniciar sesión para ver los detalles del pedido.', 'error');
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
                return;
            }

            const backendBaseUrl = 'http://localhost:3000'; // Asumiendo que el backend corre en el puerto 3000
            const response = await fetch(`${backendBaseUrl}/api/pedidos/${orderIdFromUrl}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                console.error('[order-details.js] Error del backend:', response.status, errorData.message);
                throw new Error(errorData.message || `Error del servidor: ${response.status}`);
            }
            orderData = await response.json();
            console.log('[order-details.js] Datos del pedido recibidos del backend:', orderData);
        } catch (error) {
            console.error('[order-details.js] Error al cargar los detalles del pedido desde el backend:', error);
            showNotification(`Error al cargar detalles: ${error.message}`, 'error');
            orderItemsListElement.innerHTML = '<p class="text-red-500 text-center">No se pudieron cargar los detalles del pedido.</p>';
            orderDatetimeElement.textContent = 'Error';
            orderStatusElement.textContent = 'Error';
            orderDeliveryTypeElement.textContent = 'Error';
            orderTotalElement.textContent = 'Error';
            return;
        }
    }

    if (!orderData || !orderData.id) {
        showNotification('No se encontraron datos para este pedido o el formato es incorrecto.', 'error');
        orderItemsListElement.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center">No se encontraron detalles para este pedido.</p>';
        return;
    }

    const items = orderData.items || [];

    const orderDate = new Date(orderData.fecha_pedido);
    orderDatetimeElement.textContent = orderDate.toLocaleString('es-ES', { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });

    orderStatusElement.textContent = formatOrderStatus(orderData.estado_pedido);
    
    if (orderData.tipo_entrega === 'recogida') {
        orderDeliveryTypeElement.textContent = 'Recoger en Tienda';
        orderAddressSection.classList.add('hidden');
    } else if (orderData.tipo_entrega === 'domicilio') {
        orderDeliveryTypeElement.textContent = 'Envío a Domicilio';
        orderAddressSection.classList.remove('hidden');
        if (orderData.direccion_envio_detallada && typeof orderData.direccion_envio_detallada === 'object') {
            const dir = orderData.direccion_envio_detallada;
            let addressHtml = '';
            if (dir.direccion_calle) {
                addressHtml += `${dir.direccion_calle}<br>`;
            }
            if (dir.direccion_detalle) {
                addressHtml += `${dir.direccion_detalle}<br>`;
            }
            let cpCiudad = [];
            if (dir.direccion_cp) {
                cpCiudad.push(dir.direccion_cp);
            }
            if (dir.direccion_ciudad) {
                cpCiudad.push(dir.direccion_ciudad);
            }
            if (cpCiudad.length > 0) {
                addressHtml += `${cpCiudad.join(' ')}<br>`;
            }
            if (dir.direccion_provincia) {
                addressHtml += `${dir.direccion_provincia}<br>`;
            }
            if (dir.direccion_pais) {
                addressHtml += `${dir.direccion_pais}<br>`;
            }

            if (addressHtml.endsWith('<br>')) {
                addressHtml = addressHtml.slice(0, -4);
            }

            if (addressHtml.trim() !== '') {
                orderAddressElement.innerHTML = addressHtml;
            } else {
                orderAddressElement.textContent = 'Dirección de envío no detallada.';
            }
        } else {
            orderAddressElement.textContent = 'Detalles de dirección no disponibles.'; 
        }
    } else {
        orderDeliveryTypeElement.textContent = orderData.tipo_entrega || 'Desconocido';
        orderAddressSection.classList.remove('hidden');
        orderAddressElement.textContent = 'Información de envío no disponible.';
    }

    orderTotalElement.textContent = `${parseFloat(orderData.monto_total).toFixed(2)} €`;

    if (items.length > 0) {
        orderItemsListElement.innerHTML = '';
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow';
            
            const coverImage = item.cover_image_url || 'assets/books/placeholder.png';

            itemElement.innerHTML = `
                <img src="${coverImage}" alt="Portada de ${item.titulo_en_compra}" class="w-16 h-24 object-cover rounded mr-4 flex-shrink-0">
                <div class="flex-grow min-w-0">
                    <h3 class="text-lg font-medium text-gray-800 dark:text-white truncate" title="${item.titulo_en_compra}">${item.titulo_en_compra}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 truncate" title="${item.autor_libro || 'Autor desconocido'}">${item.autor_libro || 'Autor desconocido'}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-300">Cantidad: ${item.cantidad}</p>
                </div>
                <div class="text-md font-semibold text-gray-700 dark:text-gray-200 ml-4 whitespace-nowrap">${parseFloat(item.precio_unitario_en_compra).toFixed(2)} €</div>
            `;
            orderItemsListElement.appendChild(itemElement);
        });
    } else {
        orderItemsListElement.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-4">Este pedido no tiene artículos.</p>';
    }
});

function formatOrderStatus(status) {
    switch (status) {
        case 'Pendiente': return 'Pendiente';
        case 'Pagado': return 'Pagado';
        case 'Procesando': return 'En Proceso';
        case 'Enviado': return 'Enviado';
        case 'Entregado': return 'Entregado';
        case 'Cancelado': return 'Cancelado';
        case 'Listo para Recoger': return 'Listo para Recoger';
        default: return status || 'Desconocido';
    }
}

async function getMockOrderData(orderId) {
    console.log(`[getMockOrderData] Generando datos para orderId: ${orderId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockDatabase = {
        "order123": {
            order: {
                id: "order123",
                usuario_id: "userABC", 
                fecha_pedido: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                estado_pedido: "Entregado", 
                tipo_entrega: "domicilio", 
                monto_total: "75.97",
                direccion_envio_id: 1,
            },
            items: [
                {
                    libro_id: "OL27448W",
                    titulo_en_compra: "El Nombre del Viento",
                    autor_libro: "Patrick Rothfuss",
                    cover_image_url: "assets/books/el_nombre_del_viento.jpg",
                    cantidad: 1,
                    precio_unitario_en_compra: "25.99"
                },
                {
                    libro_id: "OL1M",
                    titulo_en_compra: "Cien Años de Soledad",
                    autor_libro: "Gabriel García Márquez",
                    cover_image_url: "assets/books/cien_anyos_soledad.jpg",
                    cantidad: 2,
                    precio_unitario_en_compra: "24.99"
                }
            ]
        },
        "order789": {
            order: {
                id: "order789",
                usuario_id: "userXYZ",
                fecha_pedido: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                estado_pedido: "Listo para Recoger",
                tipo_entrega: "recogida",
                monto_total: "19.50",
                direccion_envio_id: null
            },
            items: [
                {
                    libro_id: "OL23919W",
                    titulo_en_compra: "Dune",
                    autor_libro: "Frank Herbert",
                    cover_image_url: "assets/books/dune.jpg",
                    cantidad: 1,
                    precio_unitario_en_compra: "19.50"
                }
            ]
        }
    };
    if (mockDatabase[orderId]) {
        return mockDatabase[orderId];
    }
    return { 
        order: { 
            id: orderId, 
            fecha_pedido: new Date().toISOString(), 
            estado_pedido: "not_found", 
            tipo_entrega: "unknown", 
            monto_total: "0.00",
            direccion_envio_id: null
        }, 
        items: [] 
    };
} 