import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { NavbarComponent } from '../shared/navbar/navbar';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { SupportService, CreateTicketDto, SupportTicket } from '../services/support';
import { BlockService, BlockedUser } from '../services/block';
import { NotificationService, NotificationSettings } from '../services/notification';
import { ThemeService } from '../services/theme';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './ajustes.html',
  styleUrl: './ajustes.css'
})
export class AjustesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Loading states
  loading = {
    privacy: false,
    notifications: false,
    messages: false,
    tickets: false,
    blocked: false
  };

  // Configuración de privacidad
  privacySettings = {
    isPrivate: false
  };

  // Configuración de notificaciones
  notificationSettings: NotificationSettings = {
    followers: true,
    comments: true,
    likes: true,
    messages: true
  };

  // Configuración de mensajes
  messageSettings = {
    onlyFollowers: false
  };

  // Usuarios bloqueados
  blockedUsers: BlockedUser[] = [];

  // Tickets de soporte
  tickets: (SupportTicket & { expanded?: boolean })[] = [];
  
  newTicket: CreateTicketDto = {
    subject: '',
    description: ''
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private supportService: SupportService,
    private blockService: BlockService,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAllSettings();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════
  // TEMA
  // ═══════════════════════════════════════════════════════════

  /**
   * Verifica si el modo oscuro está activo
   */
  isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  /**
   * Alterna entre tema claro y oscuro
   */
  toggleTheme(): void {
    const newTheme = this.themeService.toggleTheme();
    
    const themeMessages = {
      light: '☀️ Modo claro activado',
      dark: '🌙 Modo oscuro activado'
    };
    
    this.showToast(themeMessages[newTheme]);
  }


  // ═══════════════════════════════════════════════════════════
  // CARGA INICIAL
  // ═══════════════════════════════════════════════════════════

  private loadAllSettings() {
    this.loadUserSettings();
    this.loadNotificationSettings();
    this.loadBlockedUsers();
    this.loadTickets();
  }

  private loadUserSettings() {
    const user = this.userService.getUser();
    if (user) {
      this.privacySettings.isPrivate = user.isPrivate ?? false;
      this.messageSettings.onlyFollowers = user.onlyFollowersMessages ?? false;
    }
  }

  private loadNotificationSettings() {
    this.notificationService.getSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.notificationSettings = settings;
      });
  }

  private loadBlockedUsers() {
    this.loading.blocked = true;
    this.blockService.getBlockedUsers()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.blocked = false)
      )
      .subscribe(users => {
        this.blockedUsers = users;
      });
  }

  private loadTickets() {
    this.loading.tickets = true;
    this.supportService.getMyTickets()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.tickets = false)
      )
      .subscribe(tickets => {
        this.tickets = tickets.map(t => ({ ...t, expanded: false }));
      });
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVACIDAD
  // ═══════════════════════════════════════════════════════════

  updatePrivacy() {
    this.loading.privacy = true;
    
    this.userService.updatePrivacy(this.privacySettings.isPrivate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.privacy = false)
      )
      .subscribe({
        next: () => {
          this.showToast(
            this.privacySettings.isPrivate
              ? '🔒 Cuenta privada activada'
              : '🌍 Cuenta pública activada'
          );
        },
        error: (error) => {
          console.error('Error updating privacy:', error);
          // Revertir el toggle en caso de error
          this.privacySettings.isPrivate = !this.privacySettings.isPrivate;
          this.showToast('❌ Error al actualizar privacidad', 'error');
        }
      });
  }

  // ═══════════════════════════════════════════════════════════
  // NOTIFICACIONES
  // ═══════════════════════════════════════════════════════════

  updateNotifications() {
    this.loading.notifications = true;
    
    this.notificationService.updateSettings(this.notificationSettings)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.notifications = false)
      )
      .subscribe({
        next: () => {
          this.showToast('🔔 Preferencias de notificaciones actualizadas');
        },
        error: (error) => {
          console.error('Error updating notifications:', error);
          this.showToast('❌ Error al actualizar notificaciones', 'error');
        }
      });
  }

  // ═══════════════════════════════════════════════════════════
  // MENSAJES
  // ═══════════════════════════════════════════════════════════

  updateMessageSettings() {
    this.loading.messages = true;
    
    this.userService.updateMessageSettings(this.messageSettings.onlyFollowers)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.messages = false)
      )
      .subscribe({
        next: () => {
          this.showToast(
            this.messageSettings.onlyFollowers
              ? '💬 Solo tus seguidores pueden escribirte'
              : '💬 Todos pueden escribirte mensajes'
          );
        },
        error: (error) => {
          console.error('Error updating message settings:', error);
          this.messageSettings.onlyFollowers = !this.messageSettings.onlyFollowers;
          this.showToast('❌ Error al actualizar configuración de mensajes', 'error');
        }
      });
  }

  // ═══════════════════════════════════════════════════════════
  // BLOQUEOS
  // ═══════════════════════════════════════════════════════════

  unblockUser(userId: number) {
    const user = this.blockedUsers.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`¿Desbloquear a ${user.name}?`)) {
      this.blockService.unblockUser(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.blockedUsers = this.blockedUsers.filter(u => u.id !== userId);
            this.showToast(`✅ ${user.name} ha sido desbloqueado`);
          },
          error: (error) => {
            console.error('Error unblocking user:', error);
            this.showToast('❌ Error al desbloquear usuario', 'error');
          }
        });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SOPORTE
  // ═══════════════════════════════════════════════════════════

  submitTicket() {
    if (!this.newTicket.subject.trim() || !this.newTicket.description.trim()) {
      this.showToast('⚠️ Por favor completa todos los campos', 'warning');
      return;
    }

    if (this.newTicket.subject.length < 5) {
      this.showToast('⚠️ El asunto debe tener al menos 5 caracteres', 'warning');
      return;
    }

    if (this.newTicket.description.length < 20) {
      this.showToast('⚠️ La descripción debe tener al menos 20 caracteres', 'warning');
      return;
    }

    this.loading.tickets = true;

    this.supportService.createTicket({
      subject: this.newTicket.subject.trim(),
      description: this.newTicket.description.trim()
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.tickets = false)
      )
      .subscribe({
        next: (ticket) => {
          this.tickets.unshift({ ...ticket, expanded: false });
          this.newTicket = { subject: '', description: '' };
          this.showToast('✅ Ticket enviado correctamente. Te responderemos pronto.');
        },
        error: (error) => {
          console.error('Error creating ticket:', error);
          this.showToast('❌ Error al enviar el ticket. Intenta de nuevo.', 'error');
        }
      });
  }

  toggleTicket(ticketId: number) {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.expanded = !ticket.expanded;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'open': 'Abierto',
      'in-progress': 'En proceso',
      'resolved': 'Resuelto',
      'closed': 'Cerrado'
    };
    return statusMap[status] || status;
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.authService.logout();
      this.showToast('👋 Sesión cerrada correctamente');
    }
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    const colors = {
      success: 'linear-gradient(135deg, #a2b895 0%, #679460 100%)',
      error: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
      warning: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
    };

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-weight: 600;
      animation: slideIn 0.3s ease;
      max-width: 400px;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        toast.remove();
        style.remove();
      }, 300);
    }, 3000);
  }
}