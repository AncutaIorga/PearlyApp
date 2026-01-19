import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private auth: AuthService) {}

  login() {
    this.auth.login(this.email, this.password);
  }
}
