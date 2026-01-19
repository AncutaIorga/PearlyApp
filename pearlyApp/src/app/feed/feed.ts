import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post';
import { PostCardComponent } from '../shared/post-card/post-card';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  standalone: true,
  imports: [CommonModule, PostCardComponent, NavbarComponent],
  templateUrl: './feed.html',
  styleUrl: './feed.css'  
})
export class FeedComponent {
  posts;

  constructor(private postService: PostService) {
    this.posts = this.postService.posts;
  }
}