import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user';
import { PostService, Post } from '../services/post';
import { AuthService } from '../services/auth';
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';
import { TimeAgoPipe } from '../pipes/time-ago-pipe';

@Component({
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule, TimeAgoPipe, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  
  user: any = {};
  isOwnProfile = true; // Controla si puedo editar o no
  
  // Variables de edición y modal
  editing = false;
  editableUser: any = {};
  selectedPost: Post | null = null;
  editingPost: Post | null = null;
  editPostData: any = {};
  newComment = '';
  
  userStats = { posts: 0, followers: 0, following: 0 };
  posts: Post[] = [];
  dailyChallenges: any[] = []; // Solo para mi perfil

  constructor(
    private userService: UserService,
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Suscribirse a cambios en la URL (por si navegamos de un perfil a otro)
    this.route.paramMap.subscribe(params => {
      const usernameParam = params.get('username');
      const currentUserName = localStorage.getItem('userName');

      if (usernameParam && usernameParam !== currentUserName) {
        // PERFIL DE OTRA PERSONA
        this.isOwnProfile = false;
        this.loadOtherUserProfile(usernameParam);
      } else {
        // MI PERFIL
        this.isOwnProfile = true;
        this.userService.syncWithAuthData();
        this.user = this.userService.getUser();
        this.loadMyData();
      }
    });
  }

  // Cargar datos de otro usuario (Simulado para frontend)
  loadOtherUserProfile(username: string) {
    // Buscamos si tiene posts para coger su avatar
    const userPosts = this.postService.getPostsByUser(username);
    const avatar = userPosts.length > 0 ? userPosts[0].userAvatar : '';

    this.user = {
      name: username,
      bio: `Perfil público de ${username}. Usuario de PearlyApp.`,
      avatar: avatar,
      achievements: Math.floor(Math.random() * 10),
      followers: 120, // Datos simulados
      following: 45
    };
    
    this.posts = userPosts;
    this.updateStats();
  }

  loadMyData() {
    this.loadUserPosts();
    this.updateStats();
    this.loadDailyChallenges(); // Solo cargo retos si soy yo
  }

  loadUserPosts() {
    this.posts = this.postService.getPostsByUser(this.user.name);
  }

  updateStats() {
    this.userStats.posts = this.posts.length;
    if (this.isOwnProfile) {
      this.userStats.followers = this.userService.getFollowersCount();
      this.userStats.following = this.userService.getFollowingCount();
    } else {
      this.userStats.followers = this.user.followers;
      this.userStats.following = this.user.following;
    }
  }

  // --- MÉTODOS DE EDICIÓN (Solo funcionan si isOwnProfile es true) ---

  toggleEdit() {
    if (!this.isOwnProfile) return;

    if (this.editing) {
      // Guardar cambios
      if (!this.editableUser.name || this.editableUser.name.trim().length < 2) {
        this.notificationService.warning('Nombre inválido');
        return;
      }
      this.user = { ...this.editableUser };
      this.userService.updateUser(this.user);
      localStorage.setItem('userName', this.user.name);
      this.notificationService.showProfileUpdated();
    } else {
      this.editableUser = { ...this.user };
    }
    this.editing = !this.editing;
  }

  cancelEdit() {
    this.editing = false;
    this.editableUser = {};
  }

  // --- MODALES Y ACCIONES ---

  openImageModal(post: Post) {
    this.selectedPost = post;
  }

  closeImageModal() {
    this.selectedPost = null;
    this.newComment = '';
  }

  toggleLike() {
    if (this.selectedPost) {
      this.postService.toggleLike(this.selectedPost.id);
      // Recargar post actualizado
      const updated = this.postService.getPostById(this.selectedPost.id);
      if (updated) this.selectedPost = updated;
    }
  }

  addComment() {
    if (this.selectedPost && this.newComment.trim()) {
      const myUser = this.userService.getUser();
      this.postService.addComment(
        this.selectedPost.id,
        this.newComment.trim(),
        myUser.name,
        myUser.avatar
      );
      const updated = this.postService.getPostById(this.selectedPost.id);
      if (updated) this.selectedPost = updated;
      this.newComment = '';
      this.notificationService.showCommentAdded();
    }
  }

  isPostOwner(post: Post): boolean {
    const currentUserName = localStorage.getItem('userName');
    return post.user === currentUserName;
  }

  // --- RETOS (Código simplificado, mantén tu lógica completa si la tienes) ---
  loadDailyChallenges() {
     // Aquí va tu lógica de cargar retos del localStorage...
     // Si la perdiste, avísame, pero asumo que ya la tienes del paso anterior.
     // Para que no de error la compilación, inicializo vacío:
     this.dailyChallenges = []; 
  }
  
  goToDailyChallenge(id: string) {
    this.router.navigate(['/challenges']);
  }

  // Gestión de post propio
  openEditPostModal(post: Post) {
    this.editingPost = post;
    this.editPostData = { text: post.text, image: post.image };
  }
  
  closeEditPostModal() { this.editingPost = null; }
  
  saveEditedPost() {
    if(this.editingPost) {
       this.postService.updatePost(this.editingPost.id, this.editPostData);
       this.loadUserPosts();
       this.closeEditPostModal();
    }
  }
  
  deletePost(id: number) {
    if(confirm('¿Eliminar?')) {
        this.postService.deletePost(id);
        this.loadUserPosts();
        this.closeImageModal();
        this.closeEditPostModal();
    }
  }
}