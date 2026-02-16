import { Component, OnInit, inject, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { SupportService, CreateTicketDto, SupportTicket } from '../services/support';
import { BlockService } from '../services/block';
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
  public notificationService = inject(NotificationService);
  public supportService = inject(SupportService);
  public blockService = inject(BlockService);
  public themeService = inject(ThemeService);
  public authService = inject(AuthService);
  public userService = inject(UserService);

  // Signals para reactividad
  public blockedUsers = computed(() => this.blockService.blockedUsers());
  public mutedUsers = computed(() => this.blockService.mutedUsers());
  public tickets: Signal<SupportTicket[]> = this.supportService.getTicketsSignal();
  
  // Variables para el Modal
  showBlockedModal = false;

  loading = { privacy: false, notifications: false, tickets: false };
  privacySettings = { isPrivate: false };
  notificationSettings = { followers: true, comments: true, likes: true };
  newTicket: CreateTicketDto = { subject: '', description: '' };

  ngOnInit() {
    const user = this.userService.getUser();
    if (user) {
      this.privacySettings.isPrivate = user.isPrivate ?? false;
    }
  }

  // --- Lógica de Modal ---
  openBlockedModal() { this.showBlockedModal = true; }
  closeBlockedModal() { this.showBlockedModal = false; }

  // --- Otros Métodos ---
  isDarkMode() { return this.themeService.isDarkMode(); }
  
  toggleTheme() {
    const newTheme = this.themeService.toggleTheme();
    this.notificationService.showThemeChanged(newTheme);
  }

  updatePrivacy() {
    this.userService.updatePrivacy(this.privacySettings.isPrivate).subscribe(() => {
      this.notificationService.showPrivacyUpdated(this.privacySettings.isPrivate);
    });
  }

  updateNotifications() { this.notificationService.success('Preferencias guardadas'); }

  unblockUser(id: number) {
    this.blockService.unblockUser(id).subscribe(() => {
      this.notificationService.success('Usuario desbloqueado');
      // Si la lista queda vacía, cerramos el modal automáticamente
      if (this.blockedUsers().length === 0) this.closeBlockedModal();
    });
  }

  submitTicket() {
    if (!this.newTicket.subject.trim() || !this.newTicket.description.trim()) return;
    this.loading.tickets = true;
    this.supportService.createTicket(this.newTicket).subscribe({
      next: (ticket) => {
        this.loading.tickets = false;
        this.newTicket = { subject: '', description: '' };
        this.notificationService.showTicketCreated(ticket.id);
      },
      error: () => this.loading.tickets = false
    });
  }

  logout() { this.authService.logout(); }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}