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

  success(message: string, options?: Partial<AppNotification>) {
    return this.show({ type: 'success', message, title: options?.title || '✅ Éxito', duration: options?.duration ?? this.defaultDuration, dismissible: options?.dismissible ?? true, ...options });
  }

  error(message: string, options?: Partial<AppNotification>) {
    return this.show({ type: 'error', message, title: options?.title || '❌ Error', duration: options?.duration ?? this.defaultDuration * 1.5, dismissible: options?.dismissible ?? true, ...options });
  }

  info(message: string, options?: Partial<AppNotification>) {
    return this.show({ type: 'info', message, title: options?.title || 'ℹ️ Información', duration: options?.duration ?? this.defaultDuration, dismissible: options?.dismissible ?? true, ...options });
  }

  warning(message: string, options?: Partial<AppNotification>) {
    return this.show({ type: 'warning', message, title: options?.title || '⚠️ Advertencia', duration: options?.duration ?? this.defaultDuration, dismissible: options?.dismissible ?? true, ...options });
  }

  show(notification: Omit<AppNotification, 'id' | 'createdAt'>) {
    // ARREGLO #1: Limpiar array para dejar solo 1 notificación en pantalla
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

  dismiss(id: number) {
    this.notifications.update(notifications => 
      notifications.filter(n => n.id !== id)
    );
  }

  dismissAll() {
    this.notifications.set([]);
  }

  // ===== MÉTODOS ESPECÍFICOS PARA CADA SERVICIO =====

  showWelcome(name: string) {
    this.success(`¡Bienvenido de vuelta, ${name}!`, { title: '👋 Hola', duration: 4000 });
  }

  showLoginError() {
    this.error('El correo electrónico o la contraseña son incorrectos.', { title: '🔐 Acceso denegado' });
  }

  showRegistrationSuccess(name: string) {
    this.success(`¡Cuenta creada exitosamente! Bienvenido, ${name}`, { title: '🎉 Registro completado', duration: 6000 });
  }

  showLogout() {
    this.info('Sesión cerrada correctamente', { title: '👋 Hasta pronto', duration: 3000 });
  }

  showPostCreated() {
    this.success('Publicación creada exitosamente', { title: '📝 Nueva publicación' });
  }

  showPostDeleted() {
    this.success('Publicación eliminada', { title: '🗑️ Publicación eliminada' });
  }

  showPostUpdated() {
    this.success('Publicación actualizada', { title: '✏️ Cambios guardados' });
  }

  showPostLiked(liked: boolean, userName: string) {
    if (liked) {
      this.info(`Te gusta la publicación de ${userName}`, { title: '❤️ Like', duration: 2000 });
    }
  }

  showCommentAdded() {
    this.success('Comentario agregado', { title: '💬 Comentario', duration: 3000 });
  }

  showProfileUpdated() {
    this.success('Perfil actualizado correctamente', { title: '👤 Perfil' });
  }

  showPrivacyUpdated(isPrivate: boolean) {
    const message = isPrivate ? 'Tu cuenta ahora es privada' : 'Tu cuenta ahora es pública';
    this.info(message, { title: '🔒 Privacidad', duration: 4000 });
  }

  showMessageSettingsUpdated(onlyFollowers: boolean) {
    const message = onlyFollowers ? 'Solo tus seguidores pueden escribirte' : 'Todos pueden escribirte mensajes';
    this.info(message, { title: '💬 Mensajes', duration: 4000 });
  }

  showThemeChanged(theme: 'light' | 'dark') {
    const message = theme === 'dark' ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado';
    this.info(message, { duration: 2000, dismissible: false });
  }

  showUserBlocked(userName: string) {
    this.info(`Usuario ${userName} bloqueado`, { title: '🚫 Usuario bloqueado', duration: 4000 });
  }

  showUserUnblocked(userName: string) {
    this.info(`Usuario ${userName} desbloqueado`, { title: '✅ Usuario desbloqueado', duration: 4000 });
  }

  showTicketCreated(ticketId: number) {
    this.success(`Ticket #${ticketId} creado. Te responderemos pronto.`, { title: '🎫 Ticket de soporte', duration: 8000 });
  }

  showTicketError() {
    this.error('Error al crear el ticket. Intenta de nuevo.', { title: '❌ Error en soporte' });
  }

  showChallengeCompleted(title: string, points: number) {
    this.success(`"${title}" completado - +${points} ⚡`, { title: '🏆 Reto completado', duration: 5000 });
  }

  showDailyChallengeCompleted(title: string, points: number) {
    this.success(`Reto diario: "${title}" - +${points} ⚡`, { title: '✨ ¡Buen trabajo!', duration: 5000 });
  }

  showStreakUpdated(streak: number) {
    if (streak > 0) {
      this.info(`¡Llevas ${streak} día${streak > 1 ? 's' : ''} seguidos! 🔥`, { title: '📅 Racha', duration: 4000 });
    }
  }

  showEnergyGained(points: number) {
    this.success(`+${points} ⚡ energía ganada`, { title: '⚡ Energía', duration: 3000 });
  }

  showLinkCopied() {
    this.success('Link copiado al portapapeles', { title: '🔗 Enlace copiado', duration: 2000 });
  }

  showUserReported() {
    this.success('Contenido reportado. Gracias por tu colaboración.', { title: '⚠️ Reporte enviado', duration: 4000 });
  }

  showError(message: string) {
    this.error(message, { title: '❌ Error' });
  }

  showConfirmAction(message: string, actionLabel: string, actionHandler: () => void) {
    return this.show({ type: 'info', message, duration: 10000, dismissible: true, action: { label: actionLabel, handler: actionHandler } });
  }
}