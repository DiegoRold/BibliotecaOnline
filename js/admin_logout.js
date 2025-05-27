document.addEventListener('DOMContentLoaded', () => {
    const adminLogoutLink = document.getElementById('admin-logout-link');
    const confirmAdminLogoutModal = document.getElementById('confirm-admin-logout-modal'); // Este ID puede variar si el modal está en cada página
    const cancelAdminLogoutBtn = document.getElementById('cancel-admin-logout-btn');
    const confirmAdminLogoutActionBtn = document.getElementById('confirm-admin-logout-action-btn');

    // Si el modal de logout no está en esta página específica, estos elementos podrían no existir.
    // La lógica de admin_dashboard.js ya maneja esto, aquí es una versión simplificada o para páginas que SÍ tengan el modal.

    if (adminLogoutLink) {
        adminLogoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Si existe un modal de confirmación específico en la página actual, usarlo.
            // Asumimos que el HTML de cada página de admin que necesite esto incluirá el modal.
            const pageSpecificModal = document.getElementById('confirm-admin-logout-modal'); // Re-chequear por si acaso
            if (pageSpecificModal && typeof pageSpecificModal.showModal === 'function') {
                pageSpecificModal.showModal();
            } else {
                // Fallback si no hay modal en esta página o no es soportado
                if (confirm('¿Estás seguro de que quieres cerrar la sesión de administrador?')) {
                    performAdminLogout();
                }
            }
        });
    }

    if (cancelAdminLogoutBtn && confirmAdminLogoutModal) {
        cancelAdminLogoutBtn.addEventListener('click', () => {
            confirmAdminLogoutModal.close();
        });
    }

    if (confirmAdminLogoutActionBtn && confirmAdminLogoutModal) {
        confirmAdminLogoutActionBtn.addEventListener('click', () => {
            performAdminLogout();
            confirmAdminLogoutModal.close();
        });
    }
    
    // Opcional: Cerrar modal si se hace clic fuera del contenido del modal.
    if (confirmAdminLogoutModal) {
        confirmAdminLogoutModal.addEventListener('click', (event) => {
            if (event.target === confirmAdminLogoutModal) {
                 confirmAdminLogoutModal.close();
            }
        });
    }
});

function performAdminLogout() {
    console.log('Admin cerrando sesión...');
    localStorage.removeItem('authToken'); 
    localStorage.removeItem('userData'); 
    // Considera si hay otros items específicos de admin en localStorage para limpiar
    // Idealmente, redirigir a una página que no requiera autenticación.
    window.location.href = '/login.html'; // Redirigir a la página de login
} 