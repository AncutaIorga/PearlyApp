import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user';
import { PostService, Post } from '../services/post';
import { AuthService } from '../services/auth';
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
  
  // Nuevas propiedades para editar/eliminar posts
  editingPost: Post | null = null;
  editPostData: any = {};
  
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
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Sincronizar datos del usuario con la autenticación
    this.userService.syncWithAuthData();
    
    // Obtener datos del usuario
    this.user = this.userService.getUser();
    
    // Cargar posts del usuario actual
    this.loadUserPosts();
    this.updateStats();
    
    console.log('Usuario actual:', this.user.name);
  }

  loadUserPosts() {
    // Cargar solo las publicaciones del usuario actual
    const userName = this.user.name;
    console.log('Buscando posts para usuario:', userName);
    this.posts = this.postService.getPostsByUser(userName);
    console.log('Posts encontrados:', this.posts.length);
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

      // Guardar cambios en el perfil
      this.user = { ...this.editableUser };
      this.userService.updateUser(this.user);
      
      // Actualizar también en localStorage para mantener sincronizado con autenticación
      localStorage.setItem('userName', this.user.name);
      
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

  // NUEVOS MÉTODOS PARA EDITAR/ELIMINAR POSTS
  
  // Abrir modal para editar post
  openEditPostModal(post: Post) {
    this.editingPost = post;
    this.editPostData = {
      text: post.text,
      image: post.image
    };
  }

  // Cerrar modal de edición
  closeEditPostModal() {
    this.editingPost = null;
    this.editPostData = {};
  }

  // Guardar cambios del post editado
  saveEditedPost() {
    if (this.editingPost && this.editPostData.text.trim()) {
      // Validar URL de imagen si se proporcionó
      if (this.editPostData.image && this.editPostData.image.trim() !== '') {
        // Aceptar tanto URLs http/https como data URLs (base64)
        const urlPattern = /^(https?:\/\/|data:image\/)/;
        if (!urlPattern.test(this.editPostData.image)) {
          alert('Por favor ingresa una URL válida:\n- Comienza con http:// o https://\n- O una URL data:image/ (imagen en base64)');
          return;
        }
      }

      // Actualizar el post
      this.postService.updatePost(this.editingPost.id, {
        text: this.editPostData.text,
        image: this.editPostData.image || this.editingPost.image
      });

      // Actualizar la lista de posts
      this.loadUserPosts();
      
      // Si el post editado está abierto en el modal, actualizarlo también
      if (this.selectedPost && this.selectedPost.id === this.editingPost.id) {
        const updatedPost = this.postService.getPostById(this.editingPost.id);
        if (updatedPost) {
          this.selectedPost = updatedPost;
        }
      }

      this.closeEditPostModal();
      alert('Publicación actualizada correctamente');
    }
  }

  // Eliminar post
  deletePost(postId: number) {
    if (confirm('¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.')) {
      this.postService.deletePost(postId);
      this.loadUserPosts();
      this.updateStats();
      
      // Cerrar modales si estaban abiertos
      if (this.selectedPost && this.selectedPost.id === postId) {
        this.closeImageModal();
      }
      if (this.editingPost && this.editingPost.id === postId) {
        this.closeEditPostModal();
      }
      
      alert('Publicación eliminada correctamente');
    }
  }

  // Verificar si el usuario actual es el dueño del post
  isPostOwner(post: Post): boolean {
    const currentUserName = this.user.name;
    return post.user === currentUserName;
  }
}