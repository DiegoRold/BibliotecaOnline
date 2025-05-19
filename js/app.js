// Estado de la aplicación (simplificado)
const state = {
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]'),
    cart: JSON.parse(localStorage.getItem('cart') || '[]'),
};

// Variable global para almacenar los libros de la API
let allBooks = [];

// --- SELECCIÓN DOM ---
let themeToggle, wishlistModal, closeWishlist, contactIcon, contactModal, closeContactModal;
let cartIcon, wishlistHeaderIcon, cartCountBadge;
let cartModal, closeCartModalBtn, cartItemsContainer, goToCheckoutBtn, cartTotalPrice, emptyCartBtn;
let wishlistContent; 
let userIcon, userDropdown; 
let userGreeting, loginLinkMenu, registerLinkMenu, profileLinkMenu, ordersLinkMenu, logoutLinkMenu;
let confirmEmptyCartModal, cancelEmptyCartBtn, confirmEmptyCartActionBtn;
let horarioLink, horarioModal, closeHorarioModal;
let goToBlogBtn, goToBioBtn;
let goToBooksBtn;
let recommendationsGrid; // <--- NUEVO: Para la cuadrícula de recomendaciones

// --- Slider Dinámico de Libros ---
let dynamicSliderElement;
// IMPORTANTE: Crea la carpeta 'assets/books/' y pon tus imágenes allí.
// Luego, actualiza esta lista con los nombres de tus archivos de imagen.
const bookImageFilenames = [
    "1984.jpg",
    "anna-karenina.jpg",
    "brave-new-world.jpg",
    "cien-anos-de-soledad-(edicion-revisada).jpg",
    "crime-and-punishment.jpg",
    "dune.jpg",
    "el-principito.jpg",
    "frankenstein.jpg",
    "harry-potter-and-the-sorcerers-stone.jpg",
    "moby-dick.jpg",
    "pride-and-prejudice.jpg",
    "slaughterhouse-five.jpg",
    "the-alchemist.jpg",
    "the-bell-jar.jpg",
    "the-catcher-in-the-rye.jpg",
    "the-chronicles-of-narnia-the-lion-the-witch-and-the-wardrobe.jpg",
    "the-great-gatsby.jpg",
    "the-hobbit.jpg",
    "the-lord-of-the-rings-the-fellowship-of-the-ring.jpg",
    "the-odyssey.jpg",
    "the-outsiders.jpg",
    "the-picture-of-dorian-gray.jpg",
    "the-secret-garden.jpg",
    "the-shining.jpg",
    "to-kill-a-mockingbird.jpg",
    "wuthering-heights.jpg"
];
let currentImageGroupIndex = 0;
let slideCycleCount = 0;
const IMAGES_PER_GROUP = 4;
const TOTAL_SLIDE_CYCLES_BEFORE_RESET = 3;
let bookSliderIntervalId = null;

// --- INICIALIZACIÓN ---
async function init() {
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
    userIcon = document.getElementById('user-icon'); 
    userDropdown = document.getElementById('user-dropdown'); 
    userGreeting = document.getElementById('user-greeting');
    loginLinkMenu = document.getElementById('login-link-menu');
    registerLinkMenu = document.getElementById('register-link-menu');
    profileLinkMenu = document.getElementById('profile-link-menu');
    ordersLinkMenu = document.getElementById('orders-link-menu');
    logoutLinkMenu = document.getElementById('logout-link-menu');
    confirmEmptyCartModal = document.getElementById('confirm-empty-cart-modal');
    cancelEmptyCartBtn = document.getElementById('cancel-empty-cart-btn');
    confirmEmptyCartActionBtn = document.getElementById('confirm-empty-cart-action-btn');
    horarioLink = document.getElementById('horario-link');
    horarioModal = document.getElementById('horario-modal');
    closeHorarioModal = document.getElementById('close-horario-modal');
    goToBlogBtn = document.getElementById('go-to-blog-btn');
    goToBioBtn = document.getElementById('go-to-bio-btn');
    goToBooksBtn = document.getElementById('go-to-books-btn');
    dynamicSliderElement = document.getElementById('dynamic-book-slider'); // <--- Slider Element
    recommendationsGrid = document.getElementById('recommendationsGrid'); // <--- NUEVO

    applyTheme();
    initializeDynamicBookSlider(); // <--- Inicializar el nuevo slider

    try {
        allBooks = await fetchBooks(); 
        console.log(`Fetched ${allBooks.length} books from API.`);

        setupEventListeners(); 
        updateCartIcon(); 
        renderWishlist(); 
        renderCartModal(); 
        updateUserUI(); 

        // Seleccionar 4 libros aleatorios para recomendaciones
        renderBookCardsSlider([...allBooks].sort(() => 0.5 - Math.random()).slice(0, 4));

        console.log('Aplicación inicializada.');

    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
    }
}

// --- OBTENER DATOS ---
async function fetchBooks() {
    const apiUrl = 'http://localhost:3000/api/libros';
    try {
        const response = await fetch(apiUrl); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Libros obtenidos del backend (data.books):', data.books);
        return data.books; 
    } catch (error) {
        console.error("Error fetching books from local backend:", error);
        throw error; 
    }
}

// --- RENDERIZADO ---
function applyTheme() { document.body.classList.toggle('dark', state.isDarkMode); }

// --- FUNCIÓN MODIFICADA: Renderizar una tarjeta de libro usando el Custom Element <book-card> ---
function renderBookCard(book) {
    const bookCardElement = document.createElement('book-card');

    bookCardElement.setAttribute('id', book.id.toString());
    bookCardElement.setAttribute('title', book.title || '');
    bookCardElement.setAttribute('author', book.author || '');
    
    // Simplificación: Asumir que book.cover ya es la URL correcta o placeholder
    // La lógica compleja para determinar la portada se debe hacer ANTES de llamar a esta función.
    const coverSrc = book.cover || 'assets/books/placeholder-cover.png'; // Usar directamente book.cover o un placeholder
    bookCardElement.setAttribute('cover', coverSrc);

    bookCardElement.setAttribute('year', book.publication_date ? new Date(book.publication_date).getFullYear().toString() : 'N/A');
    bookCardElement.setAttribute('category', book.categories && Array.isArray(book.categories) ? book.categories.join(', ') : (book.categories || 'N/A'));
    bookCardElement.setAttribute('rating', book.rating ? book.rating.toString() : 'N/A');
    bookCardElement.setAttribute('pages', book.pages ? book.pages.toString() : 'N/A');
    // language no está en tu BD según la imagen, pero el componente lo espera. Podemos omitirlo o poner N/A
    bookCardElement.setAttribute('language', book.language || 'N/A'); 
    bookCardElement.setAttribute('price', book.price ? book.price.toString() : '0');
    bookCardElement.setAttribute('stock', book.stock ? book.stock.toString() : '0');

    const isInWishlist = state.wishlist.includes(book.id.toString());
    bookCardElement.setAttribute('in-wishlist', isInWishlist.toString());

    // Los event listeners para 'view-book-details', 'toggle-wishlist', 'add-to-cart'
    // se añadirán globalmente en setupEventListeners() para escuchar los eventos que burbujean
    // desde los custom elements <book-card>.
    // No es necesario añadirlos aquí directamente al `bookCardElement` si los eventos burbujean (composed: true).

    return bookCardElement;
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
    // Actualizar el icono en la tarjeta de libro específica si está visible
    const bookCards = document.querySelectorAll(`.book-card[data-book-id="${bookId}"]`);
    bookCards.forEach(card => {
        const wishlistIcon = card.querySelector('.wishlist-icon');
        if (wishlistIcon) {
            wishlistIcon.src = isNowInWishlist ? 'assets/wishlist-filled.png' : 'assets/wishlist.png';
            wishlistIcon.dataset.isWishlisted = isNowInWishlist;
            wishlistIcon.alt = isNowInWishlist ? 'Quitar de Deseos' : 'Añadir a Deseos';
        }
    });

    // Actualizar también el icono en el slider dinámico si el libro está allí
    const sliderBookDivs = document.querySelectorAll(`.dynamic-book-slide[data-book-id="${bookId}"]`);
    sliderBookDivs.forEach(div => {
        const wishlistIcon = div.querySelector('.slider-wishlist-icon'); // Asumiendo una clase específica para el slider
        if (wishlistIcon) {
            wishlistIcon.src = isNowInWishlist ? 'assets/wishlist-filled.png' : 'assets/wishlist.png';
            // Podrías necesitar un data-attribute similar para el estado en el slider
        }
    });

    // Si tienes una sección de libros en books.html que usa tarjetas similares, deberás actualizarla también.
    // Esto podría requerir una función más global o llamar a esta función desde el contexto de books.js
}

function addBookToCart(bookId, title, price, cover, stock) {
    // NO convertir bookId a número para usuarios logueados
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
        // Usuario logueado: interactuar con el backend
        fetchWithAuth('http://localhost:3000/api/cart', {
            method: 'POST',
            body: JSON.stringify({ book_id: bookId, quantity: 1 }) // Enviar siempre el api_id (cadena)
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
            fetchUserCart(); 
        })
        .catch(error => {
            console.error('Error al añadir al carrito en backend:', error);
            alert(error.message || 'Error al añadir el libro al carrito.');
        });

    } else {
        // Usuario invitado: usar localStorage (lógica existente)
        let realBookId = bookId;
        if (typeof bookId === 'string' && bookId.startsWith('book-')) {
            realBookId = parseInt(bookId.replace('book-', ''), 10);
        }
        const existingBook = state.cart.find(item => item.id === realBookId);
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
                 state.cart.push({ id: realBookId, title, price, cover, stock: currentStock, quantity: 1 });
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

    // Listener para el botón del blog
    if (goToBlogBtn) {
        goToBlogBtn.addEventListener('click', () => {
            window.location.href = 'blog.html';
        });
    }

    // Listener para el botón de bio
    if (goToBioBtn) {
        goToBioBtn.addEventListener('click', () => {
            window.location.href = 'bio.html';
        });
    }

    // Listener para el botón de libros
    if (goToBooksBtn) {
        goToBooksBtn.addEventListener('click', () => {
            window.location.href = 'books.html';
        });
    }

    // Listener para el menú de usuario
    if (userIcon && userDropdown) {
        userIcon.addEventListener('click', (event) => {
            event.stopPropagation(); // Evita que el click se propague al document
            userDropdown.classList.toggle('hidden');
        });

        // Cerrar dropdown si se hace clic fuera
        document.addEventListener('click', (event) => {
            if (userDropdown && !userDropdown.classList.contains('hidden') && userIcon && !userIcon.contains(event.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }

    // Listeners para el modal de confirmación de vaciar carrito
    if (cancelEmptyCartBtn && confirmEmptyCartModal) {
        cancelEmptyCartBtn.addEventListener('click', () => {
            confirmEmptyCartModal.close();
        });
    }
    if (confirmEmptyCartActionBtn && confirmEmptyCartModal) {
        confirmEmptyCartActionBtn.addEventListener('click', () => {
            performEmptyCartAction();
        });
    }

    // Listeners para eventos de book-card
    document.addEventListener('view-book-details', e => {
        // Lógica para ver detalles, por ejemplo:
        // window.location.href = `product-detail.html?id=${e.detail.bookId}`;
        alert(`Ver detalles (desde custom event): ${e.detail.bookId}`);
    });

    document.addEventListener('toggle-wishlist', e => {
        toggleWishlistItem(e.detail.bookId);
    });

    document.addEventListener('add-to-cart', e => {
        const bookDetails = allBooks.find(b => b.id.toString() === e.detail.bookId.toString());
        if (bookDetails) {
            addBookToCart(
                bookDetails.id, 
                bookDetails.title, 
                bookDetails.price, 
                bookDetails.cover, 
                bookDetails.stock
            );
        } else {
            console.warn(`No se encontraron detalles del libro ${e.detail.bookId} para añadir al carrito desde el evento del custom element.`);
            // Podrías necesitar pasar más detalles en e.detail desde el custom element
            // o asegurar que allBooks siempre está completo.
            // El custom element <book-card> pasa: { bookId, title, price, cover, stock } en su evento add-to-cart
            // así que podemos usarlos directamente si el find falla.
            if(e.detail.title && e.detail.price !== undefined) { // Chequeo mínimo
                 addBookToCart(
                    e.detail.bookId, 
                    e.detail.title, 
                    parseFloat(e.detail.price),
                    e.detail.cover, 
                    parseInt(e.detail.stock)
                );
            } else {
                console.error("Detalles insuficientes en el evento 'add-to-cart' del custom element.");
            }
        }
    });

    // Lógica para el modal de Horario
    if (horarioLink && horarioModal) {
        console.log('Horario modal: Attaching listener to horarioLink:', horarioLink); // DEBUG
        horarioLink.addEventListener('click', (event) => {
            event.preventDefault(); 
            console.log('Horario link clicked, showing modal:', horarioModal); // DEBUG
            horarioModal.showModal();
        });
    } else {
        console.warn('Horario modal: horarioLink or horarioModal not found. Check DOM order or IDs.'); // DEBUG
    }

    if (closeHorarioModal && horarioModal) {
        console.log('Horario modal: Attaching listener to closeHorarioModal:', closeHorarioModal); // DEBUG
        closeHorarioModal.addEventListener('click', () => {
            console.log('Close horario modal clicked.'); // DEBUG
            horarioModal.close();
        });
    } else {
        // No es un warn si closeHorarioModal no existe, ya que el modal podría cerrarse solo con clic en backdrop
        if (!horarioModal) console.warn('Horario modal: closeHorarioModal or horarioModal not found for close button.'); // DEBUG
    }

    // Cerrar modales si se hace clic fuera de ellos (backdrop) - ÚNICA INSTANCIA CONSOLIDADA
    [wishlistModal, contactModal, horarioModal, cartModal, confirmEmptyCartModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.close();
                }
            });
        }
    });
}

// --- FUNCIONES DE AUTENTICACIÓN Y UI DE USUARIO ---

// Helper para realizar fetch con token de autenticación
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    let completeUrl = url;
    // Verificar si la URL ya es absoluta
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        completeUrl = `http://localhost:3000${url}`;
    }

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(completeUrl, { ...options, headers });
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
    if (!allBooks || allBooks.length === 0) return;
    
    allBooks.forEach(book => {
        if (book && book.id !== undefined) { // Asegurarse que book y book.id existan
            const isInWishlist = state.wishlist.includes(book.id.toString());
            updateBookCardVisualState(book.id.toString(), isInWishlist);
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
            if (profileLinkMenu) {
                profileLinkMenu.classList.remove('hidden');
                profileLinkMenu.href = 'profile.html';
            }
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

// --- NUEVO: LÓGICA DEL SLIDER DINÁMICO DE LIBROS ---
function initializeDynamicBookSlider() {
    if (!dynamicSliderElement) {
        console.warn("Elemento del slider dinámico 'dynamic-book-slider' no encontrado.");
        return;
    }
    if (bookImageFilenames.length === 0) {
        console.warn("No hay imágenes definidas en 'bookImageFilenames' para el slider.");
        dynamicSliderElement.innerHTML = '<p class="text-center text-gray-500 p-4">No hay imágenes para mostrar en el slider.</p>';
        return;
    }
    if (bookImageFilenames.length < IMAGES_PER_GROUP) {
        console.warn(`Se necesitan al menos ${IMAGES_PER_GROUP} imágenes para el slider, solo se encontraron ${bookImageFilenames.length}. Mostrando las disponibles sin animación.`);
        // Renderizar las pocas imágenes disponibles sin iniciar el intervalo
        renderCurrentImageGroupInSlider();
        return;
    }

    renderCurrentImageGroupInSlider();
    if (bookSliderIntervalId) clearInterval(bookSliderIntervalId); // Limpiar intervalo anterior si existe
    bookSliderIntervalId = setInterval(advanceBookSlider, 2000);
}

function renderCurrentImageGroupInSlider() {
    if (!dynamicSliderElement || bookImageFilenames.length === 0) return;

    dynamicSliderElement.innerHTML = ''; // Limpiar contenido anterior

    for (let i = 0; i < IMAGES_PER_GROUP; i++) {
        const imageIndex = (currentImageGroupIndex + i) % bookImageFilenames.length;
        const imageName = bookImageFilenames[imageIndex];
        
        const imgContainer = document.createElement('div');
        imgContainer.className = 'w-1/4 flex-shrink-0 p-2 box-border'; // Tailwind para 4 imágenes por fila
        
        const imgElement = document.createElement('img');
        imgElement.src = `assets/books/${imageName}`;
        imgElement.alt = `Portada ${imageName.split('.')[0]}`; // Alt text básico
        imgElement.className = 'w-full h-64 object-contain rounded shadow-md bg-white dark:bg-gray-800 p-1'; // Estilos de la imagen

        imgContainer.appendChild(imgElement);
        dynamicSliderElement.appendChild(imgContainer);
    }
}

function advanceBookSlider() {
    // Avanzar al siguiente grupo de imágenes
    currentImageGroupIndex = (currentImageGroupIndex + IMAGES_PER_GROUP);
    
    // Si currentImageGroupIndex se pasa del total de imágenes (considerando un ciclo completo),
    // y no es momento de un reseteo total por slideCycleCount, lo ajustamos para que siga en el ciclo.
    if (currentImageGroupIndex >= bookImageFilenames.length) {
         currentImageGroupIndex %= bookImageFilenames.length;
    }

    slideCycleCount++;

    if (slideCycleCount >= TOTAL_SLIDE_CYCLES_BEFORE_RESET) {
        slideCycleCount = 0;
        currentImageGroupIndex = 0; // Reiniciar al primer grupo de imágenes
        console.log("Slider reiniciado después de 3 ciclos.");
    }
    
    renderCurrentImageGroupInSlider();
}

// --- INICIALIZAR ---
document.addEventListener('DOMContentLoaded', init);

// Escuchar el evento cartUpdated para mantener sincronizado el carrito
document.addEventListener('cartUpdated', (event) => {
    console.log('Evento cartUpdated recibido en app.js:', event.detail.cart);
    // Actualizar el estado global
    if (state) {
        state.cart = event.detail.cart;
        // Actualizar localStorage
        localStorage.setItem('cart', JSON.stringify(state.cart));
        // Actualizar UI
        updateCartIcon();
        // Considera si renderCartModal() es necesario aquí y si el modal podría estar abierto
        if (cartModal && cartModal.open) {
            renderCartModal(); 
        }
        console.log('Estado del carrito actualizado en app.js');
    } else {
        console.warn('La variable state no está disponible al recibir cartUpdated. Esto no debería ocurrir.'); 
    }
});

function renderBookCardsSlider(books) {
  const slider = document.getElementById('book-cards-slider');
  if (!slider) return;
  slider.innerHTML = '';
  // Solo mostrar 4 libros
  books.slice(0, 4).forEach(book => {
    const card = renderBookCard(book);
    slider.appendChild(card);
  });
}
