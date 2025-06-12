document.addEventListener('DOMContentLoaded', () => {
    console.log('[books.js] DOMContentLoaded: Script iniciado.');
    const booksGrid = document.getElementById('books-grid');
    const paginationContainer = document.getElementById('pagination');
    
    if (!booksGrid) {
        console.error('[books.js] El elemento #books-grid NO fue encontrado en el DOM.');
        return; // Detener si el contenedor principal no existe
    }
    if (!paginationContainer) {
        console.warn('[books.js] El elemento #pagination NO fue encontrado en el DOM. La paginación no funcionará.');
        // No detenemos, pero es un aviso importante
    }
    console.log('[books.js] #books-grid y #pagination (si existe) encontrados.');

    // Apuntar al puerto correcto del backend
    const API_BASE_URL = 'http://localhost:3000'; // O http://127.0.0.1:3000
    const API_URL = `${API_BASE_URL}/api/libros`; 
    
    let currentPage = 1; // Mantenemos currentPage global para saber el estado actual
    const booksPerPage = 12; 

    async function fetchBooks(page = 1, limit = booksPerPage) {
        try {
            console.log(`[books.js] fetchBooks: Intentando obtener libros - Página: ${page}, Límite: ${limit}`);
            const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`);
            console.log(`[books.js] fetchBooks: Respuesta recibida, Status: ${response.status}`);
            if (!response.ok) {
                const errorText = await response.text(); 
                console.error(`[books.js] fetchBooks: Error en la respuesta de la API: ${response.status} ${response.statusText}`);
                console.error(`[books.js] fetchBooks: Cuerpo de la respuesta del error: ${errorText}`);
                if (booksGrid && !booksGrid.innerHTML.includes('Error al cargar los libros')) {
                    booksGrid.innerHTML = '<p class="col-span-4 text-center text-red-500">Error al cargar los libros desde la API (código: ${response.status}). Por favor, inténtalo de nuevo más tarde.</p>';
                }
                return null; // Indicar fallo
            }
            const data = await response.json();
            console.log('[books.js] fetchBooks: Datos JSON parseados:', JSON.stringify(data, null, 2));
            return data; // Devuelve los datos parseados (ej: { libros: [], totalPages: X, currentPage: Y })
        } catch (error) {
            console.error('[books.js] fetchBooks: Error CRÍTICO al obtener o parsear los libros:', error);
            if (booksGrid && !booksGrid.innerHTML.includes('Error al cargar los libros')) {
                 booksGrid.innerHTML = '<p class="col-span-4 text-center text-red-500">Error de red o parseo severo al obtener los libros. Revisa la consola.</p>';
            }
            return null; // Indicar fallo
        }
    }

    async function loadPage(pageToLoad) {
        currentPage = pageToLoad; // Actualizar la página actual global
        console.log(`[books.js] loadPage: Cargando página ${pageToLoad}`);
        const data = await fetchBooks(currentPage, booksPerPage);

        if (data && data.books && data.pagination) { 
            console.log('[books.js] loadPage: Datos recibidos para renderizar:', data.books.length, 'libros. Total páginas:', data.pagination.totalPages);
            renderBooks(data.books); 
            if (data.pagination.totalPages !== undefined && data.pagination.currentPage !== undefined) {
                renderPagination(data.pagination.totalPages, data.pagination.currentPage);
            } else {
                console.warn("[books.js] loadPage: La respuesta de la API no incluye totalPages o currentPage dentro del objeto pagination. La paginación podría no ser precisa.");
                if (data.books.length === 0) paginationContainer.innerHTML = '';
            }
        } else if (data && Array.isArray(data)) { // Fallback si la API solo devuelve un array de libros (sin paginación)
            console.log('[books.js] loadPage: Datos recibidos como un array directo:', data.length, 'libros.');
            renderBooks(data);
            paginationContainer.innerHTML = ''; // No hay cómo generar paginación
            console.warn("[books.js] loadPage: La API devolvió un array de libros directamente, sin metadatos de paginación.");
        } else {
            console.error('[books.js] loadPage: No se recibieron datos válidos (esperando data.books y data.pagination) o estructura inesperada. Data recibida:', data);
            if (booksGrid) { // Solo limpiar si booksGrid existe
                booksGrid.innerHTML = '<p class="w-full text-center text-red-600">Error al procesar los datos de los libros. Estructura inesperada.</p>';
            }
            if (paginationContainer) paginationContainer.innerHTML = '';
        }
        if (booksGrid) booksGrid.scrollIntoView({ behavior: 'smooth' }); // Solo hacer scroll si booksGrid existe
    }

    function renderBooks(books) {
        booksGrid.innerHTML = ''; 
        console.log('[books.js] renderBooks: Iniciando renderizado de', books ? books.length : 0, 'libros.');
        if (!books || books.length === 0) {
            booksGrid.innerHTML = '<p class="w-full text-center">No se encontraron libros para mostrar.</p>';
            console.log('[books.js] renderBooks: No se encontraron libros o el array está vacío.');
            return;
        }

        const localPlaceholder = 'public/assets/books/placeholder.png';

        books.forEach(book => {
            let finalCoverUrl = localPlaceholder;
            const coverUrl = book.cover || book.cover_image_url;

            if (coverUrl && typeof coverUrl === 'string' && coverUrl.trim() !== '') {
                if (coverUrl.startsWith('public/')) {
                    finalCoverUrl = coverUrl.trim();
                } else {
                    finalCoverUrl = `public/${coverUrl.trim()}`;
                }
            } else {
                console.log(`Libro "${book.title}" no tiene propiedad 'cover' válida, usando placeholder.`);
            }

            const bookCardData = {  
                id: book.id ? book.id.toString() : '',
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
            
            const bookCardElement = document.createElement('book-card');
            for (const key in bookCardData) {
                if (bookCardData.hasOwnProperty(key)) {
                    bookCardElement.setAttribute(key, bookCardData[key]);
                }
            }
            // console.log('[books.js] renderBooks: Creando book-card con datos:', bookCardData);
            booksGrid.appendChild(bookCardElement);
            // console.log('[books.js] renderBooks: book-card añadido al DOM para el libro:', book.title);
        });
        console.log('[books.js] renderBooks: Renderizado completado.');
    }

    function renderPagination(totalPages, pageNum) { // pageNum es la página actual recibida del backend
        paginationContainer.innerHTML = ''; 
        console.log(`[books.js] renderPagination: Iniciando paginación - Total Páginas: ${totalPages}, Página Actual: ${pageNum}`);
        if (totalPages <= 1) {
            console.log('[books.js] renderPagination: No se necesita paginación (<= 1 página).');
            return;
        }
    
        const createButton = (text, page, isDisabled = false, isNavSymbol = false) => {
            const button = document.createElement('button');
            button.innerHTML = text; 
            
            button.classList.add(
                'px-3', 'py-1', 'border', 'rounded-md', 'text-sm', 'font-medium',
                'transition-colors', 'duration-150', 'ease-in-out', 'mx-0.5' // Añadido margen pequeño
            );

            if (isNavSymbol) {
                button.classList.add(
                    'bg-gray-200', 'dark:bg-gray-600', 'text-gray-700', 'dark:text-gray-200',
                    'border-gray-300', 'dark:border-gray-500'
                );
                if (!isDisabled) {
                    button.classList.add('hover:bg-gray-300', 'dark:hover:bg-gray-500');
                }
            } else { // Es un número de página
                if (page === pageNum) { // Botón activo
                    button.classList.add('bg-blue-500', 'text-white', 'border-blue-500', 'cursor-default');
                } else { // Botón de número de página normal
                    button.classList.add(
                        'bg-white', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-200',
                        'border-gray-300', 'dark:border-gray-600'
                    );
                    if(!isDisabled) {
                       button.classList.add('hover:bg-gray-100', 'dark:hover:bg-gray-600');
                    }
                }
            }
            
            button.disabled = isDisabled;
            if (isDisabled && !(page === pageNum && !isNavSymbol) ) { // Si está deshabilitado y no es el botón activo
                button.classList.add('opacity-50', 'cursor-not-allowed');
            } else if (page === pageNum && !isNavSymbol) {
                button.disabled = true; // El botón activo es siempre disabled
            }


            if (!isDisabled && !(page === pageNum && !isNavSymbol) ) {
                button.addEventListener('click', () => loadPage(page));
            }
            return button;
        };
       
        if (pageNum > 1 && totalPages > 3) { 
            paginationContainer.appendChild(createButton('« Primera', 1, false, true));
        }

        paginationContainer.appendChild(createButton('<span class="hidden sm:inline">Anterior</span><span class="sm:hidden">&lt;</span>', pageNum - 1, pageNum === 1, true));

        let startPage = Math.max(1, pageNum - 2);
        let endPage = Math.min(totalPages, pageNum + 2);

        if (pageNum <= 3) {
            endPage = Math.min(totalPages, 5);
        }
        if (pageNum > totalPages - 3) {
            startPage = Math.max(1, totalPages - 4);
        }
        
        if (startPage > 1) {
            paginationContainer.appendChild(createButton('1', 1, false, false));
            if (startPage > 2) {
                 const dots = document.createElement('span');
                 dots.textContent = '...';
                 dots.className = 'px-3 py-1 text-gray-700 dark:text-gray-300 mx-0.5';
                 paginationContainer.appendChild(dots);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = createButton(i.toString(), i, i === pageNum, false); // el botón activo se deshabilita
            paginationContainer.appendChild(pageButton);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.className = 'px-3 py-1 text-gray-700 dark:text-gray-300 mx-0.5';
                paginationContainer.appendChild(dots);
            }
            paginationContainer.appendChild(createButton(totalPages.toString(), totalPages, false, false));
        }

        paginationContainer.appendChild(createButton('<span class="hidden sm:inline">Siguiente</span><span class="sm:hidden">&gt;</span>', pageNum + 1, pageNum === totalPages, true));
        
        if (pageNum < totalPages && totalPages > 3) {
            paginationContainer.appendChild(createButton('Última »', totalPages, false, true));
        }
        console.log('[books.js] renderPagination: Paginación renderizada.');
    }

    // La función createPaginationButton ya no es necesaria, su lógica está en createButton.
    // function createPaginationButton(pageNumber, text, isActive = false) { ... }


    loadPage(currentPage); // Carga inicial de la página 1
}); 

// Esta función renderBookCard ya no se usa aquí directamente si book-card es un Custom Element
// que toma los datos vía atributos. La lógica de renderizado está ahora en renderBooks.
// function renderBookCard(bookData) { ... } 