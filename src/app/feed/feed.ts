import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService, Post } from '../services/post';
import { PostCardComponent } from '../shared/post-card/post-card';
import { NavbarComponent } from '../shared/navbar/navbar';
import { MuteService } from '../services/mute';

@Component({
  standalone: true,
  imports: [CommonModule, PostCardComponent, NavbarComponent],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class FeedComponent {
  posts: Post[] = [];

  constructor(
    private postService: PostService,
    private muteService: MuteService
  ) {
    const allPosts = this.postService.getAllPosts();
    this.posts = allPosts.filter(p => !this.muteService.isMuted(p.user));
  }
}
