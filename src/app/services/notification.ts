import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = signal<AppNotification[]>([]);
  private nextId = 1;
  private defaultDuration = 5000;

  readonly activeNotifications = this.notifications.asReadonly();

  constructor() {}

  // Muestra una notificacion de exito de color verde.
  success(message: string, options?: Partial<AppNotification>) {
    return this.show({ type: 'success', message, title: options?.title || '✅ Éxito', duration: options?.duration ?? this.defaultDuration, dismissible: options?.dismissible ?? true, ...options });
  }

  // Muestra una notificacion de error de color rojo.
  error(message: string, options?: Partial<AppNotification>) {
    return this.show({ type: 'error', message, title: options?.title || '❌ Error', duration: options?.duration ?? this.defaultDuration * 1.5, dismissible: options?.dismissible ?? true, ...options });
  }

  // Muestra una notificacion informativa de color azul.
  info(message: string, options?: Partial<AppNotification>) {
    return this.show({ type: 'info', message, title: options?.title || 'ℹ️ Información', duration: options?.duration ?? this.defaultDuration, dismissible: options?.dismissible ?? true, ...options });
  }

  // Muestra una notificacion de advertencia de color naranja.
  warning(message: string, options?: Partial<AppNotification>) {
    return this.show({ type: 'warning', message, title: options?.title || '⚠️ Advertencia', duration: options?.duration ?? this.defaultDuration, dismissible: options?.dismissible ?? true, ...options });
  }

  // Crea la notificacion, la añade a la pantalla y configura cuando debe borrarse.
  show(notification: Omit<AppNotification, 'id' | 'createdAt'>) {
    this.notifications.set([]); 
    
    const id = this.nextId++;
    const newNotification: AppNotification = {
      ...notification,
      id,
      createdAt: new Date()
    };

    this.notifications.update(notifications => [...notifications, newNotification]);

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
    }

    return id;
  }

  // Elimina una notificacion especifica de la lista activa.
  dismiss(id: number) {
    this.notifications.update(notifications => 
      notifications.filter(n => n.id !== id)
    );
  }

  // Cierra todas las notificaciones que esten en pantalla.
  dismissAll() {
    this.notifications.set([]);
  }

  // --- MÉTODOS DE MENSAJES PREDEFINIDOS ---

  // Saluda al usuario cuando entra a la aplicacion.
  showWelcome(name: string) {
    this.success(`¡Bienvenido de vuelta, ${name}!`, { title: '👋 Hola', duration: 4000 });
  }

  // Muestra error cuando la contraseña o email son incorrectos.
  showLoginError() {
    this.error('El correo electrónico o la contraseña son incorrectos.', { title: '🔐 Acceso denegado' });
  }

  // Felicita al usuario por haberse registrado con exito.
  showRegistrationSuccess(name: string) {
    this.success(`¡Cuenta creada exitosamente! Bienvenido, ${name}`, { title: '🎉 Registro completado', duration: 6000 });
  }

  // Se despide del usuario al cerrar su sesion.
  showLogout() {
    this.info('Sesión cerrada correctamente', { title: '👋 Hasta pronto', duration: 3000 });
  }

  // Confirma que un nuevo post se subio bien.
  showPostCreated() {
    this.success('Publicación creada exitosamente', { title: '📝 Nueva publicación' });
  }

  // Confirma que un post se ha borrado correctamente.
  showPostDeleted() {
    this.success('Publicación eliminada', { title: '🗑️ Publicación eliminada' });
  }

  // Confirma que un post ha sido editado con exito.
  showPostUpdated() {
    this.success('Publicación actualizada', { title: '✏️ Cambios guardados' });
  }

  // Muestra un pequeño mensaje cuando das me gusta a alguien.
  showPostLiked(liked: boolean, userName: string) {
    if (liked) {
      this.info(`Te gusta la publicación de ${userName}`, { title: '❤️ Like', duration: 2000 });
    }
  }

  // Avisa de que el comentario se envio bien.
  showCommentAdded() {
    this.success('Comentario agregado', { title: '💬 Comentario', duration: 3000 });
  }

  // Avisa que los cambios de nombre o foto se han guardado.
  showProfileUpdated() {
    this.success('Perfil actualizado correctamente', { title: '👤 Perfil' });
  }

  // Confirma los cambios al poner la cuenta en publica o privada.
  showPrivacyUpdated(isPrivate: boolean) {
    const message = isPrivate ? 'Tu cuenta ahora es privada' : 'Tu cuenta ahora es pública';
    this.info(message, { title: '🔒 Privacidad', duration: 4000 });
  }

  // Confirma los cambios de quien puede mandarte mensajes.
  showMessageSettingsUpdated(onlyFollowers: boolean) {
    const message = onlyFollowers ? 'Solo tus seguidores pueden escribirte' : 'Todos pueden escribirte mensajes';
    this.info(message, { title: '💬 Mensajes', duration: 4000 });
  }

  // Avisa de que la pantalla a cambiado de color oscuro a claro o viceversa.
  showThemeChanged(theme: 'light' | 'dark') {
    const message = theme === 'dark' ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado';
    this.info(message, { duration: 2000, dismissible: false });
  }

  // Avisa de que se ha bloqueado a una persona con exito.
  showUserBlocked(userName: string) {
    this.info(`Usuario ${userName} bloqueado`, { title: '🚫 Usuario bloqueado', duration: 4000 });
  }

  // Avisa de que se ha desbloqueado a una persona.
  showUserUnblocked(userName: string) {
    this.info(`Usuario ${userName} desbloqueado`, { title: '✅ Usuario desbloqueado', duration: 4000 });
  }

  // Notifica que la reclamacion de soporte ha llegado a la base de datos.
  showTicketCreated(ticketId: number) {
    this.success(`Ticket #${ticketId} creado. Te responderemos pronto.`, { title: '🎫 Ticket de soporte', duration: 8000 });
  }

  // Muestra un error si el ticket de soporte falla.
  showTicketError() {
    this.error('Error al crear el ticket. Intenta de nuevo.', { title: '❌ Error en soporte' });
  }

  // Celebra cuando completas un reto normal y ganas puntos.
  showChallengeCompleted(title: string, points: number) {
    this.success(`"${title}" completado - +${points} ⚡`, { title: '🏆 Reto completado', duration: 5000 });
  }

  // Celebra cuando completas una accion del reto diario.
  showDailyChallengeCompleted(title: string, points: number) {
    this.success(`Reto diario: "${title}" - +${points} ⚡`, { title: '✨ ¡Buen trabajo!', duration: 5000 });
  }

  // Felicita al usuario por mantener una racha de varios dias.
  showStreakUpdated(streak: number) {
    if (streak > 0) {
      this.info(`¡Llevas ${streak} día${streak > 1 ? 's' : ''} seguidos! 🔥`, { title: '📅 Racha', duration: 4000 });
    }
  }

  // Indica de manera general que has ganado energia.
  showEnergyGained(points: number) {
    this.success(`+${points} ⚡ energía ganada`, { title: '⚡ Energía', duration: 3000 });
  }

  // Avisa de que se ha copiado el enlace para poder pegarlo en Whatsapp.
  showLinkCopied() {
    this.success('Link copiado al portapapeles', { title: '🔗 Enlace copiado', duration: 2000 });
  }

  // Confirma que el moderador ha recibido el aviso de un contenido toxico.
  showUserReported() {
    this.success('Contenido reportado. Gracias por tu colaboración.', { title: '⚠️ Reporte enviado', duration: 4000 });
  }

  // Muestra un error con un texto personalizado.
  showError(message: string) {
    this.error(message, { title: '❌ Error' });
  }

  // Muestra la ventana especial de confirmar con dos botones antes de hacer acciones destructivas.
  showConfirmAction(message: string, actionLabel: string, actionHandler: () => void) {
    return this.show({ type: 'info', message, duration: 10000, dismissible: true, action: { label: actionLabel, handler: actionHandler } });
  }
}