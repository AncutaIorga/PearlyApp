import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostOptionsComponent } from '../post-options/post-options';
import { PostService } from '../../services/post';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { NotificationService } from '../../services/notification'; // Cambiado a NotificationService
import { TimeAgoPipe } from '../../pipes/time-ago-pipe';

export interface Post {
  id: number;
  user: string;
  userAvatar?: string;
  image: string;
  text: string;
  likes: number;
  likedByMe?: boolean;
  comments: Comment[];
  createdAt: Date;
}

export interface Comment {
  id: number;
  user: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule, PostOptionsComponent, TimeAgoPipe],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css']
})
export class PostCardComponent implements OnInit {
  @Input() post!: Post;
  
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService); // Cambiado a NotificationService
  
  showComments = false;
  newComment = '';
  isLiked = false;

  ngOnInit() {
    this.isLiked = this.post.likedByMe || false;
  }

  toggleLike() {
    this.isLiked = !this.isLiked;
    this.post.likes += this.isLiked ? 1 : -1;
    this.post.likedByMe = this.isLiked;
    this.postService.toggleLike(this.post.id);
    
    if (this.isLiked) {
      this.notificationService.showPostLiked(true, this.post.user);
    }
  }

  toggleComments() {
    this.showComments = !this.showComments;
  }

  addComment() {
    if (this.newComment.trim()) {
      const currentUser = this.authService.user();
      const userProfile = this.userService.getUser();
      
      this.postService.addComment(
        this.post.id,
        this.newComment.trim(),
        currentUser?.name || 'Usuario',
        userProfile.avatar
      );
      
      // Actualizar el post con el nuevo comentario
      const updatedPost = this.postService.getPostById(this.post.id);
      if (updatedPost) {
        this.post.comments = updatedPost.comments;
      }
      
      this.newComment = '';
      this.notificationService.showCommentAdded();
    }
  }

  sharePost() {
    const shareData = {
      title: 'Publicación en PearlyApp',
      text: this.post.text,
      url: `${window.location.origin}/post/${this.post.id}`
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => {
          this.notificationService.success('¡Compartido exitosamente!');
        })
        .catch((error) => {
          console.log('Error sharing:', error);
          this.copyLink();
        });
    } else {
      this.copyLink();
    }
  }

  private copyLink() {
    const url = `${window.location.origin}/post/${this.post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.notificationService.showLinkCopied();
    });
  }

  onOptionSelected(event: { action: string; postId: number }) {
    console.log('Opción seleccionada:', event);
  }

  getCurrentUserAvatar(): string {
    return this.userService.getUser().avatar || '';
  }

  getCurrentUserName(): string {
    return this.authService.user()?.name || 'Usuario';
  }
}