import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user';
import { PostService, Post } from '../services/post';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  user: any;
  editing = false;
  editableUser: any = {};
  selectedPost: Post | null = null;
  
  // Para comentarios
  newComment = '';
  
  // Estadísticas dinámicas
  userStats = {
    posts: 0,
    followers: 0,
    following: 0
  };
  
  posts: Post[] = [];

  constructor(
    private userService: UserService,
    private postService: PostService,
    private router: Router
  ) {
    this.user = this.userService.getUser();
  }

  ngOnInit() {
    this.loadUserPosts();
    this.updateStats();
  }

  loadUserPosts() {
    // Cargar solo las publicaciones del usuario actual
    this.posts = this.postService.getPostsByUser(this.user.name);
  }

  updateStats() {
    // Actualizar estadísticas dinámicamente
    this.userStats.posts = this.posts.length;
    this.userStats.followers = this.userService.getFollowersCount();
    this.userStats.following = this.userService.getFollowingCount();
  }

  toggleEdit() {
    if (this.editing) {
      // Validaciones antes de guardar
      if (!this.editableUser.name || this.editableUser.name.trim().length < 2) {
        alert('El nombre debe tener al menos 2 caracteres');
        return;
      }

      if (this.editableUser.bio && this.editableUser.bio.length > 150) {
        alert('La biografía no puede exceder 150 caracteres');
        return;
      }

      // Validar URL de avatar si se proporcionó
      if (this.editableUser.avatar && this.editableUser.avatar.trim() !== '') {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(this.editableUser.avatar)) {
          alert('Por favor ingresa una URL válida que comience con http:// o https://');
          return;
        }
      }

      // Guardar cambios
      this.user = { ...this.editableUser };
      this.userService.updateUser(this.user);
      alert('Perfil actualizado correctamente');
    } else {
      this.editableUser = { ...this.user };
    }
    this.editing = !this.editing;
  }

  cancelEdit() {
    this.editing = false;
    this.editableUser = {};
  }

  goToChallenges() {
    this.router.navigate(['/challenges']);
  }

  openImageModal(post: Post) {
    this.selectedPost = post;
    this.newComment = '';
  }

  closeImageModal() {
    this.selectedPost = null;
    this.newComment = '';
  }

  toggleLike() {
    if (this.selectedPost) {
      this.postService.toggleLike(this.selectedPost.id);
      // Actualizar el post seleccionado
      const updatedPost = this.postService.getPostById(this.selectedPost.id);
      if (updatedPost) {
        this.selectedPost = updatedPost;
      }
      this.loadUserPosts();
    }
  }

  addComment() {
    if (this.selectedPost && this.newComment.trim()) {
      this.postService.addComment(
        this.selectedPost.id,
        this.newComment.trim(),
        this.user.name,
        this.user.avatar
      );
      
      // Actualizar el post seleccionado
      const updatedPost = this.postService.getPostById(this.selectedPost.id);
      if (updatedPost) {
        this.selectedPost = updatedPost;
      }
      
      this.newComment = '';
      this.loadUserPosts();
    }
  }

  deleteComment(commentId: number) {
    // Implementar si lo necesitas
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Ahora';
  }
}