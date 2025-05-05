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
    // recommendations: JSON.parse(localStorage.getItem('recommendations') || '{}')
};

// Elementos del DOM relacionados al Header y Wishlist Modal
let themeToggle, wishlistModal, closeWishlist;
let contactIcon, contactModal, closeContactModal; // Añadidas variables para contacto
// Eliminadas variables: optionsIcon, optionsMenuContainer, favoritesLink

// Inicialización
function init() {
    // Seleccionar elementos del DOM para Header y Wishlist Modal
    themeToggle = document.getElementById('theme-toggle');
    wishlistModal = document.getElementById('wishlist-modal');
    closeWishlist = document.getElementById('close-wishlist');
    contactIcon = document.getElementById('contact-icon'); // Selección icono contacto
    contactModal = document.getElementById('contact-modal'); // Selección modal contacto
    closeContactModal = document.getElementById('close-contact-modal'); // Selección botón cerrar contacto
    // Eliminadas selecciones: optionsIcon, optionsMenuContainer, favoritesLink
    
    console.log('INIT: Header/Modal Elements Selected:', { themeToggle, wishlistModal, contactIcon, contactModal });

    applyTheme(); // Aplicar tema inicial
    setupEventListeners(); // Configurar listeners restantes
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
    [wishlistModal, contactModal].forEach(modal => {
        if (modal) {
            modal.addEventListener("click", e => {
                if (e.target === modal) { // Si el clic es directamente en el dialog (backdrop)
                    modal.close();
                }
            });
        }
    });

    // Prevenir que el click dentro de los formularios cierre el menú
    // Eliminada línea para optionsMenuContainer

    // Listener para añadir/quitar de wishlist desde la tarjeta (COMENTADO temporalmente)
    /*
    document.addEventListener('toggle-wishlist', (e) => {
        const bookId = e.detail.bookId;
        toggleWishlistItem(bookId);
        // Actualizar botón en la tarjeta específica (no hay tarjetas ahora)
    });
    */
}

// Función para añadir/quitar de la lista de deseos (se mantiene)
function toggleWishlistItem(bookId) {
    const index = state.wishlist.indexOf(bookId);
    if (index === -1) {
        state.wishlist.push(bookId);
    } else {
        state.wishlist.splice(index, 1);
    }
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    renderWishlist(); // Actualizar modal si está abierto
}

// Renderizar wishlist (versión mínima)
function renderWishlist() {
    const wishlistContent = document.getElementById('wishlist-content');
    if (wishlistContent) {
        wishlistContent.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-400">Tu lista de deseos está vacía.</p>';
        // Aquí iría la lógica para renderizar los items cuando los restauremos
        console.log('Rendering wishlist (currently empty).');
    } else {
        console.error('Wishlist content container not found!');
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