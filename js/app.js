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
let userGreeting, loginLinkMenu, registerLinkMenu, profileLinkMenu, ordersLinkMenu, logoutLinkMenu, adminLinkMenu;
let confirmEmptyCartModal, cancelEmptyCartBtn, confirmEmptyCartActionBtn;
let horarioLink, horarioModal, closeHorarioModal;
let goToBlogBtn, goToBioBtn;
let goToBooksBtn;
let recommendationsGrid; // <--- NUEVO: Para la cuadrícula de recomendaciones
let searchForm; // <--- AÑADIR ESTA LÍNEA PARA EL FORMULARIO DE BÚSQUEDA

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
    adminLinkMenu = document.getElementById('admin-link-menu');
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
    searchForm = document.getElementById('searchForm'); // <--- AÑADIR ESTA LÍNEA

    applyTheme();
    initializeDynamicBookSlider(); // <--- Inicializar el nuevo slider

    try {
        allBooks = await fetchBooks(); 
        console.log(`[app.js init] Fetched ${allBooks.length} books from API.`);
        if (allBooks && allBooks.length > 0) {
            console.log("[app.js init] First book object from allBooks (book.id should be api_id like 'book-X'):", JSON.stringify(allBooks[0]));
        } else {
            console.log("[app.js init] allBooks is empty or not loaded correctly.");
        }

        setupEventListeners(); 
        updateCartIcon(); 
        renderWishlist(); 
        renderCartModal(); 
        await updateUserUI(); 
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
        const data = await response.json(); // data es el objeto completo, ej: { books: [...] } o directamente [...] 
        console.log("[app.js fetchBooks] Raw data from API:", JSON.stringify(data));
        
        // Asumimos que la API devuelve un objeto con una propiedad `books` que es el array
        // O si la API devuelve directamente el array de libros, sería solo `data`.
        // El log del backend era `data.books`, así que probablemente es `data.books`.
        if (data && Array.isArray(data.books)) {
            console.log("[app.js fetchBooks] data.books IS an array. Length:", data.books.length);
            return data.books; 
        } else if (Array.isArray(data)) {
            console.log("[app.js fetchBooks] data IS an array. Length:", data.length);
            return data; // Si la API devuelve el array directamente
        } else {
            console.error("[app.js fetchBooks] Data from API is not in expected format (object with a .books array, or an array). Received:", data);
            return []; // Devolver array vacío para evitar más errores
        }
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
    const cardId = book.id; // book.id ES el api_id (ej: "book-1")

    bookCardElement.setAttribute('id', cardId); 
    bookCardElement.setAttribute('title', book.title || '');
    bookCardElement.setAttribute('author', book.author || '');
    bookCardElement.setAttribute('cover', book.cover_image_url || book.cover || 'assets/books/placeholder.png'); 
    bookCardElement.setAttribute('year', book.publication_date ? new Date(book.publication_date).getFullYear().toString() : 'N/A');
    bookCardElement.setAttribute('category', Array.isArray(book.categories) ? book.categories.join(', ') : (book.categories || 'N/A'));
    bookCardElement.setAttribute('rating', book.rating ? book.rating.toString() : 'N/A');
    bookCardElement.setAttribute('pages', book.pages ? book.pages.toString() : 'N/A');
    bookCardElement.setAttribute('language', book.language || 'N/A');
    bookCardElement.setAttribute('price', book.price ? book.price.toString() : '0');
    bookCardElement.setAttribute('stock', book.stock ? book.stock.toString() : '0');

    const isInWishlist = state.wishlist.includes(cardId); 
    bookCardElement.setAttribute('in-wishlist', isInWishlist.toString());

    // Los event listeners para 'view-book-details', 'toggle-wishlist', 'add-to-cart'
    // se añadirán globalmente en setupEventListeners() para escuchar los eventos que burbujean
    // desde los custom elements <book-card>.
    // No es necesario añadirlos aquí directamente al `bookCardElement` si los eventos burbujean (composed: true).

    return bookCardElement;
}

function renderWishlist() {
    if (!wishlistContent) {
        console.warn("[app.js renderWishlist] wishlistContent element not found. Aborting.");
        return;
    }
    wishlistContent.innerHTML = ''; 
    console.log("[app.js renderWishlist] Rendering. state.wishlist (book IDs):", JSON.stringify(state.wishlist));

    if (!state.wishlist || state.wishlist.length === 0) {
        wishlistContent.innerHTML = '<p class="text-gray-600 dark:text-gray-400 text-center py-4">Tu lista de deseos está vacía.</p>';
        return;
    }

    if (!allBooks || allBooks.length === 0) {
        console.warn("[app.js renderWishlist] allBooks está vacío. No se pueden renderizar items de wishlist.");
        wishlistContent.innerHTML = '<p class="text-red-500 text-center py-4">Error al cargar datos de libros para la wishlist. Intenta refrescar la página.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'space-y-4';

    state.wishlist.forEach(bookId => {
        const book = allBooks.find(b => b.id === bookId);
        if (book) {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow';
            
            const bookInfoDiv = document.createElement('div');
            bookInfoDiv.className = 'flex items-center space-x-3';

            const img = document.createElement('img');
            img.src = book.cover_image_url || book.cover || 'assets/books/placeholder.png';
            img.alt = book.title;
            img.className = 'w-16 h-24 object-cover rounded';
            bookInfoDiv.appendChild(img);

            const textDiv = document.createElement('div');
            const title = document.createElement('h4');
            title.textContent = book.title;
            title.className = 'font-semibold text-gray-800 dark:text-white';
            textDiv.appendChild(title);

            const author = document.createElement('p');
            author.textContent = `Por: ${book.author}`;
            author.className = 'text-sm text-gray-600 dark:text-gray-400';
            textDiv.appendChild(author);
            
            bookInfoDiv.appendChild(textDiv);
            li.appendChild(bookInfoDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'flex items-center space-x-2';

            // Botón "Mover al Carrito"
            const moveToCartBtn = document.createElement('button');
            moveToCartBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            `;
            moveToCartBtn.title = 'Mover al carrito';
            moveToCartBtn.className = 'p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors';
            moveToCartBtn.onclick = () => moveWishlistItemToCart(book.id);
            actionsDiv.appendChild(moveToCartBtn);

            // Botón "Quitar de la Lista de Deseos"
            const removeFromWishlistBtn = document.createElement('button');
            removeFromWishlistBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            `;
            removeFromWishlistBtn.title = 'Quitar de la lista de deseos';
            removeFromWishlistBtn.className = 'p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors';
            removeFromWishlistBtn.onclick = () => toggleWishlistItemApp(book.id); // toggleWishlistItemApp se encarga de quitarlo
            actionsDiv.appendChild(removeFromWishlistBtn);

            li.appendChild(actionsDiv);
            ul.appendChild(li);
        } else {
            console.warn(`[app.js renderWishlist] Libro con ID: ${bookId} no encontrado en allBooks. Será omitido.`);
            // Opcionalmente, eliminar el ID de state.wishlist si el libro ya no existe
            // state.wishlist = state.wishlist.filter(id => id !== bookId);
            // localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
        }
    });
    wishlistContent.appendChild(ul);
    console.log("[app.js renderWishlist] Wishlist rendered with items:", state.wishlist.length);
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
        // Usar placeholder general para cart modal si no hay cover
        const cartCover = item.cover ? item.cover.replace('-L.jpg', '-S.jpg') : 'assets/books/placeholder.png'; 
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

/**
 * Añade o quita un libro de la lista de deseos.
 * @param {object|string} bookOrBookId - El objeto libro completo (desde book-details) o el api_id del libro (desde book-card).
 * @param {boolean} [fromDetailsPage=false] - True si la llamada proviene de la página de detalles del libro.
 */
async function toggleWishlistItemApp(bookOrBookId, fromDetailsPage = false) {
    let apiId, numericId, bookTitle;

    if (fromDetailsPage && typeof bookOrBookId === 'object' && bookOrBookId !== null) {
        apiId = bookOrBookId.id;
        numericId = bookOrBookId.numeric_id;
        bookTitle = bookOrBookId.title;
        // console.log(`[app.js toggleWishlistItemApp fromDetails] apiId: ${apiId}, numericId: ${numericId}`);
    } else if (!fromDetailsPage && typeof bookOrBookId === 'string') {
        apiId = bookOrBookId;
        const bookFromAllBooks = allBooks.find(b => b.id === apiId);
        if (bookFromAllBooks) {
            numericId = bookFromAllBooks.numeric_id;
            bookTitle = bookFromAllBooks.title;
        } else {
            console.error(`[app.js toggleWishlistItemApp fromCard] Libro con api_id '${apiId}' no encontrado en allBooks.`);
            showNotification('Error: Libro no encontrado.', 'error'); // Notificación de error
            return; 
        }
        // console.log(`[app.js toggleWishlistItemApp fromCard] apiId: ${apiId}, numericId: ${numericId}`);
    } else {
        console.error('[app.js toggleWishlistItemApp] Argumentos inválidos:', bookOrBookId, fromDetailsPage);
        showNotification('Error: No se pudo procesar la acción.', 'error'); // Notificación de error
        return;
    }

    if (!apiId) {
        console.error('[app.js toggleWishlistItemApp] No se pudo determinar el apiId del libro.');
        showNotification('Error: Identificador de libro no válido.', 'error'); // Notificación de error
        return;
    }

    const isInWishlist = state.wishlist.includes(apiId);
    const token = localStorage.getItem('authToken'); // <--- Corregido a authToken

    try {
        if (token) {
            if (!numericId) {
                console.error(`[app.js toggleWishlistItemApp] Usuario autenticado pero numericId no disponible para apiId: ${apiId}. No se puede llamar a la API.`);
                // Fallback a actualizar solo localmente si numericId no está, o mostrar error.
                // Por ahora, mostramos error y no procedemos con API call si numericId es esencial.
                showNotification('Error de datos del libro, no se pudo contactar al servidor.', 'error');
                // Considerar no continuar si la llamada a la API es crítica
            } else {
                if (isInWishlist) {
                    await removeFromWishlistAPI(numericId); 
                    // console.log(`[API] Libro ${numericId} (${bookTitle}) quitado de wishlist de usuario.`);
                } else {
                    await addToWishlistAPI(numericId);
                    // console.log(`[API] Libro ${numericId} (${bookTitle}) añadido a wishlist de usuario.`);
                }
            }
        }

        let message = '';
        if (isInWishlist) {
            state.wishlist = state.wishlist.filter(id => id !== apiId);
            message = `"${bookTitle || 'El libro'}" eliminado de tu lista de deseos.`;
        } else {
            state.wishlist.push(apiId);
            message = `"${bookTitle || 'El libro'}" añadido a tu lista de deseos.`;
        }
        localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
        // console.log(`[app.js toggleWishlistItemApp] Wishlist actualizada para ${apiId}. Nueva wishlist (local):`, state.wishlist);

        renderWishlist();
        updateBookCardVisualState(apiId, !isInWishlist);
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { bookId: apiId, isInWishlist: !isInWishlist } }));
        
        showNotification(message, 'success'); // <--- Notificación de éxito
        
    } catch (error) {
        console.error('Error al actualizar la lista de deseos:', error);
        showNotification(`Error al actualizar tu lista de deseos: ${error.message || 'Inténtalo de nuevo.'}`, 'error'); // <--- Notificación de error
    }
}
window.toggleWishlistItemApp = toggleWishlistItemApp; // Exponer globalmente

// Función auxiliar para actualizar una sola tarjeta de libro
// Esta función es ahora MENOS importante si updateAllBookCardWishlistStatus funciona bien
// y los book-card se actualizan con el cambio de atributo 'in-wishlist'.
// La dejamos por si se necesita para una actualización visual muy específica e inmediata no cubierta.
function updateBookCardVisualState(bookId, isNowInWishlist) {
    const card = document.querySelector(`book-card[id="${bookId}"]`); // Seleccionar por ID del book-card
    if (card) {
        card.setAttribute('in-wishlist', isNowInWishlist.toString());
        console.log(`[app.js] updateBookCardVisualState: Set in-wishlist=${isNowInWishlist} for book-card id=${bookId}`);
    } else {
        // console.warn(`[app.js] updateBookCardVisualState: Book card with id ${bookId} not found.`);
    }
    // No es necesario manipular el src del icono directamente aquí si el book-card lo hace en su render.
}

// --- NUEVA FUNCIÓN PARA MOSTRAR NOTIFICACIONES ---
function showNotification(message, type = 'success', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.warn('Contenedor de notificaciones no encontrado. Usando alert como fallback.');
        alert(message); 
        return;
    }

    const notification = document.createElement('div');
    notification.textContent = message;
    // Clases base y para animación de entrada inicial (fuera de la pantalla y transparente)
    notification.className = 'p-4 rounded-md shadow-lg text-white transition-all duration-500 ease-in-out transform translate-x-full opacity-0';

    if (type === 'success') {
        notification.classList.add('bg-green-500');
    } else if (type === 'error') {
        notification.classList.add('bg-red-500');
    } else if (type === 'info') {
        notification.classList.add('bg-blue-500');
    } else { // Default
        notification.classList.add('bg-gray-700');
    }

    container.appendChild(notification);

    // Forzar reflujo para asegurar que la animación de entrada se ejecute
    void notification.offsetWidth; 

    // Animación de entrada: mover a la posición y hacer visible
    requestAnimationFrame(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
        notification.classList.add('translate-x-0', 'opacity-100');
    });

    // Programar desaparición
    setTimeout(() => {
        // Animación de salida: mover fuera de la pantalla y hacer transparente
        notification.classList.remove('translate-x-0', 'opacity-100');
        notification.classList.add('translate-x-full', 'opacity-0'); // O a la dirección opuesta si prefieres

        // Eliminar del DOM después de que la animación de salida termine
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500); // Coincide con la duración de la transición CSS
    }, duration);
}

/**
 * Añade un libro al carrito.
 * @param {object} bookObject - El objeto libro completo con todas sus propiedades (incluyendo id, numeric_id, title, price, cover, stock).
 */
function addBookToCartApp(bookObject) {
    if (!bookObject || typeof bookObject !== 'object' || !bookObject.id) {
        console.error('[app.js addBookToCartApp] Objeto libro inválido:', bookObject);
        showNotification('Error: No se pudo añadir el libro al carrito (datos incompletos).', 'error');
        return;
    }

    const { id: apiId, title, price, cover, stock, numeric_id } = bookObject; 
    console.log(`[app.js addBookToCartApp] Intentando añadir: ${title} (apiId: ${apiId}, stock: ${stock})`);

    const authToken = localStorage.getItem('authToken');
    const existingItemInLocalState = state.cart.find(item => item.id === apiId);
    const numericPrice = parseFloat(price);
    const quantityUserWantsToAdd = 1; // Asumimos que cada acción de "añadir al carrito" es para 1 unidad.
                                    // Si tuvieras un input de cantidad, aquí usarías ese valor.

    // Verificación de stock antes de cualquier acción (local y antes de API)
    if (existingItemInLocalState) {
        if (existingItemInLocalState.quantity + quantityUserWantsToAdd > stock) {
            showNotification(`No puedes añadir más unidades de "${title}" (stock máximo: ${stock}).`, 'warning');
            return;
        }
    } else {
        if (quantityUserWantsToAdd > stock) {
            showNotification(`No hay suficiente stock para "${title}" (stock disponible: ${stock}).`, 'warning');
            return;
        }
    }

    if (authToken) {
        // Usuario logueado: llamar al backend para añadir y luego resincronizar
        console.log(`[app.js addBookToCartApp] Usuario logueado. Llamando a POST /api/cart para apiId: ${apiId}, quantity: ${quantityUserWantsToAdd}`);
        fetchWithAuth(`http://localhost:3000/api/cart`, {
            method: 'POST',
            body: JSON.stringify({ book_id: apiId, quantity: quantityUserWantsToAdd })
        })
        .then(response => response.json()) // fetchWithAuth debería haber manejado errores de red/status no-OK
        .then(data => {
            console.log('[app.js addBookToCartApp] Respuesta de POST /api/cart:', data);
            if (data.message) { // Asumiendo que el backend siempre devuelve un mensaje
                 showNotification(data.message, 'success'); // Usar mensaje del backend
            } else {
                 showNotification(`"${title}" procesado en el carrito.`, 'success');
            }
            fetchUserCart(); // <-- CLAVE: Resincronizar con el estado del backend
        })
        .catch(error => {
            console.error('Error al añadir libro al carrito (backend):', error);
            alert(error.message || 'Error al guardar el libro en el carrito.');
            fetchUserCart(); // Sincronizar incluso en error para asegurar consistencia
        });
    } else {
        // Usuario invitado: actualizar localmente y en localStorage (lógica optimista)
        if (existingItemInLocalState) {
            existingItemInLocalState.quantity += quantityUserWantsToAdd;
            console.log(`[app.js addBookToCartApp] Cantidad incrementada para ${title} (local). Nueva cantidad: ${existingItemInLocalState.quantity}`);
        } else {
            state.cart.push({ 
                id: apiId, 
                numeric_id: numeric_id, 
                title,
                price: !isNaN(numericPrice) ? numericPrice : 0, 
                cover: cover || 'assets/books/placeholder.png', 
                quantity: quantityUserWantsToAdd,
                stock: parseInt(stock, 10)
            });
            console.log(`[app.js addBookToCartApp] Libro ${title} añadido al carrito (local).`);
        }
        localStorage.setItem('cart', JSON.stringify(state.cart));
        renderCartModal();
        updateCartIcon();
        showNotification(`"${title}" añadido al carrito.`, 'success');
    }
}
window.addBookToCartApp = addBookToCartApp; // Exponer globalmente

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
       toggleWishlistItemApp(bookId); 
    }
    removeBookFromCart(bookId, true); 
    console.log(`Libro ID ${bookId} movido del carrito a la lista de deseos.`);
}

// NUEVA FUNCIÓN: Mover un item de la Wishlist al Carrito
async function moveWishlistItemToCart(bookId) {
    console.log(`[app.js moveWishlistItemToCart] Intentando mover libro con ID: ${bookId} de wishlist a carrito.`);
    const book = allBooks.find(b => b.id === bookId);

    if (book) {
        // 1. Añadir al carrito
        addBookToCartApp(book); // Esta función ya maneja la lógica de la API si es necesario y actualiza el estado local.

        // 2. Quitar de la wishlist
        // toggleWishlistItemApp se encarga de la lógica de quitar si ya está,
        // y también de la actualización con la API si está implementado.
        await toggleWishlistItemApp(bookId); 

        // 3. Actualizar vistas (renderWishlist es llamado por toggleWishlistItemApp, renderCartModal por addBookToCartApp)
        // No es necesario llamarlos explícitamente aquí si las funciones internas ya lo hacen.
        console.log(`[app.js moveWishlistItemToCart] Libro ${bookId} movido al carrito y eliminado de la wishlist.`);
    } else {
        console.error(`[app.js moveWishlistItemToCart] Libro con ID: ${bookId} no encontrado en allBooks.`);
    }
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

    // Listener para el formulario de búsqueda del header
    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevenir el envío tradicional del formulario
            const searchInput = document.getElementById('searchInput'); // Asumimos que el input tiene id="searchInput"
            if (searchInput) {
                const query = searchInput.value.trim();
                if (query) {
                    // Redirigir a la página de resultados de búsqueda
                    window.location.href = `search-results.html?query=${encodeURIComponent(query)}`;
                } else {
                    // Opcional: manejar el caso de búsqueda vacía, ej. focus en el input
                    searchInput.focus();
                }
            } else {
                console.error('Elemento con id "searchInput" no encontrado dentro del searchForm.');
            }
        });
    }

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
        toggleWishlistItemApp(e.detail.bookId);
    });

    document.addEventListener('add-to-cart', e => {
        const bookDetails = allBooks.find(b => b.id.toString() === e.detail.bookId.toString());
        if (bookDetails) {
            addBookToCartApp(bookDetails);
        } else {
            console.warn(`No se encontraron detalles del libro ${e.detail.bookId} para añadir al carrito desde el evento del custom element.`);
            // Podrías necesitar pasar más detalles en e.detail desde el custom element
            // o asegurar que allBooks siempre está completo.
            // El custom element <book-card> pasa: { bookId, title, price, cover, stock } en su evento add-to-cart
            // así que podemos usarlos directamente si el find falla.
            if(e.detail.title && e.detail.price !== undefined) { // Chequeo mínimo
        addBookToCartApp(
            {
                    id: e.detail.bookId,
                    title: e.detail.title,
                    price: parseFloat(e.detail.price),
                    cover: e.detail.cover,
                    stock: parseInt(e.detail.stock)
            }
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
    try {
        const response = await fetch(completeUrl, { ...options, headers });
        if (response.status === 401) { // Unauthorized
            console.warn('Token no válido o expirado. Deslogueando usuario.');
            logoutUser(); // Desloguear si el token es rechazado
            // Podríamos querer lanzar un error aquí o redirigir a login
            throw new Error('Unauthorized');
        }
        if (!response.ok && response.status !== 404) { // No tratar 404 como error fatal aquí, puede ser manejado por el llamador
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Error ${response.status}`);
        }
        return response; // Devolver la respuesta completa para que el llamador maneje .json() y errores específicos como 404
    } catch (error) {
        console.error('Error en fetchWithAuth:', error);
        throw error;
    }
}

async function fetchUserWishlist() {
    console.log("[app.js fetchUserWishlist] Called. REQUIERE REVISIÓN para asegurar que obtiene y almacena api_id.");
    // Esta función es para usuarios logueados. El backend /api/wishlist debe devolver los identificadores
    // de los libros en la wishlist del usuario. Idealmente, debería devolver los api_id (que el frontend usa como book.id).
    // Si solo devuelve IDs numéricos, necesitamos una forma de convertirlos a api_id (book.id) usando allBooks.
    try {
        const response = await fetchWithAuth('/api/wishlist');
        if (!response.ok) {
            state.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]'); // Fallback
            return;
        }
        const serverWishlistData = await response.json();
        if (serverWishlistData && Array.isArray(serverWishlistData.wishlist)) {
            // ASUMPCIÓN: serverWishlistData.wishlist CONTIENE items donde item.id o item.api_id es el api_id.
            // O si solo tiene el id numérico, ej item.book_id_numeric, necesitamos convertirlo.
            // Por ahora, asumimos que el backend de wishlist devuelve los mismos IDs que usa el frontend (book.id que es api_id)
            state.wishlist = serverWishlistData.wishlist.map(item => item.id || item.api_id).filter(Boolean);
            console.log("[app.js fetchUserWishlist] Wishlist del servidor procesada, state.wishlist:", JSON.stringify(state.wishlist));
        } else {
            state.wishlist = [];
        }
    } catch (error) {
        console.error('Error fetching user wishlist:', error);
        state.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]'); // Fallback
    }
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    updateAllBookCardWishlistStatus();
    renderWishlist();
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
}

function updateAllBookCardWishlistStatus() {
    console.log("[app.js updateAllBookCardWishlistStatus] Called. state.wishlist:", JSON.stringify(state.wishlist));
    document.querySelectorAll('book-card').forEach(card => {
        const cardId = card.getAttribute('id'); // es api_id (ej: "book-1")
        if (cardId) {
            const isInWishlist = state.wishlist.includes(cardId);
            card.setAttribute('in-wishlist', isInWishlist.toString());
        }
    });
}

// Convertir updateUserUI a async y llamar a await fetchUserCart()
async function updateUserUI() {
    const authToken = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('userData');
    
    if (!adminLinkMenu) {
        adminLinkMenu = document.getElementById('admin-link-menu');
    }

    if (authToken && userDataString) {
        const userData = JSON.parse(userDataString);
        if (userGreeting) {
            userGreeting.textContent = `Hola, ${userData.name || userData.nombre || 'Usuario'}!`;
            userGreeting.classList.remove('hidden');
            userGreeting.style.display = 'block';
        }
        if (loginLinkMenu) loginLinkMenu.style.display = 'none';
        if (registerLinkMenu) registerLinkMenu.style.display = 'none';
        
        if (profileLinkMenu) {
            profileLinkMenu.style.display = 'flex'; 
            profileLinkMenu.href = 'profile.html'; 
        }
        if (ordersLinkMenu) ordersLinkMenu.style.display = 'flex';
        if (logoutLinkMenu) logoutLinkMenu.style.display = 'flex';

        if (adminLinkMenu) {
            if (userData.rol === 'admin') {
                adminLinkMenu.style.display = 'flex';
                adminLinkMenu.classList.remove('hidden');
            } else {
                adminLinkMenu.style.display = 'none';
                adminLinkMenu.classList.add('hidden');
            }
        }

        if (userIcon) {
            userIcon.classList.remove('text-gray-400', 'hover:text-white');
            userIcon.classList.add('text-sky-400', 'hover:text-sky-300');
        }

        await fetchUserWishlist(); 
        await fetchUserCart(); // <<< LLAMADA AÑADIDA Y AWAIT
        console.log('User is logged in. UI updated. Wishlist and cart sync initiated.');

        // Estas renderizaciones deben ocurrir DESPUÉS de que wishlist y cart se hayan cargado
        updateAllBookCardWishlistStatus(); // Asegurar que esto se llame después de fetchUserWishlist
        updateCartIcon(); // Asegurar que esto se llame después de fetchUserCart
        renderWishlist(); // Asegurar que esto se llame después de fetchUserWishlist
        renderCartModal(); // Asegurar que esto se llame después de fetchUserCart

    } else {
        // Usuario deslogueado
        if (userGreeting) {
            userGreeting.textContent = '';
            userGreeting.classList.add('hidden');
            userGreeting.style.display = 'none';
        }
        if (loginLinkMenu) loginLinkMenu.style.display = 'flex';
        if (registerLinkMenu) registerLinkMenu.style.display = 'flex';
        if (profileLinkMenu) {
            profileLinkMenu.style.display = 'none';
            profileLinkMenu.href = '#';
        }
        if (ordersLinkMenu) ordersLinkMenu.style.display = 'none';
        if (logoutLinkMenu) logoutLinkMenu.style.display = 'none';
        if (adminLinkMenu) {
            adminLinkMenu.style.display = 'none';
            adminLinkMenu.classList.add('hidden');
        }
        if (userIcon) {
            userIcon.classList.remove('text-sky-400', 'hover:text-sky-300');
            userIcon.classList.add('text-gray-400', 'hover:text-white');
        }
        
        // Para invitado, wishlist y cart se cargan de localStorage al inicio.
        // Las funciones de renderizado usarán ese estado.
        state.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        state.cart = JSON.parse(localStorage.getItem('cart') || '[]');

        updateAllBookCardWishlistStatus(); 
        updateCartIcon(); 
        renderWishlist(); 
        renderCartModal(); 
        console.log('User is logged out or no token. UI updated for guest. Wishlist/cart from localStorage.');
    }
}

function clearUserSessionAndUI() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Limpiar la wishlist y el carrito del estado y de localStorage, ya que eran del usuario anterior.
    // El invitado usará una nueva wishlist/carrito de localStorage.
    state.wishlist = [];
    state.cart = []; // Asumiendo que el carrito también debe limpiarse
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    localStorage.setItem('cart', JSON.stringify(state.cart)); // Limpiar también el carrito
    
    console.log('User session cleared. Local wishlist/cart reset for guest state.');
    updateUserUI(); // Actualizar la UI para reflejar el estado de invitado
}

function logoutUser() {
    console.log('logoutUser called');
    // Eliminar el token y los datos del usuario del localStorage
    localStorage.removeItem('authToken'); // <--- Cambiado de 'token' a 'authToken'
    localStorage.removeItem('userData');   // <--- Añadido para limpiar userData

    // Opcional: Considerar si el carrito debe persistir o no para usuarios no logueados.
    // Si el carrito es específico del usuario y no debe persistir para invitados, límpialo también:
    // state.cart = [];
    // localStorage.removeItem('cart'); 
    // console.log('Cart cleared for guest state.');

    console.log('AuthToken y userData eliminados. Sesión cerrada localmente.');

    // Actualizar la UI para reflejar el estado de logout
    // updateUserUI() es llamada por clearUserSessionAndUI, pero llamarla aquí 
    // directamente asegura la actualización antes de la redirección si clearUserSessionAndUI no fuera llamada.
    // Sin embargo, es mejor centralizar la lógica. Llamaremos a clearUserSessionAndUI.
    
    clearUserSessionAndUI(); // Esta función ya llama a updateUserUI y limpia otros estados.

    // Redirigir a la página de inicio
    // Es importante que la redirección ocurra DESPUÉS de que localStorage se haya limpiado
    // y la UI (si es necesario en la página actual) se haya actualizado.
    window.location.href = 'index.html'; 
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
  console.log('[app.js renderBookCardsSlider] Iniciando. Buscando slider:', slider);
  if (!slider) {
    console.error('[app.js renderBookCardsSlider] Elemento con ID "book-cards-slider" NO encontrado en el DOM.');
    return;
  }
  slider.innerHTML = ''; // Limpiar por si acaso
  console.log('[app.js renderBookCardsSlider] Libros recibidos para el slider:', books);

  if (!books || books.length === 0) {
    console.warn('[app.js renderBookCardsSlider] No se recibieron libros o el array está vacío. El slider quedará vacío.');
    slider.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-300 py-4">No hay recomendaciones disponibles en este momento.</p>';
    return;
  }

  // Solo mostrar 4 libros (o menos si hay menos de 4)
  const booksToShow = books.slice(0, 4);
  console.log('[app.js renderBookCardsSlider] Libros a mostrar (después de slice):', booksToShow);

  booksToShow.forEach(book => {
    if (!book || !book.id) {
        console.warn('[app.js renderBookCardsSlider] Libro inválido o sin ID encontrado, saltando:', book);
        return; // Saltar este libro si es inválido
    }
    console.log("[app.js renderBookCardsSlider] Creando tarjeta para el libro:", book.title, book.id);
    const card = renderBookCard(book);
    slider.appendChild(card);
  });
  console.log('[app.js renderBookCardsSlider] Slider de recomendaciones renderizado con', booksToShow.length, 'tarjetas.');
}

// --- NUEVAS FUNCIONES DE API PARA WISHLIST ---
async function addToWishlistAPI(numericBookId) { 
    console.log(`[app.js addToWishlistAPI] Placeholder: Añadir libro con ID numérico ${numericBookId} a la API.`);
    // const token = localStorage.getItem('token');
    // if (!token) throw new Error('Usuario no autenticado');
    // const response = await fetchWithAuth(`/api/wishlist/${numericBookId}`, { method: 'POST' });
    // if (!response.ok) throw new Error('Error al añadir a la wishlist en API');
    // return await response.json(); 
    return Promise.resolve({ message: "Libro añadido a wishlist (API)" }); // Placeholder
}

async function removeFromWishlistAPI(numericBookId) { 
    console.log(`[app.js removeFromWishlistAPI] Placeholder: Quitar libro con ID numérico ${numericBookId} de la API.`);
    // const token = localStorage.getItem('token');
    // if (!token) throw new Error('Usuario no autenticado');
    // const response = await fetchWithAuth(`/api/wishlist/${numericBookId}`, { method: 'DELETE' });
    // if (!response.ok) throw new Error('Error al quitar de la wishlist en API');
    // return await response.json(); 
    return Promise.resolve({ message: "Libro quitado de wishlist (API)" }); // Placeholder
}

// NUEVA FUNCIÓN FETCHUSERCART
async function fetchUserCart() {
    console.log("[app.js fetchUserCart] Called to sync cart from backend.");
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.log("[app.js fetchUserCart] No auth token, cart will remain local (from localStorage).");
        // Para un invitado, el carrito ya está cargado desde localStorage al inicio.
        // Aseguramos que la UI se renderice con el estado actual.
        state.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        updateCartIcon();
        renderCartModal();
        return;
    }

    try {
        const response = await fetchWithAuth('/api/cart'); // GET request por defecto
        if (!response.ok) {
            if (response.status === 401) {
                // fetchWithAuth ya maneja el logoutUser si hay 401
                console.warn('[app.js fetchUserCart] Unauthorized (401) fetching cart. Logout should have been triggered.');
                // Si el logout no limpió el carrito, lo hacemos aquí para reflejar un estado vacío post-error.
                state.cart = []; 
            } else {
                console.error(`[app.js fetchUserCart] Error fetching cart from backend: ${response.status}`);
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from fetchUserCart' }));
                console.error('[app.js fetchUserCart] Error data:', errorData);
                // En caso de otros errores (ej. 500), podríamos mantener el carrito local como fallback
                // o limpiarlo, dependiendo de la UX deseada. Por ahora, lo mantenemos.
                // state.cart = JSON.parse(localStorage.getItem('cart') || '[]'); 
            }
        } else {
            const backendCartItems = await response.json();
            console.log("[app.js fetchUserCart] Cart data from backend:", JSON.stringify(backendCartItems));

            if (Array.isArray(backendCartItems)) {
                // El backend ahora devuelve objetos de carrito completos gracias a los cambios en cartController.js
                state.cart = backendCartItems.map(item => ({
                    ...item, // Copia todas las propiedades devueltas por el backend
                    price: parseFloat(item.price) || 0, // Asegurar que el precio sea número
                    stock: parseInt(item.stock) || 0    // Asegurar que el stock sea número
                }));
                console.log("[app.js fetchUserCart] state.cart updated from backend:", JSON.stringify(state.cart));
            } else {
                console.error("[app.js fetchUserCart] Cart data from backend is not an array:", backendCartItems);
                state.cart = []; // Resetear si el formato es incorrecto
            }
        }
    } catch (error) {
        console.error('[app.js fetchUserCart] Critical error in fetchUserCart (e.g., network issue, or error in fetchWithAuth not caught as response.ok):_ ', error);
        // Si fetchWithAuth lanza un error (ej. Unauthorized que no fue response.status 401), puede ser capturado aquí.
        // Si el error es 'Unauthorized', logoutUser ya se habrá llamado.
        // Para otros errores, decidimos si limpiar el carrito o mantener el local.
        // Por ahora, como fallback conservador, si state.cart no fue limpiado por un logout:
        // state.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        // Pero es más seguro limpiar si hay un error grave y el usuario está supuestamente logueado.
        if (localStorage.getItem('authToken')) { // Solo limpiar si se esperaba un carrito de backend
            state.cart = []; 
        }
    }
    
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartIcon();
    renderCartModal(); 
    // Disparar un evento global por si otros componentes necesitan reaccionar.
    // Nota: Ya existe un evento 'cartUpdated'. Considerar si es el mismo o uno nuevo.
    // window.dispatchEvent(new CustomEvent('cartRefreshedFromBackend', { detail: { cart: state.cart } }));
}

// Exponer funciones clave globalmente si es necesario para otros scripts como book-details.js
window.getStateApp = () => JSON.parse(JSON.stringify(state)); // Devuelve una copia para evitar mutación externa directa
