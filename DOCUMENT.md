# Documentación Técnica - ENTRE HOJAS

## Nombre del proyecto
ENTRE HOJAS

## Descripción
ENTRE HOJAS es una tienda de libros online que permite a los usuarios explorar, buscar y comprar libros. La aplicación está construida utilizando tecnologías web modernas para el frontend y un backend robusto para la gestión de datos, usuarios y transacciones.

## Motivación
El proyecto nació con la idea de crear una biblioteca personal online, pero evolucionó hacia una tienda de libros completa. La motivación principal es explorar y aprender sobre el desarrollo de aplicaciones web full-stack, abarcando desde el diseño de la interfaz de usuario (frontend) hasta la lógica de servidor (backend), la gestión de bases de datos y la integración de servicios externos como APIs de libros y pasarelas de pago.

## Justificación
La creación de una tienda de libros online como "ENTRE HOJAS" permite aplicar conocimientos en diversas tecnologías y arquitecturas de software. Este proyecto sirve como un caso práctico para:
*   Desarrollar una interfaz de usuario interactiva y amigable con HTML, CSS (Tailwind CSS) y JavaScript.
*   Implementar un backend con Node.js y Express.js para gestionar la lógica de negocio y las APIs.
*   Diseñar y gestionar una base de datos relacional con MySQL.
*   Integrar y consumir APIs externas para obtener datos de productos (libros).
*   Implementar un sistema de autenticación de usuarios.
*   Entender el flujo de una transacción de comercio electrónico, incluyendo la futura integración de una pasarela de pago.
*   Aprender sobre la gestión de inventario (simulado inicialmente) y precios.
*   Reforzar buenas prácticas de desarrollo, documentación y control de versiones.

## Estructura del Proyecto
La estructura del proyecto es la siguiente:
```
ENTRE HOJAS/
├── assets/                 # Imágenes, iconos, fuentes, etc.
│   ├── books/              # Portadas de libros (generadas o añadidas)
│   ├── images/             # Imágenes generales (ej: blog.jpeg, gastos-envio.png)
│   └── logo.png, usuario.png, etc.
├── config/                 # Configuración del backend
│   └── db.js               # Configuración de la conexión a la base de datos MySQL
├── controllers/            # Lógica de negocio para las rutas del backend
│   ├── authController.js   # Lógica para autenticación (registro, login)
│   ├── bookController.js   # Lógica para la gestión de libros
│   ├── orderController.js  # Lógica para la gestión de pedidos
│   └── paymentController.js# Lógica para la gestión de pagos (futuro)
├── css/                    # Hojas de estilo CSS adicionales (si no se usa solo Tailwind inline)
├── js/                     # Scripts JavaScript del lado del cliente
│   ├── app.js              # Script principal de la aplicación frontend
│   └── components/
│       └── book-card.js    # Web Component para la tarjeta de libro
├── middlewares/            # Middlewares para Express (ej: autenticación, logging)
├── node_modules/           # Dependencias de Node.js
├── routes/                 # Definición de rutas de la API del backend
│   ├── authRoutes.js       # Rutas para autenticación (/api/auth)
│   ├── bookRoutes.js       # Rutas para libros (/api/books)
│   ├── orderRoutes.js      # Rutas para pedidos (/api/orders)
│   └── paymentRoutes.js    # Rutas para pagos (/api/payment)
├── scripts/                # Scripts útiles (ej: para poblar la BD)
├── .gitignore              # Especifica archivos y directorios ignorados por Git
├── DOCUMENT.md             # Este archivo de documentación técnica
├── index.html              # Página principal de la tienda
├── register.html           # Página de registro de usuarios
├── checkout.html           # Página de proceso de compra
├── package.json            # Metadatos del proyecto Node.js y dependencias
├── package-lock.json       # Versiones exactas de las dependencias
├── README.md               # Descripción general del proyecto
├── server.js               # Archivo principal del servidor backend (Express.js)
└── styles.css              # Hoja de estilos principal (puede incluir Tailwind compilado o custom CSS)
```

## Tecnologías Utilizadas

### Frontend
- HTML5
- CSS3 (principalmente Tailwind CSS, con `styles.css` para estilos globales o personalizados)
- JavaScript (ES6+)
- Web Components (para `book-card.js`)
- LocalStorage (para funcionalidades del lado del cliente como modo oscuro, wishlist y carrito de invitados)

### Backend
- Node.js
- Express.js (framework para Node.js)
- MySQL (gestionado con MySQL Workbench)
- `mysql2/promise` (driver de MySQL para Node.js)
- `bcryptjs` (para hashing de contraseñas)
- `jsonwebtoken` (para la generación y verificación de JSON Web Tokens)
- `dotenv` (para la gestión de variables de entorno)

### APIs Externas Potenciales
- API de Libros: `https://books-foniuhqsba-uc.a.run.app/` (utilizada para obtener datos iniciales de libros).
- Pasarela de Pago: (A definir, ej: Stripe, PayPal).

## Componentes y Funcionalidades

### 1. Frontend (`index.html`, `register.html`, `checkout.html`, `js/`, `assets/`, `styles.css`)

#### 1.1. Páginas Principales
*   **`index.html`**: Página de inicio, muestra el catálogo de libros, recomendaciones, slider de imágenes, y acceso a otras secciones.
*   **`register.html`**: Formulario para el registro de nuevos usuarios. Actualmente envía los datos a un endpoint simulado del backend (`/api/auth/register`).
*   **`checkout.html`**: Página para el proceso de finalización de compra (en desarrollo).

#### 1.2. Componente `book-card.js` (`js/components/book-card.js`)
Web Component reutilizable que muestra la información de un libro en formato de tarjeta.
*   **Atributos**: `id`, `title`, `author`, `cover`, `price`, `stock`, `year`, `category`, `rating`, `pages`, `language`, `in-wishlist`.
*   **Eventos Disparados**:
    *   `view-book-details`: (Funcionalidad pendiente) Para ver más detalles del libro.
    *   `add-to-cart`: Añade el libro al carrito (gestionado en `js/app.js`).
    *   `toggle-wishlist`: Añade o quita el libro de la lista de deseos (gestionado en `js/app.js`).

#### 1.3. Lógica Principal del Cliente (`js/app.js`)
Gestiona el estado y la interactividad general del frontend.
*   **Estado de la Aplicación (Cliente)**:
    *   `isDarkMode`: Booleano para el tema oscuro.
    *   `wishlist`: Array de IDs de libros (persiste en LocalStorage).
    *   `cart`: Array de objetos (libros) en el carrito (persiste en LocalStorage).
    *   `allBooks`: Array con los datos de los libros obtenidos de la API externa.
*   **Funcionalidades Implementadas (Frontend)**:
    *   **Modo Oscuro**: Funcional, con persistencia en LocalStorage.
    *   **Slider de Imágenes**: Muestra portadas de libros destacadas en la página principal.
    *   **Renderizado de Libros**: Muestra libros en la sección de recomendaciones.
    *   **Lista de Deseos (Wishlist)**:
        *   Añadir/eliminar libros desde las `book-card` o desde el modal del carrito.
        *   Visualización en un modal.
        *   Persistencia en LocalStorage.
    *   **Carrito de Compras**:
        *   Añadir libros desde las `book-card`.
        *   Ver contenido en un modal.
        *   Modificar cantidades (incrementar, decrementar).
        *   Eliminar ítems.
        *   Vaciar carrito.
        *   Mover ítems del carrito a la lista de deseos.
        *   Cálculo del total.
        *   Persistencia en LocalStorage.
        *   Botón "Ver Mi Compra" que redirige a `checkout.html`.
    *   **Modal de Contacto**: Muestra información de contacto.
    *   **Menú de Usuario Desplegable**:
        *   Opciones: Iniciar Sesión, Registrarse, Mi Perfil, Mis Pedidos, Cerrar Sesión.
        *   "Registrarse" redirige a `register.html`.
        *   Otras opciones son placeholders por ahora.
    *   **Sección de Promoción del Blog y Gastos de Envío**: Secciones estáticas con imágenes en `index.html`.
    *   **Footer**: Con el año actual dinámico.
*   **Funcionalidades Pendientes o Simuladas (Frontend)**:
    *   Conexión del formulario de `register.html` con el backend real para persistir usuarios.
    *   Implementación de la lógica de inicio de sesión en el frontend para interactuar con `/api/auth/login` y gestionar el token JWT.
    *   Sincronización de wishlist y carrito con el backend para usuarios autenticados.
    *   Página de detalles del libro.
    *   Funcionalidad de búsqueda y filtrado avanzada en el catálogo.
    *   Paginación completa del catálogo.
    *   Proceso de checkout funcional (envío de datos, conexión a pasarela de pago).
    *   Secciones "Mi Perfil" y "Mis Pedidos".

### 2. Backend (`server.js`, `routes/`, `controllers/`, `config/`, `middlewares/`)

#### 2.1. Configuración (`config/db.js`)
*   Establece y gestiona la conexión a la base de datos MySQL utilizando `mysql2/promise`.
*   Lee la configuración de la base de datos desde variables de entorno (ej: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) con valores por defecto.

#### 2.2. Servidor Principal (`server.js`)
*   Inicializa la aplicación Express.
*   Configura middlewares (ej: `express.json()` para parsear bodies JSON).
*   Monta las rutas definidas en el directorio `routes/` (ej: `/api/auth`, `/api/books`).
*   Inicia el servidor para escuchar en un puerto definido (usualmente desde una variable de entorno).

#### 2.3. Rutas (`routes/`)
*   **`authRoutes.js`**:
    *   `POST /api/auth/register`: Para registrar un nuevo usuario. Llama a `authController.registerUser`.
    *   `POST /api/auth/login`: Para iniciar sesión. Llama a `authController.loginUser`.
*   **`bookRoutes.js`**: (Estructura básica, lógica de controlador por desarrollar)
*   **`orderRoutes.js`**: (Estructura básica, lógica de controlador por desarrollar)
*   **`paymentRoutes.js`**: (Estructura básica, lógica de controlador por desarrollar)

#### 2.4. Controladores (`controllers/`)
*   **`authController.js`**:
    *   `registerUser`:
        *   Valida los datos de entrada (nombre, email, password).
        *   Verifica si el email ya está registrado en la base de datos.
        *   Hashea la contraseña usando `bcryptjs`.
        *   Inserta el nuevo usuario en la tabla `usuarios`.
        *   Devuelve un mensaje de éxito y datos básicos del usuario (sin el hash).
    *   `loginUser`:
        *   Valida los datos de entrada (email, password).
        *   Busca al usuario por email en la tabla `usuarios`.
        *   Compara la contraseña proporcionada con el hash almacenado usando `bcryptjs`.
        *   Si las credenciales son correctas, genera un JSON Web Token (JWT) firmado con `process.env.JWT_SECRET` y con una expiración (ej: 1 hora).
        *   Devuelve el token y datos del usuario.
*   **`bookController.js`**, **`orderController.js`**, **`paymentController.js`**: Contienen la estructura inicial, pero la lógica detallada para gestionar libros, pedidos y pagos necesita ser implementada.

#### 2.5. Middlewares (`middlewares/`)
*   (Directorio creado, pero middlewares específicos como `authMiddleware` para proteger rutas aún necesitan ser implementados y utilizados en las rutas que lo requieran).

### 3. Base de Datos (MySQL)

#### 3.1. Tabla `usuarios`
Utilizada por `authController.js`. Esquema inferido (se recomienda definirlo explícitamente):
```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'cliente', -- 'cliente', 'admin', etc.
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3.2. Tabla `libros`
Definida conceptualmente, necesitará ser creada y poblada.
```sql
CREATE TABLE libros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255),
    editorial VARCHAR(255),
    fecha_publicacion DATE,
    genero VARCHAR(100),
    descripcion TEXT,
    idioma VARCHAR(50),
    paginas INT,
    portada_url VARCHAR(512),
    precio DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    isbn VARCHAR(20) NULL,
    rating_promedio DECIMAL(3,2) DEFAULT 0.00,
    numero_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
*Otras tablas futuras:* `pedidos`, `items_pedido`, `direcciones`, `categorias`, `reviews`, `wishlist_items_usuarios`.

## Próximos Pasos y Tareas Pendientes
1.  **Frontend - Registro/Login**:
    *   Modificar `register.html` y `js/app.js` (o un nuevo `js/auth.js`) para que el formulario de registro envíe los datos al endpoint real `POST /api/auth/register`.
    *   Manejar la respuesta del backend (éxito o error) y mostrar mensajes adecuados al usuario.
    *   Crear una página `login.html` (o un modal de login) y su lógica JS para enviar datos a `POST /api/auth/login`.
    *   Almacenar el token JWT recibido del backend (ej: en LocalStorage o HttpOnly cookie) y enviarlo en las cabeceras de las solicitudes a rutas protegidas.
    *   Implementar la lógica de "Cerrar Sesión" (eliminar token).
    *   Actualizar la UI para reflejar el estado de autenticación del usuario (ej: mostrar nombre de usuario, cambiar opciones del menú).
2.  **Backend - Protección de Rutas**:
    *   Crear un `authMiddleware.js` que verifique el token JWT en las solicitudes.
    *   Aplicar este middleware a las rutas que requieran autenticación (ej: gestión de pedidos, perfil de usuario).
3.  **Backend - Gestión de Libros**:
    *   Implementar la lógica en `bookController.js` para:
        *   `GET /api/books`: Listar libros con filtros (género, precio, etc.) y paginación.
        *   `GET /api/books/:id`: Obtener detalles de un libro.
        *   (Opcional CRUD para administradores: `POST`, `PUT`, `DELETE /api/books`).
    *   Poblar la tabla `libros` (manualmente, desde la API externa, o con un script).
4.  **Frontend - Catálogo y Detalles del Libro**:
    *   Conectar la visualización de libros en `index.html` con el endpoint `GET /api/books`.
    *   Implementar la página o modal de detalles del libro, obteniendo datos de `GET /api/books/:id`.
5.  **Backend y Frontend - Wishlist y Carrito para Usuarios Logueados**:
    *   Definir y crear tablas en la BD para `wishlist_items_usuarios` y `cart_items_usuarios`.
    *   Implementar endpoints en el backend para gestionar la wishlist y el carrito de usuarios autenticados.
    *   Modificar `js/app.js` para que, si el usuario está logueado, la wishlist y el carrito se sincronicen/guarden en el backend en lugar de solo en LocalStorage.
6.  **Proceso de Compra (Checkout)**:
    *   Diseñar tablas de BD para `pedidos` e `items_pedido`.
    *   Implementar endpoints en el backend para crear y gestionar pedidos.
    *   Desarrollar la lógica del frontend en `checkout.html` para recopilar información de envío, facturación y llamar al backend para crear el pedido.
    *   Integrar una pasarela de pago (Stripe, PayPal).
7.  **Base de Datos**:
    *   Finalizar y crear todos los esquemas de tablas necesarios en MySQL.
    *   Establecer relaciones entre tablas.
8.  **Mejoras y Refinamientos**:
    *   Validaciones más robustas en frontend y backend.
    *   Manejo de errores exhaustivo.
    *   Mejoras de UI/UX.
    *   Implementar roles de usuario (cliente, administrador) con diferentes permisos.
    *   Panel de administración (opcional).

---
*Este documento debe mantenerse actualizado a medida que el proyecto evoluciona.*
