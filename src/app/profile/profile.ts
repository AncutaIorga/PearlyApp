import { Component } from '@angular/core';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css'  
})
export class ProfileComponent {
  user: any;

  constructor(private userService: UserService) {
    this.user = this.userService.getUser();
  }
}