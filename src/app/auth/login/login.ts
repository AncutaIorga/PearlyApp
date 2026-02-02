import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

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

  constructor(private auth: AuthService) {}

  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.email && !emailRegex.test(this.email)) {
      this.emailError = 'Ingresa un email válido';
    } else {
      this.emailError = '';
    }
  }

  login() {
    this.validateEmail();
    if (!this.emailError) {
      this.auth.login(this.email, this.password);
    }
  }
}