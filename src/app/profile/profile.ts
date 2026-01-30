import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'  
})
export class ProfileComponent {
  user: any;
  posts = [
    { image: 'https://picsum.photos/400/400?random=1', likes: 45, comments: 12, title: 'Post 1' },
    { image: 'https://picsum.photos/400/400?random=2', likes: 78, comments: 23, title: 'Post 2' },
    { image: 'https://picsum.photos/400/400?random=3', likes: 102, comments: 34, title: 'Post 3' },
    { image: 'https://picsum.photos/400/400?random=4', likes: 56, comments: 8, title: 'Post 4' },
    { image: 'https://picsum.photos/400/400?random=5', likes: 89, comments: 19, title: 'Post 5' },
    { image: 'https://picsum.photos/400/400?random=6', likes: 134, comments: 42, title: 'Post 6' },
  ];

  constructor(
    private userService: UserService,
    private router: Router
  ) {
    this.user = this.userService.getUser();
  }

  goToChallenges() {
    this.router.navigate(['/challenges']);
  }
}