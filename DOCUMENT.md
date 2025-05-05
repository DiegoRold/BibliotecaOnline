# Documentación Técnica - ENTRE HOJAS

## Descripción General
ENTRE HOJAS es una aplicación web que permite a los usuarios explorar, buscar y leer libros digitales. La aplicación está construida utilizando tecnologías web modernas y sigue un diseño modular y escalable.

## Estructura del Proyecto
```
ENTRE HOJAS/
├── index.html              # Página principal
├── css/
│   └── styles.css         # Estilos globales
├── js/
│   ├── app.js            # Lógica principal de la aplicación
│   └── components/
│       └── book-card.js  # Componente personalizado para tarjetas de libros
├── assets/
│   └── logo.png          # Logo de la aplicación
└── DOCUMENT.md           # Documentación técnica
```

## Tecnologías Utilizadas
- HTML5
- CSS3 (con Tailwind CSS)
- JavaScript (ES6+)
- Web Components
- LocalStorage para persistencia de datos

## Componentes Principales

### 1. BookCard (book-card.js)
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
- `read-book`: Se dispara al hacer clic en el botón "Leer"
- `toggle-wishlist`: Se dispara al hacer clic en el botón "Lista de deseos"

### 2. Aplicación Principal (app.js)

#### Estado de la Aplicación
```javascript
const state = {
    isDarkMode: boolean,
    isGridView: boolean,
    wishlist: string[],
    currentCategory: string,
    currentBook: object|null,
    currentPage: number,
    booksPerPage: number,
    sortBy: string,
    sortOrder: string
}
```

#### Funcionalidades Principales
1. **Gestión de Tema**
   - Cambio entre modo claro y oscuro
   - Persistencia de preferencia en localStorage

2. **Gestión de Vista**
   - Vista en cuadrícula
   - Vista en lista
   - Persistencia de preferencia

3. **Sistema de Filtrado y Ordenamiento**
   - Filtrado por categorías
   - Búsqueda por título, autor y descripción
   - Ordenamiento por:
     - Título
     - Autor
     - Año
     - Rating
   - Orden ascendente/descendente
   - Paginación de resultados

4. **Lista de Deseos**
   - Agregar/eliminar libros
   - Persistencia en localStorage
   - Visualización en modal

5. **Lector de Libros**
   - Visualización de contenido en modal
   - Diseño responsivo
   - Soporte para modo oscuro

### 3. Estilos (styles.css)

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

## Categorías de Libros
1. Fantasía
2. Ciencia Ficción
3. Literatura
4. Distopía
5. Infantil
6. Histórica

## Funcionalidades Implementadas

### 1. Interfaz de Usuario
- Barra de navegación con controles de tema y vista
- Barra de búsqueda avanzada
- Sistema de filtros y ordenamiento
- Paginación de resultados
- Grid/Lista de libros
- Modal de lista de deseos
- Lector de libros

### 2. Gestión de Datos
- Almacenamiento local de preferencias
- Gestión de lista de deseos
- Filtrado y búsqueda avanzada de libros
- Ordenamiento y paginación de resultados

### 3. Características de Accesibilidad
- Soporte para modo oscuro
- Diseño responsivo
- Navegación por teclado
- Contraste adecuado

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

## Próximas Mejoras Planificadas
1. Implementación de sistema de usuarios
2. Añadir más categorías de libros
3. Implementar sistema de reseñas y comentarios
4. Añadir sistema de marcadores de lectura
5. Implementar sistema de recomendaciones

## Notas de Desarrollo
- La aplicación utiliza Web Components para una mejor modularidad
- Se implementa el patrón de diseño Observer para la gestión de eventos
- Se utiliza localStorage para persistencia de datos del lado del cliente
- La interfaz está construida con Tailwind CSS para un diseño consistente y responsivo
- Se implementa paginación del lado del cliente para mejor rendimiento
- El sistema de búsqueda incluye búsqueda en títulos, autores y descripciones
