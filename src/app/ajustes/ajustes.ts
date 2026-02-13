import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { NavbarComponent } from '../shared/navbar/navbar';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { SupportService, CreateTicketDto, SupportTicket } from '../services/support';
import { BlockService, BlockedUser } from '../services/block';
import { ThemeService } from '../services/theme';
import { NotificationService } from '../services/notification'; // Importación correcta

// Definir la interfaz localmente ya que no está exportada
interface NotificationSettings {
  followers: boolean;
  comments: boolean;
  likes: boolean;
  messages: boolean;
}

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './ajustes.html',
  styleUrl: './ajustes.css'
})
export class AjustesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private notificationService = inject(NotificationService);
  
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

  isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  toggleTheme(): void {
    const newTheme = this.themeService.toggleTheme();
    this.notificationService.showThemeChanged(newTheme);
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
    // Cargar desde localStorage o usar valores por defecto
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      try {
        this.notificationSettings = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading notification settings', e);
      }
    }
  }

  private loadBlockedUsers() {
    this.loading.blocked = true;
    this.blockService.getBlockedUsers()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.blocked = false)
      )
      .subscribe({
        next: (users) => {
          this.blockedUsers = users;
        },
        error: (error: any) => {
          console.error('Error loading blocked users:', error);
          this.notificationService.showError('Error al cargar usuarios bloqueados');
        }
      });
  }

  private loadTickets() {
    this.loading.tickets = true;
    this.supportService.getMyTickets()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.tickets = false)
      )
      .subscribe({
        next: (tickets) => {
          this.tickets = tickets.map(t => ({ ...t, expanded: false }));
        },
        error: (error: any) => {
          console.error('Error loading tickets:', error);
        }
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
          this.notificationService.showPrivacyUpdated(this.privacySettings.isPrivate);
        },
        error: (error: any) => {
          console.error('Error updating privacy:', error);
          this.privacySettings.isPrivate = !this.privacySettings.isPrivate;
          this.notificationService.showError('Error al actualizar privacidad');
        }
      });
  }

  // ═══════════════════════════════════════════════════════════
  // NOTIFICACIONES
  // ═══════════════════════════════════════════════════════════

  updateNotifications() {
    this.loading.notifications = true;
    
    // Guardar en localStorage
    try {
      localStorage.setItem('notification-settings', JSON.stringify(this.notificationSettings));
      this.notificationService.success('Preferencias de notificaciones actualizadas', {
        title: '🔔 Notificaciones'
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      this.notificationService.showError('Error al actualizar notificaciones');
    } finally {
      this.loading.notifications = false;
    }
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
          this.notificationService.showMessageSettingsUpdated(this.messageSettings.onlyFollowers);
        },
        error: (error: any) => {
          console.error('Error updating message settings:', error);
          this.messageSettings.onlyFollowers = !this.messageSettings.onlyFollowers;
          this.notificationService.showError('Error al actualizar configuración de mensajes');
        }
      });
  }

  // ═══════════════════════════════════════════════════════════
  // BLOQUEOS
  // ═══════════════════════════════════════════════════════════

  unblockUser(userId: number) {
    const user = this.blockedUsers.find(u => u.id === userId);
    if (!user) return;

    const notificationId = this.notificationService.showConfirmAction(
      `¿Desbloquear a ${user.name}?`,
      'Sí, desbloquear',
      () => {
        this.blockService.unblockUser(userId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.blockedUsers = this.blockedUsers.filter(u => u.id !== userId);
              this.notificationService.showUserUnblocked(user.name);
            },
            error: (error: any) => {
              console.error('Error unblocking user:', error);
              this.notificationService.showError('Error al desbloquear usuario');
            }
          });
      }
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SOPORTE
  // ═══════════════════════════════════════════════════════════

  submitTicket() {
    if (!this.newTicket.subject.trim() || !this.newTicket.description.trim()) {
      this.notificationService.warning('Por favor completa todos los campos');
      return;
    }

    if (this.newTicket.subject.length < 5) {
      this.notificationService.warning('El asunto debe tener al menos 5 caracteres');
      return;
    }

    if (this.newTicket.description.length < 20) {
      this.notificationService.warning('La descripción debe tener al menos 20 caracteres');
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
          this.notificationService.showTicketCreated(ticket.id);
        },
        error: (error: any) => {
          console.error('Error creating ticket:', error);
          this.notificationService.showTicketError();
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
    const notificationId = this.notificationService.showConfirmAction(
      '¿Estás seguro de que quieres cerrar sesión?',
      'Sí, cerrar sesión',
      () => {
        this.authService.logout();
      }
    );
  }
}