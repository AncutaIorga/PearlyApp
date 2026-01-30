import { Component, HostListener, ElementRef, inject, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
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
      new Notification('PearlyApp', {
        body: '¡Notificaciones activadas con éxito!',
        icon: '/assets/icons/icon-192x192.png'
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
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  private handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.authService.logout();
      this.showToast('👋 Sesión cerrada correctamente');
    }
  }

  private showToast(message: string) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #a2b895 0%, #679460 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
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