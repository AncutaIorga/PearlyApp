/*

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { HttpErrorResponse } from '@angular/common/http';

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
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  // ===============================
  // VALIDACIÓN DE EMAIL
  // ===============================
  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.email && !emailRegex.test(this.email)) {
      this.emailError = 'Ingresa un email válido';
    } else {
      this.emailError = '';
    }
  }

  // ===============================
  // LOGIN
  // ===============================
  login() {
    this.validateEmail();

    // Validación simple
    if (this.emailError || !this.password) {
      return;
    }

    this.loading = true;
    this.emailError = ''; // limpiar errores anteriores

    // ===============================
    // Llamada a AuthService (mock o backend)
    // ===============================
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/feed']); // Navegación al feed
      },
      error: (err: any) => {
        this.loading = false;

        // Si es backend real, HttpErrorResponse
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            this.emailError = 'Credenciales incorrectas';
          } else {
            this.emailError = 'Error del servidor';
          }
        } else {
          // Si es mock local, err.message
          this.emailError = err?.message || 'Email o contraseña incorrectos';
        }
      }
    });
  }
}


*/