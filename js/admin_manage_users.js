document.addEventListener('DOMContentLoaded', async () => {
    console.log('Admin Manage Users script loaded.');

    // Reutilizar la función checkAdminRole o asegurar que el acceso está protegido
    // Esta función debería existir globalmente o ser importada si está en un módulo
    // Por ahora, asumimos que una función similar a la de admin_dashboard.js está disponible
    // o que el acceso ya fue validado por un script previo si se navega desde el dashboard.

    // Ejemplo de cómo podrías volver a verificar (si no estás seguro de que se hizo antes):
    /*
    if (typeof checkAdminRole === 'function') {
        const isAdmin = await checkAdminRole(); 
        if (!isAdmin) {
            alert('Acceso denegado. Debes ser administrador para ver esta página.');
            window.location.href = 'login.html'; 
            return;
        }
        console.log('Acceso de administrador verificado para gestionar usuarios.');
    } else {
        console.warn('checkAdminRole function not found. Asegúrate de que la validación de admin esté implementada.');
        // Considera redirigir o bloquear si no se puede verificar el rol aquí
    }
    */

    // Aquí irán las funciones para cargar usuarios, manejar el modal, etc.
    loadUsers();

    const addUserBtn = document.getElementById('add-user-btn');
    const userFormModal = document.getElementById('user-form-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelFormBtn = document.getElementById('cancel-form-btn');
    const userForm = document.getElementById('user-form');

    // Elementos del nuevo modal de confirmación/éxito
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationModalTitle = document.getElementById('confirmation-modal-title');
    const confirmationModalMessage = document.getElementById('confirmation-modal-message');
    const confirmationModalButtons = document.getElementById('confirmation-modal-buttons');
    const successModalButtons = document.getElementById('success-modal-buttons');
    const confirmationModalConfirmBtn = document.getElementById('confirmation-modal-confirm-btn');
    const confirmationModalCancelBtn = document.getElementById('confirmation-modal-cancel-btn');
    const successModalOkBtn = document.getElementById('success-modal-ok-btn');

    // Variable para almacenar la acción a confirmar
    let actionToConfirm = null;

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'Añadir Nuevo Usuario';
            userForm.reset(); // Limpiar el formulario
            document.getElementById('user-id').value = ''; // Asegurar que no hay ID oculto
            userFormModal.showModal();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => userFormModal.close());
    }

    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', () => userFormModal.close());
    }
    
    // Cerrar modal si se hace clic fuera (en el backdrop)
    if (userFormModal) {
        userFormModal.addEventListener('click', (event) => {
            if (event.target === userFormModal) {
                userFormModal.close();
            }
        });
    }

    // Lógica para enviar el formulario (añadir/editar usuario)
    if (userForm) {
        userForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const userId = document.getElementById('user-id').value;
            const actionType = userId ? 'actualizar' : 'crear';
            const password = document.getElementById('password').value;

            if (!userId && !password) {
                // Mostrar mensaje de error en el modal de formulario o como alerta temporal
                alert('La contraseña es requerida para nuevos usuarios.');
                // Podrías usar un pequeño espacio en el modal del formulario para mostrar este error
                return;
            }
            
            // Configurar y mostrar modal de confirmación
            confirmationModalTitle.textContent = `Confirmar ${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Usuario`;
            confirmationModalMessage.textContent = `¿Estás seguro de que quieres ${actionType} este usuario?`;
            confirmationModalButtons.style.display = 'flex';
            successModalButtons.style.display = 'none';
            confirmationModalConfirmBtn.className = 'px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md'; // Reset class
            confirmationModalConfirmBtn.textContent = 'Confirmar';

            actionToConfirm = async () => {
                const nombre = document.getElementById('nombre').value;
                const email = document.getElementById('email').value;
                const rol = document.getElementById('rol').value;
                
                const userData = { nombre, email, rol };
                if (password) userData.password = password; // Incluir solo si se proveyó

                let response;
                if (userId) {
                    response = await fetchData(`/api/admin/users/${userId}`, {
                        method: 'PUT',
                        body: JSON.stringify(userData)
                    });
                } else {
                    response = await fetchData('/api/admin/users', {
                        method: 'POST',
                        body: JSON.stringify(userData)
                    });
                }

                if (response !== null && (response.id || response.message || response === undefined)) { // Undefined para PUT exitoso sin cuerpo
                    userFormModal.close();
                    showSuccessModal(userId ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
                    await loadUsers();
                } else {
                    showErrorModal('Ocurrió un error al guardar el usuario.');
                }
            };
            confirmationModal.showModal();
        });
    }

    // Manejador para el botón de confirmación del modal genérico
    if (confirmationModalConfirmBtn) {
        confirmationModalConfirmBtn.addEventListener('click', async () => {
            if (typeof actionToConfirm === 'function') {
                await actionToConfirm();
                actionToConfirm = null; // Resetear la acción
                // No cerramos el modal aquí, se maneja en showSuccessModal o showErrorModal
            }
        });
    }

    if (confirmationModalCancelBtn) {
        confirmationModalCancelBtn.addEventListener('click', () => {
            confirmationModal.close();
            actionToConfirm = null; // Resetear la acción
        });
    }

    if (successModalOkBtn) {
        successModalOkBtn.addEventListener('click', () => {
            confirmationModal.close();
        });
    }
    
    // Cerrar modal de confirmación si se hace clic fuera (en el backdrop)
    if(confirmationModal){
        confirmationModal.addEventListener('click', (event) => {
            if (event.target === confirmationModal) {
                confirmationModal.close();
                actionToConfirm = null;
            }
        });
    }

    function showSuccessModal(message) {
        confirmationModalTitle.textContent = 'Éxito';
        confirmationModalMessage.textContent = message;
        confirmationModalButtons.style.display = 'none';
        successModalButtons.style.display = 'flex';
        // Asegurarse de que el modal esté abierto si se llamó sin que estuviera visible
        if (!confirmationModal.open) {
            confirmationModal.showModal();
        }
    }

    function showErrorModal(message) {
        confirmationModalTitle.textContent = 'Error';
        confirmationModalMessage.textContent = message;
        confirmationModalButtons.style.display = 'none'; // Ocultar botones de confirmar/cancelar
        successModalButtons.style.display = 'flex'; // Mostrar solo el botón OK
        confirmationModalConfirmBtn.className = 'px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md'; // Opcional: Cambiar color a rojo para OK en error
        successModalOkBtn.textContent = 'Aceptar'; // Asegurar que el botón OK sea genérico
         if (!confirmationModal.open) {
            confirmationModal.showModal();
        }
    }

});

async function fetchData(apiPath, options = {}) {
    const token = localStorage.getItem('authToken');
    const baseUrl = 'http://localhost:3000'; 
    const fullApiUrl = baseUrl + apiPath;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(fullApiUrl, { ...options, headers });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Sesión expirada o no autorizado. Por favor, inicie sesión como administrador.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'login.html';
                throw new Error('Unauthorized'); // Detener ejecución adicional
            }
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
        }
        // Si la respuesta no tiene contenido (ej. en un DELETE o PUT exitoso sin body)
        if (response.status === 204) {
            return null; 
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${fullApiUrl}:`, error);
        // alert(`Error al comunicar con el servidor: ${error.message}`); // Podría ser muy ruidoso
        return null; 
    }
}

async function loadUsers() {
    console.log('Cargando lista de usuarios...');
    const usersTableBody = document.getElementById('users-table-body');
    if (!usersTableBody) {
        console.error('Elemento users-table-body no encontrado.');
        return;
    }

    // Endpoint temporal, lo crearemos en el backend luego
    const users = await fetchData('/api/admin/users'); 

    usersTableBody.innerHTML = ''; // Limpiar mensaje de "Cargando..."

    if (users && users.length > 0) {
        users.forEach(user => {
            const row = usersTableBody.insertRow();
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">${user.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${user.nombre || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${user.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${user.rol}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${new Date(user.fecha_creacion).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-3 edit-user-btn" data-id="${user.id}">Editar</button>
                </td>
            `;
        });
    } else if (users) {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No se encontraron usuarios.</td></tr>';
    } else {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Error al cargar usuarios.</td></tr>';
    }
    console.log('Lista de usuarios cargada o intento finalizado.');
    addTableEventListeners(); // Añadir listeners para los botones de editar/eliminar
}

function addTableEventListeners() {
    document.querySelectorAll('.edit-user-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.target.dataset.id;
            console.log(`Editando usuario ID: ${userId}`);
            const user = await fetchData(`/api/admin/users/${userId}`);
            if (user) {
                document.getElementById('modal-title').textContent = 'Editar Usuario';
                document.getElementById('user-id').value = user.id;
                document.getElementById('nombre').value = user.nombre;
                document.getElementById('email').value = user.email;
                document.getElementById('rol').value = user.rol;
                document.getElementById('password').value = ''; // Limpiar campo de contraseña
                document.getElementById('password').placeholder = 'Dejar en blanco para no cambiar';
                
                // No mostramos el formulario directamente, preparamos para la confirmación si es necesario
                // o simplemente abrimos el formulario y la confirmación se hará al enviar.
                const userFormModal = document.getElementById('user-form-modal');
                userFormModal.showModal();
            } else {
                // Aquí podríamos usar showErrorModal si el error es crítico
                showErrorModal('No se pudieron cargar los datos del usuario para editar.');
            }
        });
    });
}

// Asumimos que `checkAdminRole` y `adminLogout` están disponibles globalmente o en `admin_logout.js`.
// Si `admin_logout.js` contiene la lógica de logout del dashboard, podría ser reutilizado.
// La función `checkAdminRole` es crucial y debería ser una de las primeras cosas en ejecutarse.
// Para modularidad, podrías tener un `auth_check.js` que se carga en todas las páginas de admin.

// Aquí está la función checkAdminRole (similar a la del dashboard) para que este script funcione de forma independiente
// si se accede directamente a admin_manage_users.html
async function checkAdminRole() {
    const token = localStorage.getItem('authToken'); 
    if (!token) {
        console.log('No se encontró authToken. Redirigiendo a login...');
        window.location.href = 'login.html'; 
        return false; 
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/verify-admin', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.isAdmin === true) {
                console.log('Rol de administrador verificado.');
                return true;
            } else {
                console.warn('El usuario no es administrador según el backend.');
                alert('Acceso denegado. No tienes permisos de administrador.');
                window.location.href = 'login.html'; 
                return false;
            }
        } else {
            console.error('Error verificando rol de admin con el backend (respuesta no OK):', response.status);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            alert('Error al verificar tu sesión. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
            return false;
        }
    } catch (error) {
        console.error('Error de red o excepción al verificar rol de admin:', error);
        alert('Error de conexión al verificar tu rol. Inténtalo más tarde.');
        window.location.href = 'login.html'; // O una página de error
        return false;
    }
}

// Ejecutar checkAdminRole al inicio del script, antes de cargar datos sensibles.
(async () => {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
        // La redirección ya se maneja dentro de checkAdminRole si no es admin
        return; 
    }
    // Si es admin, continuar con la carga de la página (ya está en DOMContentLoaded)
})(); 