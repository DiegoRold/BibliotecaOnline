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
    const apiUrl = 'https://books-foniuhqsba-uc.a.run.app/';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();

        // Filtrar "Cien años de soledad" de los datos ANTES de mapear
        data = data.filter(book => 
            !book.title || book.title.toLowerCase() !== 'cien años de soledad'
        );

        // Mapear datos y construir la URL de la portada localmente
        return data.map((book, index) => {
            const bookId = `book-${index}`;
            const rawTitle = book.title || 'untitled'; // title ya debería existir por el filtro, pero por seguridad.

            // Normalizar el título para el nombre del archivo
            const filename = rawTitle
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos y diacríticos
                .replace(/ñ/g, 'n') // Asegurar que la ñ se convierte a n
                .replace(/\s+/g, '-') // Reemplazar espacios con guiones
                .replace(/[^a-z0-9-()]/g, ''); // Eliminar caracteres no alfanuméricos excepto guiones y paréntesis
            
            return {
                ...book,
                id: bookId,
                cover: `assets/books/${filename}.jpg` // Ruta local a la imagen
            };
        });
    } catch (error) {
        console.error("Error fetching books:", error);
        // Considerar si mostrar un mensaje más amigable al usuario aquí también
        throw error; // Re-lanzar error para que init() lo maneje
    }
}


// --- RENDERIZADO ---
function applyTheme() { document.body.classList.toggle('dark', state.isDarkMode); }

function renderSliderImages(books) {
    if (!sliderTrack) return;
    sliderTrack.innerHTML = ''; 
    const placeholderUrl = 'assets/placeholder-cover.png';

    // Filtrar "Cien años de soledad" de la lista de libros para el slider
    const booksWithoutCienAnos = books.filter(book => 
        !book.title || book.title.toLowerCase() !== 'cien años de soledad'
    );

    const booksForSlider = booksWithoutCienAnos.slice(0, 12); // Tomar los primeros 12 de la lista filtrada

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
    wishlistContent.innerHTML = state.wishlist.length === 0 ? '<p class="col-span-full text-center text-gray-500 dark:text-gray-400">Tu lista de deseos está vacía.</p>' : '';
    if (state.wishlist.length > 0) {
        state.wishlist.forEach(bookId => {
            const book = allBooks.find(b => b.id === bookId); // Buscar en allBooks
            if (book) {
                const item = document.createElement('div');
                item.className = 'p-2 border rounded flex items-center justify-between dark:text-gray-200 dark:border-gray-600';
                item.innerHTML = `<span>${book.title}</span> <button data-book-id="${bookId}" class="remove-wishlist-item text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 p-1">X</button>`;
                wishlistContent.appendChild(item);
            } else {
                 // Opcional: manejar caso si el libro ya no existe en allBooks
                 console.warn(`Libro con ID ${bookId} en wishlist pero no encontrado en allBooks.`);
            }
        });
        wishlistContent.querySelectorAll('.remove-wishlist-item').forEach(button => button.addEventListener('click', e => toggleWishlistItem(e.target.dataset.bookId)));
    }
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
    const index = state.wishlist.indexOf(bookId);
    if (index === -1) {
        state.wishlist.push(bookId);
    } else {
        state.wishlist.splice(index, 1);
    }
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    renderWishlist();

    // Actualizar el estado visual de todas las tarjetas de libro correspondientes
    const isInWishlist = state.wishlist.includes(bookId);
    document.querySelectorAll(`book-card[id="${bookId}"]`).forEach(cardElement => {
        cardElement.setAttribute('in-wishlist', isInWishlist.toString());
    });
}

function addBookToCart(bookId, title, price, cover, stock) {
    const existingBook = state.cart.find(item => item.id === bookId);
    const currentStock = stock || 0; // Asegurar que stock es un número

    if (existingBook) {
        // Usa el stock original guardado en el carrito para comparar
        if (existingBook.quantity < existingBook.stock) {
           existingBook.quantity += 1;
        } else {
            alert(`No puedes añadir más unidades de "${title}". Stock máximo (${existingBook.stock}) alcanzado.`);
            return;
        }
    } else {
        // Solo añadir si hay stock inicial
        if (currentStock > 0) {
             // Guardar stock original al añadir por primera vez
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

function increaseCartItemQuantity(bookId) {
    const item = state.cart.find(i => i.id === bookId);
    // Usar item.stock (stock original guardado) para validar
    if (item && item.quantity < item.stock) {
        item.quantity++;
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartIcon();
        renderCartModal();
    } else if (item) {
        alert(`No puedes añadir más unidades de "${item.title}". Stock máximo (${item.stock}) alcanzado.`);
    }
}

function decreaseCartItemQuantity(bookId) {
    const itemIndex = state.cart.findIndex(i => i.id === bookId); // Necesitamos index para splice
    if (itemIndex > -1) {
        if (state.cart[itemIndex].quantity > 1) {
            state.cart[itemIndex].quantity--;
             localStorage.setItem('cart', JSON.stringify(state.cart));
             updateCartIcon();
             renderCartModal();
        } else {
            // Si la cantidad es 1, eliminar completamente
            removeBookFromCart(bookId, true);
        }
    }
}

function removeBookFromCart(bookId, removeAll = false) { // removeAll siempre será true aquí
    state.cart = state.cart.filter(item => item.id !== bookId);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartIcon();
    renderCartModal();
}

function moveCartItemToWishlist(bookId) {
    const itemInCart = state.cart.find(i => i.id === bookId);
    if (!itemInCart) return;
    if (!state.wishlist.includes(bookId)) { // Añadir solo si no está ya
       toggleWishlistItem(bookId); // Esto ya actualiza localStorage y renderWishlist
    }
    removeBookFromCart(bookId, true); // Esto actualiza localStorage, cart icon y cart modal
    console.log(`Libro ID ${bookId} movido del carrito a la lista de deseos.`);
}

function emptyCart() {
    if (state.cart.length > 0 && confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        state.cart = [];
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartIcon();
        renderCartModal();
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

    // Cerrar modales con click en backdrop
    [wishlistModal, contactModal, cartModal].forEach(modal => { if (modal) modal.addEventListener("click", e => { if (e.target === modal) modal.close(); }); });

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

// --- INICIALIZAR ---
document.addEventListener('DOMContentLoaded', init);
