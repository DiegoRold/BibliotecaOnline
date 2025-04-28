// Datos de ejemplo para los libros
const books = [
    {
        id: '1',
        title: 'El Señor de los Anillos',
        author: 'J.R.R. Tolkien',
        cover: 'assets/books/lotr.jpg',
        description: 'Una épica historia de fantasía que sigue las aventuras de Frodo Bolsón y la Comunidad del Anillo.'
    },
    {
        id: '2',
        title: 'Cien años de soledad',
        author: 'Gabriel García Márquez',
        cover: 'assets/books/cien-anos.jpg',
        description: 'La historia de la familia Buendía en el pueblo ficticio de Macondo.'
    },
    // Añadir más libros según sea necesario
];

// Estado de la aplicación
const state = {
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    isGridView: true,
    wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]')
};

// Elementos del DOM
const themeToggle = document.getElementById('theme-toggle');
const viewToggle = document.getElementById('view-toggle');
const wishlistToggle = document.getElementById('wishlist-toggle');
const wishlistModal = document.getElementById('wishlist-modal');
const closeWishlist = document.getElementById('close-wishlist');
const booksGrid = document.getElementById('books-grid');
const searchInput = document.querySelector('input[type="text"]');

// Inicialización
function init() {
    applyTheme();
    renderBooks();
    setupEventListeners();
}

// Aplicar tema
function applyTheme() {
    document.body.classList.toggle('dark', state.isDarkMode);
}

// Renderizar libros
function renderBooks() {
    booksGrid.innerHTML = '';
    books.forEach(book => {
        const card = document.createElement('book-card');
        card.setAttribute('title', book.title);
        card.setAttribute('author', book.author);
        card.setAttribute('cover', book.cover);
        card.setAttribute('id', book.id);
        
        if (state.wishlist.includes(book.id)) {
            card.shadowRoot.querySelector('.wishlist-btn').classList.add('active');
        }
        
        booksGrid.appendChild(card);
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Toggle tema oscuro
    themeToggle.addEventListener('click', () => {
        state.isDarkMode = !state.isDarkMode;
        localStorage.setItem('darkMode', state.isDarkMode);
        applyTheme();
    });

    // Toggle vista grid/flex
    viewToggle.addEventListener('click', () => {
        state.isGridView = !state.isGridView;
        booksGrid.classList.toggle('grid-view', state.isGridView);
        booksGrid.classList.toggle('flex-view', !state.isGridView);
    });

    // Toggle wishlist modal
    wishlistToggle.addEventListener('click', () => {
        wishlistModal.showModal();
        renderWishlist();
    });

    closeWishlist.addEventListener('click', () => {
        wishlistModal.close();
    });

    // Búsqueda
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredBooks = books.filter(book => 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );
        renderFilteredBooks(filteredBooks);
    });

    // Evento para leer libro
    document.addEventListener('read-book', (e) => {
        const bookId = e.detail.bookId;
        const book = books.find(b => b.id === bookId);
        if (book) {
            // Aquí implementaremos la lógica para abrir el libro
            console.log(`Abriendo libro: ${book.title}`);
        }
    });
}

// Renderizar libros filtrados
function renderFilteredBooks(filteredBooks) {
    booksGrid.innerHTML = '';
    filteredBooks.forEach(book => {
        const card = document.createElement('book-card');
        card.setAttribute('title', book.title);
        card.setAttribute('author', book.author);
        card.setAttribute('cover', book.cover);
        card.setAttribute('id', book.id);
        
        if (state.wishlist.includes(book.id)) {
            card.shadowRoot.querySelector('.wishlist-btn').classList.add('active');
        }
        
        booksGrid.appendChild(card);
    });
}

// Renderizar wishlist
function renderWishlist() {
    const wishlistContent = document.getElementById('wishlist-content');
    wishlistContent.innerHTML = '';
    
    state.wishlist.forEach(bookId => {
        const book = books.find(b => b.id === bookId);
        if (book) {
            const card = document.createElement('book-card');
            card.setAttribute('title', book.title);
            card.setAttribute('author', book.author);
            card.setAttribute('cover', book.cover);
            card.setAttribute('id', book.id);
            card.shadowRoot.querySelector('.wishlist-btn').classList.add('active');
            wishlistContent.appendChild(card);
        }
    });
}

// Inicializar la aplicación
init(); 