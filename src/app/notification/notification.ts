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

  dismiss(id: number) {
    this.clearTimer(id);
    this.notificationService.dismiss(id);
  }

  handleAction(notification: any) {
    if (notification.action?.handler) {
      notification.action.handler();
    }
    this.dismiss(notification.id);
  }

  pauseTimer(notification: any) {
    if (notification.duration && notification.duration > 0) {
      this.clearTimer(notification.id);
    }
  }

  resumeTimer(notification: any) {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
      this.timers.set(notification.id, timer);
    }
  }

  private clearTimer(id: number) {
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id));
      this.timers.delete(id);
    }
  }
}