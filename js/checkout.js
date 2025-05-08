document.addEventListener('DOMContentLoaded', () => {
    const cartSummaryContainer = document.getElementById('checkout-cart-summary');
    const subtotalPriceElement = document.getElementById('checkout-subtotal');
    const grandTotalPriceElement = document.getElementById('checkout-grand-total');
    const proceedToPaymentBtn = document.getElementById('proceed-to-payment-btn');

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    function renderCheckoutCart() {
        if (!cartSummaryContainer || !subtotalPriceElement || !grandTotalPriceElement) {
            console.error('Elementos del DOM para checkout no encontrados.');
            return;
        }

        cartSummaryContainer.innerHTML = ''; // Limpiar placeholder
        let currentSubtotal = 0;

        if (cart.length === 0) {
            cartSummaryContainer.innerHTML = '<p class="text-gray-600 dark:text-gray-400 py-4 text-center">Tu carrito está vacío. No hay nada que mostrar aquí.</p>';
            subtotalPriceElement.textContent = '0.00 €';
            grandTotalPriceElement.textContent = '0.00 €';
            if(proceedToPaymentBtn) proceedToPaymentBtn.disabled = true;
            return;
        }
        
        if(proceedToPaymentBtn) proceedToPaymentBtn.disabled = false;

        const ul = document.createElement('ul');
        ul.className = 'space-y-4';

        cart.forEach(item => {
            const itemTotalPrice = item.price * item.quantity;
            currentSubtotal += itemTotalPrice;

            const cartCover = item.cover ? item.cover.replace('-L.jpg', '-S.jpg') : 'assets/placeholder-cover-small.png';

            const li = document.createElement('li');
            li.className = 'flex items-start space-x-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0';
            li.innerHTML = `
                <img src="${cartCover}" alt="${item.title}" class="w-16 h-24 object-cover rounded shadow-md">
                <div class="flex-grow">
                    <h3 class="text-md font-semibold text-gray-800 dark:text-white">${item.title}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Precio Unitario: ${item.price.toFixed(2)} €</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Cantidad: ${item.quantity}</p>
                </div>
                <div class="text-md font-semibold text-gray-800 dark:text-white w-24 text-right">${itemTotalPrice.toFixed(2)} €</div>
            `;
            ul.appendChild(li);
        });

        cartSummaryContainer.appendChild(ul);
        subtotalPriceElement.textContent = `${currentSubtotal.toFixed(2)} €`;
        // Por ahora, el total general es igual al subtotal (sin gastos de envío)
        grandTotalPriceElement.textContent = `${currentSubtotal.toFixed(2)} €`;
    }

    if (proceedToPaymentBtn) {
        proceedToPaymentBtn.addEventListener('click', () => {
            alert('Redirigiendo a la pasarela de pago (simulación). Gracias por tu compra!');
            // Aquí podrías, por ejemplo, limpiar el carrito después de una compra "exitosa"
            // localStorage.removeItem('cart'); 
            // window.location.href = 'pagina-de-agradecimiento.html';
        });
    }

    // Inicializar la vista del carrito en la página de checkout
    renderCheckoutCart();
}); 