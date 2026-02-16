import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // <--- IMPORTANTE: Debe estar aquí
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
    RouterModule, // <--- ASEGÚRATE DE QUE ESTÉ EN IMPORTS
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

  ngOnInit() {
    // Verificamos si el usuario actual le ha dado like al cargar
    this.isLiked = this.post.likedByMe || false;
  }

  toggleLike() {
    this.postService.toggleLike(this.post.id);
    
    // Actualizamos el estado local para la UI inmediata
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
      
      // Sincronizar el post local con los nuevos comentarios del servicio
      const updatedPost = this.postService.getPostById(this.post.id);
      if (updatedPost) {
        this.post.comments = updatedPost.comments;
      }
      
      this.newComment = '';
      this.notificationService.showCommentAdded();
    }
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