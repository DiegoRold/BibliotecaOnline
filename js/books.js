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
            booksGrid.innerHTML = '<p class="col-span-4 text-center">No se encontraron libros.</p>';
            return;
        }

        const localPlaceholder = 'assets/placeholder-cover.png'; // Placeholder local

        books.forEach(book => {
            let imageUrl = localPlaceholder; // Por defecto, el placeholder local

            // Caso especial para "Cien años de soledad"
            if (book.title && book.title.toLowerCase().includes('cien años de soledad')) {
                imageUrl = 'assets/books/cien-anos-de-soledad-(edicion-revisada).jpg';
            } else {
                // Lógica general para otras imágenes
                if (book.cover_image_url && typeof book.cover_image_url === 'string' && book.cover_image_url.trim() !== '') {
                    const coverUrl = book.cover_image_url.trim();
                    if (coverUrl.startsWith('http')) {
                        imageUrl = coverUrl; 
                    } else if (coverUrl.startsWith('assets/')) {
                        imageUrl = coverUrl; 
                    } else {
                        imageUrl = `assets/books/${coverUrl}`;
                    }
                } else if (book.title && typeof book.title === 'string' && book.title.trim() !== '') {
                    const rawTitle = book.title.trim();
                    const filename = rawTitle
                        .toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
                        .replace(/ñ/g, 'n') 
                        .replace(/\s+/g, '-') 
                        .replace(/[^a-z0-9-]/g, '');
                    imageUrl = `assets/books/${filename}.jpg`;
                }
            }
            
            let priceText = 'No disponible';
            if (book.price !== null && book.price !== undefined) {
                const priceNumber = parseFloat(book.price);
                if (!isNaN(priceNumber)) {
                    priceText = priceNumber.toFixed(2) + ' €';
                }
            }

            const bookElement = `
                <div class="book-item">
                    <img src="${imageUrl}" 
                         alt="${book.title || 'Título no disponible'}" 
                         onerror="this.onerror=null; this.src='${localPlaceholder}';">
                    <h3>${book.title || 'Título no disponible'}</h3>
                    <p>Autor: ${book.author || 'Autor desconocido'}</p>
                    <p class="price">Precio: ${priceText}</p>
                    <!-- Podríamos añadir más detalles o un botón de "Añadir al carrito" aquí -->
                </div>
            `;
            booksGrid.insertAdjacentHTML('beforeend', bookElement);
        });
    }

    function renderPagination(totalPages, currentPage) {
        paginationContainer.innerHTML = ''; // Limpiar paginación existente
        if (totalPages <= 1) return; // No mostrar paginación si solo hay una página

        // Botón Anterior
        const prevButton = document.createElement('button');
        prevButton.textContent = 'ANTERIOR';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                loadPage(currentPage - 1);
            }
        });
        paginationContainer.appendChild(prevButton);

        // Números de página
        for (let i = 1; i <= totalPages; i++) {
            const pageNumberSpan = document.createElement('span');
            pageNumberSpan.textContent = i;
            pageNumberSpan.classList.add('page-number');
            if (i === currentPage) {
                pageNumberSpan.classList.add('active');
            }
            pageNumberSpan.addEventListener('click', () => {
                loadPage(i);
            });
            paginationContainer.appendChild(pageNumberSpan);
        }

        // Botón Siguiente
        const nextButton = document.createElement('button');
        nextButton.textContent = 'SIGUIENTE';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                loadPage(currentPage + 1);
            }
        });
        paginationContainer.appendChild(nextButton);
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