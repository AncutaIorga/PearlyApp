import { Component, OnInit, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NavbarComponent } from '../shared/navbar/navbar';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { SupportService, CreateTicketDto, SupportTicket } from '../services/support';
import { BlockService, BlockedUser } from '../services/block';
import { ThemeService } from '../services/theme';
import { NotificationService } from '../services/notification';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './ajustes.html',
  styleUrl: './ajustes.css'
})
export class AjustesComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private supportService = inject(SupportService);
  
  // Signals directos del servicio
  tickets: Signal<SupportTicket[]> = this.supportService.getTicketsSignal();
  
  loading = {
    privacy: false,
    notifications: false,
    tickets: false,
    blocked: false
  };

  privacySettings = { isPrivate: false };
  notificationSettings = { followers: true, comments: true, likes: true };
  blockedUsers: BlockedUser[] = [];
  
  newTicket: CreateTicketDto = { subject: '', description: '' };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private blockService: BlockService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit() {
    // Cargar datos iniciales
    const user = this.userService.getUser();
    if (user) this.privacySettings.isPrivate = user.isPrivate ?? false;
    
    this.loadBlockedUsers();
    // Tickets se cargan automáticamente por el signal en el servicio
  }

  // TEMA
  isDarkMode() { return this.themeService.isDarkMode(); }
  
  toggleTheme() {
    const newTheme = this.themeService.toggleTheme();
    this.notificationService.showThemeChanged(newTheme);
  }

  // PRIVACIDAD
  updatePrivacy() {
    this.loading.privacy = true;
    this.userService.updatePrivacy(this.privacySettings.isPrivate).subscribe({
      next: () => {
        this.loading.privacy = false;
        this.notificationService.showPrivacyUpdated(this.privacySettings.isPrivate);
      },
      error: () => {
        this.loading.privacy = false;
        this.privacySettings.isPrivate = !this.privacySettings.isPrivate; // Revertir
        this.notificationService.showError('Error al guardar privacidad');
      }
    });
  }

  // NOTIFICACIONES
  updateNotifications() {
    this.notificationService.success('Preferencias de notificación guardadas');
  }

  // BLOQUEOS
  loadBlockedUsers() {
    this.blockService.getBlockedUsers().subscribe(users => this.blockedUsers = users);
  }

  unblockUser(id: number) {
    this.blockService.unblockUser(id).subscribe(() => {
      this.blockedUsers = this.blockedUsers.filter(u => u.id !== id);
      this.notificationService.showUserUnblocked('Usuario');
    });
  }

  // SOPORTE
  submitTicket() {
    if (!this.newTicket.subject || !this.newTicket.description) return;

    this.loading.tickets = true;
    this.supportService.createTicket(this.newTicket).subscribe({
      next: (ticket) => {
        this.loading.tickets = false;
        this.newTicket = { subject: '', description: '' };
        this.notificationService.showTicketCreated(ticket.id);
      },
      error: () => {
        this.loading.tickets = false;
        this.notificationService.showTicketError();
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}