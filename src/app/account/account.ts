import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../services/user';
import { AuthService } from '../services/authBACK';
import { NotificationService } from '../services/notification'; 

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './account.html',
  styleUrls: ['./account.css']
})
export class AccountComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  
  userName = '';
  bio = '';
  email = '';
  
  isLoading = false; 

  // Carga los datos del usuario al abrir la pantalla de cuenta.
  ngOnInit() {
    const user = this.userService.getUser();
    if (user) {
      this.userName = user.nombre || user.name || '';
      this.bio = user.bio || '';
      this.email = user.email || '';
    }
  }
  
  // Valida y guarda los cambios del perfil del usuario en el servidor.
  saveProfile() {
    if (!this.userName.trim()) {
      this.notificationService.warning('El nombre no puede estar vacío.');
      return;
    }

    this.isLoading = true;
    
    const updatedData = {
      nombre: this.userName, 
      name: this.userName, // Compatibilidad
      bio: this.bio
    };

    this.userService.updateUser(updatedData).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.success('Perfil actualizado correctamente.');
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.notificationService.error('No se pudo conectar con el servidor para guardar los cambios.');
      }
    });
  }
  
  // Solicita y simula el cambio de la contraseña del usuario.
  changePassword() {
    // TODO: Conectar con endpoint real cuando exista
    const newPassword = prompt('Introduce tu nueva contraseña:');
    if (newPassword && newPassword.length >= 6) {
      this.notificationService.success('Contraseña cambiada (Simulación Local).');
    } else if (newPassword) {
      this.notificationService.warning('La contraseña debe tener al menos 6 caracteres.');
    }
  }
  
  // Cierra la sesión del usuario tras pedir confirmación.
  logout() {
    if (confirm('¿Cerrar sesión?')) {
      this.authService.logout();
    }
  }
}