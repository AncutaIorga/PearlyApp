import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-post-card',
  standalone: true,
  templateUrl: './post-card.html',
  styleUrl: './post-card.css'
})
export class PostCardComponent {
  @Input() post!: any;
  isLiked = false;

  toggleLike() {
    this.isLiked = !this.isLiked;
    if (this.isLiked) {
      this.post.likes++;
    } else {
      this.post.likes--;
    }
  }
}