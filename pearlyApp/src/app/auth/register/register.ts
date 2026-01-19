import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';

  constructor(private auth: AuthService) {}

  register() {
    this.auth.register(this.name, this.email, this.password);
  }
}
