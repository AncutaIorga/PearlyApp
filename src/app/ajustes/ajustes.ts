import { Component, OnInit, inject, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../shared/navbar/navbar';
import { AuthService } from '../services/authBACK';
import { UserService } from '../services/user';
import { SupportService, CreateTicketDto } from '../services/support';
import { BlockService } from '../services/block';
import { ThemeService } from '../services/theme';
import { NotificationService } from '../services/notification';
import { PostService } from '../services/post';

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
  public postService = inject(PostService);
  private cdr = inject(ChangeDetectorRef);

  /**
   * Como el Backend ahora envía el nombre real ("Ivan"), 
   * el computed solo se encarga de eliminar duplicados.
   */
  public blockedUsers = computed(() => {
    const list = this.blockService.blockedUsers();
    const uniqueMap = new Map(list.map(u => [u.idBloqueado, u]));
    return Array.from(uniqueMap.values());
  });

  public mutedUsers = computed(() => {
    const list = this.blockService.mutedUsers();
    const uniqueMap = new Map(list.map(u => [u.idBloqueado, u]));
    return Array.from(uniqueMap.values());
  });

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
    this.blockService.cargarRestricciones();
  }

  openBlockedModal() { this.showBlockedModal = true; }
  closeBlockedModal() { this.showBlockedModal = false; }

  isDarkMode() { return this.themeService.isDarkMode(); }
  
  toggleTheme() {
    const newTheme = this.themeService.toggleTheme();
    this.notificationService.showThemeChanged(newTheme);
  }

  /**
   * DESBLOQUEAR
   */
  unblockUser(idBloqueado: number | undefined) {
    if (!idBloqueado) return;
    
    this.blockService.unblockUserByUsername(idBloqueado).subscribe({
      next: () => {
        this.notificationService.success('Usuario desbloqueado');
        this.postService.loadPostsFromBackend(); // Refresca feed
      },
      error: () => this.notificationService.error('Error al desbloquear')
    });
  }

  /**
   * DESILENCIAR (Añadido para que funcione igual que el desbloqueo)
   */
  unmuteUser(idBloqueado: number | undefined) {
    if (!idBloqueado) return;

    this.blockService.unmuteUser(idBloqueado).subscribe({
      next: () => {
        this.notificationService.success('Usuario desilenciado');
        this.postService.loadPostsFromBackend(); // Refresca feed
      },
      error: () => this.notificationService.error('Error al desilenciar')
    });
  }

  updatePrivacy() {
    this.loading.privacy = true;
    this.userService.updatePrivacy(this.privacySettings.isPrivate).subscribe({
      next: () => {
        this.loading.privacy = false;
        this.notificationService.showPrivacyUpdated(this.privacySettings.isPrivate);
      },
      error: () => {
        this.loading.privacy = false;
        this.privacySettings.isPrivate = !this.privacySettings.isPrivate;
      }
    });
  }

  submitTicket() {
    if (!this.newTicket.subject.trim() || !this.newTicket.description.trim()) return;
    this.loading.tickets = true;
    this.supportService.createTicket(this.newTicket).subscribe({
      next: (ticket) => {
        this.loading.tickets = false;
        this.newTicket = { subject: '', description: '' };
        this.notificationService.showTicketCreated(ticket.id || 0);
        this.cdr.detectChanges();
      },
      error: () => { 
        this.loading.tickets = false; 
        this.cdr.detectChanges(); 
      }
    });
  }

  logout() { this.authService.logout(); }
}