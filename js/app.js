// Estado de la aplicación (simplificado)
const state = {
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]'),
    // isLoggedIn: false // Eliminado estado de login
    // currentCategory: 'all',
    // currentBook: null,
    // currentPage: 1,
    // booksPerPage: 8,
    // sortBy: 'title',
    // sortOrder: 'asc',
    // reviews: JSON.parse(localStorage.getItem('reviews') || '{}'),
    // bookmarks: JSON.parse(localStorage.getItem('bookmarks') || '{}'),
    // recommendations: JSON.parse(localStorage.getItem('recommendations') || '{}'),
    // Cart (nuevo estado para el carrito, se guardará en localStorage)
    cart: JSON.parse(localStorage.getItem('cart') || '[]'), 
};

// Elementos del DOM relacionados al Header y Wishlist Modal
let themeToggle, wishlistModal, closeWishlist;
let contactIcon, contactModal, closeContactModal; // Añadidas variables para contacto
let cartIcon; // Icono del carrito en el header
let wishlistHeaderIcon; // Nuevo icono para la lista de deseos en el header
let cartModal, closeCartModalBtn, cartItemsContainer, goToCheckoutBtn, cartCountBadge, cartTotalPrice;
let emptyCartBtn; // Nuevo botón
// Eliminadas variables: optionsIcon, optionsMenuContainer, favoritesLink

// Datos de ejemplo para libros
const sampleBooks = [
    {
        id: '1',
        title: 'Cien Años de Soledad',
        author: 'Gabriel García Márquez',
        cover: 'https://covers.openlibrary.org/b/id/8267140-L.jpg',
        price: 19.99,
        stock: 150,
        year: '1967',
        category: 'Realismo Mágico',
        rating: '4.5',
        pages: '417',
        language: 'Español'
    },
    {
        id: '2',
        title: 'Don Quijote de la Mancha',
        author: 'Miguel de Cervantes',
        cover: 'https://covers.openlibrary.org/b/id/7986247-L.jpg',
        price: 22.50,
        stock: 75, // Para probar "¡ÚLTIMAS UNIDADES!"
        year: '1605',
        category: 'Clásico',
        rating: '4.7',
        pages: '863',
        language: 'Español'
    },
    {
        id: '3',
        title: 'El Principito',
        author: 'Antoine de Saint-Exupéry',
        cover: 'https://covers.openlibrary.org/b/id/10064702-L.jpg',
        price: 12.00,
        stock: 0, // Para probar "NO QUEDAN UNIDADES"
        year: '1943',
        category: 'Infantil',
        rating: '4.8',
        pages: '96',
        language: 'Francés'
    },
    {
        id: '4',
        title: '1984',
        author: 'George Orwell',
        cover: 'https://covers.openlibrary.org/b/id/8274540-L.jpg',
        price: 15.75,
        stock: 5,
        year: '1949',
        category: 'Distopía',
        rating: '4.6',
        pages: '328',
        language: 'Inglés'
    },
    {
        id: '5',
        title: 'Matar un Ruiseñor',
        author: 'Harper Lee',
        cover: 'https://covers.openlibrary.org/b/id/8362311-L.jpg',
        price: 18.20,
        stock: 30, // Para probar "¡ÚLTIMAS UNIDADES!"
        year: '1960',
        category: 'Ficción Clásica',
        rating: '4.4',
        pages: '281',
        language: 'Inglés'
    }
];

// Inicialización
function init() {
    // Seleccionar elementos del DOM para Header y Wishlist Modal
    themeToggle = document.getElementById('theme-toggle');
    wishlistModal = document.getElementById('wishlist-modal');
    closeWishlist = document.getElementById('close-wishlist');
    contactIcon = document.getElementById('contact-icon'); // Selección icono contacto
    contactModal = document.getElementById('contact-modal'); // Selección modal contacto
    closeContactModal = document.getElementById('close-contact-modal'); // Selección botón cerrar contacto
    cartIcon = document.getElementById('cart-icon');
    wishlistHeaderIcon = document.getElementById('wishlist-header-icon'); // Seleccionar nuevo icono
    
    // Elementos del nuevo modal del carrito
    cartModal = document.getElementById('cart-modal');
    closeCartModalBtn = document.getElementById('close-cart-modal');
    cartItemsContainer = document.getElementById('cart-items-container');
    goToCheckoutBtn = document.getElementById('go-to-checkout-btn');
    cartCountBadge = document.getElementById('cart-count-badge');
    cartTotalPrice = document.getElementById('cart-total-price');
    emptyCartBtn = document.getElementById('empty-cart-btn'); // Seleccionar botón

    console.log('INIT: Header/Modal Elements Selected:', { themeToggle, wishlistModal, contactIcon, contactModal, wishlistHeaderIcon });

    applyTheme(); // Aplicar tema inicial
    setupEventListeners(); // Configurar listeners restantes
    renderRecommendedBooks(sampleBooks);
    renderWishlist(); // Para inicializar el modal de wishlist vacío si es necesario
    updateCartIcon(); // Para mostrar el contador de items en el carrito al cargar
    renderCartModal(); // Inicializar el contenido del modal del carrito (estará vacío al inicio)
    console.log('INIT: Basic initialization complete (Header only).');
}

// Aplicar tema
function applyTheme() {
    document.body.classList.toggle('dark', state.isDarkMode);
}

// Configurar event listeners
function setupEventListeners() {
    // Toggle tema oscuro
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            state.isDarkMode = !state.isDarkMode;
            localStorage.setItem('darkMode', state.isDarkMode);
            applyTheme();
        });
    } else {
        console.error('Theme toggle button not found!');
    }

    // Abrir modal de lista de deseos desde el icono del header (NUEVO)
    if (wishlistHeaderIcon && wishlistModal) {
        wishlistHeaderIcon.addEventListener('click', () => {
            console.log('Wishlist header icon clicked - Showing wishlist modal');
            renderWishlist(); // Asegurarse que el contenido está actualizado antes de mostrar
            wishlistModal.showModal();
        });
    }

    // Cerrar wishlist modal
    if (closeWishlist && wishlistModal) {
        closeWishlist.addEventListener('click', () => {
            wishlistModal.close();
        });
    } else {
        console.error('Close wishlist button or wishlist modal not found!');
    }

    // Abrir Modal Contacto
    if (contactIcon && contactModal) {
        contactIcon.addEventListener('click', () => {
            console.log('Contact icon clicked - Showing contact modal');
            contactModal.showModal();
        });
    } else {
        console.error('Contact icon or contact modal not found!');
    }

    // Cerrar Modal Contacto
    if (closeContactModal && contactModal) {
        closeContactModal.addEventListener('click', () => {
            contactModal.close();
        });
    } else {
        console.error('Close contact button or contact modal not found!');
    }

    // Cerrar modal haciendo clic en el backdrop (opcional, para ambos modales)
    [wishlistModal, contactModal, cartModal].forEach(modal => {
        if (modal) {
            modal.addEventListener("click", e => {
                if (e.target === modal) { // Si el clic es directamente en el dialog (backdrop)
                    modal.close();
                }
            });
        }
    });

    // Event listeners para las tarjetas de libro
    document.addEventListener('view-book-details', (e) => {
        console.log('Evento view-book-details:', e.detail);
        // Aquí iría la lógica para mostrar una vista detallada del libro
        alert(`Ver detalles del libro ID: ${e.detail.bookId}`); 
    });

    document.addEventListener('toggle-wishlist', (e) => {
        console.log('Evento toggle-wishlist:', e.detail);
        toggleWishlistItem(e.detail.bookId);
        // TODO: Actualizar el estado visual del icono wishlist en la tarjeta específica si es necesario
    });

    document.addEventListener('add-to-cart', (e) => {
        console.log('Evento add-to-cart:', e.detail);
        addBookToCart(e.detail.bookId, e.detail.title, parseFloat(e.detail.price), e.detail.cover, parseInt(e.detail.stock));
    });
    
    // Listener para el icono del carrito en el header (para abrir el modal del carrito)
    if (cartIcon && cartModal) {
        cartIcon.addEventListener('click', () => {
            renderCartModal(); // Asegurar que el contenido esté actualizado
            cartModal.showModal();
        });
    }

    // Listeners para el nuevo modal del carrito
    if (closeCartModalBtn && cartModal) {
        closeCartModalBtn.addEventListener('click', () => cartModal.close());
    }
    if (goToCheckoutBtn) {
        goToCheckoutBtn.addEventListener('click', () => {
            cartModal.close(); // Cerrar modal antes de redirigir
            window.location.href = 'checkout.html'; // Redirigir a la página de checkout
        });
    }

    if (emptyCartBtn) {
        emptyCartBtn.addEventListener('click', () => emptyCart()); // Listener para vaciar carrito
    }

    // Prevenir que el click dentro de los formularios cierre el menú
    // Eliminada línea para optionsMenuContainer
}

// Función para añadir/quitar de la lista de deseos (se mantiene)
function toggleWishlistItem(bookId) {
    const index = state.wishlist.indexOf(bookId);
    if (index === -1) {
        state.wishlist.push(bookId);
        console.log(`Libro ID ${bookId} añadido a la wishlist.`);
    } else {
        state.wishlist.splice(index, 1);
        console.log(`Libro ID ${bookId} eliminado de la wishlist.`);
    }
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    renderWishlist(); // Actualizar modal si está abierto
}

// Renderizar wishlist (versión mínima)
function renderWishlist() {
    const wishlistContent = document.getElementById('wishlist-content');
    if (wishlistContent) {
        if (state.wishlist.length === 0) {
            wishlistContent.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-400">Tu lista de deseos está vacía.</p>';
            return;
        }

        wishlistContent.innerHTML = ''; // Limpiar contenido anterior
        // Crear y añadir elementos para cada libro en la wishlist (simplificado)
        state.wishlist.forEach(bookId => {
            const book = sampleBooks.find(b => b.id === bookId); // Encontrar el libro en nuestros datos de ejemplo
            if (book) {
                const item = document.createElement('div');
                item.className = 'p-2 border rounded flex items-center justify-between dark:text-gray-200 dark:border-gray-600';
                item.innerHTML = `<span>${book.title}</span> <button data-book-id="${bookId}" class="remove-wishlist-item text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 p-1">X</button>`;
                wishlistContent.appendChild(item);
            }
        });
        // Añadir listeners para los botones de eliminar de la wishlist modal
        wishlistContent.querySelectorAll('.remove-wishlist-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const bookIdToRemove = e.target.dataset.bookId;
                toggleWishlistItem(bookIdToRemove);
            });
        });
    } else {
        console.error('Wishlist content container not found!');
    }
}

// Funciones del Carrito (nuevas)
function addBookToCart(bookId, title, price, cover, stock) {
    const existingBook = state.cart.find(item => item.id === bookId);
    if (existingBook) {
        if (existingBook.quantity < stock) {
           existingBook.quantity += 1;
        } else {
            alert(`No puedes añadir más de ${title}, ¡stock agotado!`);
            return;
        }
    } else {
        state.cart.push({ id: bookId, title, price, cover, stock, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartIcon();
    renderCartModal();
}

function updateCartIcon() {
    const cartItemCount = state.cart.reduce((total, item) => total + item.quantity, 0);
    if (cartIcon) {
        cartIcon.title = `Mi Compra (${cartItemCount} items)`;
    }
    if (cartCountBadge) {
        cartCountBadge.textContent = cartItemCount;
        cartCountBadge.style.display = cartItemCount > 0 ? 'flex' : 'none';
    }
    console.log("Cart icon updated, count: ", cartItemCount);
}

function renderCartModal() {
    if (!cartItemsContainer || !cartTotalPrice) return;

    let totalPrice = 0;
    cartItemsContainer.innerHTML = ''; // Limpiar items anteriores

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

        // Usar una portada más pequeña para el carrito, si está disponible (ej. Open Library -S.jpg)
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

    // Añadir listeners para los botones de eliminar items del carrito modal
    cartItemsContainer.querySelectorAll('.minus-qty-btn').forEach(b => b.addEventListener('click', e => decreaseCartItemQuantity(e.currentTarget.dataset.bookId)));
    cartItemsContainer.querySelectorAll('.plus-qty-btn').forEach(b => b.addEventListener('click', e => increaseCartItemQuantity(e.currentTarget.dataset.bookId)));
    cartItemsContainer.querySelectorAll('.remove-cart-item-btn').forEach(b => b.addEventListener('click', e => removeBookFromCart(e.currentTarget.dataset.bookId, true)));
    cartItemsContainer.querySelectorAll('.move-to-wishlist-btn').forEach(b => b.addEventListener('click', e => moveCartItemToWishlist(e.currentTarget.dataset.bookId)));
}

function increaseCartItemQuantity(bookId) {
    const item = state.cart.find(i => i.id === bookId);
    if (item && item.quantity < item.stock) {
        item.quantity++;
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartIcon();
        renderCartModal();
    } else if (item && item.quantity >= item.stock) {
        alert(`No puedes añadir más unidades de "${item.title}". Stock máximo alcanzado.`);
    }
}

function decreaseCartItemQuantity(bookId) {
    const item = state.cart.find(i => i.id === bookId);
    if (item && item.quantity > 1) {
        item.quantity--;
    } else if (item && item.quantity === 1) {
        removeBookFromCart(bookId, true);
        return;
    }
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartIcon();
    renderCartModal();
}

function removeBookFromCart(bookId, removeAll = false) {
    const bookIndex = state.cart.findIndex(item => item.id === bookId);
    if (bookIndex > -1) {
        if (removeAll || state.cart[bookIndex].quantity === 1) {
            state.cart.splice(bookIndex, 1);
        } else {
            state.cart[bookIndex].quantity -= 1;
        }
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartIcon();
        renderCartModal();
    }
}

function moveCartItemToWishlist(bookId) {
    const itemInCart = state.cart.find(i => i.id === bookId);
    if (!itemInCart) return;

    // Añadir a wishlist (toggleWishlistItem maneja duplicados)
    toggleWishlistItem(bookId);
    // Eliminar todas las unidades del carrito
    removeBookFromCart(bookId, true);
    console.log(`Libro ID ${bookId} movido del carrito a la lista de deseos.`);
}

function emptyCart() {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        state.cart = [];
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartIcon();
        renderCartModal();
    }
}

// --- FUNCIONES ELIMINADAS O COMENTADAS --- 
// - setupFilters
// - renderBooks (la original)
// - renderPagination
// - addReview, deleteReview, renderBookReviews, showReviewForm
// - saveBookmark, updateBookmarkUI, saveBookmarkNotes, openBookReader
// - calculateBookScore, updateUserPreferences, generateRecommendations, renderRecommendations
// - Datos: categories, books

// Inicializar la aplicación DESPUÉS de que el DOM esté cargado
document.addEventListener('DOMContentLoaded', init); 

function renderRecommendedBooks(books) {
    const recommendationsContainer = document.querySelector('#recomendaciones .grid');
    if (!recommendationsContainer) {
        console.error('Contenedor de recomendaciones no encontrado.');
        return;
    }
    recommendationsContainer.innerHTML = ''; // Limpiar placeholders

    books.forEach(book => {
        const card = document.createElement('book-card');
        card.setAttribute('id', book.id);
        card.setAttribute('title', book.title);
        card.setAttribute('author', book.author);
        card.setAttribute('cover', book.cover);
        card.setAttribute('price', book.price);
        card.setAttribute('stock', book.stock);
        if (book.year) card.setAttribute('year', book.year);
        if (book.category) card.setAttribute('category', book.category);
        if (book.rating) card.setAttribute('rating', book.rating);
        if (book.pages) card.setAttribute('pages', book.pages);
        if (book.language) card.setAttribute('language', book.language);
        recommendationsContainer.appendChild(card);
    });
} 