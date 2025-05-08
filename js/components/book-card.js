class BookCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['title', 'author', 'cover', 'id', 'year', 'category', 'rating', 'pages', 'language', 'price', 'stock'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
            this.setupEventListeners(); // Re-attach listeners if attributes like stock change, to update button state
        }
    }

    render() {
        const title = this.getAttribute('title') || '';
        const author = this.getAttribute('author') || '';
        const cover = this.getAttribute('cover') || '';
        const id = this.getAttribute('id') || '';
        const year = this.getAttribute('year') || '';
        const category = this.getAttribute('category') || '';
        const rating = this.getAttribute('rating') || '';
        const pages = this.getAttribute('pages') || '';
        const language = this.getAttribute('language') || '';
        const price = parseFloat(this.getAttribute('price')) || 0;
        const stock = parseInt(this.getAttribute('stock')) || 0;

        let stockMessage = '';
        let stockMessageClass = '';
        if (stock === 0) {
            stockMessage = 'NO QUEDAN UNIDADES';
            stockMessageClass = 'stock-out';
        } else if (stock > 0 && stock <= 100) {
            stockMessage = '¡ÚLTIMAS UNIDADES!';
            stockMessageClass = 'stock-low';
        }

        const isOutOfStock = stock === 0;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: var(--card-bg-color, white);
                    border-radius: 0.5rem;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                    height: 100%; /* Ensure cards in a grid have same height */
                    display: flex; /* Added for flex column layout */
                    flex-direction: column; /* Added for flex column layout */
                }

                :host(:hover) {
                    transform: translateY(-4px);
                }

                .book-cover {
                    width: 100%;
                    height: 280px; /* Adjusted height */
                    object-fit: cover;
                }

                .book-info {
                    padding: 1rem;
                    flex-grow: 1; /* Allows this section to grow and push actions to bottom */
                    display: flex;
                    flex-direction: column;
                }

                .book-title {
                    font-size: 1.15rem; /* Slightly reduced */
                    font-weight: bold;
                    margin-bottom: 0.25rem;
                    color: var(--text-color, #1f2937);
                    line-height: 1.3;
                }

                .book-author {
                    font-size: 0.9rem;
                    color: var(--text-secondary-color, #6b7280);
                    margin-bottom: 0.5rem;
                }
                
                .book-price {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: var(--accent-color, #2563eb);
                    margin-bottom: 0.5rem;
                }

                .stock-message {
                    font-size: 0.8rem;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    text-align: center;
                }
                .stock-out {
                    color: var(--error-text-color, #ef4444);
                    background-color: var(--error-bg-color, #fee2e2);
                }
                .stock-low {
                    color: var(--warning-text-color, #f59e0b);
                    background-color: var(--warning-bg-color, #fffbeb);
                }

                .book-meta {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.3rem;
                    font-size: 0.8rem;
                    color: var(--text-secondary-color, #6b7280);
                    margin-bottom: 0.75rem;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .rating {
                    color: #f59e0b;
                }

                .actions {
                    margin-top: auto; /* Pushes actions to the bottom */
                    display: flex;
                    gap: 0.5rem;
                    align-items: center; /* Align items vertically */
                    padding-top: 0.5rem; /* Add some space above actions */
                    border-top: 1px solid var(--border-color, #e5e7eb); /* Separator line */
                }

                .details-btn {
                    flex-grow: 1; /* Takes available space */
                    padding: 0.6rem 0.5rem;
                    border: 1px solid var(--primary-color, #3b82f6);
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-weight: 500;
                    background-color: transparent;
                    color: var(--primary-color, #3b82f6);
                    text-align: center;
                    transition: background-color 0.2s, color 0.2s;
                }
                .details-btn:hover {
                    background-color: var(--primary-hover-color, #2563eb);
                    color: white;
                }

                .icon-btn {
                    padding: 0.5rem;
                    border: none;
                    background: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                }
                .icon-btn img {
                    width: 24px;
                    height: 24px;
                }
                .icon-btn:disabled img {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

            </style>

            <img class="book-cover" src="${cover}" alt="${title}">
            <div class="book-info">
                <h3 class="book-title">${title}</h3>
                <p class="book-author">${author}</p>
                <p class="book-price">${price.toFixed(2)} €</p>
                ${stockMessage ? `<div class="stock-message ${stockMessageClass}">${stockMessage}</div>` : ''}
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
                <div class="actions">
                    <button class="details-btn">Ver Detalles</button>
                    <button class="icon-btn wishlist-btn" title="Añadir a lista de deseos">
                        <img src="assets/wishlist.png" alt="Lista de deseos">
                    </button>
                    <button class="icon-btn add-to-cart-btn" title="Añadir al carrito" ${isOutOfStock ? 'disabled' : ''}>
                        <img src="assets/add-to-cart.png" alt="Añadir al carrito">
                    </button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const detailsBtn = this.shadowRoot.querySelector('.details-btn');
        const wishlistBtn = this.shadowRoot.querySelector('.wishlist-btn');
        const addToCartBtn = this.shadowRoot.querySelector('.add-to-cart-btn');
        const id = this.getAttribute('id');

        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('view-book-details', {
                    bubbles: true, composed: true, detail: { bookId: id }
                }));
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