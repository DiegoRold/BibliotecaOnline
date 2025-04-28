class BookCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['title', 'author', 'cover', 'id'];
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
        const id = this.getAttribute('id') || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin: 1rem;
                }
                .card {
                    background: white;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.3s;
                }
                .card:hover {
                    transform: translateY(-5px);
                }
                .cover {
                    width: 100%;
                    height: 300px;
                    object-fit: cover;
                }
                .content {
                    padding: 1rem;
                }
                .title {
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                }
                .author {
                    color: #666;
                    margin-bottom: 1rem;
                }
                .actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                button {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                .read-btn {
                    background-color: #3b82f6;
                    color: white;
                }
                .wishlist-btn {
                    background-color: #f3f4f6;
                }
                .wishlist-btn.active {
                    background-color: #ef4444;
                    color: white;
                }
            </style>
            <div class="card">
                <img class="cover" src="${cover}" alt="${title}">
                <div class="content">
                    <h3 class="title">${title}</h3>
                    <p class="author">${author}</p>
                    <div class="actions">
                        <button class="read-btn">Leer</button>
                        <button class="wishlist-btn" data-id="${id}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const wishlistBtn = this.shadowRoot.querySelector('.wishlist-btn');
        const readBtn = this.shadowRoot.querySelector('.read-btn');

        wishlistBtn.addEventListener('click', () => {
            const bookId = wishlistBtn.getAttribute('data-id');
            const isInWishlist = wishlistBtn.classList.contains('active');
            
            if (isInWishlist) {
                this.removeFromWishlist(bookId);
                wishlistBtn.classList.remove('active');
            } else {
                this.addToWishlist(bookId);
                wishlistBtn.classList.add('active');
            }
        });

        readBtn.addEventListener('click', () => {
            const bookId = this.getAttribute('id');
            this.dispatchEvent(new CustomEvent('read-book', {
                detail: { bookId },
                bubbles: true,
                composed: true
            }));
        });
    }

    addToWishlist(bookId) {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (!wishlist.includes(bookId)) {
            wishlist.push(bookId);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
    }

    removeFromWishlist(bookId) {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const index = wishlist.indexOf(bookId);
        if (index > -1) {
            wishlist.splice(index, 1);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
    }
}

customElements.define('book-card', BookCard); 