import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; 
import { PostOptionsComponent } from '../post-options/post-options';
import { PostService, Post } from '../../services/post';
import { AuthService } from '../../services/auth';
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

  ngOnInit() {
    this.isLiked = this.post.likedByMe || false;
  }

  // 👇 AQUÍ ESTÁ LA MAGIA QUE FALTABA 👇
  // Comprobación a prueba de balas para saber si el post es tuyo
  get isOwner(): boolean {
    if (!this.post || !this.post.user) return false;
    const currentUserName = localStorage.getItem('userName') || '';
    
    // Comparamos ignorando mayúsculas/minúsculas y espacios
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
    if (this.newComment.trim()) {
      const currentUser = this.authService.user();
      const userProfile = this.userService.getUser();
      
      this.postService.addComment(
        this.post.id,
        this.newComment.trim(),
        currentUser?.name || 'Usuario',
        userProfile.avatar
      );
      
      const updatedPost = this.postService.getPostById(this.post.id);
      if (updatedPost) {
        this.post.comments = updatedPost.comments;
      }
      
      this.newComment = '';
      this.notificationService.showCommentAdded();
    }
  }

  // Cuando le das al botón de "Eliminar" en los 3 puntitos, entra por aquí
  onOptionSelected(event: { action: string; postId: number }) {
    if (event.action === 'delete') {
      this.deletePost();
    }
  }

deletePost() {
    // Usamos tu servicio de notificaciones en lugar del 'confirm' nativo
    this.notificationService.showConfirmAction(
      '¿Seguro que quieres eliminar esta publicación?',
      'Sí, eliminar',
      () => {
        this.postService.deletePost(this.post.id);
        this.notificationService.success('Publicación eliminada');
        
        // Si estamos en la página del perfil, forzamos la recarga para que desaparezca
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