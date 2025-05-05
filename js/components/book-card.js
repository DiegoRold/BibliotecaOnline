class BookCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['title', 'author', 'cover', 'id', 'year', 'category', 'rating', 'pages', 'language'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const title = this.getAttribute('title') || '';
        const author = this.getAttribute('author') || '';
        const cover = this.getAttribute('cover') || '';
        const year = this.getAttribute('year') || '';
        const category = this.getAttribute('category') || '';
        const rating = this.getAttribute('rating') || '';
        const pages = this.getAttribute('pages') || '';
        const language = this.getAttribute('language') || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: white;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                }

                :host(:hover) {
                    transform: translateY(-4px);
                }

                .dark :host {
                    background: #1f2937;
                }

                .book-cover {
                    width: 100%;
                    height: 300px;
                    object-fit: cover;
                }

                .book-info {
                    padding: 1rem;
                }

                .book-title {
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    color: #1f2937;
                }

                .dark .book-title {
                    color: #f3f4f6;
                }

                .book-author {
                    color: #6b7280;
                    margin-bottom: 0.5rem;
                }

                .dark .book-author {
                    color: #9ca3af;
                }

                .book-meta {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin-bottom: 1rem;
                }

                .dark .book-meta {
                    color: #9ca3af;
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
                    display: flex;
                    gap: 0.5rem;
                }

                button {
                    flex: 1;
                    padding: 0.5rem;
                    border: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }

                .read-btn {
                    background-color: #3b82f6;
                    color: white;
                }

                .read-btn:hover {
                    background-color: #2563eb;
                }

                .wishlist-btn {
                    background-color: #e5e7eb;
                    color: #4b5563;
                }

                .dark .wishlist-btn {
                    background-color: #374151;
                    color: #d1d5db;
                }

                .wishlist-btn:hover {
                    background-color: #d1d5db;
                }

                .dark .wishlist-btn:hover {
                    background-color: #4b5563;
                }

                .wishlist-btn.active {
                    background-color: #ef4444;
                    color: white;
                }

                .wishlist-btn.active:hover {
                    background-color: #dc2626;
                }
            </style>

            <img class="book-cover" src="${cover}" alt="${title}">
            <div class="book-info">
                <h3 class="book-title">${title}</h3>
                <p class="book-author">${author}</p>
                <div class="book-meta">
                    <div class="meta-item">
                        <span>📅</span>
                        <span>${year}</span>
                    </div>
                    <div class="meta-item">
                        <span>📚</span>
                        <span>${category}</span>
                    </div>
                    <div class="meta-item">
                        <span>⭐</span>
                        <span class="rating">${rating}</span>
                    </div>
                    <div class="meta-item">
                        <span>📖</span>
                        <span>${pages} págs</span>
                    </div>
                    <div class="meta-item">
                        <span>🌍</span>
                        <span>${language}</span>
                    </div>
                </div>
                <div class="actions">
                    <button class="read-btn">Leer</button>
                    <button class="wishlist-btn">Lista de deseos</button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const readBtn = this.shadowRoot.querySelector('.read-btn');
        const wishlistBtn = this.shadowRoot.querySelector('.wishlist-btn');

        readBtn.addEventListener('click', () => {
            const bookId = this.getAttribute('id');
            this.dispatchEvent(new CustomEvent('read-book', {
                bubbles: true,
                composed: true,
                detail: { bookId }
            }));
        });

        wishlistBtn.addEventListener('click', () => {
            const bookId = this.getAttribute('id');
            this.dispatchEvent(new CustomEvent('toggle-wishlist', {
                bubbles: true,
                composed: true,
                detail: { bookId }
            }));
        });
    }
}

customElements.define('book-card', BookCard); 