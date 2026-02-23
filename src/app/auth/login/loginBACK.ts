/*import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/authBACK';

@Component({
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css' 
})
export class LoginComponent {
  email = '';
  password = '';
  emailError = '';
  
  // 👇 AQUÍ ESTÁN LAS DOS VARIABLES QUE TE PEDÍA EL COMPILADOR 👇
  serverError = ''; 
  isLoading = false; 

  constructor(private auth: AuthService) {}

  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.email && !emailRegex.test(this.email)) {
      this.emailError = 'Ingresa un email válido';
    } else {
      this.emailError = '';
    }
  }

  async login() {
    this.validateEmail();
    this.serverError = ''; // Limpiamos errores previos

    if (!this.emailError) {
      this.isLoading = true; // Activamos el estado de carga
      
      // Esperamos a que el servicio intente conectar con la base de datos
      const success = await this.auth.login(this.email, this.password);
      
      if (!success) {
        // Si el servicio devuelve false, mostramos este error
        this.serverError = 'Error al iniciar sesión. Revisa tus datos o la conexión.';
      }
      
      setTimeout(() => this.isLoading = false, 0); 
    }
  }
}
*/