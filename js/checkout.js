let currentCheckoutCart = []; // Variable para mantener el estado actual del carrito para el checkout
let selectedShippingOption = 'storePickup'; // Valor por defecto
let shippingCost = 0;
let currentShippingAddress = null; // Para almacenar la dirección a enviar al backend

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== INICIO CHECKOUT ===');
    console.log('Estado inicial de window.state:', window.state);
    console.log('Carrito en localStorage:', localStorage.getItem('cart'));
    
    // Verificar si el usuario está logueado (necesario para obtener el token)
    const authToken = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : null;
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

    // Cache de elementos del DOM para opciones de envío
    const shippingStorePickupRadio = document.getElementById('shipping-store-pickup');
    const homeDeliveryOptionGroup = document.getElementById('home-delivery-option-group');
    const shippingMyAddressRadio = document.getElementById('shipping-my-address');
    const myAddressDetailsDiv = document.getElementById('my-address-details');
    const otherAddressOptionGroup = document.getElementById('other-address-option-group');
    const shippingOtherAddressRadio = document.getElementById('shipping-other-address');
    const otherAddressForm = document.getElementById('other-address-form');
    const authRequiredForShippingDiv = document.getElementById('auth-required-for-shipping');

    // Campos del formulario de otra dirección
    const otherAddressNameInput = document.getElementById('other-address-name');
    const otherAddressStreetInput = document.getElementById('other-address-street');
    const otherAddressApartmentInput = document.getElementById('other-address-apartment');
    const otherAddressZipInput = document.getElementById('other-address-zip');
    const otherAddressCityInput = document.getElementById('other-address-city');
    const otherAddressStateInput = document.getElementById('other-address-state');
    const otherAddressCountryInput = document.getElementById('other-address-country');
    
    // Elementos de totales
    const checkoutShippingCostsEl = document.getElementById('checkout-shipping-costs');
    const checkoutSubtotalEl = document.getElementById('checkout-subtotal');
    const checkoutGrandTotalEl = document.getElementById('checkout-grand-total');

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

    function updateTotals() {
        let subtotal = 0;
        currentCheckoutCart.forEach(item => {
            subtotal += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
        });

        const currentShippingCost = parseFloat(shippingCost) || 0;
        const grandTotal = subtotal + currentShippingCost;

        if(checkoutSubtotalEl) checkoutSubtotalEl.textContent = `${subtotal.toFixed(2)} €`;
        if(checkoutShippingCostsEl) checkoutShippingCostsEl.textContent = currentShippingCost > 0 ? `${currentShippingCost.toFixed(2)} €` : 'GRATIS';
        if(checkoutGrandTotalEl) checkoutGrandTotalEl.textContent = `${grandTotal.toFixed(2)} €`;
        if(confirmationTotalPriceEl) confirmationTotalPriceEl.textContent = grandTotal.toFixed(2); // Para el modal de confirmación
    }

    function initializeShippingOptions() {
        if (authToken && userData) {
            console.log('Usuario autenticado, configurando opciones de envío a domicilio.');
            if(authRequiredForShippingDiv) authRequiredForShippingDiv.classList.add('hidden');
            if(homeDeliveryOptionGroup) homeDeliveryOptionGroup.classList.remove('hidden');
            if(otherAddressOptionGroup) otherAddressOptionGroup.classList.remove('hidden');

            // Cargar dirección del perfil del usuario
            if (myAddressDetailsDiv) {
                const profileAddress = {
                    calle: userData.direccion_calle,
                    detalle: userData.direccion_detalle,
                    cp: userData.direccion_cp,
                    ciudad: userData.direccion_ciudad,
                    provincia: userData.direccion_provincia,
                    pais: userData.direccion_pais
                };
                let addressHtml = '';
                if (profileAddress.calle) addressHtml += `${profileAddress.calle}<br>`;
                if (profileAddress.detalle) addressHtml += `${profileAddress.detalle}<br>`;
                if (profileAddress.cp && profileAddress.ciudad) addressHtml += `${profileAddress.cp} ${profileAddress.ciudad}<br>`;
                else if (profileAddress.cp) addressHtml += `${profileAddress.cp}<br>`;
                else if (profileAddress.ciudad) addressHtml += `${profileAddress.ciudad}<br>`;
                if (profileAddress.provincia) addressHtml += `${profileAddress.provincia}<br>`;
                if (profileAddress.pais) addressHtml += `${profileAddress.pais}`;
                
                myAddressDetailsDiv.innerHTML = addressHtml.trim() ? addressHtml : 'No tienes una dirección guardada en tu perfil.';
                if (!addressHtml.trim()) { // Si no hay dirección, forzar selección de otra dirección o recogida
                    if(shippingMyAddressRadio) shippingMyAddressRadio.disabled = true;
                     myAddressDetailsDiv.innerHTML = 'No tienes una dirección principal. Por favor, añade una en tu perfil o introduce una nueva dirección para el envío.';
                } else {
                    if(shippingMyAddressRadio) shippingMyAddressRadio.disabled = false;
                }
            }
        } else {
            console.log('Usuario no autenticado, mostrando mensaje para iniciar sesión para envío a domicilio.');
            if(authRequiredForShippingDiv) authRequiredForShippingDiv.classList.remove('hidden');
            if(homeDeliveryOptionGroup) homeDeliveryOptionGroup.classList.add('hidden');
            if(otherAddressOptionGroup) otherAddressOptionGroup.classList.add('hidden');
        }

        // Event listeners para los radio buttons de envío
        const shippingRadios = document.querySelectorAll('input[name="shippingOption"]');
        shippingRadios.forEach(radio => {
            radio.addEventListener('change', (event) => {
                selectedShippingOption = event.target.value;
                console.log('Opción de envío cambiada a:', selectedShippingOption);
                if (selectedShippingOption === 'storePickup') {
                    shippingCost = 0;
                    if(otherAddressForm) otherAddressForm.classList.add('hidden');
                    currentShippingAddress = null;
                } else if (selectedShippingOption === 'myAddress') {
                    shippingCost = 4.99; // O el coste que definas
                    if(otherAddressForm) otherAddressForm.classList.add('hidden');
                    // Lógica para construir currentShippingAddress desde userData si es válida
                    if (userData && userData.direccion_calle) { // Asumir que si hay calle, hay dirección válida
                        currentShippingAddress = {
                            nombre_completo: userData.nombre, // Asumiendo que userData tiene nombre
                            direccion_calle: userData.direccion_calle,
                            direccion_detalle: userData.direccion_detalle || '',
                            direccion_cp: userData.direccion_cp,
                            direccion_ciudad: userData.direccion_ciudad,
                            direccion_provincia: userData.direccion_provincia || '',
                            direccion_pais: userData.direccion_pais
                        };
                    } else {
                        currentShippingAddress = null; // No hay dirección de perfil válida
                        // Aquí podrías forzar al usuario a elegir 'otherAddress' o mostrar un error
                        // Por ahora, si la dirección del perfil no es válida, el envío no se podrá procesar con esta opción
                        console.warn('Intento de usar dirección de perfil pero no es válida o no existe.');
                    }
                } else if (selectedShippingOption === 'otherAddress') {
                    shippingCost = 4.99; // O el coste que definas
                    if(otherAddressForm) otherAddressForm.classList.remove('hidden');
                    currentShippingAddress = null; // Se construirá desde el formulario al confirmar
                }
                updateTotals();
            });
        });

        // Forzar un change inicial para establecer el estado por defecto
        if(shippingStorePickupRadio && shippingStorePickupRadio.checked) {
            shippingStorePickupRadio.dispatchEvent(new Event('change'));
        }
        updateTotals(); // Asegurar que los totales se calculen al inicio
    }

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
                // Validar que si es envío a domicilio, haya una dirección
                if (selectedShippingOption === 'myAddress' && !currentShippingAddress) {
                    alert('Por favor, selecciona una dirección de envío válida o añade una nueva.');
                    // Podrías hacer focus en la opción de otra dirección o mostrar un mensaje más específico.
                    return;
                }
                if (selectedShippingOption === 'otherAddress') {
                    // Validar y construir currentShippingAddress desde el formulario
                    const name = otherAddressNameInput ? otherAddressNameInput.value.trim() : '';
                    const street = otherAddressStreetInput ? otherAddressStreetInput.value.trim() : '';
                    const apartment = otherAddressApartmentInput ? otherAddressApartmentInput.value.trim() : '';
                    const zip = otherAddressZipInput ? otherAddressZipInput.value.trim() : '';
                    const city = otherAddressCityInput ? otherAddressCityInput.value.trim() : '';
                    const state = otherAddressStateInput ? otherAddressStateInput.value.trim() : '';
                    const country = otherAddressCountryInput ? otherAddressCountryInput.value.trim() : '';

                    if (!name || !street || !zip || !city || !country) {
                        alert('Por favor, completa todos los campos de la dirección de envío.');
                        // Podrías resaltar los campos vacíos.
                        return;
                    }
                    currentShippingAddress = {
                        nombre_completo: name,
                        direccion_calle: street,
                        direccion_detalle: apartment,
                        direccion_cp: zip,
                        direccion_ciudad: city,
                        direccion_provincia: state,
                        direccion_pais: country
                    };
                    console.log('Dirección para envío (otra dirección):', currentShippingAddress);
                }

                console.log('Usuario autenticado. Mostrando modal de confirmación de compra.');
                updateTotals(); // Asegurar que el total en el modal es el correcto
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
                    title: item.title,       // Título en el momento de la compra
                    // Los siguientes campos se mueven al nivel raíz del payload
                    // deliveryMethod: selectedShippingOption === 'storePickup' ? 'recogida' : 'domicilio',
                    // shippingAddress: selectedShippingOption !== 'storePickup' ? currentShippingAddress : null 
                })),
                totalAmount: parseFloat(checkoutGrandTotalEl.textContent.replace(' €','')), // Tomar del total general
                // Añadir deliveryMethod y shippingAddress aquí, en el nivel raíz:
                deliveryMethod: selectedShippingOption === 'storePickup' ? 'recogida' : 'domicilio',
                shippingAddress: selectedShippingOption !== 'storePickup' ? currentShippingAddress : null
            };

            console.log('Payload final del pedido:', JSON.stringify(orderPayload, null, 2));

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
                
                const authTokenForCartClear = localStorage.getItem('authToken');
                if (authTokenForCartClear && typeof fetchWithAuth === 'function') {
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

    initializeShippingOptions(); // Llamar a la nueva función

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