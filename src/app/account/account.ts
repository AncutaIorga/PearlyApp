import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../services/user';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './account.html',
  styleUrls: ['./account.css']
})
export class AccountComponent {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  userName = this.userService.getUser().name;
  bio = this.userService.getUser().bio;
  email = 'usuario@ejemplo.com';
  
  saveProfile() {
    alert(`Perfil guardado:\nNombre: ${this.userName}\nBio: ${this.bio}`);
  }
  
  changePassword() {
    const newPassword = prompt('Introduce tu nueva contraseña:');
    if (newPassword) {
      alert('🔐 Contraseña cambiada exitosamente');
    }
  }
  
  logout() {
    if (confirm('¿Cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}