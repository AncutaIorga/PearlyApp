import { Component, HostListener, ElementRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  showSettings = false;
  
  private elementRef = inject(ElementRef);
  private router = inject(Router);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private themeService = inject(ThemeService);
  
  user = this.authService.user;
  userProfile = this.userService.getUser();
  currentTheme = this.themeService.currentTheme;

  toggleSettings(event: Event) {
    event.stopPropagation();
    this.showSettings = !this.showSettings;
  }

  handleSetting(action: string) {
    this.showSettings = false;
    
    switch(action) {
      case 'theme':
        this.handleTheme();
        break;
      case 'notifications':
        this.handleNotifications();
        break;
      case 'privacy':
        this.handlePrivacy();
        break;
      case 'account':
        this.handleAccount();
        break;
      case 'logout':
        this.handleLogout();
        break;
    }
  }

  private handleTheme() {
    const newTheme = this.themeService.toggleTheme();
    
    const themeMessages = {
      light: '🌞 Modo claro activado',
      dark: '🌙 Modo oscuro activado'
    };
    this.showToast(themeMessages[newTheme]);
  }

  private handleNotifications() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.router.navigate(['/notifications']);
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.showToast('🔔 Notificaciones habilitadas');
            this.createTestNotification();
            this.router.navigate(['/notifications']);
          }
        });
      } else {
        this.showToast('🔕 Notificaciones bloqueadas. Actívalas en configuración del navegador.');
      }
    } else {
      this.showToast('⚠️ Tu navegador no soporta notificaciones');
    }
  }

  private createTestNotification() {
    if (Notification.permission === 'granted') {
      new Notification('Pearly', {
        body: '¡Notificaciones activadas con éxito!',
        icon: '/assets/logo.png'
      });
    }
  }

  private handlePrivacy() {
    this.router.navigate(['/privacy']);
    
    const privacyPrefs = {
      lastViewed: new Date().toISOString(),
      showActivity: true,
      showProfile: true
    };
    localStorage.setItem('pearly-privacy', JSON.stringify(privacyPrefs));
  }

  private handleAccount() {
    if (this.user()) {
      this.router.navigate(['/account']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  private handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
      this.showToast('👋 Sesión cerrada correctamente');
    }
  }

  private showToast(message: string) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 1000;
      animation: fadeIn 0.3s;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSettings = false;
    }
  }

  ngOnInit() {
    // El tema ya se carga automáticamente en ThemeService
  }
}