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

    if (addBookBtn) {
        addBookBtn.addEventListener('click', () => {
            document.getElementById('book-modal-title').textContent = 'Añadir Nuevo Libro';
            bookForm.reset();
            document.getElementById('book-id').value = '';
            bookFormModal.showModal();
        });
    }

    if (closeBookModalBtn) closeBookModalBtn.addEventListener('click', () => bookFormModal.close());
    if (cancelBookFormBtn) cancelBookFormBtn.addEventListener('click', () => bookFormModal.close());
    
    if (bookFormModal) {
        bookFormModal.addEventListener('click', (event) => {
            if (event.target === bookFormModal) bookFormModal.close();
        });
    }

    if (bookForm) {
        bookForm.addEventListener('submit', handleBookFormSubmit);
    }
}

async function loadBooks() {
    console.log('Cargando lista de libros...');
    const booksTableBody = document.getElementById('books-table-body');
    if (!booksTableBody) {
        console.error('Elemento books-table-body no encontrado.');
        return;
    }

    const books = await fetchData('/api/admin/books'); // Endpoint que crearemos
    console.log('Respuesta de fetchData para /api/admin/books:', JSON.stringify(books)); // LOG AÑADIDO
    booksTableBody.innerHTML = ''; 

    if (books && Array.isArray(books) && books.length > 0) { // Condición más robusta
        books.forEach(book => {
            const row = booksTableBody.insertRow();
            // Asegurarse de que los campos coincidan con tu tabla de libros
            row.innerHTML = `
                <td class="px-6 py-4 text-sm">${book.id}</td>
                <td class="px-6 py-4 text-sm"><img src="${book.cover_image_url || 'assets/placeholder_cover.png'}" alt="${book.title}" class="h-16 w-auto object-contain"></td>
                <td class="px-6 py-4 text-sm">${book.title}</td>
                <td class="px-6 py-4 text-sm">${book.author || 'N/A'}</td>
                <td class="px-6 py-4 text-sm">${book.price ? book.price.toFixed(2) + ' €' : 'N/A'}</td>
                <td class="px-6 py-4 text-sm">${book.stock !== null ? book.stock : 'N/A'}</td>
                <td class="px-6 py-4 text-sm">
                    <button class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 edit-book-btn" data-id="${book.id}">Editar</button>
                    <button class="text-red-600 hover:text-red-900 dark:text-red-400 ml-2 delete-book-btn" data-id="${book.id}">Eliminar</button>
                </td>
            `;
        });
    } else if (books && Array.isArray(books) && books.length === 0) { // Condición más robusta para array vacío
        booksTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-4">No se encontraron libros.</td></tr>';
    } else {
        console.error('La variable books no es un array o es null/undefined:', books); // Log de error adicional
        booksTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-red-500">Error al cargar libros (respuesta no válida).</td></tr>';
    }
    addBookTableEventListeners();
}

function addBookTableEventListeners() {
    document.querySelectorAll('.edit-book-btn').forEach(button => {
        button.addEventListener('click', handleEditBook);
    });
    document.querySelectorAll('.delete-book-btn').forEach(button => {
        button.addEventListener('click', handleDeleteBook);
    });
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
    if (okBtn) okBtn.addEventListener('click', () => modal.close());
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

    // Recoger todos los datos del formulario
    const bookData = {
        title: form.elements['book-title'].value,
        author: form.elements['book-author'].value,
        description: form.elements['book-description'].value,
        price: parseFloat(form.elements['book-price'].value),
        stock: parseInt(form.elements['book-stock'].value, 10),
        publication_date: form.elements['book-publication-date'].value || null,
        cover_image_url: form.elements['book-cover-image-url'].value || null,
        tags: form.elements['book-tags'].value ? JSON.parse(form.elements['book-tags'].value) : [],
        publisher: form.elements['book-publisher'].value || null
    };
    // Validar tags JSON?
    try {
        if (form.elements['book-tags'].value) JSON.parse(form.elements['book-tags'].value);
    } catch (e) {
        showOutcomeModal(false, 'El formato de Tags JSON no es válido.');
        return;
    }

    showConfirmationModal({
        title: `Confirmar ${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Libro`,
        message: `¿Estás seguro de que quieres ${actionType} este libro?`,
        action: async () => {
            let response;
            if (bookId) {
                response = await fetchData(`/api/admin/books/${bookId}`, { method: 'PUT', body: JSON.stringify(bookData) });
            } else {
                response = await fetchData('/api/admin/books', { method: 'POST', body: JSON.stringify(bookData) });
            }
            if (response !== null && (response.id || response.message || response === undefined)) {
                document.getElementById('book-form-modal').close();
                showOutcomeModal(true, `Libro ${actionType === 'crear' ? 'creado' : 'actualizado'} correctamente.`);
                await loadBooks();
            } else {
                showOutcomeModal(false, 'Ocurrió un error al guardar el libro.');
            }
        }
    });
}

async function handleEditBook(event) {
    const bookId = event.target.dataset.id;
    const book = await fetchData(`/api/admin/books/${bookId}`);
    if (book) {
        const form = document.getElementById('book-form');
        form.elements['book-id'].value = book.id;
        form.elements['book-title'].value = book.title;
        form.elements['book-author'].value = book.author;
        form.elements['book-description'].value = book.description;
        form.elements['book-price'].value = book.price;
        form.elements['book-stock'].value = book.stock;
        form.elements['book-publication-date'].value = book.publication_date ? book.publication_date.split('T')[0] : ''; // Formato YYYY-MM-DD
        form.elements['book-cover-image-url'].value = book.cover_image_url;
        form.elements['book-tags'].value = book.tags ? JSON.stringify(book.tags) : '';
        form.elements['book-publisher'].value = book.publisher;
        
        document.getElementById('book-modal-title').textContent = 'Editar Libro';
        document.getElementById('book-form-modal').showModal();
    } else {
        showOutcomeModal(false, 'No se pudieron cargar los datos del libro para editar.');
    }
}

async function handleDeleteBook(event) {
    const bookId = event.target.dataset.id;
    showConfirmationModal({
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de que quieres eliminar el libro ID: ${bookId}?`,
        confirmText: 'Eliminar',
        confirmClass: 'bg-red-600 hover:bg-red-700',
        action: async () => {
            const response = await fetchData(`/api/admin/books/${bookId}`, { method: 'DELETE' });
            if (response === null) { // DELETE exitoso devuelve 204, fetchData lo convierte a null
                showOutcomeModal(true, 'Libro eliminado correctamente.');
                await loadBooks();
            } else {
                showOutcomeModal(false, 'Error al eliminar el libro.');
            }
        }
    });
}

// --- Funciones fetchData y checkAdminRole (Idealmente compartidas) ---
// Reutilizar las versiones de admin_manage_users.js o mover a un script común.
// Por brevedad, se asume que están disponibles globalmente o importadas.

// Ejemplo de fetchData (adaptar si es necesario):
async function fetchData(apiPath, options = {}) {
    const token = localStorage.getItem('authToken');
    const baseUrl = 'http://localhost:3000'; 
    const fullApiUrl = baseUrl + apiPath;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(fullApiUrl, { ...options, headers });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showOutcomeModal(false, 'Sesión expirada o no autorizado.'); 
                localStorage.removeItem('authToken'); localStorage.removeItem('userData');
                window.location.href = '/login.html';
                throw new Error('Unauthorized');
            }
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
        }
        return response.status === 204 ? null : await response.json();
    } catch (error) {
        console.error(`Fetch error from ${fullApiUrl}:`, error);
        showOutcomeModal(false, `Error de conexión: ${error.message}`);
        return null; 
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
