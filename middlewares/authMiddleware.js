import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]; // Obtener el token después de "Bearer "

        if (!token) {
            return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Añadir el payload decodificado (que incluye userId, nombre, email, rol)
            // al objeto request para que esté disponible en los controladores de las rutas protegidas
            req.user = decoded;
            next(); // El token es válido, continuar a la siguiente función/controlador
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expirado. Por favor, inicia sesión de nuevo.' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Token inválido.' });
            }
            // Otros errores
            console.error('Error en la verificación del token:', error);
            return res.status(500).json({ message: 'Error interno del servidor al verificar el token.' });
        }
    } else {
        return res.status(401).json({ message: 'Acceso denegado. Cabecera de autorización no encontrada o mal formada.' });
    }
};

export default authMiddleware;

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