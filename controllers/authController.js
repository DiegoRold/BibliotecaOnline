import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// Registrar un nuevo usuario (cliente por defecto)
export const registerUser = async (req, res) => {
    const { nombre, email, password } = req.body;

    // Validación básica (se puede expandir)
    if (!nombre || !email || !password) {
        return res.status(400).json({ message: 'Por favor, proporcione nombre, email y contraseña.' });
    }
    if (password.length < 6) { // Ejemplo de validación de contraseña
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        // Verificar si el email ya existe
        const [existingUser] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' }); // 409 Conflict
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insertar nuevo usuario (rol por defecto es 'cliente' según la DB)
        const insertQuery = 'INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)';
        const [result] = await pool.execute(insertQuery, [nombre, email, password_hash]);

        if (result.insertId) {
            // Opcional: generar un token JWT inmediatamente después del registro y loguear al usuario
            // O simplemente devolver un mensaje de éxito
            res.status(201).json({ 
                message: 'Usuario registrado exitosamente.', 
                userId: result.insertId,
                nombre: nombre,
                email: email
                // No devolver el hash de la contraseña
            });
        } else {
            res.status(500).json({ message: 'Error al registrar el usuario.' });
        }
    } catch (error) {
        console.error('Error en registerUser:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.', error: error.message });
    }
};

// Iniciar sesión de un usuario
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, proporcione email y contraseña.' });
    }

    try {
        // Buscar usuario por email
        const [users] = await pool.query('SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' }); // 401 Unauthorized
        }

        const user = users[0];

        // Comparar contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Si la contraseña es correcta, crear y firmar un JWT
        const payload = {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
        };

        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // El token expira en 1 hora (puedes ajustarlo)
        );

        res.json({
            message: 'Inicio de sesión exitoso.',
            token: token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en loginUser:', error);
        res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.', error: error.message });
    }
};

// Nueva función para verificar el rol de administrador
export const verifyAdmin = async (req, res) => {
    // authMiddleware ya ha verificado el token y añadido req.user
    // req.user contiene el payload del token, incluyendo el rol.
    if (req.user && req.user.rol === 'admin') {
        res.status(200).json({ isAdmin: true });
    } else {
        // Si no hay req.user (algo salió mal en authMiddleware y no debería llegar aquí)
        // o el rol no es 'admin'
        res.status(403).json({ isAdmin: false, message: 'Acceso denegado. El usuario no es administrador.' });
    }
}; 