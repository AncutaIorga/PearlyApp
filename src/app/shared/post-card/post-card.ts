import { Component, Input, inject, OnInit } from '@angular/core';
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
export class PostCardComponent implements OnInit {
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

  ngOnInit() {
    this.isLiked = this.post.likedByMe || false;
  }

  get isOwner(): boolean {
    const currentName = localStorage.getItem('userName') || '';
    return this.post.user?.toLowerCase() === currentName.toLowerCase();
  }

  onOptionSelected(event: { action: string; postId: number }) {
    if (event.action === 'delete') this.deletePost();
    if (event.action === 'block') this.bloquearAutor();
    if (event.action === 'mute') this.silenciarAutor();
  }

  private bloquearAutor() {
    this.blockService.blockUser(this.post.idUsuario).subscribe(() => {
      this.notificationService.success('Usuario bloqueado');
      this.postService.loadPostsFromBackend();
    });
  }

  private silenciarAutor() {
    this.blockService.muteUser(this.post.idUsuario).subscribe(() => {
      this.notificationService.success('Usuario silenciado');
      this.postService.loadPostsFromBackend();
    });
  }

  canDeleteComment(comment: Comment): boolean {
    const currentName = localStorage.getItem('userName') || '';
    return comment.user.toLowerCase() === currentName.toLowerCase();
  }

  deleteComment(commentId: number): void {
    this.postService.deleteComment(this.post.id, commentId);
  }

  addComment() {
    if (this.newComment.trim()) {
      this.postService.addComment(this.post.id, this.newComment).subscribe({
        next: () => {
          this.newComment = ''; // Limpia el input
          this.notificationService.success('¡Comentario añadido!');
          // No hace falta llamar a loadPosts aquí porque el servicio ya lo hace con el 'tap'
        }
      });
    }
  }

  toggleLike() {
    this.postService.toggleLike(this.post.id);
    this.isLiked = !this.isLiked;
  }

  toggleComments() { this.showComments = !this.showComments; }
  deletePost() { this.postService.deletePost(this.post.id); }
  getCurrentUserAvatar() { return this.userService.getUser().avatar || ''; }
  get shouldTruncate() { return this.post.text.length > 100; }
  get displayText() { return (this.shouldTruncate && !this.isTextExpanded) ? this.post.text.substring(0, 100) + '...' : this.post.text; }
}

