import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/authBACK'; 

@Component({
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './loginBACK.html',
  styleUrl: './login.css' 
})
export class LoginComponent {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  emailError = '';
  serverError = ''; 
  isLoading = false; 

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
    this.serverError = ''; 

    if (!this.emailError) {
      // ✅ Parche para evitar Error NG0100
      setTimeout(() => {
        this.isLoading = true;
        this.cdr.detectChanges();
      });
      
      try {
        const success = await this.auth.login(this.email, this.password);
        if (!success) {
          this.serverError = 'Credenciales incorrectas o error en el servidor.';
        }
      } catch (error) {
        this.serverError = 'Error de conexión. Intenta más tarde.';
      } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }
  }
}