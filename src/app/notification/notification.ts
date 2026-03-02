import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.css']
})
export class NotificationComponent {
  notificationService = inject(NotificationService);
  private timers: Map<number, any> = new Map();

  // Elimina una notificacion especifica de la pantalla.
  dismiss(id: number) {
    this.clearTimer(id);
    this.notificationService.dismiss(id);
  }

  // Ejecuta la accion asociada al boton de una notificacion y luego la cierra.
  handleAction(notification: any) {
    if (notification.action?.handler) {
      notification.action.handler();
    }
    this.dismiss(notification.id);
  }

  // Detiene el temporizador de cierre automatico cuando el raton pasa por encima.
  pauseTimer(notification: any) {
    if (notification.duration && notification.duration > 0) {
      this.clearTimer(notification.id);
    }
  }

  // Reanuda el temporizador de cierre automatico cuando el raton sale de la notificacion.
  resumeTimer(notification: any) {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
      this.timers.set(notification.id, timer);
    }
  }

  // Limpia internamente el temporizador activo de una notificacion.
  private clearTimer(id: number) {
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id));
      this.timers.delete(id);
    }
  }
}