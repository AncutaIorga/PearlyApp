import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; 
import { PostOptionsComponent } from '../post-options/post-options';
import { PostService, Post, Comment } from '../../services/post';
import { UserService } from '../../services/user';
import { NotificationService } from '../../services/notification';
import { BlockService } from '../../services/block';
import { TimeAgoPipe } from '../../pipes/time-ago-pipe';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PostOptionsComponent, TimeAgoPipe],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css']
})
export class PostCardComponent implements OnInit, OnChanges {
  @Input() post!: Post;
  
  private postService = inject(PostService);
  private userService = inject(UserService);
  private blockService = inject(BlockService);
  private notificationService = inject(NotificationService);
  
  showComments = false;
  newComment = '';
  isLiked = false;
  isTextExpanded = false;
  
  // VARIABLE CRÍTICA: Añadida para resolver el error TS2551 del terminal
  isAddingComment = false;

  // Imagen por defecto para usuarios sin avatar
  defaultAvatar = 'assets/default-avatar.png';

  ngOnInit() {
    this.updateLikeStatus();
  }

  // Sincroniza el estado del Like cuando el Signal del servicio actualiza el @Input
  ngOnChanges(changes: SimpleChanges) {
    if (changes['post']) {
      this.updateLikeStatus();
    }
  }

  private updateLikeStatus() {
    this.isLiked = this.post.likedByMe || false;
  }

  get isOwner(): boolean {
    const currentName = localStorage.getItem('userName') || '';
    return this.post.user?.toLowerCase() === currentName.toLowerCase();
  }

  // Manejador centralizado de acciones del menú de opciones
  onOptionSelected(event: { action: string; postId: number }) {
    switch (event.action) {
      case 'delete':
        this.deletePost();
        break;
      case 'block':
        this.bloquearUsuario();
        break;
      case 'mute':
        this.silenciarAutor();
        break;
    }
  }

  bloquearUsuario() {
    if (!this.post.idUsuario) return;

    this.blockService.blockUser(this.post.idUsuario).subscribe({
      next: () => {
        this.notificationService.success('Usuario bloqueado correctamente');
        // ¡ESTO ES CLAVE! Refresca la lista de posts para que el del usuario bloqueado desaparezca
        this.postService.loadPostsFromBackend(); 
      },
      error: (err) => {
        console.error('Error al bloquear:', err);
        this.notificationService.error('No se pudo bloquear al usuario');
      }
    });
  }

  private silenciarAutor() {
    this.blockService.muteUser(this.post.idUsuario).subscribe({
      next: () => {
        this.notificationService.success(`Usuario ${this.post.user} silenciado`);
        this.postService.loadPostsFromBackend();
      },
      error: () => this.notificationService.error('Error al silenciar usuario')
    });
  }

  canDeleteComment(comment: Comment): boolean {
    const currentName = localStorage.getItem('userName') || '';
    // Un comentario puede ser borrado por su autor O por el dueño del post
    return comment.user?.toLowerCase() === currentName.toLowerCase() || this.isOwner;
  }

  deleteComment(commentId: number): void {
    if (confirm('¿Borrar comentario?')) {
      this.postService.deleteComment(this.post.id, commentId);
    }
  }

  addComment() {
    const text = this.newComment.trim();
    if (text && !this.isAddingComment) {
      this.isAddingComment = true; // Deshabilita el botón en el HTML
      
      this.postService.addComment(this.post.id, text).subscribe({
        next: () => {
          this.newComment = ''; 
          this.isAddingComment = false;
          this.notificationService.success('¡Comentario añadido!');
          this.showComments = true;
        },
        error: () => {
          this.isAddingComment = false;
          this.notificationService.error('Error al enviar el comentario');
        }
      });
    }
  }

  toggleLike() {
    this.isLiked = !this.isLiked;
    this.postService.toggleLike(this.post.id);
  }

  toggleComments() { 
    this.showComments = !this.showComments; 
  }

  deletePost() { 
    if (confirm('¿Seguro que quieres eliminar esta publicación?')) {
      this.postService.deletePost(this.post.id); 
    }
  }

  getCurrentUserAvatar() { 
    return this.userService.getUser()?.avatar || this.defaultAvatar; 
  }

  get shouldTruncate() { 
    return (this.post.text?.length || 0) > 100; 
  }

  get displayText() { 
    if (this.shouldTruncate && !this.isTextExpanded) {
      return this.post.text.substring(0, 100) + '...';
    }
    return this.post.text;
  }
}