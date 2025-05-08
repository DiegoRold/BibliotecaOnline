# Documentación Técnica - ENTRE HOJAS

## Nombre del proyecto
ENTRE HOJAS

## Descripción
ENTRE HOJAS es una tienda de libros online que permite a los usuarios explorar, buscar y comprar libros. La aplicación está construida utilizando tecnologías web modernas para el frontend y un backend robusto para la gestión de datos y transacciones.

## Motivación
El proyecto nació con la idea de crear una biblioteca personal online, pero evolucionó hacia una tienda de libros completa. La motivación principal es explorar y aprender sobre el desarrollo de aplicaciones web full-stack, abarcando desde el diseño de la interfaz de usuario (frontend) hasta la lógica de servidor (backend), la gestión de bases de datos y la integración de servicios externos como APIs de libros y pasarelas de pago.

## Justificación
La creación de una tienda de libros online como "ENTRE HOJAS" permite aplicar conocimientos en diversas tecnologías y arquitecturas de software. Este proyecto sirve como un caso práctico para:
*   Desarrollar una interfaz de usuario interactiva y amigable.
*   Implementar un backend con Node.js y Express.js.
*   Diseñar y gestionar una base de datos relacional con MySQL.
*   Consumir APIs externas para obtener datos de productos.
*   Entender el flujo de una transacción de comercio electrónico, incluyendo la futura integración de una pasarela de pago.
*   Aprender sobre la gestión de inventario (simulado inicialmente) y precios.
*   Reforzar buenas prácticas de desarrollo, documentación y control de versiones.

## Estructura del Proyecto
```
ENTRE HOJAS/
├── frontend/                 # Código del cliente (HTML, CSS, JS)
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   └── components/
│   │       └── book-card.js
│   └── assets/
│       └── logo.png
├── backend/                  # Código del servidor (Node.js)
│   ├── server.js             # Archivo principal del servidor
│   ├── routes/               # Definición de rutas de la API
│   ├── controllers/          # Lógica de negocio
│   ├── models/               # Modelos de datos (interacción con BD)
│   └── config/               # Archivos de configuración (BD, etc.)
└── DOCUMENT.md               # Documentación técnica
```

## Tecnologías Utilizadas

### Frontend
- HTML5
- CSS3 (con Tailwind CSS)
- JavaScript (ES6+)
- Web Components (para `book-card.js` y potencialmente otros elementos reutilizables)
- LocalStorage (para funcionalidades del lado del cliente como la lista de deseos y el modo oscuro)

### Backend
- Node.js (con Express.js como framework)
- MySQL (gestionado con MySQL Workbench)

### APIs Externas
- API de Libros: `https://books-foniuhqsba-uc.a.run.app/` (para poblar la base de datos inicial con información de libros, incluyendo precios y stock simulado).
- Pasarela de Pago: (A definir, ej: Stripe, PayPal)

## Componentes Principales

### 1. Frontend

#### 1.1. BookCard (frontend/js/components/book-card.js)
Componente personalizado que representa una tarjeta de libro.

#### Atributos
- `title`: Título del libro
- `author`: Autor del libro
- `cover`: URL de la portada
- `id`: Identificador único
- `year`: Año de publicación
- `category`: Categoría del libro
- `rating`: Calificación
- `pages`: Número de páginas
- `language`: Idioma

#### Eventos
- `view-details`: Se dispara al hacer clic para ver más detalles del libro (lleva a una página de producto o abre un modal más detallado).
- `add-to-cart`: Se dispara al hacer clic en el botón "Añadir al carrito".
- `toggle-wishlist`: Se dispara al hacer clic en el botón "Lista de deseos".

#### 1.2. Aplicación Principal (frontend/js/app.js)

##### Estado de la Aplicación (Cliente)
```javascript
const state = {
    isDarkMode: boolean,
    wishlist: string[], // Array de IDs de libros en la lista de deseos
    cart: object[],     // Array de objetos representando ítems en el carrito (idLibro, cantidad, precio)
    // ... otros estados relevantes para la UI ...
}
```

##### Funcionalidades Principales (Cliente)
1.  **Gestión de Tema (Modo Oscuro/Claro)**
    *   Cambio entre modo claro y oscuro.
    *   Persistencia de preferencia en localStorage.
2.  **Catálogo de Libros**
    *   Visualización de libros (grid/lista).
    *   Paginación.
    *   Búsqueda y filtrado (por género, autor, precio, etc.).
    *   Ordenamiento (por precio, popularidad, fecha de publicación, etc.).
3.  **Página de Detalles del Libro**
    *   Información completa del libro (descripción, autor, editorial, año, ISBN si disponible, precio, stock).
    *   Imágenes del libro.
    *   Botón para añadir al carrito.
    *   Botón para añadir/quitar de la lista de deseos.
4.  **Lista de Deseos**
    *   Agregar/eliminar libros.
    *   Persistencia en localStorage (y sincronización con backend si el usuario está logueado).
    *   Visualización en una sección dedicada o modal.
5.  **Carrito de Compras**
    *   Añadir/eliminar libros del carrito.
    *   Modificar cantidades.
    *   Cálculo del subtotal y total.
    *   Persistencia (localStorage para invitados, BD para usuarios logueados).
6.  **Proceso de Checkout**
    *   Formulario de información de envío y facturación.
    *   Integración con pasarela de pago.
    *   Confirmación de pedido.
7.  **Gestión de Cuenta de Usuario (Futuro)**
    *   Registro e inicio de sesión.
    *   Historial de pedidos.
    *   Gestión de direcciones.
8.  **Modal de Contacto**
    *   Muestra información de contacto (teléfono, email, dirección).

#### 1.3. Estilos (frontend/css/styles.css)

#### Variables CSS
```css
:root {
    --primary-color: #3b82f6;
    --secondary-color: #2563eb;
    --accent-color: #ef4444;
    --text-light: #1f2937;
    --text-dark: #f3f4f6;
    --bg-light: #ffffff;
    --bg-dark: #1f2937;
    --border-color: #e5e7eb;
}
```

#### Características de Diseño
- Diseño responsivo
- Soporte para modo oscuro
- Animaciones suaves
- Estilos personalizados para scrollbar
- Diseño adaptativo para diferentes tamaños de pantalla

### 2. Backend

#### 2.1. API Endpoints (ejemplos)
*   `GET /api/books`: Obtener listado de libros (con filtros y paginación).
*   `GET /api/books/:id`: Obtener detalles de un libro específico.
*   `GET /api/categories`: Obtener listado de categorías.
*   `POST /api/cart`: Añadir libro al carrito (para usuarios logueados).
*   `GET /api/cart`: Obtener contenido del carrito (para usuarios logueados).
*   `PUT /api/cart/:itemId`: Actualizar cantidad de un ítem en el carrito.
*   `DELETE /api/cart/:itemId`: Eliminar ítem del carrito.
*   `POST /api/orders`: Crear un nuevo pedido.
*   `GET /api/orders`: Obtener historial de pedidos del usuario (requiere autenticación).
*   `POST /api/wishlist`: Añadir libro a la lista de deseos (para usuarios logueados).
*   `GET /api/wishlist`: Obtener lista de deseos (para usuarios logueados).

#### 2.2. Base de Datos (MySQL)

##### Esquema de la Tabla `libros`
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
    isbn VARCHAR(20) NULL, -- Aunque la API actual no lo provee, es importante para el futuro
    rating_promedio DECIMAL(3,2) DEFAULT 0.00, -- Calculado o importado
    numero_reviews INT DEFAULT 0,
    -- Campos adicionales que puedan surgir de la API o necesidad
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
*Otras tablas a considerar para el futuro:* `usuarios`, `pedidos`, `items_pedido`, `direcciones`, `categorias`, `reviews`, `wishlist_items`.

## Categorías de Libros
1. Fantasía
2. Ciencia Ficción
3. Literatura
4. Distopía
5. Infantil
6. Histórica

## Funcionalidades Implementadas (Hasta el momento del cambio de enfoque)

### 1. Interfaz de Usuario (Frontend - Prototipo inicial como Biblioteca)
*   Header con:
    *   Logo y título "ENTRE HOJAS".
    *   Botón de modo oscuro funcional.
    *   Botón de contacto con modal mostrando información (teléfono, email, dirección).
*   Estructura básica HTML y CSS con Tailwind.
*   Componente `book-card.js` básico.

## Sistema de Marcadores de Lectura

### Descripción
El sistema de marcadores de lectura permite a los usuarios guardar su progreso en los libros que están leyendo. Cada marcador incluye:
- ID del libro
- Posición de lectura (porcentaje)
- Última página leída
- Fecha de última lectura
- Notas personales (opcional)

### Estructura de Datos
```javascript
const bookmarks = {
    [bookId]: {
        progress: number,      // Porcentaje de progreso (0-100)
        lastPage: number,      // Última página leída
        lastRead: string,      // Fecha ISO de última lectura
        notes: string,         // Notas personales
        chapters: {            // Marcadores por capítulo
            [chapterId]: {
                progress: number,
                lastRead: string
            }
        }
    }
}
```

### Funcionalidades
1. **Guardado Automático**
   - Guarda automáticamente la posición cada 30 segundos
   - Guarda al cerrar el lector
   - Persiste en localStorage

2. **Gestión de Marcadores**
   - Ver progreso general
   - Ver marcadores por capítulo
   - Agregar notas personales
   - Eliminar marcadores

3. **Interfaz de Usuario**
   - Barra de progreso visual
   - Lista de marcadores
   - Formulario para notas
   - Indicador de última lectura

4. **Características Adicionales**
   - Sincronización entre dispositivos (localStorage)
   - Exportación de marcadores
   - Estadísticas de lectura

### Implementación Técnica
1. **Almacenamiento**
   - Utiliza localStorage para persistencia
   - Estructura de datos optimizada
   - Manejo de errores y validación

2. **Interfaz**
   - Componentes modulares
   - Diseño responsivo
   - Soporte para modo oscuro
   - Animaciones suaves

3. **Eventos**
   - `bookmark-saved`: Se dispara al guardar un marcador
   - `bookmark-deleted`: Se dispara al eliminar un marcador
   - `progress-updated`: Se dispara al actualizar el progreso

## Sistema de Recomendaciones

### Descripción
El sistema de recomendaciones utiliza un algoritmo basado en el comportamiento del usuario para sugerir libros que podrían interesarle. El sistema analiza:
- Libros leídos
- Categorías preferidas
- Calificaciones dadas
- Tiempo de lectura
- Marcadores guardados

### Estructura de Datos
```javascript
const recommendations = {
    userPreferences: {
        favoriteCategories: string[],
        averageRating: number,
        readingTime: number,
        completedBooks: string[]
    },
    suggestions: {
        [bookId]: {
            score: number,
            reason: string,
            matchPercentage: number
        }
    }
}
```

### Algoritmo de Recomendación
1. **Análisis de Preferencias**
   - Categorías más leídas
   - Autores favoritos
   - Calificaciones promedio
   - Patrones de lectura

2. **Cálculo de Puntuación**
   - Similitud de categorías (40%)
   - Popularidad del libro (20%)
   - Calificación promedio (20%)
   - Complejidad del texto (10%)
   - Longitud del libro (10%)

3. **Filtros Aplicados**
   - Excluir libros ya leídos
   - Priorizar categorías preferidas
   - Considerar nivel de lectura
   - Balancear géneros

### Funcionalidades
1. **Recomendaciones Personalizadas**
   - Sugerencias diarias
   - Libros similares
   - Nuevos lanzamientos
   - Tendencias

2. **Interfaz de Usuario**
   - Sección de recomendaciones
   - Explicación de sugerencias
   - Filtros de preferencias
   - Historial de recomendaciones

3. **Gestión de Preferencias**
   - Ajuste de categorías
   - Nivel de lectura
   - Géneros preferidos
   - Autores favoritos

4. **Características Adicionales**
   - Actualización en tiempo real
   - Exportación de preferencias
   - Estadísticas de aciertos
   - Feedback de recomendaciones

### Implementación Técnica
1. **Almacenamiento**
   - Preferencias en localStorage
   - Caché de recomendaciones
   - Historial de interacciones

2. **Interfaz**
   - Componentes modulares
   - Diseño responsivo
   - Animaciones suaves
   - Modo oscuro

3. **Eventos**
   - `preferences-updated`: Se dispara al actualizar preferencias
   - `recommendation-clicked`: Se dispara al seleccionar una recomendación
   - `feedback-submitted`: Se dispara al dar feedback

## Próximas Mejoras Planificadas (Nuevo Enfoque Tienda Online)
1.  **Desarrollo del Backend (Node.js + Express)**
    *   Configuración del servidor.
    *   Definición de modelos y conexión a MySQL.
    *   Implementación de rutas y controladores para la API de libros.
2.  **Población de la Base de Datos**
    *   Crear script para importar datos desde la API `https://books-foniuhqsba-uc.a.run.app/` a la tabla `libros`.
3.  **Desarrollo del Frontend (Tienda)**
    *   Adaptar el catálogo de libros para mostrar precios y botón "Añadir al carrito".
    *   Implementar la página de detalles del producto.
    *   Desarrollar la funcionalidad del carrito de compras.
    *   Implementar el proceso de checkout (inicialmente simulado, luego con pasarela de pago).
    *   Mejorar la búsqueda y filtros para una tienda.
4.  **Sistema de Usuarios (Básico)**
    *   Registro e inicio de sesión (puede ser simplificado inicialmente).
    *   Asociación de carritos y listas de deseos a usuarios.
5.  **Pasarela de Pago**
    *   Investigar e integrar una pasarela de pago.
6.  **Gestión de Órdenes (Básico en Admin)**
    *   Interfaz simple para ver pedidos (si el tiempo lo permite).

## Notas de Desarrollo
- El proyecto ha pivotado de una biblioteca digital a una tienda de libros online.
- Se priorizará la creación de la base de datos MySQL y la configuración inicial del backend Node.js.
- La API `https://books-foniuhqsba-uc.a.run.app/` se usará para la carga inicial de datos de libros. Aunque carece de ISBN y su origen es desconocido, es útil por incluir precios y stock (simulado).
- El frontend se reutilizará y adaptará desde el prototipo de biblioteca.
- Tailwind CSS seguirá siendo la librería principal para estilos en el frontend.
- Los Web Components se mantendrán para elementos reutilizables como las tarjetas de libro.
