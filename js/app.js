// Estado de la aplicación (simplificado)
const state = {
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]'),
    cart: JSON.parse(localStorage.getItem('cart') || '[]'),
};

// Variable global para almacenar los libros de la API
let allBooks = [];

// --- SELECCIÓN DOM --- (Asegúrate de que todas las selecciones estén aquí)
let themeToggle, wishlistModal, closeWishlist, contactIcon, contactModal, closeContactModal;
let cartIcon, wishlistHeaderIcon, cartCountBadge;
let cartModal, closeCartModalBtn, cartItemsContainer, goToCheckoutBtn, cartTotalPrice, emptyCartBtn;
let wishlistContent; // Asegurar que se define
let recommendationsContainer, sliderTrack;
let userIcon, userDropdown; // <--- Añadido para el menú de usuario
// Elementos del menú de usuario para la UI dinámica
let userGreeting, loginLinkMenu, registerLinkMenu, profileLinkMenu, ordersLinkMenu, logoutLinkMenu;
// Elementos del modal de confirmación para vaciar carrito
let confirmEmptyCartModal, cancelEmptyCartBtn, confirmEmptyCartActionBtn;

// --- INICIALIZACIÓN ---
async function init() {
    // Seleccionar elementos del DOM
    themeToggle = document.getElementById('theme-toggle');
    wishlistModal = document.getElementById('wishlist-modal');
    closeWishlist = document.getElementById('close-wishlist');
    wishlistContent = document.getElementById('wishlist-content');
    contactIcon = document.getElementById('contact-icon');
    contactModal = document.getElementById('contact-modal');
    closeContactModal = document.getElementById('close-contact-modal');
    cartIcon = document.getElementById('cart-icon');
    wishlistHeaderIcon = document.getElementById('wishlist-header-icon');
    cartCountBadge = document.getElementById('cart-count-badge');
    cartModal = document.getElementById('cart-modal');
    closeCartModalBtn = document.getElementById('close-cart-modal');
    cartItemsContainer = document.getElementById('cart-items-container');
    goToCheckoutBtn = document.getElementById('go-to-checkout-btn');
    cartTotalPrice = document.getElementById('cart-total-price');
    emptyCartBtn = document.getElementById('empty-cart-btn');
    sliderTrack = document.getElementById('slider-track');
    recommendationsContainer = document.getElementById('recommendations-container');
    userIcon = document.getElementById('user-icon'); 
    userDropdown = document.getElementById('user-dropdown'); 

    // Seleccionar elementos del menú de usuario
    userGreeting = document.getElementById('user-greeting');
    loginLinkMenu = document.getElementById('login-link-menu');
    registerLinkMenu = document.getElementById('register-link-menu');
    profileLinkMenu = document.getElementById('profile-link-menu');
    ordersLinkMenu = document.getElementById('orders-link-menu');
    console.log('Elemento ordersLinkMenu seleccionado en init:', ordersLinkMenu);
    logoutLinkMenu = document.getElementById('logout-link-menu');

    // Seleccionar elementos del modal de confirmación para vaciar carrito
    confirmEmptyCartModal = document.getElementById('confirm-empty-cart-modal');
    cancelEmptyCartBtn = document.getElementById('cancel-empty-cart-btn');
    confirmEmptyCartActionBtn = document.getElementById('confirm-empty-cart-action-btn');

    applyTheme(); // Aplicar tema lo antes posible

    try {
        allBooks = await fetchBooks(); // Cargar libros de la API
        console.log(`Fetched ${allBooks.length} books from API.`);
        // Añadir log para ver los datos obtenidos
        console.log('Datos de allBooks (primeros 5):', allBooks.slice(0, 5)); 

        renderSliderImages(allBooks); // Renderizar slider
        renderRecommendedBooks(allBooks); // Renderizar recomendaciones

        setupEventListeners(); // Configurar listeners después de cargar datos y renderizar
        updateCartIcon(); // Actualizar UI inicial del carrito
        renderWishlist(); // Renderizar UI inicial de wishlist
        renderCartModal(); // Renderizar UI inicial del modal carrito
        updateUserUI(); // <--- Actualizar UI del usuario al iniciar

        console.log('Aplicación inicializada con datos de la API.');

    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        // Mostrar mensaje de error al usuario si falla la carga de libros
        if (recommendationsContainer) {
            recommendationsContainer.innerHTML = '<p class="text-red-500 text-center col-span-full">Error al cargar los libros. Por favor, inténtalo de nuevo más tarde.</p>';
        }
         if (sliderTrack) {
             sliderTrack.innerHTML = '<p class="text-red-500 text-center w-full">Error al cargar imágenes.</p>';
         }
    }
}

// --- OBTENER DATOS ---
async function fetchBooks() {
    const apiUrl = 'https://books-foniuhqsba-uc.a.run.app/'; // <--- REVERTIDO a API Externa
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();

        // REVERTIDO: Filtrar "Cien años de soledad" de los datos ANTES de mapear
        data = data.filter(book => 
            !book.title || book.title.toLowerCase() !== 'cien años de soledad'
        );

        // REVERTIDO: Mapear datos y construir la URL de la portada localmente
        return data.map((book, index) => {
            const bookId = `book-${index}`;
            const rawTitle = book.title || 'untitled'; 

            const filename = rawTitle
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
                .replace(/ñ/g, 'n') 
                .replace(/\s+/g, '-') 
                .replace(/[^a-z0-9-()]/g, ''); 
            
            return {
                ...book,
                id: bookId, // ID generado localmente
                cover: `assets/books/${filename}.jpg` // Ruta local a la imagen construida
            };
        });
    } catch (error) {
        console.error("Error fetching books:", error); // Mensaje original
        throw error; 
    }
}


// --- RENDERIZADO ---
function applyTheme() { document.body.classList.toggle('dark', state.isDarkMode); }

function renderSliderImages(books) {
    if (!sliderTrack) return;
    sliderTrack.innerHTML = ''; 
    const placeholderUrl = 'assets/placeholder-cover.png';

    // REVERTIDO: Filtrar "Cien años de soledad" de la lista de libros para el slider
    const booksWithoutCienAnos = books.filter(book => 
        !book.title || book.title.toLowerCase() !== 'cien años de soledad'
    );

    const booksForSlider = booksWithoutCienAnos.slice(0, TOTAL_IMAGES_IN_SLIDER); 

    if (booksForSlider.length === 0 && TOTAL_IMAGES_IN_SLIDER > 0) {
        // Si no hay libros pero esperamos imágenes, mostrar placeholders
        for (let i = 0; i < TOTAL_IMAGES_IN_SLIDER; i++) {
            const div = document.createElement('div');
            div.className = 'w-1/3 flex-shrink-0 px-2 flex items-center justify-center';
            div.innerHTML = `<img src="${placeholderUrl}" alt="Placeholder Portada libro ${i + 1}" class="w-auto h-56 object-contain border dark:border-gray-700">`;
            sliderTrack.appendChild(div);
        }
    } else {
        // Usar imágenes de los libros, o placeholder si falta la portada
        for (let i = 0; i < TOTAL_IMAGES_IN_SLIDER; i++) {
            const book = booksForSlider[i % booksForSlider.length]; // Repetir libros si hay menos de 12
            const div = document.createElement('div');
            div.className = 'w-1/3 flex-shrink-0 px-2 flex items-center justify-center';
            const coverUrl = (book && book.cover) ? book.cover : placeholderUrl;
            const altText = (book && book.title) ? book.title : `Portada libro ${i + 1}`;
            // Añadir un manejador de error para cada imagen
            div.innerHTML = `<img src="${coverUrl}" alt="${altText}" class="w-auto h-56 object-contain border dark:border-gray-700" onerror="this.onerror=null;this.src='${placeholderUrl}';">`; 
            sliderTrack.appendChild(div);
        }
    }

    const actualTotalSlides = Math.ceil(Math.min(booksForSlider.length, TOTAL_IMAGES_IN_SLIDER) / SLIDES_TO_SHOW);
    if(actualTotalSlides > 1) {
        startSliderAnimation();
    } else {
        if (sliderInterval) clearInterval(sliderInterval); // Detener si no hay suficientes slides
    }
}

function renderRecommendedBooks(books) {
    if (!recommendationsContainer) return;
    recommendationsContainer.innerHTML = ''; 

    // Barajar una copia de los libros para obtener una selección aleatoria
    const shuffledBooks = [...books].sort(() => 0.5 - Math.random());
    const booksToShow = shuffledBooks.slice(0, 4); // Mostrar 4 libros aleatorios

    if (booksToShow.length === 0) {
        recommendationsContainer.innerHTML = '<p class="text-gray-500 text-center w-full">No hay libros para mostrar.</p>';
        return;
    }

    booksToShow.forEach(book => {
        const cardContainer = document.createElement('div');
        const card = document.createElement('book-card');
        card.setAttribute('id', book.id); 
        card.setAttribute('title', book.title);
        card.setAttribute('author', book.author || 'Desconocido');
        card.setAttribute('cover', book.cover || 'assets/placeholder-cover.png');
        card.setAttribute('price', book.price || 0);
        card.setAttribute('stock', book.stock || 0);
        if (book.year) card.setAttribute('year', book.year);
        if (book.category) card.setAttribute('category', book.category);
        if (book.rating) card.setAttribute('rating', book.rating); 
        if (book.pages) card.setAttribute('pages', book.pages);
        if (book.language) card.setAttribute('language', book.language);

        // Establecer si está en la lista de deseos
        if (state.wishlist.includes(book.id)) {
            card.setAttribute('in-wishlist', 'true');
        }

        cardContainer.appendChild(card);
        recommendationsContainer.appendChild(cardContainer);
    });
}

function renderWishlist() {
    if (!wishlistContent) return;
    wishlistContent.innerHTML = ''; // Limpiar contenido anterior

    if (state.wishlist.length === 0) {
        wishlistContent.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-400 py-4">Tu lista de deseos está vacía.</p>';
        return;
    }

    state.wishlist.forEach(bookId => {
        const book = allBooks.find(b => b.id === bookId);
        if (book) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex items-center space-x-2 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0';
            
            const coverUrl = book.cover || 'assets/placeholder-cover-small.png';
            const price = typeof book.price === 'number' ? book.price.toFixed(2) : 'N/A';

            itemDiv.innerHTML = `
                <img src="${coverUrl}" alt="${book.title}" class="w-12 h-16 object-cover rounded shadow">
                <div class="flex-grow">
                    <h4 class="text-sm font-medium text-gray-800 dark:text-gray-200">${book.title}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${book.author || 'Autor Desconocido'}</p>
                </div>
                <div class="text-sm font-semibold text-gray-800 dark:text-gray-300 w-16 text-right">${price} €</div>
                <div class="flex flex-col space-y-1 ml-2">
                    <button data-book-id="${book.id}" class="move-to-cart-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Mover al Carrito">
                        <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg>
                    </button>
                    <button data-book-id="${book.id}" class="remove-wishlist-item-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Eliminar de la Lista de Deseos">
                         <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                    </button>
                </div>
            `;
            wishlistContent.appendChild(itemDiv);
        } else {
            console.warn(`Libro con ID ${bookId} en wishlist pero no encontrado en allBooks.`);
        }
    });

    // Adjuntar listeners a los nuevos botones
    wishlistContent.querySelectorAll('.remove-wishlist-item-btn').forEach(button => 
        button.addEventListener('click', e => toggleWishlistItem(e.currentTarget.dataset.bookId))
    );
    wishlistContent.querySelectorAll('.move-to-cart-btn').forEach(button =>
        button.addEventListener('click', e => moveWishlistItemToCart(e.currentTarget.dataset.bookId))
    );
}

function renderCartModal() {
    if (!cartItemsContainer || !cartTotalPrice) return;
    let totalPrice = 0;
    cartItemsContainer.innerHTML = '';
    if (state.cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-4">Tu carrito está vacío.</p>';
        cartTotalPrice.textContent = '0.00 €';
        return;
    }
    state.cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex items-center space-x-2 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0';
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        // Asegurarse que item.cover exista o usar placeholder
        const cartCover = item.cover ? item.cover.replace('-L.jpg', '-S.jpg') : 'assets/placeholder-cover-small.png';
        itemDiv.innerHTML = `
            <img src="${cartCover}" alt="${item.title}" class="w-12 h-16 object-cover rounded shadow">
            <div class="flex-grow">
                <h4 class="text-sm font-medium text-gray-800 dark:text-gray-200">${item.title}</h4>
                <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <button data-book-id="${item.id}" class="minus-qty-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Reducir cantidad">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                    </button>
                    <span class="item-quantity font-medium text-gray-700 dark:text-gray-300">${item.quantity}</span>
                    <button data-book-id="${item.id}" class="plus-qty-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Aumentar cantidad">
                         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                </div>
            </div>
            <div class="text-sm font-semibold text-gray-800 dark:text-gray-300 w-16 text-right">${itemTotal.toFixed(2)} €</div>
            <div class="flex flex-col space-y-1 ml-2">
                <button data-book-id="${item.id}" class="move-to-wishlist-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Mover a Lista de Deseos">
                    <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </button>
                <button data-book-id="${item.id}" class="remove-cart-item-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Eliminar del carrito">
                     <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(itemDiv);
    });
    cartTotalPrice.textContent = `${totalPrice.toFixed(2)} €`;
    // Adjuntar listeners a los botones dentro del modal
    cartItemsContainer.querySelectorAll('.minus-qty-btn').forEach(b => b.addEventListener('click', e => decreaseCartItemQuantity(e.currentTarget.dataset.bookId)));
    cartItemsContainer.querySelectorAll('.plus-qty-btn').forEach(b => b.addEventListener('click', e => increaseCartItemQuantity(e.currentTarget.dataset.bookId)));
    cartItemsContainer.querySelectorAll('.remove-cart-item-btn').forEach(b => b.addEventListener('click', e => removeBookFromCart(e.currentTarget.dataset.bookId, true))); // True para eliminar todas las unidades
    cartItemsContainer.querySelectorAll('.move-to-wishlist-btn').forEach(b => b.addEventListener('click', e => moveCartItemToWishlist(e.currentTarget.dataset.bookId)));
}


// --- MANEJO DE ESTADO (CARRITO / WISHLIST) ---
function toggleWishlistItem(bookId) {
    const authToken = localStorage.getItem('authToken');
    const isInWishlist = state.wishlist.includes(bookId);

    if (authToken) {
        // Usuario logueado: interactuar con el backend
        const url = `http://localhost:3000/api/wishlist${isInWishlist ? '/' + bookId : ''}`;
        const method = isInWishlist ? 'DELETE' : 'POST';
        const body = isInWishlist ? null : JSON.stringify({ book_id: bookId });

        fetchWithAuth(url, { 
            method: method,
            body: body // fetchWithAuth ya pone Content-Type si hay body JSON
        })
        .then(response => {
            if (!response.ok) {
                // Si es 401, el token podría haber expirado entre la carga de la página y esta acción
                if (response.status === 401) logoutUser(); 
                return response.json().then(errData => Promise.reject(errData));
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            // Actualizar state.wishlist localmente después de la operación exitosa del backend
            if (isInWishlist) { // Se eliminó
                state.wishlist = state.wishlist.filter(id => id !== bookId);
            } else { // Se añadió
                state.wishlist.push(bookId);
            }
            // Actualizar la UI
            renderWishlist();
            updateBookCardVisualState(bookId, !isInWishlist);
        })
        .catch(error => {
            console.error('Error al actualizar wishlist en backend:', error);
            // Podríamos mostrar un mensaje al usuario aquí
            // alert(error.message || 'Error al actualizar tu lista de deseos.');
        });

    } else {
        // Usuario invitado: usar localStorage (lógica existente)
        const index = state.wishlist.indexOf(bookId);
        if (index === -1) {
            state.wishlist.push(bookId);
        } else {
            state.wishlist.splice(index, 1);
        }
        localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
        renderWishlist();
        updateBookCardVisualState(bookId, index === -1);
    }
}

// Función auxiliar para actualizar una sola tarjeta de libro
function updateBookCardVisualState(bookId, isNowInWishlist) {
    document.querySelectorAll(`book-card[id="${bookId}"]`).forEach(cardElement => {
        cardElement.setAttribute('in-wishlist', isNowInWishlist.toString());
    });
}

function addBookToCart(bookId, title, price, cover, stock) {
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
        // Usuario logueado: interactuar con el backend
        // El backend en POST /api/cart espera { book_id, quantity (opcional, default 1) }
        // y maneja la lógica de si el ítem ya existe para incrementar la cantidad.
        fetchWithAuth('http://localhost:3000/api/cart', {
            method: 'POST',
            body: JSON.stringify({ book_id: bookId, quantity: 1 }) // Siempre añadimos 1 unidad con este botón
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) logoutUser();
                return response.json().then(errData => Promise.reject(errData));
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message); // Mensaje del backend: "Libro añadido" o "Cantidad actualizada"
            // Después de una operación exitosa, recargar el carrito desde el backend para asegurar consistencia
            fetchUserCart(); 
        })
        .catch(error => {
            console.error('Error al añadir al carrito en backend:', error);
            alert(error.message || 'Error al añadir el libro al carrito.');
        });

    } else {
        // Usuario invitado: usar localStorage (lógica existente)
        const existingBook = state.cart.find(item => item.id === bookId);
        const currentStock = stock || 0; 

        if (existingBook) {
            if (existingBook.quantity < existingBook.stock) {
               existingBook.quantity += 1;
            } else {
                alert(`No puedes añadir más unidades de "${title}". Stock máximo (${existingBook.stock}) alcanzado.`);
                return;
            }
        } else {
            if (currentStock > 0) {
                 state.cart.push({ id: bookId, title, price, cover, stock: currentStock, quantity: 1 });
            } else {
                alert(`"${title}" no está disponible actualmente.`);
                return;
            }
        }
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartIcon();
        renderCartModal();
    }
}

function increaseCartItemQuantity(bookId) {
    const authToken = localStorage.getItem('authToken');
    const item = state.cart.find(i => i.id === bookId);

    if (!item) {
        console.error('Item no encontrado en el carrito local al intentar incrementar cantidad.');
        return;
    }

    if (item.quantity >= item.stock) {
        alert(`No puedes añadir más unidades de "${item.title}". Stock máximo (${item.stock}) alcanzado.`);
        return;
    }

    const newQuantity = item.quantity + 1;

    if (authToken) {
        fetchWithAuth(`http://localhost:3000/api/cart/${bookId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: newQuantity })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) logoutUser();
                return response.json().then(errData => Promise.reject(errData));
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message); // "Cantidad actualizada"
            fetchUserCart(); // Recargar carrito desde backend
        })
        .catch(error => {
            console.error('Error al actualizar cantidad en backend:', error);
            alert(error.message || 'Error al actualizar la cantidad del libro.');
            // Opcional: revertir el cambio optimista si se hizo en state.cart
        });
    } else {
        // Usuario invitado: actualizar localStorage
        item.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartIcon();
        renderCartModal();
    }
}

function decreaseCartItemQuantity(bookId) {
    const authToken = localStorage.getItem('authToken');
    const item = state.cart.find(i => i.id === bookId);

    if (!item) {
        console.error('Item no encontrado en el carrito local al intentar decrementar cantidad.');
        return;
    }

    const newQuantity = item.quantity - 1;

    if (newQuantity < 1) {
        // Si la cantidad va a ser menor que 1, eliminar el ítem
        removeBookFromCart(bookId, true); // true para indicar que es una eliminación completa
        return;
    }

    if (authToken) {
        fetchWithAuth(`http://localhost:3000/api/cart/${bookId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: newQuantity })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) logoutUser();
                return response.json().then(errData => Promise.reject(errData));
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message); // "Cantidad actualizada"
            fetchUserCart(); // Recargar carrito desde backend
        })
        .catch(error => {
            console.error('Error al actualizar cantidad en backend:', error);
            alert(error.message || 'Error al actualizar la cantidad del libro.');
        });
    } else {
        // Usuario invitado
        item.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartIcon();
        renderCartModal();
    }
}

function removeBookFromCart(bookId, removeAll = false) { // removeAll se usa para la lógica interna, el botón siempre elimina todo
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
        fetchWithAuth(`http://localhost:3000/api/cart/${bookId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) logoutUser();
                // Permitir un 404 si el ítem ya no estaba en el backend (quizás eliminado desde otra sesión)
                if (response.status !== 404) { 
                    return response.json().then(errData => Promise.reject(errData));
                }
            }
            // Si es 404 o éxito, la respuesta puede no tener JSON, o ser un mensaje
            return response.status === 204 ? { message: 'Libro eliminado del carrito (backend)' } : response.json().catch(() => ({ message: 'Operación completada (backend)' }));
        })
        .then(data => {
            console.log(data.message);
            fetchUserCart(); // Recargar carrito desde backend
        })
        .catch(error => {
            console.error('Error al eliminar libro del carrito en backend:', error);
            // No mostrar alerta si el error es porque el ítem ya no existía (manejado por el backend como éxito o 404)
            if (error && error.message && !error.message.includes("unexpected end of JSON input")) { // Evitar alertas por respuestas vacías (204)
                 alert(error.message || 'Error al eliminar el libro del carrito.');
            } else if (!error || !error.message) { // Error genérico
                 alert('Error al eliminar el libro del carrito.');
            }
            // Como fallback, si el backend falla pero queremos que la UI refleje el cambio localmente:
            // state.cart = state.cart.filter(item => item.id !== bookId);
            // updateCartIcon();
            // renderCartModal();
            // Pero es mejor confiar en fetchUserCart() para la consistencia.
        });
    } else {
        // Usuario invitado
        state.cart = state.cart.filter(item => item.id !== bookId);
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartIcon();
        renderCartModal();
    }
}

function moveCartItemToWishlist(bookId) {
    const itemInCart = state.cart.find(i => i.id === bookId);
    if (!itemInCart) return;
    if (!state.wishlist.includes(bookId)) { // Añadir solo si no está ya
       toggleWishlistItem(bookId); 
    }
    removeBookFromCart(bookId, true); 
    console.log(`Libro ID ${bookId} movido del carrito a la lista de deseos.`);
}

// Nueva función para mover de wishlist a carrito
function moveWishlistItemToCart(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) {
        console.error(`Libro con ID ${bookId} no encontrado al intentar mover de wishlist a carrito.`);
        return;
    }

    // 1. Añadir al carrito
    // Necesitamos todos los detalles del libro para addBookToCart
    addBookToCart(book.id, book.title, book.price, book.cover, book.stock);

    // 2. Eliminar de la wishlist (toggleWishlistItem se encarga de la lógica de backend/localStorage y UI)
    // Solo lo hacemos si realmente está en la wishlist para evitar un toggle innecesario si algo falló antes.
    if (state.wishlist.includes(bookId)) {
        toggleWishlistItem(bookId);
    }
    
    console.log(`Libro ID ${bookId} movido de la lista de deseos al carrito.`);
    // renderWishlist() y renderCartModal() serán llamados por toggleWishlistItem y fetchUserCart (dentro de addBookToCart)
}

function emptyCart() {
    if (state.cart.length === 0) {
        alert("Tu carrito ya está vacío."); // O podrías mostrar un mensaje más sutil en la UI
        return;
    }

    if (confirmEmptyCartModal) {
        confirmEmptyCartModal.showModal();
    } else {
        // Fallback al confirm nativo si el modal no está disponible por alguna razón
        console.warn("Modal de confirmación para vaciar carrito no encontrado, usando confirm nativo.");
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            performEmptyCartAction();
        }
    }
}

// Acción real de vaciar el carrito, llamada después de la confirmación
async function performEmptyCartAction() {
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
        // Usuario logueado: llamar al backend
        try {
            const response = await fetchWithAuth('http://localhost:3000/api/cart', { method: 'DELETE' });
            if (!response.ok) {
                if (response.status === 401) logoutUser();
                // Permitir un 404 si el carrito ya estaba vacío en el backend
                if (response.status !== 404) { 
                    const errData = await response.json().catch(() => ({ message: 'Error desconocido al vaciar el carrito en backend.' }));
                    throw new Error(errData.message || `Error ${response.status} del servidor`);
                }
            }
            console.log('Carrito vaciado en el backend.');
            // Recargar el carrito desde el backend (que debería estar vacío)
            // fetchUserCart() se encargará de actualizar state.cart, localStorage (si aplica para invitados tras logout), y la UI.
            await fetchUserCart(); 
        } catch (error) {
            console.error('Error al vaciar el carrito en el backend:', error);
            alert(`Error al vaciar el carrito: ${error.message}`);
            // Considerar si se debe hacer algo más aquí, como un reintento o mantener el estado local.
        }
    } else {
        // Usuario invitado: limpiar localStorage
        state.cart = [];
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartIcon();
        renderCartModal();
        console.log('Carrito local vaciado.');
    }

    if (confirmEmptyCartModal && confirmEmptyCartModal.open) {
        confirmEmptyCartModal.close();
    }
}

function updateCartIcon() {
    const cartItemCount = state.cart.reduce((total, item) => total + item.quantity, 0);
    if (cartCountBadge) { // Renombrar a cartBadge
        cartCountBadge.textContent = cartItemCount;
        cartCountBadge.style.display = cartItemCount > 0 ? 'flex' : 'none';
    }
     if (cartIcon) cartIcon.title = `Mi Compra (${cartItemCount} items)`;
}


// --- LÓGICA SLIDER Y SCROLL ---
let currentSlide = 0;
let sliderInterval;
const SLIDES_TO_SHOW = 3;
const TOTAL_IMAGES_IN_SLIDER = 12;

function startSliderAnimation() {
    if (!sliderTrack) return;
    if (sliderInterval) clearInterval(sliderInterval);
    const actualTotalSlides = Math.ceil(TOTAL_IMAGES_IN_SLIDER / SLIDES_TO_SHOW);
    if (actualTotalSlides <= 1) return;

    sliderInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % actualTotalSlides;
        updateSliderPosition();
    }, 4000);
}

function updateSliderPosition() {
    if (!sliderTrack) return;
    sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
}

// --- EVENT LISTENERS GENERALES ---
function setupEventListeners() {
    // Listeners del header y modales generales
    if (themeToggle) themeToggle.addEventListener('click', () => { state.isDarkMode = !state.isDarkMode; localStorage.setItem('darkMode', state.isDarkMode); applyTheme(); });
    if (wishlistHeaderIcon && wishlistModal) wishlistHeaderIcon.addEventListener('click', () => { renderWishlist(); wishlistModal.showModal(); });
    if (closeWishlist && wishlistModal) closeWishlist.addEventListener('click', () => wishlistModal.close());
    if (contactIcon && contactModal) contactIcon.addEventListener('click', () => contactModal.showModal());
    if (closeContactModal && contactModal) closeContactModal.addEventListener('click', () => contactModal.close());
    if (cartIcon && cartModal) cartIcon.addEventListener('click', () => { renderCartModal(); cartModal.showModal(); });
    if (closeCartModalBtn && cartModal) closeCartModalBtn.addEventListener('click', () => cartModal.close());
    if (goToCheckoutBtn && cartModal) goToCheckoutBtn.addEventListener('click', () => { cartModal.close(); window.location.href = 'checkout.html'; });
    if (emptyCartBtn) emptyCartBtn.addEventListener('click', () => emptyCart());
    if (logoutLinkMenu) logoutLinkMenu.addEventListener('click', (e) => { e.preventDefault(); logoutUser(); }); // <--- Listener para logout

    // Listener para el menú de usuario
    if (userIcon && userDropdown) {
        userIcon.addEventListener('click', (event) => {
            event.stopPropagation(); // Evita que el click se propague al document
            userDropdown.classList.toggle('hidden');
        });

        // Cerrar dropdown si se hace clic fuera
        document.addEventListener('click', (event) => {
            if (!userDropdown.classList.contains('hidden') && !userIcon.contains(event.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }

    // Cerrar modales con click en backdrop
    [wishlistModal, contactModal, cartModal].forEach(modal => { if (modal) modal.addEventListener("click", e => { if (e.target === modal) modal.close(); }); });

    // Listeners para el modal de confirmación de vaciar carrito
    if (cancelEmptyCartBtn && confirmEmptyCartModal) {
        cancelEmptyCartBtn.addEventListener('click', () => {
            confirmEmptyCartModal.close();
        });
    }
    if (confirmEmptyCartActionBtn && confirmEmptyCartModal) {
        confirmEmptyCartActionBtn.addEventListener('click', () => {
            performEmptyCartAction(); // La función que realmente vacía el carrito
            // confirmEmptyCartModal.close(); // Se cierra dentro de performEmptyCartAction
        });
    }

    // Listeners para eventos de book-card
    document.addEventListener('view-book-details', e => alert(`Ver detalles del libro ID: ${e.detail.bookId}`));
    document.addEventListener('add-to-cart', e => {
        addBookToCart(
            e.detail.bookId,
            e.detail.title,
            parseFloat(e.detail.price || 0),
            e.detail.cover,
            parseInt(e.detail.stock || 0)
        );
    });
    document.addEventListener('toggle-wishlist', e => {
        toggleWishlistItem(e.detail.bookId);
    });
}

// --- FUNCIONES DE AUTENTICACIÓN Y UI DE USUARIO ---

// Helper para realizar fetch con token de autenticación
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
}

async function fetchUserWishlist() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        // Si no hay token, podría cargar la wishlist de localStorage para invitados
        // o simplemente asegurarse de que state.wishlist esté sincronizado con localStorage.
        state.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        renderWishlist(); // Renderizar desde localStorage
        updateAllBookCardWishlistStatus(); // Actualizar todas las tarjetas
        return;
    }

    try {
        const response = await fetchWithAuth('http://localhost:3000/api/wishlist');
        if (!response.ok) {
            if (response.status === 401) {
                 // Token inválido o expirado, limpiar sesión y tratar como invitado
                console.warn('Token inválido/expirado al obtener wishlist. Limpiando sesión.');
                logoutUser(); // Esto ya limpia localStorage y actualiza UI
                // state.wishlist ya se limpia en logoutUser
                return; // Salir para no procesar más
            }
            throw new Error(`Error al obtener wishlist del backend: ${response.statusText}`);
        }
        const backendWishlistItems = await response.json(); // Array de { book_id: "id", added_at: "date" }
        state.wishlist = backendWishlistItems.map(item => item.book_id); // Almacenar solo los IDs
        
        // Opcional: podríamos guardar esta lista sincronizada también en localStorage
        // localStorage.setItem('wishlist', JSON.stringify(state.wishlist)); 
        // Pero esto podría causar confusión si el usuario cierra sesión y espera la local.
        // Por ahora, la fuente de verdad para usuarios logueados es el backend.

        console.log('Wishlist cargada del backend:', state.wishlist);
        renderWishlist();
        updateAllBookCardWishlistStatus();

    } catch (error) {
        console.error('Fallo al obtener/procesar wishlist del backend:', error);
        // En caso de error (ej. red), podríamos intentar cargar de localStorage como fallback,
        // o simplemente mostrar la wishlist vacía para el usuario logueado hasta que se resuelva.
        // Por ahora, si falla la carga del backend, el usuario logueado verá una wishlist vacía
        // (ya que logoutUser no se llama aquí a menos que sea un 401)
        // state.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]'); // Fallback opcional
        // renderWishlist();
        // updateAllBookCardWishlistStatus();
    }
}

function updateAllBookCardWishlistStatus() {
    document.querySelectorAll('book-card').forEach(card => {
        const bookId = card.getAttribute('id');
        if (state.wishlist.includes(bookId)) {
            card.setAttribute('in-wishlist', 'true');
        } else {
            card.setAttribute('in-wishlist', 'false');
        }
    });
}

function updateUserUI() {
    const authToken = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('userData');
    
    console.log('updateUserUI: authToken:', authToken); // <--- NUEVO LOG
    console.log('updateUserUI: userDataString desde localStorage:', userDataString); // <--- NUEVO LOG

    if (authToken && userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            console.log('updateUserUI: userData parseado:', userData); // <--- NUEVO LOG
            if (userGreeting) {
                userGreeting.textContent = `Hola, ${userData.nombre}`;
                userGreeting.classList.remove('hidden');
            }
            if (loginLinkMenu) loginLinkMenu.classList.add('hidden');
            if (registerLinkMenu) registerLinkMenu.classList.add('hidden');
            if (profileLinkMenu) profileLinkMenu.classList.remove('hidden');
            if (ordersLinkMenu) ordersLinkMenu.classList.remove('hidden');
            if (logoutLinkMenu) logoutLinkMenu.classList.remove('hidden');

            fetchUserWishlist(); // <--- Cargar wishlist del backend para usuario
            fetchUserCart(); // <--- Cargar carrito del backend/localStorage para usuario

        } catch (error) {
            console.error('Error al parsear userData:', error);
            clearUserSessionAndUI();
            fetchUserWishlist(); 
            fetchUserCart(); // <--- Cargar carrito de localStorage para invitado
        }
    } else {
        clearUserSessionAndUI();
        fetchUserWishlist(); 
        fetchUserCart(); // <--- Cargar carrito de localStorage para invitado
    }
}

function clearUserSessionAndUI() {
    if (userGreeting) userGreeting.classList.add('hidden');
    if (loginLinkMenu) loginLinkMenu.classList.remove('hidden');
    if (registerLinkMenu) registerLinkMenu.classList.remove('hidden');
    if (profileLinkMenu) profileLinkMenu.classList.add('hidden');
    if (ordersLinkMenu) ordersLinkMenu.classList.add('hidden');
    if (logoutLinkMenu) logoutLinkMenu.classList.add('hidden');
}

function logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Limpiar carrito y wishlist de localStorage y del estado de la aplicación
    state.cart = [];
    localStorage.removeItem('cart');
    updateCartIcon(); // Actualizar el icono del carrito en la UI
    if (cartModal && cartModal.open) renderCartModal(); // Re-renderizar modal si está abierto

    state.wishlist = [];
    localStorage.removeItem('wishlist');
    if (wishlistModal && wishlistModal.open) renderWishlist(); // Re-renderizar modal si está abierto
    // También actualizamos las tarjetas de libro para quitar el estado 'in-wishlist'
    document.querySelectorAll('book-card[in-wishlist="true"]').forEach(card => {
        card.setAttribute('in-wishlist', 'false');
    });

    updateUserUI(); // Actualizar la UI para reflejar el cierre de sesión
    console.log('Usuario ha cerrado sesión. Carrito y wishlist local limpiados.');
    if (userDropdown && !userDropdown.classList.contains('hidden')) {
        userDropdown.classList.add('hidden');
    }
}

// Similar a fetchUserWishlist, pero para el carrito
async function fetchUserCart() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        state.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        renderCartModal();
        updateCartIcon();
        document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: state.cart } })); // <--- EVENTO
        return;
    }

    try {
        const response = await fetchWithAuth('http://localhost:3000/api/cart');
        if (!response.ok) {
            if (response.status === 401) {
                console.warn('Token inválido/expirado al obtener carrito. Limpiando sesión.');
                logoutUser(); // Esto ya dispara su propia lógica de actualización de UI y estado
                // Considerar si aquí también se debe disparar 'cartUpdated' con un carrito vacío
                document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: [] } })); // <--- EVENTO (carrito vacío tras logout)
                return;
            }
            throw new Error(`Error al obtener carrito del backend: ${response.statusText}`);
        }
        const backendCartItems = await response.json(); // Array de { book_id, quantity, ... }
        
        // Reconstruir state.cart con detalles completos de allBooks
        const newCart = [];
        if (allBooks && allBooks.length > 0) { // Asegurarse que allBooks esté cargado
            for (const item of backendCartItems) {
                const bookDetails = allBooks.find(b => b.id === item.book_id);
                if (bookDetails) {
                    newCart.push({
                        ...bookDetails, // title, price, cover, stock original, etc.
                        id: item.book_id, // Asegurarse de que el id es el book_id del carrito
                        quantity: item.quantity
                    });
                } else {
                    console.warn(`Detalles no encontrados para el libro con ID ${item.book_id} en el carrito del backend.`);
                }
            }
        } else {
            console.warn("allBooks no está disponible para reconstruir el carrito del backend. El carrito podría estar incompleto en detalles.");
            // Si allBooks no está, al menos podemos usar los datos básicos del backend, aunque falten detalles.
            // Esto es un fallback, idealmente allBooks debería estar siempre disponible.
            backendCartItems.forEach(item => {
                newCart.push({
                    id: item.book_id,
                    quantity: item.quantity,
                    title: item.book_id, // Placeholder
                    price: 0, // Placeholder
                    cover: 'assets/placeholder-cover-small.png' // Placeholder
                    // stock no estaría disponible aquí
                });
            });
        }
        state.cart = newCart;
        console.log('Carrito cargado del backend:', state.cart);
        renderCartModal();
        updateCartIcon();
        document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: state.cart } })); // <--- EVENTO

    } catch (error) {
        console.error('Fallo al obtener/procesar carrito del backend:', error);
        // En caso de error, disparamos el evento con el carrito actual (que podría ser el de localStorage o vacío)
        // o un carrito vacío si la intención es reflejar un fallo de carga.
        document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: state.cart } })); // <--- EVENTO (con carrito actual o vacío)
    }
}

// --- INICIALIZAR ---
document.addEventListener('DOMContentLoaded', init);
