# 🫧 PearlyApp: Frontend Architecture & UI/UX

**PearlyApp** es una red social enfocada en el bienestar personal, la salud y la creación de hábitos positivos. Este documento explica cómo está construida la aplicación, cómo instalarla y las decisiones de diseño que hemos tomado para ofrecer la mejor experiencia de usuario.

---

## Tecnologías, Versiones y Entorno de Desarrollo

El proyecto ha sido desarrollado utilizando herramientas modernas y preparadas para escritorio:

- **Framework Base:** Angular v21+
- **Lenguaje:** TypeScript.
- **Estilos:** CSS3 puro con variables globales para facilitar el cambio de temas.
- **Gestión de Datos:** Angular Signals.
- **Multiplataforma (Escritorio):** Electron y Electron-Builder.
- **Entorno requerido:** Node.js y gestor de paquetes `npm`.

## Guía de Instalación y Despliegue Local

Sigue estos pasos para levantar el proyecto en tu propio ordenador:

1. **Instalar Angular CLI:**

   ```bash
   npm install -g @angular/cli

   ```

2. **Clonar el repositorio:**

   ```bash
   git clone [https://github.com/AncutaIorga/PearlyApp.git](https://github.com/AncutaIorga/PearlyApp.git)

   ```

3. **Acceder al directorio del proyecto:**

   ```bash
   cd PearlyApp

   ```

4. **Instalar las dependencias del proyecto:**

   ```bash
      npm install


   ```

5. **Desplegar el servidor de desarrollo:**
   ```bash
      ng serve -o
      Nota: El flag -o abrirá automáticamente la aplicación en tu navegador predeterminado en http://localhost:4200/.
   ```

## Diseño de la Aplicación y Criterios de Usabilidad (UX/UI)

La aplicación está pensada para ser cómoda, intuitiva y fácil de usar, siguiendo estos principios:

- **Accesibilidad:** Uso de etiquetas descriptivas para lectores de pantalla y soporte completo para Modo Claro/Oscuro, cuidando la vista del usuario en cualquier entorno.

- **Prevención y Gestión de Errores:** Las alertas de la app (como "Cambios guardados") aparecen de una en una para no agobiar al usuario. Además, hemos eliminado las alertas poco atractivas visualmente por defecto del navegador y creado ventanas a medida que encajan con nuestro diseño.

- **Diseño Minimalista y Consistente:** Usamos colores con sentido (Rojo para borrar, Azul para acciones importantes, Verde para éxito). Todos los botones comparten el mismo estilo (.btn-rect) para que la plataforma se vea uniforme y profesional.

- **Adaptabilidad (Responsive):** Los textos muy largos se acortan automáticamente mostrando un botón de Ver más, y las fotos se ajustan solas para verse perfectas tanto en móviles como en ordenador.

---

## Documentación de Vistas, Routing y Componentes

El código fuente (`src/app`) está bien organizado por secciones. La plataforma funciona como una **SPA (Single Page Application)**, lo que significa que la navegación es súper rápida porque no necesita recargar la página entera a cada clic.

### Sistema de Routing (`app.routes.ts`) y Seguridad

Las páginas están protegidas para mantener la privacidad de los usuarios:

- **Rutas públicas:** `/login` y `/register`.
- **Rutas protegidas** _(Requieren sesión activa en LocalStorage)_: `/feed`, `/profile`, `/challenges`, `/ajustes`. Si un usuario no autenticado intenta acceder, el Guard lo redirige automáticamente al Login.

### Componentes y Vistas Principales (Feature Modules)

- **`feed/` (Vista Principal):** Muestra las publicaciones de los usuarios, filtrando y ocultando automáticamente el contenido de las personas a las que has bloqueado o silenciado.

- **`profile/` (Vista de Usuario):** Muestra los datos de cada persona (`/profile/:username`), sus publicaciones y estadísticas. Incluye ventanas para ver las listas reales de Seguidores y Seguidos.

- **`challenges/` (Vista de Gamificación):** La sección de salud. Los botones cambian inteligentemente (por ejemplo, dicen "⏱️ Comenzar" si es un reto de tiempo o "✨ Completar" si es una acción rápida).

- **`ajustes/` y `account/`:** Entorno seguro donde el usuario puede editar sus datos, cambiar al modo oscuro y gestionar a quién ha bloqueado.

### Componentes Reutilizables (`shared/`)

- **`navbar/`:** El menú superior que incluye un buscador en tiempo real, optimizado para no sobrecargar la aplicación mientras el usuario teclea.

- **`post-card/` & `post-options/`:** Las tarjetas de las publicaciones y su menú de opciones. El sistema es seguro y solo te muestra el botón de "Eliminar" si la publicación es realmente tuya.

---

## Aspectos Técnicos y Rendimiento

- **Cuentas Privadas e Independientes:** Para que dos personas puedan usar el mismo ordenador sin mezclar sus fotos o bloqueos, guardamos los datos asociados al email de cada uno. Al cerrar sesión, borramos la memoria temporal por total seguridad.

- **Compresión de Imágenes en Cliente:** Si un usuario sube una foto enorme (ej. 4K), la aplicación la reduce de tamaño y peso de forma invisible antes de publicarla. Así evitamos que la plataforma vaya lenta o gaste muchos datos.

- **Velocidad y Rendimiento:** Gracias a las nuevas tecnologías de Angular (Signals), cuando le das a Like a una foto o cambias de tema visual, la pantalla reacciona en milisegundos sin bloqueos.
