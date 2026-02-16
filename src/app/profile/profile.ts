import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user';
import { PostService, Post } from '../services/post';
import { AuthService } from '../services/auth';
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';
import { TimeAgoPipe } from '../pipes/time-ago-pipe';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  tags: string[];
  category?: string;
}

@Component({
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule, TimeAgoPipe, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  
  @ViewChild('fileInput') fileInput!: ElementRef; // AÑADIR ESTA LÍNEA
  
  user: any = {};
  isOwnProfile = true; // Controla si puedo editar o no
  
  // Variables de edición y modal
  editing = false;
  editableUser: any = {};
  selectedPost: Post | null = null;
  editingPost: Post | null = null;
  editPostData: any = {};
  newComment = '';
  
  // Nueva variable para la imagen seleccionada
  selectedAvatarFile: File | null = null;
  avatarPreview: string | null = null;
  
  userStats = { posts: 0, followers: 0, following: 0 };
  posts: Post[] = [];
  pendingDailyChallenges: DailyChallenge[] = []; // Retos diarios pendientes

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
    this.loadPendingDailyChallenges(); // Cargo retos pendientes
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

  // --- CARGAR RETOS DIARIOS PENDIENTES ---
  private loadPendingDailyChallenges() {
    const userData = this.userService.getUser();
    const userId = userData?.email ? userData.email.replace(/[.#$[\]]/g, '_') : 'anonymous';
    const savedProgress = localStorage.getItem(`pearly-wellness-progress-${userId}`);
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        if (progress.dailyChallenges && Array.isArray(progress.dailyChallenges)) {
          // Filtrar solo retos diarios NO completados
          const pending = progress.dailyChallenges.filter((d: any) => d.completed === false);
          
          // Mapear a objetos con información completa
          this.pendingDailyChallenges = pending.map((d: any) => ({
            id: d.id,
            title: this.getDailyChallengeTitle(d.id),
            description: this.getDailyChallengeDescription(d.id),
            points: this.getDailyChallengePoints(d.id),
            completed: false,
            tags: this.getDailyChallengeTags(d.id),
            category: this.getDailyChallengeCategory(d.id)
          }));
        }
      } catch (error) {
        console.error('Error cargando retos pendientes:', error);
        this.pendingDailyChallenges = [];
      }
    } else {
      this.pendingDailyChallenges = [];
    }
  }

  private getDailyChallengeTitle(id: string): string {
    const titles: Record<string, string> = {
      'daily-1': 'Meditación matutina',
      'daily-2': 'Estiramientos básicos',
      'daily-3': 'Reflexión diaria',
      'daily-4': 'Hidratación completa',
      'daily-5': 'Pausa digital',
      'daily-6': 'Respiración consciente'
    };
    return titles[id] || 'Reto diario';
  }

  private getDailyChallengeDescription(id: string): string {
    const descriptions: Record<string, string> = {
      'daily-1': 'Dedica 5 minutos por la mañana para meditar y centrar tu mente.',
      'daily-2': 'Realiza 10 minutos de estiramientos para activar tu cuerpo.',
      'daily-3': 'Tómate un momento para reflexionar sobre tu día.',
      'daily-4': 'Bebe al menos 2 litros de agua durante el día.',
      'daily-5': 'Descansa 20 minutos sin mirar ninguna pantalla.',
      'daily-6': 'Practica la respiración profunda durante 3 minutos.'
    };
    return descriptions[id] || 'Completa este reto diario para mantener tu bienestar.';
  }

  private getDailyChallengePoints(id: string): number {
    const points: Record<string, number> = {
      'daily-1': 30,
      'daily-2': 25,
      'daily-3': 20,
      'daily-4': 35,
      'daily-5': 30,
      'daily-6': 20
    };
    return points[id] || 25;
  }

  private getDailyChallengeTags(id: string): string[] {
    const tags: Record<string, string[]> = {
      'daily-1': ['Mindfulness', '5 min'],
      'daily-2': ['Físico', '10 min'],
      'daily-3': ['Mental', '5 min'],
      'daily-4': ['Nutrición', 'Salud'],
      'daily-5': ['Digital', '20 min'],
      'daily-6': ['Respiración', 'Calma']
    };
    return tags[id] || ['Bienestar'];
  }

  private getDailyChallengeCategory(id: string): string {
    const categories: Record<string, string> = {
      'daily-1': 'mindfulness',
      'daily-2': 'physical',
      'daily-3': 'mental',
      'daily-4': 'nutrition',
      'daily-5': 'mental',
      'daily-6': 'mindfulness'
    };
    return categories[id] || 'mental';
  }

  // --- MÉTODOS DE EDICIÓN (con soporte para cambio de foto) ---

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedAvatarFile = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  toggleEdit() {
    if (!this.isOwnProfile) return;

    if (this.editing) {
      // Guardar cambios
      if (!this.editableUser.name || this.editableUser.name.trim().length < 2) {
        this.notificationService.warning('Nombre inválido');
        return;
      }
      
      // Si hay nueva imagen seleccionada, actualizar avatar
      if (this.avatarPreview) {
        this.editableUser.avatar = this.avatarPreview;
      }
      
      this.user = { ...this.editableUser };
      this.userService.updateUser(this.user);
      localStorage.setItem('userName', this.user.name);
      
      // Limpiar la selección de archivo
      this.selectedAvatarFile = null;
      this.avatarPreview = null;
      
      this.notificationService.showProfileUpdated();
    } else {
      this.editableUser = { ...this.user };
      this.avatarPreview = null;
      this.selectedAvatarFile = null;
    }
    this.editing = !this.editing;
  }

  cancelEdit() {
    this.editing = false;
    this.editableUser = {};
    this.avatarPreview = null;
    this.selectedAvatarFile = null;
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

  // --- NAVEGACIÓN A RETOS ---
  
  goToDailyChallenge(id: string) {
    // Guardar el ID del reto para enfocarlo en la página de challenges
    if (id !== 'all') {
      localStorage.setItem('focusDailyChallenge', id);
    }
    this.router.navigate(['/challenges']);
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'mental': '🧠',
      'physical': '💪',
      'mindfulness': '🌿',
      'nutrition': '🍎'
    };
    return icons[category] || '🌟';
  }

  // --- GESTIÓN DE POSTS PROPIOS ---

  openEditPostModal(post: Post) {
    this.editingPost = post;
    this.editPostData = { text: post.text, image: post.image };
  }
  
  closeEditPostModal() { 
    this.editingPost = null; 
  }
  
  saveEditedPost() {
    if(this.editingPost) {
       this.postService.updatePost(this.editingPost.id, this.editPostData);
       this.loadUserPosts();
       this.closeEditPostModal();
    }
  }
  
  deletePost(id: number) {
    if(confirm('¿Eliminar esta publicación?')) {
        this.postService.deletePost(id);
        this.loadUserPosts();
        this.closeImageModal();
        this.closeEditPostModal();
        this.notificationService.success('Publicación eliminada');
    }
  }

  openFileSelector() {
    // Crear un input de tipo file temporal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      this.onAvatarSelected(event);
    };
    input.click();
  }
}