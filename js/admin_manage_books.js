document.addEventListener('DOMContentLoaded', async () => {
    console.log('Admin Manage Books script loaded.');

    // Verificar rol de administrador (asumiendo que checkAdminRole está disponible globalmente o se importa)
    // Esta IIFE asegura que la verificación se haga antes de cargar datos sensibles
    (async () => {
        if (typeof checkAdminRole !== 'function') {
            console.error('checkAdminRole function is not defined. Ensure auth_check.js or similar is loaded PRIOR to this script.');
            alert('Error crítico de configuración: No se puede verificar el rol del administrador.');
            // Podrías redirigir a login o una página de error aquí si es apropiado
            // window.location.href = '/login.html';
            return; // Detener la ejecución adicional si no se puede verificar el rol
        }
        const isAdmin = await checkAdminRole();
        if (!isAdmin) {
            // checkAdminRole ya debería manejar la redirección si no es admin
            return; 
        }
        console.log('Admin role verified for book management.');
        // Si es admin, continuar con la carga de la página
        loadBooks();
        initializeBookModalListeners();
        initializeConfirmationModalListeners(); // Para el modal genérico
    })();
});

// Asumimos que checkAdminRole, fetchData, y los listeners/funciones del modal de confirmación 
// (confirmationModal, etc.) estarán disponibles (quizás en un script global o importados).
// Por ahora, duplicaremos fetchData y la lógica básica de modals si es necesario,
// pero idealmente, esto se refactorizaría en módulos compartidos.

// --- Lógica Específica para Libros ---

function initializeBookModalListeners() {
    const addBookBtn = document.getElementById('add-book-btn');
    const bookFormModal = document.getElementById('book-form-modal');
    const closeBookModalBtn = document.getElementById('close-book-modal-btn');
    const cancelBookFormBtn = document.getElementById('cancel-book-form-btn');
    const bookForm = document.getElementById('book-form');
    const bookCoverImageFile = document.getElementById('book-cover-image-file');
    const newCoverPreview = document.getElementById('new-cover-preview');

    if (addBookBtn) {
        addBookBtn.addEventListener('click', () => {
            document.getElementById('book-modal-title').textContent = 'Añadir Nuevo Libro';
            bookForm.reset();
            document.getElementById('book-id').value = '';
            document.getElementById('current-cover-preview').classList.add('hidden');
            document.getElementById('no-current-cover').classList.remove('hidden');
            newCoverPreview.classList.add('hidden');
            newCoverPreview.src = '#';
            bookCoverImageFile.value = null; // Resetear el input de archivo
            document.getElementById('book-cover-image-url-hidden').value = '';
            bookFormModal.showModal();
        });
    }

    if (closeBookModalBtn) closeBookModalBtn.addEventListener('click', () => bookFormModal.close());
    if (cancelBookFormBtn) cancelBookFormBtn.addEventListener('click', () => {
        bookFormModal.close();
        newCoverPreview.classList.add('hidden');
        newCoverPreview.src = '#';
        bookCoverImageFile.value = null;
    });
    
    if (bookFormModal) {
        bookFormModal.addEventListener('click', (event) => {
            if (event.target === bookFormModal) {
                bookFormModal.close();
                newCoverPreview.classList.add('hidden');
                newCoverPreview.src = '#';
                bookCoverImageFile.value = null;
            }
        });
    }

    if (bookForm) {
        bookForm.addEventListener('submit', handleBookFormSubmit);
    }

    if (bookCoverImageFile) {
        bookCoverImageFile.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    newCoverPreview.src = e.target.result;
                    newCoverPreview.classList.remove('hidden');
                }
                reader.readAsDataURL(file);
            } else {
                newCoverPreview.src = '#';
                newCoverPreview.classList.add('hidden');
            }
        });
    }
}

async function loadBooks() {
    console.log('Cargando lista de libros...');
    const booksTableBody = document.getElementById('books-table-body');
    if (!booksTableBody) {
        console.error('Elemento books-table-body no encontrado.');
        return;
    }
    booksTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-4">Cargando...</td></tr>';

    try {
        const response = await fetchData('/api/admin/books'); 
        if (response && response.ok && response.data && Array.isArray(response.data)) {
            const books = response.data;
            booksTableBody.innerHTML = ''; 
            if (books.length > 0) {
                books.forEach(book => {
                    const row = booksTableBody.insertRow();
                    const price = typeof book.price === 'number' ? book.price.toFixed(2) + ' €' : (book.price ? parseFloat(book.price).toFixed(2) + ' €' : 'N/A');
                    
                    let coverSrc = 'assets/books/placeholder.png'; // Placeholder por defecto
                    let localFilename = null;
                    if (book.cover_image_url) {
                        // Asumimos que cover_image_url es algo como "assets/books/nombre.jpg" o solo "nombre.jpg"
                        localFilename = book.cover_image_url.includes('/') ? 
                                        book.cover_image_url.substring(book.cover_image_url.lastIndexOf('/') + 1) :
                                        book.cover_image_url;
                        coverSrc = `assets/books/${localFilename}`; // Primer intento
                    }

                    row.innerHTML = `
                        <td class="px-6 py-4 text-sm">${book.id}</td>
                        <td class="px-6 py-4 text-sm">
                            <img src="${coverSrc}" alt="${book.title || 'Portada'}" class="h-16 w-auto object-contain book-cover-img" data-filename="${localFilename || ''}">
                        </td>
                        <td class="px-6 py-4 text-sm">${book.title}</td>
                        <td class="px-6 py-4 text-sm">${book.author || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm">${price}</td>
                        <td class="px-6 py-4 text-sm">${book.stock !== null ? book.stock : 'N/A'}</td>
                        <td class="px-6 py-4 text-sm">
                            <button class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 edit-book-btn" data-id="${book.id}">Editar</button>
                        </td>
                    `;

                    const imgElement = row.querySelector('.book-cover-img');
                    if (imgElement && localFilename) { // Solo añadir listeners si había un localFilename para intentar
                        imgElement.onerror = function() {
                            // El primer intento (assets/books/filename) falló.
                            // Intentar con public/assets/books/filename
                            console.warn(`Admin: Falló ${this.src}. Intentando public/assets/books/${localFilename}`);
                            this.src = `public/assets/books/${localFilename}`;
                            this.onerror = function() {
                                // El segundo intento (public/assets/books/filename) también falló.
                                // Usar placeholder.
                                console.warn(`Admin: Falló ${this.src}. Usando placeholder.`);
                                this.src = 'assets/books/placeholder.png';
                                this.onerror = null; // Evitar bucles si el placeholder falla
                            };
                        };
                    } else if (imgElement) { // Si no había localFilename, src ya es el placeholder.
                        imgElement.onerror = function() {
                             console.error(`Admin: Falló el placeholder ${this.src}.`);
                             this.onerror = null; // Evitar bucles
                        }
                    }
                });
            } else {
                booksTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-4">No se encontraron libros.</td></tr>';
            }
        } else {
            console.error('La respuesta de la API no contiene un array de libros válido:', response);
            booksTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-red-500">Error al procesar los datos: ${response.data?.message || 'Formato inesperado.'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error al cargar libros:', error);
        booksTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-red-500">Error: ${error.message || 'Desconocido.'}</td></tr>`;
    }
    addBookTableEventListeners();
}

function addBookTableEventListeners() {
    document.querySelectorAll('.edit-book-btn').forEach(button => {
        button.addEventListener('click', handleEditBook);
    });
    // No hay listeners para .toggle-active-btn ya que se eliminó la funcionalidad
}

// --- Funciones de Ayuda y Lógica de Modales de Confirmación (pueden ser compartidas/refactorizadas) ---
let currentActionToConfirm = null; // Específico para este script si no se comparte

function initializeConfirmationModalListeners() {
    const modal = document.getElementById('confirmation-modal');
    const confirmBtn = document.getElementById('confirmation-modal-confirm-btn');
    const cancelBtn = document.getElementById('confirmation-modal-cancel-btn');
    const okBtn = document.getElementById('success-modal-ok-btn');

    if (confirmBtn) confirmBtn.addEventListener('click', async () => {
        if (typeof currentActionToConfirm === 'function') {
            await currentActionToConfirm();
            currentActionToConfirm = null;
        }
    });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { modal.close(); currentActionToConfirm = null; });
    if (okBtn) okBtn.addEventListener('click', () => {
        const successModal = document.getElementById('confirmation-modal'); // Reutilizando el mismo modal
        if(successModal) successModal.close();
    }); 
    if (modal) modal.addEventListener('click', (event) => {
        if (event.target === modal) { modal.close(); currentActionToConfirm = null; }
    });
}

function showConfirmationModal(config) {
    // config = { title, message, confirmText, confirmClass (opcional), action }
    const modal = document.getElementById('confirmation-modal');
    document.getElementById('confirmation-modal-title').textContent = config.title;
    document.getElementById('confirmation-modal-message').textContent = config.message;
    
    const confirmBtn = document.getElementById('confirmation-modal-confirm-btn');
    confirmBtn.textContent = config.confirmText || 'Confirmar';
    confirmBtn.className = 'px-4 py-2 text-white rounded-md '; // Reset base classes
    if (config.confirmClass) {
        confirmBtn.classList.add(...config.confirmClass.split(' '));
    } else {
        confirmBtn.classList.add('bg-sky-600', 'hover:bg-sky-700');
    }

    document.getElementById('confirmation-modal-buttons').style.display = 'flex';
    document.getElementById('success-modal-buttons').style.display = 'none';
    currentActionToConfirm = config.action;
    modal.showModal();
}

function showOutcomeModal(isSuccess, message) {
    const modal = document.getElementById('confirmation-modal');
    document.getElementById('confirmation-modal-title').textContent = isSuccess ? 'Éxito' : 'Error';
    document.getElementById('confirmation-modal-message').textContent = message;
    document.getElementById('confirmation-modal-buttons').style.display = 'none';
    document.getElementById('success-modal-buttons').style.display = 'flex';
    if (!modal.open) modal.showModal();
}

// --- CRUD Handlers para Libros (a implementar) ---

async function handleBookFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const bookId = form.elements['book-id'].value;
    const actionType = bookId ? 'actualizar' : 'crear';

    const formData = new FormData();

    // Añadir todos los campos de texto/número
    formData.append('title', form.elements['book-title'].value);
    formData.append('author', form.elements['book-author'].value);
    formData.append('description', form.elements['book-description'].value);
    let priceValue = form.elements['book-price'].value;
    let price = parseFloat(priceValue.replace(',','.')); // Reemplazar coma por punto para parseFloat
    formData.append('price', isNaN(price) ? '' : price.toString());
    formData.append('stock', parseInt(form.elements['book-stock'].value, 10) || 0);
    formData.append('publication_date', form.elements['book-publication-date'].value || null);
    formData.append('tags', form.elements['book-tags'].value || '[]'); // Enviar como string JSON
    formData.append('publisher', form.elements['book-publisher'].value || null);
    
    // Para la actualización, enviar la URL actual si no se sube un nuevo archivo
    if (bookId) {
        formData.append('current_cover_image_url', form.elements['book-cover-image-url-hidden'].value);
    }

    // Añadir el archivo de imagen si se seleccionó uno
    const imageFile = form.elements['book-cover-image-file'].files[0];
    if (imageFile) {
        formData.append('bookCoverImage', imageFile);
    }
    
    // Log FormData para depuración (no funcionará con console.log directo para archivos)
    // for (let [key, value] of formData.entries()) { 
    //     console.log(key, value); 
    // }

    try {
        let response;
        let fetchOptions = {
            method: bookId ? 'PUT' : 'POST',
            body: formData // FormData se pasa directamente aquí
            // No establecer Content-Type, el navegador lo hará por nosotros con FormData
        };

        if (bookId) {
            response = await fetchData(`/api/admin/books/${bookId}`, fetchOptions);
        } else {
            response = await fetchData('/api/admin/books', fetchOptions);
        }

        if (response.ok) {
            document.getElementById('book-form-modal').close();
            // Limpiar previsualización y campo de archivo
            document.getElementById('new-cover-preview').classList.add('hidden');
            document.getElementById('new-cover-preview').src = '#';
            document.getElementById('book-cover-image-file').value = null;

            showOutcomeModal(true, `Libro ${actionType === 'crear' ? 'creado' : 'actualizado'} correctamente.`);
            await loadBooks();
        } else {
            showOutcomeModal(false, response.data?.message || 'Ocurrió un error al guardar el libro.');
        }
    } catch (error) {
        showOutcomeModal(false, error.message || 'Ocurrió un error al guardar el libro.');
    }
}

async function handleEditBook(event) {
    const bookId = event.target.dataset.id;
    try {
        const response = await fetchData(`/api/admin/books/${bookId}`);
        if (response.ok && response.data) {
            const book = response.data;
            const form = document.getElementById('book-form');
            form.elements['book-id'].value = book.id;
            form.elements['book-title'].value = book.title;
            form.elements['book-author'].value = book.author;
            form.elements['book-description'].value = book.description;
            
            const priceValue = parseFloat(book.price);
            // Para input type="number", es mejor asignar el valor con punto decimal o como número.
            // El navegador lo mostrará con coma si la configuración regional así lo indica.
            form.elements['book-price'].value = !isNaN(priceValue) ? priceValue : ''; 
            
            form.elements['book-stock'].value = book.stock;
            form.elements['book-publication-date'].value = book.publication_date ? book.publication_date.split('T')[0] : '';
            
            // Manejo de la imagen de portada actual
            const currentCoverPreview = document.getElementById('current-cover-preview');
            const noCurrentCover = document.getElementById('no-current-cover');
            const hiddenCoverUrlInput = document.getElementById('book-cover-image-url-hidden');
            
            if (book.cover_image_url) {
                currentCoverPreview.src = 'http://localhost:3000/' + book.cover_image_url; // Corregido para apuntar al backend
                currentCoverPreview.classList.remove('hidden');
                noCurrentCover.classList.add('hidden');
                hiddenCoverUrlInput.value = book.cover_image_url;
            } else {
                currentCoverPreview.classList.add('hidden');
                currentCoverPreview.src = '#';
                noCurrentCover.classList.remove('hidden');
                hiddenCoverUrlInput.value = '';
            }
            // Resetear el campo de archivo y la nueva previsualización
            document.getElementById('book-cover-image-file').value = null;
            document.getElementById('new-cover-preview').src = '#';
            document.getElementById('new-cover-preview').classList.add('hidden');

            form.elements['book-tags'].value = book.tags ? JSON.stringify(book.tags) : '[]';
            form.elements['book-publisher'].value = book.publisher;
            
            document.getElementById('book-modal-title').textContent = 'Editar Libro';
            document.getElementById('book-form-modal').showModal();
        } else {
            showOutcomeModal(false, response.data?.message || 'No se pudieron cargar los datos del libro para editar.');
        }
    } catch (error) {
        showOutcomeModal(false, error.message || 'No se pudieron cargar los datos del libro para editar.');
    }
}

// La función handleToggleActiveStateBook ha sido eliminada.

// --- Funciones fetchData y checkAdminRole (Idealmente compartidas) ---
// Reutilizar las versiones de admin_manage_users.js o mover a un script común.
// Por brevedad, se asume que están disponibles globalmente o importadas.

// Ejemplo de fetchData (adaptar si es necesario):
async function fetchData(apiPath, options = {}) {
    const token = localStorage.getItem('authToken');
    const baseUrl = 'http://localhost:3000'; 
    const fullApiUrl = baseUrl + apiPath;
    
    const fetchOptions = { ...options }; // Clonar opciones para no modificar el original
    fetchOptions.headers = { ...options.headers }; // Clonar headers

    if (token) {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    // Si el body es FormData, no establecer Content-Type manualmente.
    // El navegador lo hará con el boundary correcto.
    if (!(fetchOptions.body instanceof FormData)) {
        fetchOptions.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(fullApiUrl, fetchOptions);
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showOutcomeModal(false, 'Sesión expirada o no autorizado. Serás redirigido al login.');
                setTimeout(() => {
                    localStorage.removeItem('authToken'); 
                    localStorage.removeItem('userData');
                    window.location.href = '/login.html';
                }, 3000);
                throw { status: response.status, message: 'Sesión expirada o no autorizado.', isAuthError: true };
            }
            let errorData = { message: response.statusText };
            try {
                errorData = await response.json();
            } catch (e) { /* Silently ignore if body is not JSON */ }
            throw { status: response.status, message: errorData.message || response.statusText, isFetchError: true, data: errorData };
        }

        if (response.status === 204) { 
            return { ok: true, status: 204, data: null };
        }
        const data = await response.json();
        return { ok: true, status: response.status, data: data };

    } catch (error) {
        if (error.isFetchError || error.isAuthError) {
            console.error(`API error from ${fullApiUrl}: Status ${error.status}, Message: ${error.message}`);
            throw error; 
        }
        console.error(`Network or unexpected error from ${fullApiUrl}:`, error);
        throw { message: `Error de conexión o inesperado: ${error.message}`, isNetworkError: true };
    }
}

// Definición de checkAdminRole (si no está en un script global como auth_check.js)
async function checkAdminRole() {
    const token = localStorage.getItem('authToken'); 
    if (!token) {
        window.location.href = '/login.html'; 
        return false; 
    }
    try {
        const response = await fetch('http://localhost:3000/api/auth/verify-admin', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.isAdmin === true) return true;
        }
        alert('Acceso denegado. No tienes permisos de administrador.');
        localStorage.removeItem('authToken'); localStorage.removeItem('userData');
        window.location.href = '/login.html'; 
        return false;
    } catch (error) {
        alert('Error de conexión al verificar tu rol.');
        window.location.href = '/login.html';
        return false;
    }
}
