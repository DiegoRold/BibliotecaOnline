document.addEventListener('DOMContentLoaded', () => {
    const rawBookId = new URLSearchParams(window.location.search).get('id');
    let bookId = rawBookId;

    if (bookId) {
        if (bookId.includes(':')) {
            console.warn(`El ID del libro "${rawBookId}" (antes de procesar ':') contiene caracteres adicionales. Se usará solo la parte antes de ':'. ID procesado: "${bookId.split(':')[0]}"`);
            bookId = bookId.split(':')[0];
        }

        if (bookId.startsWith('book-')) {
            const numericPart = bookId.substring('book-'.length);
            if (/^\d+$/.test(numericPart) && numericPart !== '') {
                console.warn(`El ID del libro (original: "${rawBookId}", procesado actual: "${bookId}") tiene el prefijo "book-". Se usará la parte numérica: "${numericPart}" para la API.`);
                bookId = numericPart;
            } else {
                console.error(`El ID del libro (original: "${rawBookId}", procesado actual: "${bookId}") tiene un formato "book-" inválido después del prefijo. No se pudo extraer un ID numérico. Se usará "${bookId}" para la API, lo que podría causar un error.`);
            }
        }
    }

    // Elementos del DOM para rellenar (los que son específicos de la página de detalles)
    const coverImg = document.getElementById('book-cover-img');
    const titleEl = document.getElementById('book-title');
    const authorEl = document.getElementById('book-author');
    const descriptionEl = document.getElementById('book-description');
    const categoriesEl = document.getElementById('book-categories');
    const yearEl = document.getElementById('book-year');
    const publisherEl = document.getElementById('book-publisher');
    const isbnEl = document.getElementById('book-isbn');
    const pagesEl = document.getElementById('book-pages');
    const languageEl = document.getElementById('book-language');
    const ratingEl = document.getElementById('book-rating');
    const stockEl = document.getElementById('book-stock');
    const priceEl = document.getElementById('book-price');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const toggleWishlistBtn = document.getElementById('toggle-wishlist-btn');
    const wishlistIcon = document.getElementById('wishlist-icon-details');
    const outOfStockMessage = document.getElementById('out-of-stock-message');

    // La lógica del tema y la actualización de los badges del header ahora son manejadas por app.js,
    // que se carga antes que este script.

    let currentBook = null; 

    // Función de ayuda para normalizar el título del libro para la URL de la imagen
    function normalizeBookTitleForImage(title) {
        if (!title) return 'default'; // Si no hay título, usa un nombre por defecto
        return title.toLowerCase()
            .replace(/[áäâà]/g, 'a')
            .replace(/[éëêè]/g, 'e')
            .replace(/[íïîì]/g, 'i')
            .replace(/[óöôò]/g, 'o')
            .replace(/[úüûù]/g, 'u')
            .replace(/[ñ]/g, 'n')
            .replace(/[^a-z0-9_]/g, '-') // Reemplaza caracteres no alfanuméricos (excepto _) por guiones
            .replace(/-+/g, '-') // Reemplaza múltiples guiones por uno solo
            .replace(/^-+|-+$/g, ''); // Elimina guiones al principio y al final
    }

    if (!bookId) {
        document.getElementById('book-details-container').innerHTML = '<p class="text-red-500 text-center">No se especificó un ID de libro válido.</p>';
        return;
    }

    async function fetchBookDetails() {
        try {
            const response = await fetch(`http://localhost:3000/api/libros/${bookId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Libro no encontrado.');
                } else {
                    throw new Error(`Error del servidor: ${response.status}`);
                }
            }
            const book = await response.json();
            currentBook = book; // Guardar el libro actual
            renderBookDetails(book);
            setupActionButtons(book);
        } catch (error) {
            console.error('Error al obtener detalles del libro:', error);
            document.getElementById('book-details-container').innerHTML = `<p class="text-red-500 text-center">Error al cargar los detalles del libro: ${error.message}</p>`;
        }
    }

    function renderBookDetails(book) {
        document.title = `${book.title || 'Detalles del Libro'} - Entre Hojas`; // Actualizar título de la página
        
        let coverSrc = 'assets/books/placeholder.png'; // Imagen por defecto inicial
        if (book.cover && (book.cover.startsWith('http://') || book.cover.startsWith('https://'))) {
            coverSrc = book.cover;
        } else if (book.title) {
            // Caso especial para "Cien años de soledad"
            if (book.title.toLowerCase().includes('cien años de soledad')) {
                coverSrc = 'assets/books/cien-anos-de-soledad-(edicion-revisada).png';
            } else {
                const normalizedTitle = normalizeBookTitleForImage(book.title);
                coverSrc = `assets/books/${normalizedTitle}.png`;
            }
        }
        
        coverImg.src = coverSrc;
        coverImg.alt = book.title || 'Portada';
        coverImg.onerror = function() {
            this.style.display = 'none'; // Ocultar si la imagen no carga
            console.error(`Error al cargar la imagen de portada para "${book.title}" en la ruta: ${this.src}`);
        };

        titleEl.textContent = book.title || 'N/A';
        authorEl.textContent = book.author || 'N/A';
        descriptionEl.innerHTML = book.description ? book.description.replace(/\n/g, '<br>') : 'Descripción no disponible.'; // Permitir saltos de línea
        categoriesEl.textContent = Array.isArray(book.categories) ? book.categories.join(', ') : (book.categories || 'N/A');
        yearEl.textContent = book.publication_date ? new Date(book.publication_date).getFullYear() : 'N/A';
        publisherEl.textContent = book.publisher || 'N/A';
        isbnEl.textContent = book.isbn || 'N/A';
        pagesEl.textContent = book.pages ? `${book.pages} páginas` : 'N/A';
        languageEl.textContent = book.language || 'N/A';
        ratingEl.textContent = book.rating ? `${parseFloat(book.rating).toFixed(1)}` : 'N/A';
        priceEl.textContent = book.price ? parseFloat(book.price).toFixed(2) : '0.00';

        // Lógica de Stock Mejorada
        const stockAmount = parseInt(book.stock, 10); // Asegurarse de que es un número
        stockEl.classList.remove('text-red-500', 'text-green-500', 'text-yellow-500', 'dark:text-red-400', 'dark:text-green-400', 'dark:text-yellow-400'); // Resetear clases de color

        if (stockAmount <= 0) {
            stockEl.textContent = 'Sin Stock';
            stockEl.classList.add('text-red-500', 'dark:text-red-400');
            addToCartBtn.disabled = true;
            addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
            outOfStockMessage.style.display = 'block';
        } else if (stockAmount <= 5) { // Umbral para "Últimas Unidades"
            stockEl.textContent = '¡Últimas Unidades!';
            // Podrías usar text-orange-500 si text-yellow-500 no es lo suficientemente destacable
            stockEl.classList.add('text-yellow-500', 'dark:text-yellow-400'); 
            addToCartBtn.disabled = false;
            addToCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            outOfStockMessage.style.display = 'none';
        } else { // stockAmount > 5
            stockEl.textContent = 'Disponible';
            stockEl.classList.add('text-green-500', 'dark:text-green-400');
            addToCartBtn.disabled = false;
            addToCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            outOfStockMessage.style.display = 'none';
        }
    }

    function setupActionButtons(book) {
        // Lógica Wishlist (simplificada, necesita integración con estado global de app.js)
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const baseAssetURL = 'http://localhost:3000/assets'; // URL base para los assets del servidor

        const updateWishlistIcon = () => {
            if (wishlist.includes(book.id.toString())) {
                wishlistIcon.src = `${baseAssetURL}/wishlist-filled.png`;
                toggleWishlistBtn.title = 'Quitar de la lista de deseos';
            } else {
                wishlistIcon.src = `${baseAssetURL}/wishlist.png`;
                toggleWishlistBtn.title = 'Añadir a la lista de deseos';
            }
            // Añadir un manejador de errores para los iconos de wishlist
            wishlistIcon.onerror = function() {
                console.error(`Error al cargar el icono de wishlist: ${this.src}`);
                this.style.display = 'none'; // Ocultar si no carga
            };
            wishlistIcon.onload = function() {
                this.style.display = ''; // Asegurarse de que se muestre si carga correctamente
            };
        };
        updateWishlistIcon();

        toggleWishlistBtn.addEventListener('click', () => {
            wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            const bookIdStr = book.id.toString();
            if (wishlist.includes(bookIdStr)) {
                wishlist = wishlist.filter(id => id !== bookIdStr);
            } else {
                wishlist.push(bookIdStr);
            }
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            updateWishlistIcon();
            window.dispatchEvent(new CustomEvent('wishlistUpdated'));
        });

        // Lógica Carrito (simplificada)
        addToCartBtn.addEventListener('click', () => {
            if (book.stock > 0) {
                let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                const existingItem = cart.find(item => item.id === book.id);
                if (existingItem) {
                    if (existingItem.quantity < book.stock) {
                        existingItem.quantity++;
                    }
                } else {
                    cart.push({ 
                        id: book.id, 
                        title: book.title, 
                        price: book.price, 
                        cover: book.cover, 
                        quantity: 1,
                        stock: book.stock
                    });
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                alert("`${book.title}` añadido al carrito.");
                window.dispatchEvent(new CustomEvent('cartUpdated'));
            } else {
                alert('Este libro está agotado.');
            }
        });
    }
    
    // La función updateCartBadge() y sus llamadas se eliminan.
    // app.js se encargará de actualizar el badge del header al escuchar 'cartUpdated'.

    // --- Inicializar --- 
    fetchBookDetails();
}); 