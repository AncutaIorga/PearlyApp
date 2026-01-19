import { Component } from '@angular/core';
import { PostService } from '../services/post';
import { PostCardComponent } from '../shared/post-card/post-card';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  standalone: true,
  imports: [PostCardComponent, NavbarComponent],
  templateUrl: './feed.html'
})
export class FeedComponent {
  posts;

  constructor(private postService: PostService) {
    this.posts = this.postService.posts;
  }
}
