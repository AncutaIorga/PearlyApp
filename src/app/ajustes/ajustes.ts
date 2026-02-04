import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../shared/navbar/navbar';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';

interface BlockedUser {
  id: number;
  name: string;
  avatar?: string;
  blockedAt: Date;
}

interface SupportTicket {
  id: number;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  response?: string;
  createdAt: Date;
  respondedAt?: Date;
  expanded?: boolean;
}

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './ajustes.html',
  styleUrl: './ajustes.css'
})
export class AjustesComponent implements OnInit {
  // Configuración de privacidad
  privacySettings = {
    isPrivate: false
  };

  // Configuración de notificaciones
  notificationSettings = {
    followers: true,
    comments: true,
    likes: true
  };

  // Configuración de mensajes
  messageSettings = {
    onlyFollowers: false
  };

  // Usuarios bloqueados
  blockedUsers: BlockedUser[] = [];

  // Tickets de soporte
  tickets: SupportTicket[] = [];
  
  newTicket = {
    subject: '',
    description: ''
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.loadBlockedUsers();
    this.loadTickets();
  }

  loadSettings() {
    // Cargar configuración de privacidad
    const savedPrivacy = localStorage.getItem('privacy-settings');
    if (savedPrivacy) {
      this.privacySettings = JSON.parse(savedPrivacy);
    }

    // Cargar configuración de notificaciones
    const savedNotifications = localStorage.getItem('notification-settings');
    if (savedNotifications) {
      this.notificationSettings = JSON.parse(savedNotifications);
    }

    // Cargar configuración de mensajes
    const savedMessages = localStorage.getItem('message-settings');
    if (savedMessages) {
      this.messageSettings = JSON.parse(savedMessages);
    }
  }

  loadBlockedUsers() {
    const saved = localStorage.getItem('blocked-users');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convertir fechas
      this.blockedUsers = parsed.map((user: any) => ({
        ...user,
        blockedAt: new Date(user.blockedAt)
      }));
    }
  }

  loadTickets() {
    const saved = localStorage.getItem('support-tickets');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convertir fechas
      this.tickets = parsed.map((ticket: any) => ({
        ...ticket,
        createdAt: new Date(ticket.createdAt),
        respondedAt: ticket.respondedAt ? new Date(ticket.respondedAt) : undefined,
        expanded: false
      }));
    }
  }

  updatePrivacy() {
    localStorage.setItem('privacy-settings', JSON.stringify(this.privacySettings));
    
    if (this.privacySettings.isPrivate) {
      this.showToast('🔒 Cuenta privada activada');
    } else {
      this.showToast('🌍 Cuenta pública activada');
    }
  }

  updateNotifications() {
    localStorage.setItem('notification-settings', JSON.stringify(this.notificationSettings));
    this.showToast('🔔 Preferencias de notificaciones actualizadas');
  }

  updateMessageSettings() {
    localStorage.setItem('message-settings', JSON.stringify(this.messageSettings));
    
    if (this.messageSettings.onlyFollowers) {
      this.showToast('💬 Solo tus seguidores pueden escribirte');
    } else {
      this.showToast('💬 Todos pueden escribirte mensajes');
    }
  }

  unblockUser(userId: number) {
    const user = this.blockedUsers.find(u => u.id === userId);
    if (confirm(`¿Desbloquear a ${user?.name}?`)) {
      this.blockedUsers = this.blockedUsers.filter(u => u.id !== userId);
      localStorage.setItem('blocked-users', JSON.stringify(this.blockedUsers));
      this.showToast(`✅ ${user?.name} ha sido desbloqueado`);
    }
  }

  submitTicket() {
    if (!this.newTicket.subject.trim() || !this.newTicket.description.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    const user = this.userService.getUser();
    const ticket: SupportTicket = {
      id: Date.now(),
      userId: user.email,
      subject: this.newTicket.subject.trim(),
      description: this.newTicket.description.trim(),
      status: 'open',
      createdAt: new Date(),
      expanded: false
    };

    this.tickets.unshift(ticket);
    localStorage.setItem('support-tickets', JSON.stringify(this.tickets));

    // Limpiar formulario
    this.newTicket = { subject: '', description: '' };
    
    this.showToast('✅ Ticket enviado correctamente. Te responderemos pronto.');

    // TODO: Cuando tengas backend, enviar al servidor
    // this.http.post('/api/support/tickets', ticket).subscribe(...)
  }

  toggleTicket(ticketId: number) {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.expanded = !ticket.expanded;
    }
  }

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

  // Método para bloquear usuarios (llamar desde otros componentes)
  blockUser(userId: number, userName: string, userAvatar?: string) {
    const newBlockedUser: BlockedUser = {
      id: userId,
      name: userName,
      avatar: userAvatar,
      blockedAt: new Date()
    };
    
    this.blockedUsers.push(newBlockedUser);
    localStorage.setItem('blocked-users', JSON.stringify(this.blockedUsers));
    this.showToast(`🚫 ${userName} ha sido bloqueado`);
  }
}