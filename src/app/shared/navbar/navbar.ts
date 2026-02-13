import { Component, HostListener, ElementRef, inject, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { ThemeService } from '../../services/theme';
import { NotificationService } from '../../services/notification';

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
  router = inject(Router);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private themeService = inject(ThemeService);
  private notificationService = inject(NotificationService);
  
  user = this.authService.user;
  userProfile = this.userService.getUser();
  currentTheme = this.themeService.currentTheme;

  toggleSettings(event: Event) {
    event.stopPropagation();
    this.showSettings = !this.showSettings;
  }

  handleSetting(action: string) {
    this.showSettings = false;
    
    if (action === 'settings') {
      this.router.navigate(['/ajustes']);
    } else if (action === 'logout') {
      this.handleLogout();
    }
  }

  private handleTheme() {
    const newTheme = this.themeService.toggleTheme();
    this.notificationService.showThemeChanged(newTheme);
  }

  private handleNotifications() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.router.navigate(['/notifications']);
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.notificationService.success('🔔 Notificaciones habilitadas');
            this.createTestNotification();
            this.router.navigate(['/notifications']);
          }
        });
      } else {
        this.notificationService.warning('Notificaciones bloqueadas. Actívalas en configuración del navegador.');
      }
    } else {
      this.notificationService.warning('Tu navegador no soporta notificaciones');
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
    const notificationId = this.notificationService.showConfirmAction(
      '¿Estás seguro de que quieres cerrar sesión?',
      'Sí, cerrar sesión',
      () => {
        this.authService.logout();
      }
    );
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