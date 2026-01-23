import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class NotificationsComponent {
  enableNotifications = false;
  emailNotifications = true;
  likeNotifications = true;
  commentNotifications = true;
  achievementNotifications = true;
  frequency = 'realtime';
  
  constructor() {
    if ('Notification' in window) {
      this.enableNotifications = Notification.permission === 'granted';
    }
  }
  
  toggleNotifications() {
    if (this.enableNotifications && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        this.enableNotifications = permission === 'granted';
        if (this.enableNotifications) {
          this.showToast('🔔 Notificaciones activadas');
        }
      });
    }
  }
  
  saveSettings() {
    const settings = {
      enableNotifications: this.enableNotifications,
      emailNotifications: this.emailNotifications,
      likeNotifications: this.likeNotifications,
      commentNotifications: this.commentNotifications,
      achievementNotifications: this.achievementNotifications,
      frequency: this.frequency,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('pearly-notifications', JSON.stringify(settings));
    this.showToast('✅ Preferencias guardadas');
  }
  
  testNotification() {
    if (this.enableNotifications && Notification.permission === 'granted') {
      new Notification('Pearly - Notificación de prueba', {
        body: '¡Tus notificaciones están funcionando correctamente! 🎉',
        icon: '/assets/logo.png'
      });
      this.showToast('📱 Notificación de prueba enviada');
    } else {
      alert('Activa las notificaciones primero');
    }
  }
  
  private showToast(message: string) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 1000;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}