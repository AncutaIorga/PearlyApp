import { Component, Input } from '@angular/core';
import { PostOptionsComponent } from '../post-options/post-options';

export interface Post {
  id: number;
  user: string;
  image: string;
  text: string;
  likes: number;
  content?: string;
}

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [PostOptionsComponent],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css']
})
export class PostCardComponent {
  @Input() post!: Post;
  isLiked = false;

  toggleLike() {
    this.isLiked = !this.isLiked;
    this.post.likes += this.isLiked ? 1 : -1;
  }

  onOptionSelected(event: { action: string; postId: number }) {
    console.log('Opción seleccionada:', event);
  }
}
