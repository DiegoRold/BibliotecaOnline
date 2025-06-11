class BookCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['title', 'author', 'cover', 'id', 'year', 'category', 'rating', 'pages', 'language', 'price', 'stock', 'in-wishlist'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`[book-card id=${this.getAttribute('id')}] attributeChanged: ${name}, oldValue: ${oldValue}, newValue: ${newValue}`);
        if (oldValue !== newValue) {
            // Si es 'in-wishlist' el que cambia, loguear el estado antes de re-renderizar
            if (name === 'in-wishlist') {
                const currentInWishlistAttr = this.getAttribute('in-wishlist') === 'true';
                const nextIconSrc = currentInWishlistAttr ? `http://localhost:3000/assets/wishlist-filled.png` : `http://localhost:3000/assets/wishlist.png`;
                console.log(`[book-card id=${this.getAttribute('id')}] 'in-wishlist' changed. Current attr value: ${this.getAttribute('in-wishlist')}. Next icon determined: ${nextIconSrc}`);
            }
            this.render();
            this.setupEventListeners(); // Re-attach listeners if attributes like stock change, to update button state
        }
    }

    render() {
        const title = this.getAttribute('title') || '';
        const author = this.getAttribute('author') || '';
        // let cover = this.getAttribute('cover') || ''; // Antigua lógica de 'cover'

        const id = this.getAttribute('id') || '';
        const year = this.getAttribute('year') || '';
        const category = this.getAttribute('category') || '';
        const rating = this.getAttribute('rating') || '';
        const pages = this.getAttribute('pages') || '';
        const language = this.getAttribute('language') || '';
        const price = parseFloat(this.getAttribute('price')) || 0;
        const stock = parseInt(this.getAttribute('stock')) || 0;
        const isInWishlist = this.getAttribute('in-wishlist') === 'true';

        const isOutOfStock = stock === 0;
        const baseAssetURL = 'http://localhost:3000/assets';
        const placeholderSrc = 'assets/books/placeholder.png'; // Ruta al placeholder

        let coverAttribute = this.getAttribute('cover') || placeholderSrc;
        // Si el cover no es una URL completa (no empieza con http), y no es el placeholder por defecto,
        // asumimos que es una ruta relativa que necesita la base del servidor.
        if (!coverAttribute.startsWith('http') && coverAttribute !== placeholderSrc) {
            coverAttribute = `${baseAssetURL}/${coverAttribute.startsWith('assets/') ? coverAttribute : 'assets/books/' + coverAttribute}`;
        }

        const wishlistIconSrc = isInWishlist ? `${baseAssetURL}/wishlist-filled.png` : `${baseAssetURL}/wishlist.png`;
        console.log(`[book-card id=${id}] render() called. Attr 'in-wishlist': ${this.getAttribute('in-wishlist')}, Parsed isInWishlist: ${isInWishlist}, Calculated wishlistIconSrc: ${wishlistIconSrc}`);
        const wishlistIconAlt = isInWishlist ? 'Quitar de lista de deseos' : 'Añadir a lista de deseos';
        const wishlistButtonTitle = isInWishlist ? 'Quitar de lista de deseos' : 'Añadir a lista de deseos';
        const addToCartIconSrc = `${baseAssetURL}/add-to-cart.png`;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    border: 1px solid #e0e0e0; /* Gris claro */
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    background-color: var(--card-bg, white); /* Permitir sobrescritura por CSS global */
                    color: var(--card-text-color, black);
                    transition: box-shadow 0.3s ease;
                    height: 100%; /* Para que todas las tarjetas tengan la misma altura en un flex container */
                    display: flex;
                    flex-direction: column;
                }
                :host(:hover) {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .card-link {
                    text-decoration: none;
                    color: inherit;
                    display: flex;
                    flex-direction: column;
                    height: 100%; /* Asegura que el enlace ocupe toda la tarjeta */
                }
                .cover-image {
                    width: 100%;
                    height: 200px; /* Altura fija para la imagen */
                    object-fit: cover; /* Escalar imagen para llenar el contenedor manteniendo proporciones */
                    border-bottom: 1px solid #e0e0e0;
                }
                .book-info {
                    padding: 16px;
                    flex-grow: 1; /* Permite que esta sección crezca para empujar las acciones hacia abajo */
                    display: flex;
                    flex-direction: column;
                }
                .book-title {
                    font-size: 1.1em;
                    font-weight: 600;
                    margin: 0 0 4px 0;
                    line-height: 1.3;
                    /* Limitar a 2 líneas con elipsis */
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;  
                    overflow: hidden;
                    text-overflow: ellipsis;
                    min-height: 2.6em; /* Ajustar para asegurar espacio para 2 líneas */
                }
                .book-author {
                    font-size: 0.9em;
                    color: #555;
                    margin: 0 0 12px 0;
                    line-height: 1.3;
                    /* Limitar a 1 línea */
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .dark .book-author {
                    color: #bbb;
                }
                .book-price {
                    font-size: 1.2em;
                    font-weight: bold;
                    color: var(--primary-color, #007bff);
                    margin-bottom: 12px;
                }
                .book-meta {
                    font-size: 0.8em;
                    color: #777;
                    margin-bottom: 16px; /* Más espacio antes de los botones */
                    flex-grow: 1; /* Empuja las acciones al final si book-info necesita crecer */
                }
                .dark .book-meta {
                    color: #ccc;
                }
                .meta-item {
                    margin-bottom: 4px;
                }
                .actions {
                    display: flex;
                    justify-content: space-between; /* Mejor distribución */
                    align-items: center;
                    border-top: 1px solid #e0e0e0; /* Separador */
                    padding-top: 12px;
                    margin-top: auto; /* Empujar al fondo */
                }
                .icon-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 50%;
                    transition: background-color 0.2s ease;
                }
                .icon-btn:hover {
                    background-color: #f0f0f0;
                }
                .dark .icon-btn:hover {
                    background-color: #4a4a4a;
                }
                .icon-btn img {
                    width: 22px; /* Tamaño iconos */
                    height: 22px;
                }
                .details-btn {
                    font-size: 0.9em;
                    padding: 8px 12px;
                    background-color: var(--primary-color, #007bff);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                .details-btn:hover {
                    background-color: var(--secondary-color, #0056b3);
                }
                .add-to-cart-btn[disabled] img {
                    filter: grayscale(100%) opacity(50%);
                    cursor: not-allowed;
                }
            </style>
            <a href="book-details.html?id=${id}" class="card-link">
                <img src="${coverAttribute}" alt="${title}" class="cover-image">
                <div class="book-info">
                    <h3 class="book-title" title="${title}">${title}</h3>
                    <p class="book-author" title="${author}">${author}</p>
                    <p class="book-price">${price.toFixed(2)} €</p>
                    <div class="book-meta">
                        <div class="meta-item">
                            <span>📅</span> <span>${year}</span>
                        </div>
                        <div class="meta-item">
                            <span>📚</span> <span>${category}</span>
                        </div>
                        <div class="meta-item">
                            <span>⭐</span> <span class="rating">${rating}</span>
                        </div>
                        <div class="meta-item">
                            <span>📖</span> <span>${pages} págs</span>
                        </div>
                        <div class="meta-item">
                            <span>🌍</span> <span>${language}</span>
                        </div>
                    </div>
                </div>
            </a>
            <div class="actions" style="padding: 0 16px 16px 16px;"> 
                <button class="details-btn">Ver Detalles</button>
                <button class="icon-btn wishlist-btn" title="${wishlistButtonTitle}">
                    <img src="${wishlistIconSrc}" alt="${wishlistIconAlt}">
                </button>
                <button class="icon-btn add-to-cart-btn" title="Añadir al carrito" ${isOutOfStock ? 'disabled' : ''}>
                    <img src="${addToCartIconSrc}" alt="Añadir al carrito">
                </button>
            </div>
        `;

        const imgElement = this.shadowRoot.querySelector('.cover-image');

        if (imgElement) {
            imgElement.onerror = () => {
                const currentSrc = imgElement.src;
                // Extraer la ruta original del atributo `cover`
                const originalPath = this.getAttribute('cover');

                // Si ya estamos intentando cargar 'public/' y falla, o si la ruta original ya contenía 'public/'
                if (currentSrc.includes('public/') || (originalPath && originalPath.startsWith('public/'))) {
                    // Si el segundo intento (con public/) falla, o si el original ya era public y falló
                    console.warn(`[book-card id=${id}] Falló la carga de ${currentSrc}. Usando placeholder final.`);
                    imgElement.src = placeholderSrc;
                    imgElement.onerror = null; // Detener el bucle de reintentos
                } else if (originalPath) {
                    // Si el primer intento (sin public/) falla, intentamos con 'public/'
                    const fallbackSrc = `public/${originalPath}`;
                    console.warn(`[book-card id=${id}] Falló la carga de ${currentSrc}. Intentando con fallback: ${fallbackSrc}`);
                    imgElement.src = fallbackSrc;
                } else {
                    // Si no había 'cover' y el placeholder inicial falla (muy raro)
                    console.error(`[book-card id=${id}] No hay 'cover' y el placeholder por defecto (${placeholderSrc}) falló.`);
                    imgElement.onerror = null;
                }
            };
        }
    }

    setupEventListeners() {
        const detailsBtn = this.shadowRoot.querySelector('.details-btn');
        const wishlistBtn = this.shadowRoot.querySelector('.wishlist-btn');
        const addToCartBtn = this.shadowRoot.querySelector('.add-to-cart-btn');
        const id = this.getAttribute('id');

        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
                console.log(`[book-card] Details button clicked. Card ID from attribute: ${id}. Navigating to: book-details.html?id=${id}`);
                window.location.href = `book-details.html?id=${id}`;
            });
        }

        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('toggle-wishlist', {
                    bubbles: true, composed: true, detail: { bookId: id }
                }));
            });
        }

        if (addToCartBtn) {
            // Check if button is not disabled before adding listener
            // The disabled state is handled in render, but good to double check
            if (!addToCartBtn.disabled) {
                addToCartBtn.addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('add-to-cart', {
                        bubbles: true, composed: true, detail: { 
                            bookId: id, 
                            title: this.getAttribute('title'), 
                            price: this.getAttribute('price'),
                            cover: this.getAttribute('cover'),
                            stock: this.getAttribute('stock')
                        }
                    }));
                });
            }
        }
    }
}

customElements.define('book-card', BookCard); 