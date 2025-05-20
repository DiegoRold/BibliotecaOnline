let currentCheckoutCart = []; // Variable para mantener el estado actual del carrito para el checkout

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== INICIO CHECKOUT ===');
    console.log('Estado inicial de window.state:', window.state);
    console.log('Carrito en localStorage:', localStorage.getItem('cart'));
    
    // Verificar si el usuario está logueado (necesario para obtener el token)
    const authToken = localStorage.getItem('authToken');
    // Aunque el backend lo validará, es buena práctica asegurar que el usuario
    // esté logueado para acceder al checkout, o al menos que la UI lo refleje.
    if (!authToken && !window.location.pathname.includes('login.html')) {
        // Si no estamos ya en login y no hay token, podríamos redirigir o mostrar mensaje.
        // Por ahora, se permite continuar, pero el backend rechazará si se requiere auth.
        console.warn('Usuario no autenticado accediendo al checkout. El backend validará la autenticación si es necesaria para el pago.');
    }

    // Cache de elementos del DOM para los modales y botones
    const authRequiredModal = document.getElementById('auth-required-modal');
    const closeAuthRequiredModalBtn = document.getElementById('close-auth-required-modal');
    const confirmPurchaseModal = document.getElementById('confirm-purchase-modal');
    const cancelPurchaseBtn = document.getElementById('cancel-purchase-btn');
    const confirmPurchaseActionBtn = document.getElementById('confirm-purchase-action-btn');
    const purchaseSuccessModal = document.getElementById('purchase-success-modal');
    const closePurchaseSuccessModalBtn = document.getElementById('close-purchase-success-modal');
    const confirmationTotalPriceEl = document.getElementById('confirmation-total-price');
    const orderNumberDisplayEl = document.getElementById('order-number-display');
    const proceedToPaymentBtn = document.getElementById('proceed-to-payment-btn');

    // Funciones para manejar los modales
    function showModal(modalElement) {
        if (modalElement) modalElement.showModal();
    }
    function closeModal(modalElement) {
        if (modalElement) modalElement.close();
    }

    // Event listeners para cerrar modales
    if(closeAuthRequiredModalBtn) closeAuthRequiredModalBtn.addEventListener('click', () => closeModal(authRequiredModal));
    if(cancelPurchaseBtn) cancelPurchaseBtn.addEventListener('click', () => closeModal(confirmPurchaseModal));
    if(closePurchaseSuccessModalBtn) closePurchaseSuccessModalBtn.addEventListener('click', () => {
        closeModal(purchaseSuccessModal);
        // Redirigir a index.html en lugar de orders.html
        window.location.href = 'index.html'; 
    });

    // Lógica del botón "REALIZAR PAGO"
    if (proceedToPaymentBtn) {
        proceedToPaymentBtn.addEventListener('click', () => {
            console.log('"REALIZAR PAGO" clickeado.');
            const authToken = localStorage.getItem('authToken');
            const cart = currentCheckoutCart; // <--- USAR LA VARIABLE GLOBAL DEL SCRIPT

            if (cart.length === 0) {
                alert('Tu carrito está vacío. Añade productos antes de realizar el pago.'); // O un modal más elegante
                return;
            }

            if (!authToken) {
                console.log('Usuario no autenticado. Mostrando modal de autenticación requerida.');
                showModal(authRequiredModal);
            } else {
                console.log('Usuario autenticado. Mostrando modal de confirmación de compra.');
                let currentTotal = 0;
                cart.forEach(item => {
                    currentTotal += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
                });
                if (confirmationTotalPriceEl) confirmationTotalPriceEl.textContent = currentTotal.toFixed(2);
                showModal(confirmPurchaseModal);
            }
        });
    }

    // Lógica del botón "CONFIRMAR" en el modal de confirmación
    if (confirmPurchaseActionBtn) {
        confirmPurchaseActionBtn.addEventListener('click', async () => {
            console.log('Botón "CONFIRMAR" compra clickeado.');
            closeModal(confirmPurchaseModal);
            const cart = currentCheckoutCart; // Usar la variable actualizada con el estado del carrito
            let currentTotal = 0;
            cart.forEach(item => {
                currentTotal += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
            });

            // Preparar payload para el backend
            const orderPayload = {
                items: cart.map(item => ({
                    book_id: item.id,       // Asegúrate de que 'id' aquí es el ID del libro
                    quantity: item.quantity,
                    price: parseFloat(item.price) || 0, // Precio unitario en el momento de la compra
                    title: item.title       // Título en el momento de la compra
                })),
                totalAmount: parseFloat(currentTotal.toFixed(2))
            };

            try {
                console.log('Enviando pedido al backend:', JSON.stringify(orderPayload, null, 2));
                const response = await fetchWithAuth('http://localhost:3000/api/pedidos', {
                    method: 'POST',
                    body: JSON.stringify(orderPayload)
                });
                
                // --- LOGS DE DIAGNÓSTICO AÑADIDOS ---
                console.log('Respuesta del backend (status):', response.status);
                console.log('Respuesta del backend (statusText):', response.statusText);
                const responseText = await response.text(); // Leer como texto primero
                console.log('Respuesta del backend (texto crudo): [', responseText, ']'); // Añadí corchetes para ver si está vacío
                // --- FIN DE LOGS DE DIAGNÓSTICO ---

                let orderData;
                try {
                    orderData = JSON.parse(responseText); // Intentar parsear el texto que ya leímos
                } catch (parseError) {
                    console.error('Error al parsear la respuesta del backend como JSON:', parseError);
                    // Si falla el parseo, lanzamos un error con el texto crudo si response no fue ok, o un error genérico
                    if (!response.ok) {
                        throw new Error(`Error del servidor (${response.status}): ${responseText || 'Respuesta no JSON.'}`);
                    }
                    // Si fue response.ok pero no es JSON, es inesperado.
                    throw new Error('Respuesta inesperada del servidor, no es JSON válido.');
                }

                if (!response.ok) {
                    throw new Error(orderData.message || responseText || 'Error al crear el pedido en el backend');
                }
                
                const orderId = orderData.orderId; // El backend devuelve el ID del pedido real

                console.log('Pedido creado con éxito en el backend. ID:', orderId);
                if(orderNumberDisplayEl) orderNumberDisplayEl.textContent = orderId;
                showModal(purchaseSuccessModal);

                // Limpiar carrito local y del backend
                if (window.state && typeof window.state.cart !== 'undefined') window.state.cart = [];
                localStorage.removeItem('cart');
                if (typeof updateCartIcon === 'function') updateCartIcon();
                if (typeof renderCartModal === 'function') renderCartModal();
                currentCheckoutCart = []; // Limpiar también la variable local
                loadCartSummary(currentCheckoutCart); // Actualizar la vista del resumen del carrito a vacío
                
                console.log('Disparando evento cartUpdated con carrito vacío...');
                // Disparar evento para que otras partes de la app se enteren
                document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: [] } }));
                console.log('Evento cartUpdated disparado.');
                
                const authToken = localStorage.getItem('authToken');
                if (authToken && typeof fetchWithAuth === 'function') {
                    try {
                        await fetchWithAuth('/api/cart', { method: 'DELETE' });
                        console.log('Carrito del backend vaciado.');
                    } catch (cartError) {
                        console.error('Error al vaciar el carrito del backend:', cartError);
                    }
                }

            } catch (error) {
                console.error('Error durante la confirmación de la compra o creación del pedido:', error);
                // Mostrar el mensaje de error del backend o uno genérico
                alert(`Error al procesar tu compra: ${error.message}. Por favor, inténtalo de nuevo o contacta a soporte.`);
            }
        });
    }

    // Función auxiliar para obtener el estado actual del carrito
    function getCurrentCartState() {
        if (window.state && window.state.cart && window.state.cart.length > 0) {
            return window.state.cart;
        }
        return JSON.parse(localStorage.getItem('cart')) || [];
    }
    
    // --- Lógica de Carga de Resumen del Carrito (sin cambios importantes, se mantiene) ---
    document.addEventListener('cartUpdated', (event) => {
        console.log('Evento cartUpdated recibido en checkout.js:', event.detail.cart);
        loadCartSummary(event.detail.cart);
    });

    function initializeCartView() {
        let initialCart = [];
        if (window.state && typeof window.state.cart !== 'undefined' && window.state.cart.length > 0) {
            console.log('Estado inicial de app.js encontrado con carrito, cargando resumen.');
            initialCart = window.state.cart;
        } else if (localStorage.getItem('cart')) {
            console.log('Usando carrito de localStorage para carga inicial en checkout.');
            initialCart = JSON.parse(localStorage.getItem('cart')) || [];
        } else {
            console.log('Ni window.state.cart ni localStorage.cart disponibles en la carga inicial del checkout.');
        }
        loadCartSummary(initialCart);
    }
    initializeCartView(); // Cargar el resumen al inicio

}); // Fin DOMContentLoaded

// Separar loadCartSummary para que no dependa de renderPayPalButtons
function loadCartSummary(cart) {
    const cartSummaryContainer = document.getElementById('checkout-cart-summary');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const grandTotalEl = document.getElementById('checkout-grand-total');
    
    if (!cartSummaryContainer || !subtotalEl || !grandTotalEl) {
        console.error('Elementos del DOM para el resumen del carrito no encontrados.');
        return;
    }

    const cartItemsDetailsDiv = cartSummaryContainer.querySelector('#cart-items-details');
    const loadingCartMessage = cartSummaryContainer.querySelector('#loading-cart-message');

    if (loadingCartMessage) loadingCartMessage.classList.add('hidden');

    currentCheckoutCart = cart || []; // <--- ACTUALIZAR LA VARIABLE GLOBAL DEL SCRIPT

    if (!currentCheckoutCart || currentCheckoutCart.length === 0) {
        if (cartItemsDetailsDiv) cartItemsDetailsDiv.innerHTML = '<p>Tu carrito está vacío. <a href="index.html" class="text-blue-600 hover:underline">Vuelve a la tienda</a> para añadir productos.</p>';
        subtotalEl.textContent = '0.00 €';
        grandTotalEl.textContent = '0.00 €';
        // Deshabilitar botón de pago si el carrito está vacío
        const proceedBtn = document.getElementById('proceed-to-payment-btn');
        if(proceedBtn) {
            proceedBtn.disabled = true;
            proceedBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        return;
    }

    // Habilitar botón de pago si el carrito tiene items
    const proceedBtn = document.getElementById('proceed-to-payment-btn');
    if(proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    let currentSubtotal = 0;
    let listHtml = '<ul class="space-y-3">';

    currentCheckoutCart.forEach(item => {
        const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
        currentSubtotal += itemTotal;
        listHtml += `
            <li class="flex justify-between items-center text-sm pb-2 border-b dark:border-gray-700 last:border-b-0">
                <div class="flex items-center">
                    <img src="${item.cover || 'assets/placeholder-cover-small.png'}" alt="${item.title || 'Libro'}" class="w-10 h-14 object-cover rounded mr-3">
                    <div>
                        <span class="font-medium text-gray-800 dark:text-gray-200">${item.title || 'Título no disponible'}</span>
                        <span class="block text-xs text-gray-500 dark:text-gray-400">Cantidad: ${item.quantity || 0}</span>
                    </div>
                </div>
                <span class="font-semibold text-gray-700 dark:text-gray-300">${itemTotal.toFixed(2)} €</span>
            </li>
        `;
    });
    listHtml += '</ul>';
    
    if (cartItemsDetailsDiv) {
        cartItemsDetailsDiv.innerHTML = listHtml;
    } else {
        cartSummaryContainer.innerHTML = listHtml; 
    }

    subtotalEl.textContent = `${currentSubtotal.toFixed(2)} €`;
    grandTotalEl.textContent = `${currentSubtotal.toFixed(2)} €`;
} 

// --- LÓGICA DE PAGO ---
async function handleProceedToPayment() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        if (authRequiredModal) authRequiredModal.showModal();
        return;
    }

    const selectedShippingOption = document.querySelector('input[name="shippingOption"]:checked');
    if (!selectedShippingOption) {
        alert('Por favor, selecciona una opción de envío.');
        return;
    }

    // Validar el formulario de "otra dirección" si está seleccionado
    let shippingAddressData = null;
    const shippingMethodValue = selectedShippingOption.value;

    if (shippingMethodValue === 'myAddress') {
        if (!currentUserData || !currentUserData.direccion_calle) {
            alert('No tienes una dirección guardada. Por favor, selecciona \'Enviar a otra dirección\' o actualiza tu perfil.');
            return;
        }
        shippingAddressData = {
            name: currentUserData.nombre,
            street: currentUserData.direccion_calle,
            apartment: currentUserData.direccion_detalle || '',
            zip: currentUserData.direccion_cp,
            city: currentUserData.direccion_ciudad,
            state: currentUserData.direccion_provincia || '',
            country: currentUserData.direccion_pais
        };
    } else if (shippingMethodValue === 'otherAddress') {
        const name = document.getElementById('other-address-name').value.trim();
        const street = document.getElementById('other-address-street').value.trim();
        const zip = document.getElementById('other-address-zip').value.trim();
        const city = document.getElementById('other-address-city').value.trim();
        const country = document.getElementById('other-address-country').value.trim();
        
        if (!name || !street || !zip || !city || !country) {
            alert('Por favor, completa todos los campos obligatorios de la dirección de envío.');
            return;
        }
        shippingAddressData = {
            name: name,
            street: street,
            apartment: document.getElementById('other-address-apartment').value.trim(),
            zip: zip,
            city: city,
            state: document.getElementById('other-address-state').value.trim(),
            country: country
        };
    } else if (shippingMethodValue === 'storePickup') {
        shippingAddressData = { name: 'Recogida en Tienda' }; 
    }

    // Preparar el payload para el endpoint createOrder existente
    const orderPayload = {
        items: cart.map(item => ({
            book_id: item.id, // IMPORTANTE: Este debe ser el api_id (ej. ISBN) que createOrder espera
            quantity: parseInt(item.quantity, 10),
            price: parseFloat(item.price),
            title: item.title || item.name // Asegúrate que el título esté presente
        })),
        totalAmount: parseFloat(checkoutGrandTotalEl.textContent.replace(/[^\d,-]/g, '').replace(',', '.'))
        // El backend createOrder actual no usa explícitamente dirección, gastos de envío, etc.
        // Si se añaden esas columnas a la tabla 'pedidos' y se modifica el INSERT en createOrder,
        // se podrían añadir aquí: 
        // shippingDetails: shippingAddressData, 
        // shippingCost: parseFloat(checkoutShippingCostsEl.textContent.toLowerCase() === 'gratis' ? 0 : checkoutShippingCostsEl.textContent.replace(/[^\d,-]/g, '').replace(',', '.')),
        // paymentMethod: 'reembolso'
    };

    console.log('Procesando pedido con payload:', JSON.stringify(orderPayload, null, 2));

    const confirmPurchaseModal = document.getElementById('confirm-purchase-modal');
    const confirmationTotalPriceEl = document.getElementById('confirmation-total-price');
    const cancelPurchaseBtn = document.getElementById('cancel-purchase-btn');
    const confirmPurchaseActionBtn = document.getElementById('confirm-purchase-action-btn');

    if (confirmationTotalPriceEl) confirmationTotalPriceEl.textContent = formatPrice(orderPayload.totalAmount);
    if (confirmPurchaseModal) confirmPurchaseModal.showModal();

    // Event listeners para el modal de confirmación (se asignan una vez por clic para evitar duplicados)
    const newCancelBtn = cancelPurchaseBtn.cloneNode(true);
    cancelPurchaseBtn.parentNode.replaceChild(newCancelBtn, cancelPurchaseBtn);
    newCancelBtn.addEventListener('click', () => confirmPurchaseModal.close());

    const newConfirmBtn = confirmPurchaseActionBtn.cloneNode(true);
    confirmPurchaseActionBtn.parentNode.replaceChild(newConfirmBtn, confirmPurchaseActionBtn);
    newConfirmBtn.addEventListener('click', async () => {
        confirmPurchaseModal.close();
        try {
            const response = await fetch(`${API_BASE_URL}/pedidos`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(orderPayload)
            });

            const responseData = await response.json(); // Leer como JSON directamente

            if (!response.ok) {
                throw new Error(responseData.message || 'Error al procesar el pedido.');
            }
            
            const orderId = responseData.orderId; 
            console.log('Pedido confirmado con éxito. ID:', orderId);

            localStorage.removeItem('cart'); 
            if(window.updateCartCount) window.updateCartCount(0); 
            if(window.renderCartModal) window.renderCartModal(); 
            currentSubtotal = 0; // Resetear subtotal local
            cart = []; // Resetear carrito local
            renderCartSummary(); 
            updateShippingCosts(); 

            const purchaseSuccessModal = document.getElementById('purchase-success-modal');
            const orderNumberDisplay = document.getElementById('order-number-display');
            const closePurchaseSuccessModal = document.getElementById('close-purchase-success-modal');
            
            if(orderNumberDisplay) orderNumberDisplay.textContent = orderId;
            if(purchaseSuccessModal) purchaseSuccessModal.showModal();
            
            const newCloseSuccessBtn = closePurchaseSuccessModal.cloneNode(true);
            closePurchaseSuccessModal.parentNode.replaceChild(newCloseSuccessBtn, closePurchaseSuccessModal);
            newCloseSuccessBtn.addEventListener('click', () => {
                purchaseSuccessModal.close();
                window.location.href = 'index.html'; // Redirigir a inicio como se especificó
            });

        } catch (error) {
            alert(`Error al procesar el pedido: ${error.message}`);
            console.error('Error al procesar el pedido:', error);
        }
    });
} 