document.addEventListener('DOMContentLoaded', () => {
    const bookApiIdFromUrl = new URLSearchParams(window.location.search).get('id');
    console.log(`[book-details.js] bookApiId from URL: ${bookApiIdFromUrl}`);

    if (bookApiIdFromUrl) {
        // Ya no se procesa el ID, se asume que es el api_id directamente (ej: "book-123")
        console.log(`[book-details.js] Using bookApiId for fetch: ${bookApiIdFromUrl}`);
        fetchBookDetails(bookApiIdFromUrl);
    } else {
        console.error('[book-details.js] No book ID found in URL.');
        // Mostrar un mensaje de error en la página
        const detailsContainer = document.getElementById('book-details-container');
        if (detailsContainer) {
            detailsContainer.innerHTML = '<p class="text-red-500 text-center py-8">No se especificó un ID de libro válido.</p>';
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

    async function fetchBookDetails(apiId) { // El identificador ahora es siempre el api_id
        // Ya no se necesita la lógica para determinar el tipo de ID.
        const fetchUrl = `http://localhost:3000/api/libros/details/${apiId}`;
        console.log(`[book-details.js fetchBookDetails] Fetching from URL: ${fetchUrl}`);

        try {
            const response = await fetch(fetchUrl);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Libro no encontrado.');
                } else {
                    throw new Error(`Error del servidor: ${response.status}`);
                }
            }
            const book = await response.json();
            currentBook = book; 
            renderBookDetails(book);
            setupActionButtons(book);
        } catch (error) {
            console.error('Error al obtener detalles del libro:', error);
            document.getElementById('book-details-container').innerHTML = `<p class="text-red-500 text-center">Error al cargar los detalles del libro: ${error.message}</p>`;
        }
    }

    function renderBookDetails(book) {
        document.title = `${book.title || 'Detalles del Libro'} - Entre Hojas`; // Actualizar título de la página
        
        console.log('[book-details.js renderBookDetails] Book data received:', book);

        // Lógica para la imagen de portada
        const placeholderMainCover = 'assets/books/placeholder.png'; // Placeholder general
        coverImg.src = placeholderMainCover; // Cargar placeholder inicialmente o si todo falla
        coverImg.alt = book.title || 'Portada no disponible';
        coverImg.style.display = 'block'; // Asegurar que sea visible si se resetea

        if (book.cover && (book.cover.startsWith('http://') || book.cover.startsWith('https://'))) {
            coverImg.src = book.cover;
            coverImg.onerror = function() {
                console.error(`Error al cargar imagen externa: ${this.src}. Mostrando placeholder.`);
                this.src = placeholderMainCover;
                // No ocultar, simplemente mostrar el placeholder.
            };
        } else if (book.title) {
            const normalizedTitle = normalizeBookTitleForImage(book.title);

            const tryLoadLocalImage = (extension) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    // Guardar el src que se intentará cargar para referencia en caso de error
                    const testSrc = `assets/books/${normalizedTitle}.${extension}`;
                    img.onload = () => resolve(testSrc); // Resolvemos con el src que funcionó
                    img.onerror = () => reject(extension); // Rechazamos con la extensión que falló
                    img.src = testSrc;
                });
            };

            // Intentar cargar PNG primero
            tryLoadLocalImage('png')
                .then(pngSrc => {
                    coverImg.src = pngSrc; // Si PNG carga, usarlo
                    console.log(`[book-details.js] Portada .png cargada: ${pngSrc}`);
                })
                .catch(failedPngExt => {
                    console.warn(`[book-details.js] No se encontró .${failedPngExt} para "${book.title}". Intentando .jpg.`);
                    // Si PNG falla, intentar cargar JPG
                    return tryLoadLocalImage('jpg')
                        .then(jpgSrc => {
                            // Este .then anidado se ejecuta SOLO si tryLoadLocalImage('jpg') tuvo éxito.
                            coverImg.src = jpgSrc;
                            console.log(`[book-details.js] Portada .jpg cargada después de fallo de .png: ${jpgSrc}`);
                        })
                        .catch(failedJpgExt => {
                            // Este .catch interno se ejecuta si JPG también falla
                            console.warn(`[book-details.js] No se encontró .${failedJpgExt} (después de intentar .png) para "${book.title}". Usando placeholder general.`);
                            coverImg.src = placeholderMainCover; // Asegurar placeholder si ambos fallan
                        });
                });
        } else {
             // Si no hay book.cover URL ni book.title, se mantiene el placeholder inicial.
             coverImg.src = placeholderMainCover;
        }

        // El onerror genérico en coverImg para URLs externas o si los intentos locales fallan y se setea el placeholder
        // se maneja arriba o por el hecho de que el src final será el placeholder.

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
        // book.id es el api_id (ej: "book-123") que se usa para la wishlist de invitado
        // book.numeric_id es el id numérico de la BD, que podría ser necesario para wishlist de usuario registrado
        const bookApiId = book.id; 
        // const bookNumericId = book.numeric_id; // Disponible si es necesario para API de usuario registrado

        const updateLocalWishlistIcon = () => {
            const appState = window.getStateApp ? window.getStateApp() : { wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]') };
            const baseAssetURL = 'http://localhost:3000/assets';

            // Comparamos con bookApiId (que es el book.id del objeto libro actual)
            if (appState.wishlist.includes(bookApiId)) {
                wishlistIcon.src = `${baseAssetURL}/wishlist-filled.png`;
                toggleWishlistBtn.title = 'Quitar de la lista de deseos';
            } else {
                wishlistIcon.src = `${baseAssetURL}/wishlist.png`;
                toggleWishlistBtn.title = 'Añadir a la lista de deseos';
            }
            wishlistIcon.onerror = function() {
                console.error(`Error al cargar el icono de wishlist: ${this.src}`);
                this.style.display = 'none';
            };
            wishlistIcon.onload = function() {
                this.style.display = ''; 
            };
        };

        updateLocalWishlistIcon(); // Estado inicial

        // Escuchar el evento global para actualizar el icono si cambia en otra parte
        window.addEventListener('wishlistUpdated', updateLocalWishlistIcon);
        // Considerar remover este listener si la página se va (cleanup) para evitar leaks si book-details.js se carga múltiples veces sin recarga de página.

        toggleWishlistBtn.addEventListener('click', () => {
            if (window.toggleWishlistItemApp) {
                // Pasamos el api_id (book.id) y el objeto libro completo
                // app.js decidirá si necesita book.numeric_id para usuarios registrados
                window.toggleWishlistItemApp(book, true); // true indica que es desde book-details
            } else {
                console.error('La función global toggleWishlistItemApp no está disponible.');
                let localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                if (localWishlist.includes(bookApiId)) {
                    localWishlist = localWishlist.filter(id => id !== bookApiId);
                } else {
                    localWishlist.push(bookApiId);
                }
                localStorage.setItem('wishlist', JSON.stringify(localWishlist));
                updateLocalWishlistIcon(); 
                window.dispatchEvent(new CustomEvent('wishlistUpdated'));// Para que app.js (modal) reaccione también
            }
        });

        // Lógica Carrito (simplificada) - puede usar window.addBookToCartApp si se expone
        addToCartBtn.addEventListener('click', () => {
            if (book.stock > 0) {
                if (window.addBookToCartApp) {
                    // Pasamos el api_id (book.id) y otros detalles.
                    // app.js puede usar book.numeric_id si es necesario para el backend.
                    window.addBookToCartApp(book); 
                } else {
                    console.error('La función global addBookToCartApp no está disponible.');
                    // Fallback a lógica local de carrito si la global no está (copiada de antes)
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
                }
            } else {
                alert('Este libro está agotado.');
            }
        });
    }
    
    // La función updateCartBadge() y sus llamadas se eliminan.
    // app.js se encargará de actualizar el badge del header al escuchar 'cartUpdated'.

    // --- Inicializar --- 
    // Asegurarse de que fetchBookDetails se llama después de que bookId se haya procesado
    // y solo si bookId es válido (ya cubierto por el if (bookId) { ... } inicial)
    // La llamada a fetchBookDetails(bookId) ya está dentro del bloque if (bookId) al principio.
    // No es necesario llamarlo de nuevo aquí si la estructura es:
    // document.addEventListener('DOMContentLoaded', () => {
    //     procesar bookId...
    //     if (bookId) fetchBookDetails(bookId);
    //     definir otras funciones...
    // });
    // Revisando, la llamada original fetchBookDetails(bookId) está bien ubicada dentro del if(bookId).
    // El problema del GET undefined era porque bookId no se procesaba correctamente antes de la llamada en un caso anterior.
    // Los logs añadidos confirmarán el valor de bookId antes del fetch.
    // No se necesita cambio aquí si la llamada ya está correctamente ubicada. 
    // El error anterior de 'undefined' en el fetch era porque el script fallaba antes de procesar bookId o bookId era realmente undefined desde la URL.

}); 