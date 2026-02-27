import { Component, OnInit, inject, Signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../shared/navbar/navbar';
import { AuthService } from '../services/authBACK';
import { UserService } from '../services/user';
import { SupportService, CreateTicketDto } from '../services/support';
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
  
  private cdr = inject(ChangeDetectorRef);

  public blockedUsers = computed(() => this.blockService.blockedUsers ? this.blockService.blockedUsers() : []);
  public tickets = this.supportService.getTicketsSignal(); 
  
  showBlockedModal = false;

  loading = { privacy: false, tickets: false };
  privacySettings = { isPrivate: false };
  newTicket: CreateTicketDto = { subject: '', description: '' };

  ngOnInit() {
    const user = this.userService.getUser();
    if (user) {
      this.privacySettings.isPrivate = user.isPrivate ?? false;
    }
  }

  openBlockedModal() { this.showBlockedModal = true; }
  closeBlockedModal() { this.showBlockedModal = false; }

  isDarkMode() { return this.themeService.isDarkMode(); }
  
  toggleTheme() {
    const newTheme = this.themeService.toggleTheme();
    this.notificationService.showThemeChanged(newTheme);
  }

  updatePrivacy() {
    this.loading.privacy = true;
    this.userService.updatePrivacy(this.privacySettings.isPrivate).subscribe({
      next: () => {
        this.loading.privacy = false;
        this.notificationService.showPrivacyUpdated(this.privacySettings.isPrivate);
      },
      error: (err) => {
        this.loading.privacy = false;
        this.privacySettings.isPrivate = !this.privacySettings.isPrivate;
        this.notificationService.error('Error de conexión al cambiar privacidad.');
      }
    });
  }

  unblockUser(id: number | undefined) {
  if (!id) return;
  // Asegúrate de que no diga "unblockUsser"
  this.blockService.blockUser(id).subscribe({
    next: () => {
      this.notificationService.success('Usuario desbloqueado');
      this.blockService.cargarRestricciones();
    }
  });
}

  submitTicket() {
    if (!this.newTicket.subject.trim() || !this.newTicket.description.trim()) {
       this.notificationService.warning('Completa todos los campos.');
       return;
    }
    
    this.loading.tickets = true;
    this.cdr.detectChanges(); 
    
    this.supportService.createTicket(this.newTicket).subscribe({
      next: (ticket) => {
        this.loading.tickets = false;
        this.newTicket = { subject: '', description: '' };
        
        this.notificationService.showTicketCreated(ticket.id || 0);
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading.tickets = false;
        console.error('Error ticket:', error);
        
        if (error.message === 'Usuario no identificado') {
           this.notificationService.error('Error de sesión. Por favor, recarga la página.');
        } else if (error.status === 400) {
           this.notificationService.error('Error 400: El servidor rechazó los datos.');
        } else {
           this.notificationService.error('Error de conexión con el servidor.');
        }
        this.cdr.detectChanges();
      }
    });
  }

  logout() { this.authService.logout(); }
}