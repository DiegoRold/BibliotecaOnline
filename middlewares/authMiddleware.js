import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
    let token;

    // Los tokens JWT suelen enviarse en el header Authorization como 'Bearer <token>'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener el token del header (quitando 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            // Verificar el token con el secreto
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Añadir el usuario decodificado (sin la contraseña) al objeto request
            // Aquí podrías hacer una consulta a la DB para obtener el usuario más actualizado si fuera necesario,
            // pero para muchos casos, la información del token es suficiente.
            req.user = decoded; // El payload del token que creamos (userId, nombre, email, rol)

            next(); // Continuar al siguiente middleware o al controlador de la ruta
        } catch (error) {
            console.error('Error al verificar el token:', error.message);
            // Errores comunes: TokenExpiredError, JsonWebTokenError (malformado, firma inválida)
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expirado, por favor inicie sesión de nuevo.' });
            }
            return res.status(401).json({ message: 'Token no válido o autorización denegada.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, token no proporcionado.' });
    }
};

// Middleware para verificar roles (debe usarse DESPUÉS de 'protect')
export const authorize = (...roles) => { // Recibe un array de roles permitidos
    return (req, res, next) => {
        if (!req.user || !req.user.rol) {
            // Esto no debería pasar si 'protect' se ejecutó correctamente
            return res.status(401).json({ message: 'No autorizado, información de usuario no encontrada.' });
        }

        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ 
                message: `Acceso denegado. El rol '${req.user.rol}' no tiene permiso para acceder a este recurso.` 
            }); // 403 Forbidden
        }
        next(); // El usuario tiene uno de los roles permitidos
    };
}; 