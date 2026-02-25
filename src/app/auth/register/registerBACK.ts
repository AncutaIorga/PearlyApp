import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/authBACK'; 

@Component({
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './registerBACK.html',
  styleUrl: './register.css' 
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  emailError = '';
  passwordError = '';
  
  // Variables para feedback del servidor
  serverError = ''; 
  isLoading = false; 
  
  showPassword = false;

  // Validaciones en tiempo real
  hasMinLength = false;
  hasUpperCase = false;
  hasLowerCase = false;
  hasNumber = false;
  hasSymbol = false;

  constructor(private auth: AuthService) {}

  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.email && !emailRegex.test(this.email)) {
      this.emailError = 'Ingresa un email válido (ejemplo: usuario@gmail.com)';
    } else {
      this.emailError = '';
    }
  }

  validatePassword() {
    this.hasMinLength = this.password.length >= 8;
    this.hasUpperCase = /[A-Z]/.test(this.password);
    this.hasLowerCase = /[a-z]/.test(this.password);
    this.hasNumber = /[0-9]/.test(this.password);
    this.hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/.test(this.password);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async register() {
    this.validateEmail();
    this.validatePassword();
    this.serverError = ''; // Limpiamos errores previos
    
    if (!this.emailError && 
        this.hasMinLength && 
        this.hasUpperCase && 
        this.hasLowerCase && 
        this.hasNumber && 
        this.hasSymbol) {
          
      this.isLoading = true; // Empezamos a cargar
      
      try {
        // Esperamos la respuesta del servidor
        const success = await this.auth.register(this.name, this.email, this.password);
        
        if (!success) {
          // Si falla, el servicio ya habrá notificado, pero aseguramos mensaje aquí
          this.serverError = 'No se pudo completar el registro. Verifica si el correo ya existe.';
        }
      } catch (error) {
        this.serverError = 'Error de conexión con el servidor.';
      } finally {
        this.isLoading = false;
      }
    }
  }
}