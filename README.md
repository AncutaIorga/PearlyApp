# 🫧 PearlyApp: Frontend Architecture & UI/UX

**PearlyApp** es una plataforma social enfocada en el bienestar personal, la salud y la gamificación de hábitos. Este documento detalla la arquitectura de su **Frontend** (la interfaz de usuario), desarrollado con **Angular 17+**, destacando su estructura modular, eficiencia de rendimiento y enfoque en la experiencia del usuario (UX).

---

## 🚀 Arquitectura Base: Single Page Application (SPA)

PearlyApp está diseñada como una **SPA** (_Single Page Application_).

A diferencia de las aplicaciones web tradicionales que requieren descargar y recargar la página completa en cada interacción, una SPA carga un único documento HTML inicial. A partir de ese momento, el motor interno de Angular actualiza dinámicamente solo las secciones de la pantalla que el usuario solicita.

**Beneficios de negocio y técnicos:**

- **Rendimiento superior (Native-like feel):** Las transiciones entre el _Feed_ y el _Perfil_ son instantáneas, ofreciendo una experiencia idéntica a la de una aplicación móvil instalada.
- **Persistencia del estado:** El usuario no pierde su contexto (como un formulario a medio llenar o la posición de scroll) al navegar por la plataforma.
- **Eficiencia de red:** Se reduce drásticamente la carga del servidor, ya que solo se intercambian datos puros (JSON) en lugar de interfaces gráficas completas.

---

## 📂 Estructura de Módulos (`src/app`)

El código fuente está organizado siguiendo el principio de **Separación de Responsabilidades** (_Separation of Concerns_). Cada directorio tiene un propósito específico, facilitando el mantenimiento y la escalabilidad del proyecto.

### 🔐 1. Seguridad y Acceso (Access & Security Layer)

Módulos dedicados a la protección de la aplicación y la validación de identidad.

- **`auth/`** _(Incluye `login/` y `register/`)_: Centraliza el flujo de autenticación de los usuarios. Valida los datos de entrada antes de enviarlos al servidor (Backend) para optimizar los recursos.
- **`guards/`**: Actúan como filtros de protección en las rutas de navegación. Verifican que un usuario tenga una sesión activa antes de permitirle acceder a áreas restringidas (como el _Feed_), previniendo el acceso no autorizado.
- **`interceptors/`**: Middleware que procesa las comunicaciones HTTP. Automáticamente adjunta los _Tokens_ de seguridad a cada petición que sale hacia la base de datos, garantizando que todas las transacciones estén autenticadas de forma transparente.

### 📱 2. Módulos Core (Feature Modules)

Las funcionalidades principales que aportan valor directo al usuario.

- **`feed/`**: El muro de actividad principal. Funciona como un componente inteligente que cruza las publicaciones entrantes con las preferencias de privacidad del usuario (descartando en tiempo real los posts de cuentas bloqueadas o silenciadas).
- **`challenges/`**: El motor de gamificación. Gestiona la participación en retos de salud (Físico, Mente, Nutrición) y el sistema de recompensas, aislando esta lógica de la interacción puramente social.
- **`post-create/`**: La interfaz dedicada a la creación de contenido, encargada de preprocesar imágenes y textos antes de su publicación.
- **`profile/`** y **`account/`**:
  - `profile`: Optimizado para la visualización de la actividad y estadísticas públicas del usuario.
  - `account`: Entorno seguro para la gestión y actualización de datos personales e información sensible de la cuenta.

### ⚙️ 3. Gestión del Entorno (User Management)

Herramientas para que el usuario controle su experiencia y privacidad.

- **`ajustes/`**: Panel de configuración general. Incluye la gestión avanzada de moderación (bloqueos y silencios). Para mantener el rendimiento óptimo, implementa ventanas modales con _scroll_ dinámico, permitiendo manejar listas de cientos de usuarios sin afectar la velocidad de la interfaz.
- **`privacy/`**: Controles de visibilidad que permiten al usuario alternar entre una cuenta pública y privada, actualizando el estado global de la plataforma al instante.

### 🧰 4. Arquitectura Transversal y Soporte (Shared & Core Utilities)

Librerías internas que aseguran la consistencia visual y técnica en todo el proyecto.

- **`services/`**: El centro de gestión de datos (_State Management_). Gestiona la comunicación con la API y almacena la información temporal de la sesión actual, sincronizándose de forma segura con el almacenamiento local del navegador.
- **`shared/`**: Componentes reutilizables que garantizan una identidad visual uniforme:
  - `navbar/`: Menú de navegación global de la plataforma.
  - `post-card/`: Componente estructurado que renderiza el contenido multimedia y las métricas (likes) de cada publicación.
  - `post-options/`: Menú contextual independiente para ejecutar acciones rápidas de moderación (Silenciar/Bloquear).
- **`notification/`**: Sistema de alertas emergentes no intrusivas (_Toasts_). Informa al usuario sobre el estado de sus acciones (ej. "Cambios guardados") sin interrumpir su navegación.
- **`pipes/`**: Transformadores de datos en tiempo real. Se encargan de procesar información técnica (como fechas ISO del servidor) y convertirlas a formatos legibles para el usuario (ej. _"Publicado hace 10 minutos"_).

---

## ⚡ Aspectos Técnicos Destacados

- **Reactividad de Alto Rendimiento (Angular Signals):** La plataforma utiliza _Signals_ para la actualización de la interfaz. Si un usuario silencia a otro, la aplicación no necesita recargar la vista entera; el sistema notifica directamente al componente afectado, eliminando el contenido no deseado en milisegundos.
- **Diseño UI/UX Escalable:** Integración nativa de temas dinámicos (_Dark / Light Mode_) a través de variables CSS y uso de diseño responsivo adaptado tanto a dispositivos móviles como a escritorio.
