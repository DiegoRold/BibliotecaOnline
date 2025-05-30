document.addEventListener('DOMContentLoaded', async () => {
    console.log('Admin Manage Orders script loaded.');

    // Verificar rol de administrador
    if (typeof checkAdminRole !== 'function') {
        console.error('checkAdminRole function is not defined. Ensure auth_check.js is loaded PRIOR to this script.');
        alert('Error crítico de configuración: No se puede verificar el rol del administrador.');
        return;
    }
    const isAdmin = await checkAdminRole();
    if (!isAdmin) return;

    console.log('Admin role verified for order management.');
    initializeOrdersPage();
});

function initializeOrdersPage() {
    loadOrders();
    initializeOrderModalListeners();
    initializeConfirmationModalListeners(); // Para el modal genérico de confirmación/éxito

    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
        filterStatus.addEventListener('change', () => loadOrders(filterStatus.value));
    }

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = '/login.html';
        });
    }
}

async function loadOrders(statusFilter = '') {
    console.log(`Cargando pedidos... Filtro de estado: ${statusFilter || 'Todos'}`);
    const ordersTableBody = document.getElementById('orders-table-body');
    if (!ordersTableBody) {
        console.error('Elemento orders-table-body no encontrado.');
        return;
    }
    ordersTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Cargando...</td></tr>';

    try {
        let apiUrl = '/api/admin/orders';
        if (statusFilter) {
            apiUrl += `?status=${statusFilter}`;
        }
        // Aquí asumimos que el backend ordenará por defecto de más reciente a menos reciente.
        // Si no, se podría añadir un parámetro como ?sortBy=createdAt&order=desc

        const response = await fetchData(apiUrl);
        if (response && response.ok && response.data && Array.isArray(response.data)) {
            const orders = response.data;
            ordersTableBody.innerHTML = '';
            if (orders.length > 0) {
                orders.forEach(order => {
                    const row = ordersTableBody.insertRow();
                    const orderDate = new Date(order.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                    });
                    const priceValue = parseFloat(order.total_price);
                    const totalPrice = !isNaN(priceValue) ? priceValue.toFixed(2) + ' €' : 'N/A';
                    
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm">${order.id}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">${order.user_id}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">${orderDate}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}">
                                ${translateStatus(order.status)}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">${totalPrice}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <button class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 view-order-details-btn" data-id="${order.id}">Ver Detalles</button>
                        </td>
                    `;
                });
            } else {
                ordersTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4">No se encontraron pedidos ${statusFilter ? 'con el estado seleccionado' : ''}.</td></tr>`;
            }
            addOrderTableEventListeners(); // Añadir listeners a los nuevos botones
        } else {
            console.error('La respuesta de la API no contiene un array de pedidos válido:', response);
            ordersTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-500">Error al procesar los datos de pedidos: ${response.data?.message || 'Formato inesperado.'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        ordersTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-500">Error al cargar pedidos: ${error.message || 'Desconocido.'}</td></tr>`;
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
        case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
        case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100';
        case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
    }
}

function translateStatus(status) {
    const statuses = {
        pending: 'Pendiente',
        processing: 'Procesando',
        shipped: 'Enviado',
        delivered: 'Entregado',
        cancelled: 'Cancelado'
    };
    return statuses[status] || status;
}

function addOrderTableEventListeners() {
    document.querySelectorAll('.view-order-details-btn').forEach(button => {
        button.addEventListener('click', handleViewOrderDetails);
    });
}

function initializeOrderModalListeners() {
    const orderDetailsModal = document.getElementById('order-details-modal');
    const closeOrderModalBtn = document.getElementById('close-order-modal-btn');
    const cancelOrderUpdateBtn = document.getElementById('cancel-order-update-btn');
    const updateOrderForm = document.getElementById('update-order-form');

    if (closeOrderModalBtn) closeOrderModalBtn.addEventListener('click', () => orderDetailsModal.close());
    if (cancelOrderUpdateBtn) cancelOrderUpdateBtn.addEventListener('click', () => orderDetailsModal.close());
    
    if (orderDetailsModal) {
        orderDetailsModal.addEventListener('click', (event) => {
            if (event.target === orderDetailsModal) {
                orderDetailsModal.close();
            }
        });
    }

    if (updateOrderForm) {
        updateOrderForm.addEventListener('submit', handleUpdateOrderSubmit);
    }
}

async function handleViewOrderDetails(event) {
    const orderId = event.target.dataset.id;
    const orderDetailsModal = document.getElementById('order-details-modal');
    const detailsContent = document.getElementById('order-details-content');
    const updateForm = document.getElementById('update-order-form');

    // Resetear y mostrar "cargando" en el modal
    document.getElementById('modal-order-id').textContent = 'Cargando...';
    document.getElementById('modal-user-id').textContent = '';
    document.getElementById('modal-order-date').textContent = '';
    document.getElementById('modal-order-total').textContent = '';
    document.getElementById('modal-shipping-address').textContent = '';
    document.getElementById('modal-order-items').innerHTML = '<li>Cargando artículos...</li>';
    updateForm.elements['modal-current-order-id'].value = '';
    updateForm.elements['status'].value = 'pending'; // Valor por defecto
    updateForm.elements['admin_notes'].value = '';

    orderDetailsModal.showModal();

    try {
        const response = await fetchData(`/api/admin/orders/${orderId}`);
        if (response.ok && response.data) {
            const order = response.data;
            document.getElementById('modal-order-id').textContent = order.id;
            document.getElementById('modal-user-id').textContent = order.user_id;
            document.getElementById('modal-order-date').textContent = new Date(order.created_at).toLocaleString('es-ES');
            document.getElementById('modal-order-total').textContent = `${parseFloat(order.total_price).toFixed(2)} €`;
            
            // Construir la dirección de envío
            let shippingAddress = 'No especificada';
            if (order.shipping_address) {
                const addr = order.shipping_address;
                shippingAddress = `${addr.street_address || ''}, ${addr.city || ''}, ${addr.postal_code || ''}, ${addr.country || ''}`.replace(/, ,/g, ',').trim().replace(/^,|,$/g, '');
            }
            document.getElementById('modal-shipping-address').textContent = shippingAddress || 'No especificada';

            // Mostrar items del pedido
            const itemsList = document.getElementById('modal-order-items');
            itemsList.innerHTML = ''; // Limpiar antes de añadir
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = `${item.book_title || 'Libro Desconocido'} (x${item.quantity}) - ${parseFloat(item.price_at_purchase).toFixed(2)} € c/u`;
                    itemsList.appendChild(li);
                });
            } else {
                itemsList.innerHTML = '<li>No hay artículos en este pedido.</li>';
            }
            
            // Rellenar formulario de actualización
            updateForm.elements['modal-current-order-id'].value = order.id;
            updateForm.elements['status'].value = order.status;
            updateForm.elements['admin_notes'].value = order.admin_notes || '';

            document.getElementById('order-modal-title').textContent = `Detalles del Pedido #${order.id}`;
        } else {
            showOutcomeModal(false, response.data?.message || 'No se pudieron cargar los detalles del pedido.');
            orderDetailsModal.close();
        }
    } catch (error) {
        showOutcomeModal(false, error.message || 'Error al cargar detalles del pedido.');
        orderDetailsModal.close();
    }
}

async function handleUpdateOrderSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const orderId = form.elements['modal-current-order-id'].value;
    const status = form.elements['status'].value;
    const adminNotes = form.elements['admin_notes'].value;

    if (!orderId) {
        showOutcomeModal(false, 'ID de pedido no encontrado para actualizar.');
        return;
    }

    const payload = {
        status: status,
        admin_notes: adminNotes
    };

    try {
        const response = await fetchData(`/api/admin/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            document.getElementById('order-details-modal').close();
            showOutcomeModal(true, 'Pedido actualizado correctamente.');
            await loadOrders(document.getElementById('filter-status').value); // Recargar la lista con el filtro actual
        } else {
            showOutcomeModal(false, response.data?.message || 'Error al actualizar el pedido.');
        }
    } catch (error) {
        showOutcomeModal(false, error.message || 'Ocurrió un error al actualizar el pedido.');
    }
}

// --- Funciones de Ayuda y Lógica de Modales de Confirmación (reutilizadas o adaptadas) ---
// Asumimos que fetchData, showOutcomeModal, initializeConfirmationModalListeners ya están definidas
// (posiblemente en este mismo archivo o en un script global que se cargue antes).
// Si es necesario, se copiarían/adaptarían de admin_manage_books.js o admin_manage_users.js.

// Ejemplo fetchData (asegúrate que es la versión correcta o adáptala):
async function fetchData(apiPath, options = {}) {
    const token = localStorage.getItem('authToken');
    const baseUrl = 'http://localhost:3000'; 
    const fullApiUrl = baseUrl + apiPath;
    
    const fetchOptions = { ...options };
    fetchOptions.headers = { ...options.headers };

    if (token) {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(fetchOptions.body instanceof FormData) && !fetchOptions.headers['Content-Type']) {
        fetchOptions.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(fullApiUrl, fetchOptions);
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showOutcomeModal(false, 'Sesión expirada o no autorizado. Serás redirigido al login.');
                setTimeout(() => {
                    localStorage.removeItem('authToken'); 
                    localStorage.removeItem('userData');
                    window.location.href = '/login.html';
                }, 3000);
                throw { status: response.status, message: 'Sesión expirada o no autorizado.', isAuthError: true };
            }
            let errorData = { message: response.statusText };
            try { errorData = await response.json(); } catch (e) { /* Silently ignore */ }
            throw { status: response.status, message: errorData.message || response.statusText, isFetchError: true, data: errorData };
        }

        if (response.status === 204) { 
            return { ok: true, status: 204, data: null };
        }
        const data = await response.json();
        return { ok: true, status: response.status, data: data };

    } catch (error) {
        if (error.isFetchError || error.isAuthError) {
            console.error(`API error from ${fullApiUrl}: Status ${error.status}, Message: ${error.message}`);
            throw error; 
        }
        console.error(`Network or unexpected error from ${fullApiUrl}:`, error);
        throw { message: `Error de conexión o inesperado: ${error.message}`, isNetworkError: true };
    }
}

// Funciones para el modal de confirmación/resultado (asumimos que existen o las incluimos)
let currentActionToConfirm = null; // Específico si este modal es solo para este script

function initializeConfirmationModalListeners() {
    const modal = document.getElementById('confirmation-modal');
    const confirmBtn = document.getElementById('confirmation-modal-confirm-btn');
    const cancelBtn = document.getElementById('confirmation-modal-cancel-btn');
    const okBtn = document.getElementById('success-modal-ok-btn');

    if (confirmBtn) confirmBtn.addEventListener('click', async () => {
        if (typeof currentActionToConfirm === 'function') {
            await currentActionToConfirm();
            currentActionToConfirm = null;
        }
        if(modal && modal.open) modal.close();
    });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { 
        if(modal && modal.open) modal.close(); 
        currentActionToConfirm = null; 
    });
    if (okBtn) okBtn.addEventListener('click', () => {
        const successModal = document.getElementById('confirmation-modal'); 
        if(successModal && successModal.open) successModal.close();
    }); 
    if (modal) modal.addEventListener('click', (event) => {
        if (event.target === modal) { 
            if(modal.open) modal.close(); 
            currentActionToConfirm = null; 
        }
    });
}

function showOutcomeModal(isSuccess, message) {
    const modal = document.getElementById('confirmation-modal');
    if (!modal) return console.error('Modal de confirmación no encontrado.');

    document.getElementById('confirmation-modal-title').textContent = isSuccess ? 'Éxito' : 'Error';
    document.getElementById('confirmation-modal-message').textContent = message;
    document.getElementById('confirmation-modal-buttons').style.display = 'none';
    document.getElementById('success-modal-buttons').style.display = 'flex';
    if (!modal.open) modal.showModal();
}

// (Opcional) showConfirmationModal si se necesita confirmación genérica para alguna acción futura.
/*
function showConfirmationModal(config) {
    const modal = document.getElementById('confirmation-modal');
    if (!modal) return console.error('Modal de confirmación no encontrado.');

    document.getElementById('confirmation-modal-title').textContent = config.title;
    document.getElementById('confirmation-modal-message').textContent = config.message;
    
    const confirmBtn = document.getElementById('confirmation-modal-confirm-btn');
    confirmBtn.textContent = config.confirmText || 'Confirmar';
    confirmBtn.className = 'btn-primary'; // Reset y clase base
    if (config.confirmClass) {
        confirmBtn.classList.add(...config.confirmClass.split(' '));
    }

    document.getElementById('confirmation-modal-buttons').style.display = 'flex';
    document.getElementById('success-modal-buttons').style.display = 'none';
    currentActionToConfirm = config.action;
    if (!modal.open) modal.showModal();
}
*/

// La función checkAdminRole se espera de auth_check.js
// Definición de checkAdminRole (integrada para evitar dependencia externa)
async function checkAdminRole() {
    const token = localStorage.getItem('authToken'); 
    if (!token) {
        // Si no hay token, intentar obtenerlo de adminData por si acaso (compatibilidad)
        const adminData = JSON.parse(localStorage.getItem('adminData'));
        if (adminData && adminData.token) {
            localStorage.setItem('authToken', adminData.token);
        } else {
            window.location.href = '/login.html'; 
            return false; 
        }
    }
    // Releer el token por si se acaba de establecer desde adminData
    const currentToken = localStorage.getItem('authToken');
    if (!currentToken) { // Doble check por si adminData no tenía token
        window.location.href = '/login.html'; 
        return false; 
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/verify-admin', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.isAdmin === true) {
                // Opcional: guardar datos del admin si es necesario en otras partes
                // if (data.admin) localStorage.setItem('adminData', JSON.stringify(data.admin));
                return true;
            }
        }
        // Si la respuesta no es ok o data.isAdmin no es true
        alert('Acceso denegado. No tienes permisos de administrador o tu sesión ha expirado.');
        localStorage.removeItem('authToken'); 
        localStorage.removeItem('userData'); // También userData por si acaso
        localStorage.removeItem('adminData'); // Limpiar también adminData
        window.location.href = '/login.html'; 
        return false;
    } catch (error) {
        console.error('Error de conexión al verificar tu rol:', error);
        alert('Error de conexión al verificar tu rol. Inténtalo de nuevo más tarde.');
        // No redirigir inmediatamente en caso de error de red, podría ser temporal
        // window.location.href = '/login.html';
        return false;
    }
}
