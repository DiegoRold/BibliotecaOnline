import db from '../config/db.js'; // Asegúrate que la ruta a tu config de BD sea correcta
import bcrypt from 'bcryptjs'; // Para hashear y comparar contraseñas
import validator from 'validator'; // Para validaciones, ej. email

// Función para actualizar el perfil del usuario (nombre, email, dirección)
export const updateUserProfile = async (req, res) => {
    const userId = req.user.id; // Asumimos que verifyToken añade user.id a req
    const {
        nombre,
        email,
        direccion_calle,
        direccion_detalle,
        direccion_cp,
        direccion_ciudad,
        direccion_provincia,
        direccion_pais
    } = req.body;

    // --- INICIO VALIDACIONES --- 
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ message: 'El nombre no puede estar vacío.' });
    }
    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ message: 'El formato del correo electrónico no es válido.' });
    }
    // Aquí puedes añadir más validaciones para los campos de dirección si lo necesitas
    // --- FIN VALIDACIONES ---

    try {
        // 1. Verificar si el nuevo email ya está en uso por OTRO usuario
        const [existingUserByEmail] = await db.promise().query(
            'SELECT id FROM usuarios WHERE email = ? AND id != ?',
            [email, userId]
        );
        if (existingUserByEmail.length > 0) {
            return res.status(409).json({ message: 'El correo electrónico ya está en uso por otra cuenta.' });
        }

        // 2. Construir los datos a actualizar
        const fieldsToUpdate = {
            nombre,
            email,
            direccion_calle,
            direccion_detalle: direccion_detalle || null, // Guardar null si está vacío
            direccion_cp,
            direccion_ciudad,
            direccion_provincia,
            direccion_pais
        };

        // 3. Actualizar el usuario en la base de datos
        const [updateResult] = await db.promise().query(
            'UPDATE usuarios SET ? WHERE id = ?',
            [fieldsToUpdate, userId]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // 4. Obtener los datos actualizados del usuario para devolverlos (sin password_hash)
        const [[updatedUser]] = await db.promise().query(
            `SELECT id, nombre, email, rol, 
                    direccion_calle, direccion_detalle, direccion_cp, 
                    direccion_ciudad, direccion_provincia, direccion_pais 
             FROM usuarios WHERE id = ?`,
            [userId]
        );

        res.status(200).json({
            ...updatedUser,
            message: 'Perfil actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el perfil.' });
    }
};

// Función para cambiar la contraseña del usuario
export const changeUserPassword = async (req, res) => {
    const userId = req.user.id; // Asumimos que verifyToken añade user.id a req
    const { currentPassword, newPassword } = req.body;

    // --- INICIO VALIDACIONES --- 
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Debe proporcionar la contraseña actual y la nueva contraseña.' });
    }
    if (newPassword.length < 6) { // Ajusta la longitud mínima según tus requisitos
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }
    // --- FIN VALIDACIONES ---

    try {
        // 1. Obtener el hash de la contraseña actual del usuario desde la BD
        const [[user]] = await db.promise().query(
            'SELECT password_hash FROM usuarios WHERE id = ?',
            [userId]
        );

        if (!user) {
            // Esto no debería pasar si el userId es válido y viene del token
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // 2. Comparar la contraseña actual enviada con la almacenada
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
        }

        // 3. Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // 4. Actualizar la contraseña en la BD
        await db.promise().query(
            'UPDATE usuarios SET password_hash = ? WHERE id = ?',
            [hashedNewPassword, userId]
        );

        res.status(200).json({ message: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña.' });
    }
}; 