document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    // Quitar la carga inicial de userData de localStorage aquí, se hará después de verificar el token y cargar desde el servidor.

    if (!authToken) {
        console.warn('Usuario no autenticado. Redirigiendo a login.');
        window.location.href = 'login.html';
        return;
    }

    // --- Selección de Elementos del DOM ---
    // Información Personal
    const profileNameInput = document.getElementById('profile-name');
    const profileEmailInput = document.getElementById('profile-email');
    const editProfileInfoBtn = document.getElementById('edit-profile-info-btn');
    const saveProfileInfoBtn = document.getElementById('save-profile-info-btn');
    const profileInfoForm = document.getElementById('profile-info-form');

    // Dirección de Envío
    const shippingAddressForm = document.getElementById('shipping-address-form');
    const editShippingAddressBtn = document.getElementById('edit-shipping-address-btn');
    const saveShippingAddressBtn = document.getElementById('save-shipping-address-btn');
    const addressInputs = {
        street: document.getElementById('profile-street'),
        apartment: document.getElementById('profile-apartment'),
        zip: document.getElementById('profile-zip'),
        city: document.getElementById('profile-city'),
        state: document.getElementById('profile-state'),
        country: document.getElementById('profile-country')
    };

    // Seguridad de la Cuenta
    const changePasswordForm = document.getElementById('change-password-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');

    // Menú de Navegación Lateral y Logout
    const profileNavLinks = document.querySelectorAll('.profile-nav ul li a');
    const profileSections = document.querySelectorAll('.profile-content section');
    const profileSidebarLogoutLink = document.getElementById('profile-sidebar-logout-link');

    let userData = {}; // Para almacenar los datos del usuario cargados del servidor

    // --- Funciones API ---
    const API_BASE_URL = 'http://localhost:3000/api';

    async function fetchUserProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/perfil`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (response.status === 401 || response.status === 403) {
                console.warn('Token inválido o expirado. Redirigiendo a login.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'login.html';
                return null;
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar el perfil del usuario.');
            }
            return await response.json();
        } catch (error) {
            console.error('Error en fetchUserProfile:', error);
            showNotification(`Error al cargar datos del perfil: ${error.message}`, 'error');
            return null;
        }
    }

    async function updateProfileData(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });
            if (response.status === 401 || response.status === 403) {
                console.warn('Token inválido o expirado. Redirigiendo a login.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'login.html';
                return null;
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el perfil.');
            }
            return await response.json();
        } catch (error) {
            console.error('Error en updateProfileData:', error);
            showNotification(`Error al actualizar el perfil: ${error.message}`, 'error');
            return null;
        }
    }

    async function changePassword(passwords) {
        try {
            const response = await fetch(`${API_BASE_URL}/perfil/cambiar-contrasena`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(passwords)
            });
            if (response.status === 401 || response.status === 403) {
                console.warn('Token inválido o expirado. Redirigiendo a login.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'login.html';
                return null;
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cambiar la contraseña.');
            }
            return await response.json();
        } catch (error) {
            console.error('Error en changePassword:', error);
            showNotification(`Error al cambiar la contraseña: ${error.message}`, 'error');
            return null;
        }
    }

    // --- Funciones para poblar datos y manejar UI ---
    function populateProfileForm(profileData) {
        if (!profileData) return;
        userData = { ...profileData }; // Actualizar la variable global

        if (profileNameInput) profileNameInput.value = userData.nombre || '';
        if (profileEmailInput) profileEmailInput.value = userData.email || '';

        if (addressInputs.street) addressInputs.street.value = userData.direccion_calle || '';
        if (addressInputs.apartment) addressInputs.apartment.value = userData.direccion_detalle || '';
        if (addressInputs.zip) addressInputs.zip.value = userData.direccion_cp || '';
        if (addressInputs.city) addressInputs.city.value = userData.direccion_ciudad || '';
        if (addressInputs.state) addressInputs.state.value = userData.direccion_provincia || '';
        if (addressInputs.country) addressInputs.country.value = userData.direccion_pais || '';
        
        // Actualizar localStorage con los datos del servidor (excepto campos sensibles que no se envían)
        const { password_hash, ...userSafeData } = userData; // Excluir password_hash si viniera
        localStorage.setItem('userData', JSON.stringify(userSafeData));
        if (window.updateUserUI) window.updateUserUI(); // Actualizar UI global si es necesario
    }

    function toggleFormEdit(formElement, editBtn, saveBtn, isEditing) {
        const inputs = formElement.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input) input.disabled = !isEditing;
        });
        if (editBtn) editBtn.classList.toggle('hidden', isEditing);
        if (saveBtn) saveBtn.classList.toggle('hidden', !isEditing);
        if (isEditing) {
            const firstInput = inputs[0];
            if (firstInput) firstInput.focus();
        }
    }

    // --- Event Listeners ---

    // Información Personal: Editar/Guardar
    if (editProfileInfoBtn && profileInfoForm) {
        editProfileInfoBtn.addEventListener('click', () => {
            toggleFormEdit(profileInfoForm, editProfileInfoBtn, saveProfileInfoBtn, true);
        });
    }
    if (profileInfoForm && saveProfileInfoBtn) {
        profileInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedInfo = {
                nombre: profileNameInput.value,
                email: profileEmailInput.value,
                // Incluir campos de dirección para que el endpoint único los pueda tomar si se editan desde aquí
                // o mantenerlos si no se cambian. El backend espera todos los campos de perfil.
                direccion_calle: addressInputs.street.value,
                direccion_detalle: addressInputs.apartment.value,
                direccion_cp: addressInputs.zip.value,
                direccion_ciudad: addressInputs.city.value,
                direccion_provincia: addressInputs.state.value,
                direccion_pais: addressInputs.country.value,
            };

            const result = await updateProfileData(updatedInfo);
            if (result && result.message) { // La respuesta del backend incluye 'message' y los datos actualizados
                showNotification(result.message, 'success');
                populateProfileForm(result); // Repopular con los datos devueltos por el servidor
                toggleFormEdit(profileInfoForm, editProfileInfoBtn, saveProfileInfoBtn, false);
            } else if (result === null && (localStorage.getItem('authToken') === null)) {
                // Ya se redirigió o hubo un error fatal, no hacer nada más.
            } else {
                // Error manejado por updateProfileData (alerta ya mostrada)
            }
        });
    }

    // Dirección de Envío: Editar/Guardar
    if (editShippingAddressBtn && shippingAddressForm) {
        editShippingAddressBtn.addEventListener('click', () => {
            toggleFormEdit(shippingAddressForm, editShippingAddressBtn, saveShippingAddressBtn, true);
        });
    }
    if (shippingAddressForm && saveShippingAddressBtn) {
        shippingAddressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedAddress = {
                nombre: profileNameInput.value, // Enviar nombre y email actuales también
                email: profileEmailInput.value,
                direccion_calle: addressInputs.street.value,
                direccion_detalle: addressInputs.apartment.value,
                direccion_cp: addressInputs.zip.value,
                direccion_ciudad: addressInputs.city.value,
                direccion_provincia: addressInputs.state.value,
                direccion_pais: addressInputs.country.value,
            };
            const result = await updateProfileData(updatedAddress);
            if (result && result.message) {
                showNotification(result.message, 'success');
                populateProfileForm(result); // Repopular con los datos devueltos por el servidor
                toggleFormEdit(shippingAddressForm, editShippingAddressBtn, saveShippingAddressBtn, false);
            } else if (result === null && (localStorage.getItem('authToken') === null)) {
                // Ya se redirigió o hubo un error fatal.
            }
        });
    }

    // Seguridad de la Cuenta: Cambiar Contraseña
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                showNotification('Por favor, completa todos los campos de contraseña.', 'info');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                showNotification('La nueva contraseña y la confirmación no coinciden.', 'error');
                return;
            }
            if (newPassword.length < 8) {
                showNotification('La nueva contraseña debe tener al menos 8 caracteres.', 'info');
                return;
            }

            const result = await changePassword({ currentPassword, newPassword });
            if (result && result.message) {
                showNotification(result.message, 'success');
                changePasswordForm.reset();
            } else if (result === null && (localStorage.getItem('authToken') === null)) {
                // Redirección ya manejada
            }
        });
    }

    // Navegación del Menú Lateral y Scrollspy básico (sin cambios respecto a la versión anterior)
    profileNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#') && this.getAttribute('id') !== 'profile-sidebar-logout-link') {
                e.preventDefault();
                profileNavLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
    
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        profileSections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3 - 50)) { 
                currentSectionId = '#' + section.getAttribute('id');
            }
        });

        profileNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentSectionId && currentSectionId) {
                link.classList.add('active');
            }
        });
        if (!currentSectionId && profileNavLinks.length > 0 && profileNavLinks[0].getAttribute('href').startsWith('#')) {
             if (!document.querySelector('.profile-nav ul li a.active')) {
                profileNavLinks[0].classList.add('active');
             }
        }
    });

    // Cerrar Sesión
    if (profileSidebarLogoutLink) {
        profileSidebarLogoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.logoutUser === 'function') {
                if (confirm('¿Estás seguro de que quieres cerrar la sesión?')) {
                    window.logoutUser(); // Esta función debería limpiar localStorage y redirigir
                    // Asegurar redirección si logoutUser no lo hace:
                    // setTimeout(() => { // Dar tiempo a logoutUser para limpiar
                    //    if(localStorage.getItem('authToken')) { // Si aún está, forzar limpieza
                    //        localStorage.removeItem('authToken');
                    //        localStorage.removeItem('userData');
                    //    }
                    //    window.location.href = 'index.html';
                    // }, 100);
                }
            } else {
                console.error('La función global logoutUser no está definida.');
                alert('Error al intentar cerrar sesión.');
            }
        });
    }

    // --- Inicialización al cargar la página ---
    const initialProfileData = await fetchUserProfile();
    if (initialProfileData) {
        populateProfileForm(initialProfileData);
        // Habilitar los botones de edición una vez cargados los datos
        if(editProfileInfoBtn) editProfileInfoBtn.disabled = false;
        if(editShippingAddressBtn) editShippingAddressBtn.disabled = false;
    } else {
        // Si fetchUserProfile devuelve null (y no redirigió), significa que hubo un error
        // pero el token podría seguir siendo válido (ej. error de red, no de autenticación).
        // Podrías deshabilitar los formularios o mostrar un mensaje más específico.
        // Por ahora, si no redirige, los formularios podrían quedar vacíos o con datos de localStorage si se cargaron antes.
        console.error("No se pudieron cargar los datos del perfil desde el servidor.");
        // Opcional: intentar cargar desde localStorage como fallback si es absolutamente necesario, pero no recomendado
        // const localUserData = localStorage.getItem('userData');
        // if (localUserData) populateProfileForm(JSON.parse(localUserData));
    }
    
    // Deshabilitar botones de guardar inicialmente, se activan con "Editar"
    if (saveProfileInfoBtn) saveProfileInfoBtn.classList.add('hidden');
    if (saveShippingAddressBtn) saveShippingAddressBtn.classList.add('hidden');
    
    // Deshabilitar campos de formulario inicialmente
    toggleFormEdit(profileInfoForm, editProfileInfoBtn, saveProfileInfoBtn, false);
    toggleFormEdit(shippingAddressForm, editShippingAddressBtn, saveShippingAddressBtn, false);


}); 