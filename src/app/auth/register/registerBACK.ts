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
  
  serverError = ''; 
  isLoading = false; 
  
  showPassword = false;

  hasMinLength = false;
  hasUpperCase = false;
  hasLowerCase = false;
  hasNumber = false;
  hasSymbol = false;

  constructor(private auth: AuthService) {}

  // Verifica que el correo ingresado tenga un formato de email valido.
  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.email && !emailRegex.test(this.email)) {
      this.emailError = 'Ingresa un email válido (ejemplo: usuario@gmail.com)';
    } else {
      this.emailError = '';
    }
  }

  // Comprueba que la contraseña cumpla con los requisitos de seguridad.
  validatePassword() {
    this.hasMinLength = this.password.length >= 8;
    this.hasUpperCase = /[A-Z]/.test(this.password);
    this.hasLowerCase = /[a-z]/.test(this.password);
    this.hasNumber = /[0-9]/.test(this.password);
    this.hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/.test(this.password);
  }

  // Muestra u oculta la contraseña escrita en el formulario.
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Valida los datos y envia la peticion al servidor para registrar un nuevo usuario.
  async register() {
    this.validateEmail();
    this.validatePassword();
    this.serverError = ''; 
    
    if (!this.emailError && 
        this.hasMinLength && 
        this.hasUpperCase && 
        this.hasLowerCase && 
        this.hasNumber && 
        this.hasSymbol) {
          
      this.isLoading = true; 
      
      try {
        const success = await this.auth.register(this.name, this.email, this.password);
        
        if (!success) {
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