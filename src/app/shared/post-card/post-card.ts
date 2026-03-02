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
  isAddingComment = false;

  defaultAvatar = 'assets/default-avatar.png';

  // Verifica si le diste like a esta publicacion antes al cargarla.
  ngOnInit() {
    this.updateLikeStatus();
  }

  // Mantiene tu corazoncito rojo en tiempo real si ocurren cambios globales.
  ngOnChanges(changes: SimpleChanges) {
    if (changes['post']) {
      this.updateLikeStatus();
    }
  }

  // Pinta el corazon si detecta que has dado like al post.
  private updateLikeStatus() {
    this.isLiked = this.post.likedByMe || false;
  }

  // Comprueba si nosotros mismos somos los creadores del post para darnos mas permisos.
  get isOwner(): boolean {
    const currentName = localStorage.getItem('userName') || '';
    return this.post.user?.toLowerCase() === currentName.toLowerCase();
  }

  // Actua como centralita para ejecutar lo que hayas pulsado en el menu de opciones.
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
      case 'report':
        this.reportarPost();
        break;
    }
  }

  // Pide confirmacion y envia al backend la orden de bloquear a ese usuario.
  bloquearUsuario() {
    if (!this.post.idUsuario) return;

    this.notificationService.showConfirmAction(
      `¿Seguro que quieres bloquear a ${this.post.user}?`,
      'Sí, bloquear',
      () => {
        this.blockService.blockUser(this.post.idUsuario).subscribe({
          next: () => {
            this.notificationService.success(`Has bloqueado a ${this.post.user}`);
            this.postService.loadPostsFromBackend(); 
          },
          error: (err) => {
            console.error('Error al bloquear:', err);
            this.notificationService.error('No se pudo bloquear al usuario');
          }
        });
      }
    );
  }

  // Envia al backend la orden silenciosa de dejar de ver a esa persona sin borrarla.
  private silenciarAutor() {
    this.blockService.muteUser(this.post.idUsuario).subscribe({
      next: () => {
        this.notificationService.success(`Usuario ${this.post.user} silenciado`);
        this.postService.loadPostsFromBackend();
      },
      error: () => this.notificationService.error('Error al silenciar usuario')
    });
  }

  // Simula el reporte de una publicacion pidiendo confirmacion previa.
  private reportarPost() {
    this.notificationService.showConfirmAction(
      '¿Reportar este contenido como inapropiado?',
      'Sí, reportar',
      () => {
        this.notificationService.success('Gracias por tu reporte. Lo revisaremos pronto.');
      }
    );
  }

  // Comprueba si eres el dueño del post o del comentario para poder borrarlo.
  canDeleteComment(comment: Comment): boolean {
    const currentName = localStorage.getItem('userName') || '';
    return comment.user?.toLowerCase() === currentName.toLowerCase() || this.isOwner;
  }

  // Saca el aviso de borrar comentario y le dice al backend que lo elimine.
  deleteComment(commentId: number): void {
    this.notificationService.showConfirmAction(
      '¿Borrar comentario?',
      'Sí, eliminar',
      () => {
        this.postService.deleteComment(this.post.id, commentId);
      }
    );
  }

  // Procesa lo que has escrito, lo valida y lo sube como comentario.
  addComment() {
    const text = this.newComment.trim();
    if (text && !this.isAddingComment) {
      this.isAddingComment = true; 
      
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

  // Da like si no lo tenias o lo quita si ya estaba puesto.
  toggleLike() {
    this.isLiked = !this.isLiked;
    this.postService.toggleLike(this.post.id);
  }

  // Despliega o recoge visualmente la lista de comentarios al hacer clic.
  toggleComments() { 
    this.showComments = !this.showComments; 
  }

  // Saca el aviso definitivo y borra la publicacion entera de la base de datos.
  deletePost() { 
    this.notificationService.showConfirmAction(
      '¿Seguro que quieres eliminar esta publicación?',
      'Sí, eliminar',
      () => {
        this.postService.deletePost(this.post.id); 
      }
    );
  }

  // Busca el avatar correcto para ponerlo y usa una silueta vacia si falla.
  getCurrentUserAvatar() { 
    return this.userService.getUser()?.avatar || this.defaultAvatar; 
  }

  // Revisa si el texto de la publicacion es muy largo para esconder parte de el.
  get shouldTruncate() { 
    return (this.post.text?.length || 0) > 100; 
  }

  // Devuelve el texto completo o recortado con los puntitos dependiendo de si apretaste "Ver mas".
  get displayText() { 
    if (this.shouldTruncate && !this.isTextExpanded) {
      return this.post.text.substring(0, 100) + '...';
    }
    return this.post.text;
  }
}