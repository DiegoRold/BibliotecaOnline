document.addEventListener('DOMContentLoaded', () => {
    const booksGrid = document.getElementById('books-grid');
    const paginationContainer = document.getElementById('pagination');
    
    // Apuntar al puerto correcto del backend
    const API_BASE_URL = 'http://localhost:3000'; // O http://127.0.0.1:3000
    const API_URL = `${API_BASE_URL}/api/libros`; 
    
    let currentPage = 1;
    const booksPerPage = 12;

    async function fetchBooks(page = 1, limit = booksPerPage) {
        try {
            const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`);
            if (!response.ok) {
                const errorText = await response.text(); // Intenta obtener el texto del error de la respuesta
                console.error(`Error en la respuesta de la API: ${response.status} ${response.statusText}`);
                console.error(`Cuerpo de la respuesta del error: ${errorText}`);
                throw new Error(`Error HTTP: ${response.status}. Respuesta: ${errorText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error detallado al obtener los libros (dentro de fetchBooks):', error);
            if (booksGrid && !booksGrid.innerHTML.includes('Error al cargar los libros')) {
                 booksGrid.innerHTML = '<p class="col-span-4 text-center text-red-500">Error al cargar los libros. Por favor, inténtalo de nuevo más tarde. Revisa la consola para más detalles.</p>';
            }
            return null;
        }
    }

    function renderBooks(books) {
        booksGrid.innerHTML = ''; 
        if (!books || books.length === 0) {
            booksGrid.innerHTML = '<p class="w-full text-center">No se encontraron libros.</p>';
            return;
        }

        const localPlaceholder = 'assets/books/placeholder.png';

        books.forEach(book => {
            // console.log('Datos completos del libro (books.js):', JSON.stringify(book, null, 2)); // Comentado o eliminado
            let finalCoverUrl = localPlaceholder;

            if (book.title && book.title.toLowerCase().includes('cien años de soledad')) {
                finalCoverUrl = 'assets/books/cien-anos-de-soledad-(edicion-revisada).jpg';
            } else if (book.cover && typeof book.cover === 'string' && book.cover.trim() !== '') {
                finalCoverUrl = book.cover.trim();
            } else {
                console.log(`Libro "${book.title}" no tiene propiedad 'cover' válida o está vacía, usando placeholder: ${localPlaceholder}`);
                finalCoverUrl = localPlaceholder;
            }

            const bookCardData = {
                id: book.id.toString(),
                title: book.title || '',
                author: book.author || '',
                cover: finalCoverUrl,
                year: book.publication_date ? new Date(book.publication_date).getFullYear().toString() : 'N/A',
                category: book.categories && Array.isArray(book.categories) ? book.categories.join(', ') : (book.categories || 'N/A'),
                rating: book.rating ? book.rating.toString() : 'N/A',
                pages: book.pages ? book.pages.toString() : 'N/A',
                language: book.language || 'N/A', 
                price: book.price ? book.price.toString() : '0',
                stock: book.stock ? book.stock.toString() : '0',
            };
            
            const bookCardElement = renderBookCard(bookCardData); 
            booksGrid.appendChild(bookCardElement);
        });
    }

    function renderPagination(totalPages, currentPage) {
        paginationContainer.innerHTML = ''; 
        if (totalPages <= 1) return;

        const createButton = (text, page, isDisabled = false, isNavSymbol = false) => {
            const button = document.createElement('button');
            button.innerHTML = text; // Usar innerHTML para símbolos como < >
            button.classList.add(isNavSymbol ? 'pagination-symbol-nav' : 'page-number');
            if (page === currentPage && !isNavSymbol) {
                button.classList.add('active');
            }
            button.disabled = isDisabled;
            button.addEventListener('click', () => loadPage(page));
            return button;
        };

        // Botón Primera (si no estamos en la primera página y hay más de X páginas para justificarlo)
        if (currentPage > 1 && totalPages > 5) { // Umbral para mostrar "Primera"
            paginationContainer.appendChild(createButton('« Primera', 1, false, true));
        }

        // Botón Anterior (<)
        paginationContainer.appendChild(createButton('<', currentPage - 1, currentPage === 1, true));

        // Números de página (lógica para mostrar un rango alrededor de la actual)
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (currentPage <= 3) { // Si estamos al principio, mostrar más páginas iniciales
            endPage = Math.min(totalPages, 5);
        }
        if (currentPage > totalPages - 3) { // Si estamos al final, mostrar más páginas finales
            startPage = Math.max(1, totalPages - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageText = i.toString().padStart(2, '0'); // Formatear a dos dígitos
            paginationContainer.appendChild(createButton(pageText, i, false));
        }

        // Botón Siguiente (>)
        paginationContainer.appendChild(createButton('>', currentPage + 1, currentPage === totalPages, true));

        // Botón Última (si no estamos en la última página y hay más de X páginas)
        if (currentPage < totalPages && totalPages > 5) { // Umbral para mostrar "Última"
            paginationContainer.appendChild(createButton('Última »', totalPages, false, true));
        }
    }

    async function loadPage(page) {
        const data = await fetchBooks(page, booksPerPage);
        if (data && data.books) {
            renderBooks(data.books);
            currentPage = data.pagination.currentPage;
            renderPagination(data.pagination.totalPages, data.pagination.currentPage);
        } else {
            // Si fetchBooks devuelve null, el mensaje de error ya se mostró desde allí.
            // Si data no es null, pero data.books no existe, muestra un mensaje.
            if (data && !data.books && booksGrid && !booksGrid.innerHTML.includes('Error al cargar los libros')) {
                booksGrid.innerHTML = '<p class="col-span-4 text-center">No se encontraron libros para mostrar o el formato de datos es incorrecto.</p>';
            }
            // Si booksGrid ya tiene un error, no lo sobrescribas.
            // Si no hay error pero tampoco libros, renderBooks() mostrará "No se encontraron libros."
            renderPagination(0,1); // Limpiar o resetear paginación
        }
    }

    // Carga inicial de la primera página
    loadPage(currentPage);
}); 

function renderBookCard(bookData) {
    const bookCardElement = document.createElement('book-card');
    bookCardElement.setAttribute('id', bookData.id);
    bookCardElement.setAttribute('title', bookData.title);
    bookCardElement.setAttribute('author', bookData.author);
    bookCardElement.setAttribute('cover', bookData.cover);
    bookCardElement.setAttribute('year', bookData.year);
    bookCardElement.setAttribute('category', bookData.category);
    bookCardElement.setAttribute('rating', bookData.rating);
    bookCardElement.setAttribute('pages', bookData.pages);
    bookCardElement.setAttribute('language', bookData.language);
    bookCardElement.setAttribute('price', bookData.price);
    bookCardElement.setAttribute('stock', bookData.stock);
    
    return bookCardElement;
} 