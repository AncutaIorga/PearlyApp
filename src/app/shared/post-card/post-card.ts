import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; 
import { PostOptionsComponent } from '../post-options/post-options';
import { PostService, Post, Comment } from '../../services/post';
import { AuthService } from '../../services/authBACK';
import { UserService } from '../../services/user';
import { NotificationService } from '../../services/notification';
import { TimeAgoPipe } from '../../pipes/time-ago-pipe';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    PostOptionsComponent, 
    TimeAgoPipe
  ],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css']
})
export class PostCardComponent implements OnInit {
  @Input() post!: Post;
  
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  
  showComments = false;
  newComment = '';
  isLiked = false;
  isTextExpanded = false;
  isAddingComment = false;

  ngOnInit() {
    this.isLiked = this.post.likedByMe || false;
  }

  get isOwner(): boolean {
    if (!this.post || !this.post.user) return false;
    const currentUserName = localStorage.getItem('userName') || '';
    return this.post.user.trim().toLowerCase() === currentUserName.trim().toLowerCase();
  }

  get shouldTruncate(): boolean {
    return this.post.text.length > 100;
  }

  get displayText(): string {
    if (this.shouldTruncate && !this.isTextExpanded) {
      return this.post.text.substring(0, 100) + '...';
    }
    return this.post.text;
  }

  canDeleteComment(comment: Comment): boolean {
    const currentUserName = this.getCurrentUserName();
    return comment.user.toLowerCase() === currentUserName.toLowerCase();
  }

  deleteComment(commentId: number): void {
    this.notificationService.showConfirmAction(
      '¿Eliminar este comentario?',
      'Sí, eliminar',
      () => {
        this.postService.deleteComment(this.post.id, commentId);
        
        const updatedPost = this.postService.getPostById(this.post.id);
        if (updatedPost) {
          this.post.comments = updatedPost.comments;
        }
        
        this.notificationService.success('Comentario eliminado');
      }
    );
  }

  toggleLike() {
    this.postService.toggleLike(this.post.id);
    this.isLiked = !this.isLiked;
    this.post.likes += this.isLiked ? 1 : -1;
    this.post.likedByMe = this.isLiked;
    
    if (this.isLiked) {
      this.notificationService.showPostLiked(true, this.post.user);
    }
  }

  toggleComments() {
    this.showComments = !this.showComments;
  }

  addComment() {
    if (this.newComment.trim() && !this.isAddingComment) {
      this.isAddingComment = true;
      
      const currentUser = this.authService.user();
      const userProfile = this.userService.getUser();
      const userName = currentUser?.nombre || this.getCurrentUserName();
      
      this.postService.addComment(
        this.post.id,
        this.newComment.trim(),
        userName,
        userProfile.avatar
      );
      
      const updatedPost = this.postService.getPostById(this.post.id);
      if (updatedPost) {
        this.post.comments = updatedPost.comments;
      }
      
      this.newComment = '';
      this.isAddingComment = false;
      this.notificationService.showCommentAdded();
    }
  }

  onOptionSelected(event: { action: string; postId: number }) {
    if (event.action === 'delete') {
      this.deletePost();
    }
  }

  deletePost() {
    this.notificationService.showConfirmAction(
      '¿Seguro que quieres eliminar esta publicación?',
      'Sí, eliminar',
      () => {
        this.postService.deletePost(this.post.id);
        this.notificationService.success('Publicación eliminada');
        
        if (window.location.pathname.includes('/profile')) {
          setTimeout(() => window.location.reload(), 500);
        }
      }
    );
  }

  getCurrentUserAvatar(): string {
    return this.userService.getUser().avatar || '';
  }

  getCurrentUserName(): string {
    return localStorage.getItem('userName') || 'Usuario';
  }
}