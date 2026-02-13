import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user';
import { PostService, Post } from '../services/post';
import { AuthService } from '../services/auth';
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  tags: string[];
  currentProgress?: number;
  maxProgress?: number;
}

@Component({
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private notificationService = inject(NotificationService);
  
  user: any;
  editing = false;
  editableUser: any = {};
  selectedPost: Post | null = null;
  
  editingPost: Post | null = null;
  editPostData: any = {};
  
  newComment = '';
  
  userStats = {
    posts: 0,
    followers: 0,
    following: 0
  };
  
  posts: Post[] = [];
  
  dailyChallenges: DailyChallenge[] = [];

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

    this.userService.syncWithAuthData();
    this.user = this.userService.getUser();
    this.loadUserPosts();
    this.updateStats();
    this.loadDailyChallenges();
    
    console.log('Usuario actual:', this.user.name);
  }

  loadDailyChallenges() {
    try {
      const savedProgress = localStorage.getItem('pearly-wellness-progress');
      
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        
        const baseDailyChallenges = [
          {
            id: 'daily-1',
            title: 'Meditación matutina',
            description: 'Dedica 5 minutos por la mañana para meditar y centrar tu mente.',
            tags: ['Mindfulness', '5 min']
          },
          {
            id: 'daily-2',
            title: 'Estiramientos básicos',
            description: 'Realiza 10 minutos de estiramientos para activar tu cuerpo.',
            tags: ['Físico', '10 min']
          },
          {
            id: 'daily-3',
            title: 'Reflexión diaria',
            description: 'Tómate un momento para reflexionar sobre tu día.',
            tags: ['Mental', '5 min']
          },
          {
            id: 'daily-4',
            title: 'Hidratación completa',
            description: 'Bebe al menos 2 litros de agua durante el día.',
            tags: ['Nutrición', 'Salud']
          },
          {
            id: 'daily-5',
            title: 'Pausa digital',
            description: 'Descansa 20 minutos sin mirar ninguna pantalla.',
            tags: ['Digital', '20 min']
          },
          {
            id: 'daily-6',
            title: 'Respiración consciente',
            description: 'Practica la respiración profunda durante 3 minutos.',
            tags: ['Respiración', 'Calma']
          }
        ];
        
        this.dailyChallenges = baseDailyChallenges.map(challenge => {
          const saved = progress.dailyChallenges?.find((d: any) => d.id === challenge.id);
          
          let currentProgress = 0;
          let maxProgress = 7;
          
          const challengeKey = `challenge-${challenge.id}-progress`;
          const savedProgressDetail = localStorage.getItem(challengeKey);
          if (savedProgressDetail) {
            try {
              const detail = JSON.parse(savedProgressDetail);
              currentProgress = detail.current || 0;
              maxProgress = detail.max || 7;
            } catch (e) {
              console.error('Error cargando progreso detallado:', e);
            }
          }
          
          return {
            ...challenge,
            points: this.getPointsForChallenge(challenge.id),
            completed: saved ? saved.completed : false,
            currentProgress: currentProgress,
            maxProgress: maxProgress
          };
        }).filter(challenge => !challenge.completed);
      } else {
        this.initializeDefaultChallenges();
      }
    } catch (error) {
      console.error('Error cargando retos diarios:', error);
      this.initializeDefaultChallenges();
    }
  }
  
  getPointsForChallenge(challengeId: string): number {
    const pointsMap: { [key: string]: number } = {
      'daily-1': 30,
      'daily-2': 25,
      'daily-3': 20,
      'daily-4': 35,
      'daily-5': 30,
      'daily-6': 20
    };
    return pointsMap[challengeId] || 25;
  }
  
  initializeDefaultChallenges() {
    this.dailyChallenges = [
      {
        id: 'daily-1',
        title: 'Meditación matutina',
        description: 'Dedica 5 minutos por la mañana para meditar y centrar tu mente.',
        points: 30,
        completed: false,
        tags: ['Mindfulness', '5 min'],
        currentProgress: 0,
        maxProgress: 7
      },
      {
        id: 'daily-2',
        title: 'Estiramientos básicos',
        description: 'Realiza 10 minutos de estiramientos para activar tu cuerpo.',
        points: 25,
        completed: false,
        tags: ['Físico', '10 min'],
        currentProgress: 0,
        maxProgress: 7
      },
      {
        id: 'daily-3',
        title: 'Reflexión diaria',
        description: 'Tómate un momento para reflexionar sobre tu día.',
        points: 20,
        completed: false,
        tags: ['Mental', '5 min'],
        currentProgress: 0,
        maxProgress: 7
      },
      {
        id: 'daily-4',
        title: 'Hidratación completa',
        description: 'Bebe al menos 2 litros de agua durante el día.',
        points: 35,
        completed: false,
        tags: ['Nutrición', 'Salud'],
        currentProgress: 0,
        maxProgress: 7
      },
      {
        id: 'daily-5',
        title: 'Pausa digital',
        description: 'Descansa 20 minutos sin mirar ninguna pantalla.',
        points: 30,
        completed: false,
        tags: ['Digital', '20 min'],
        currentProgress: 0,
        maxProgress: 7
      },
      {
        id: 'daily-6',
        title: 'Respiración consciente',
        description: 'Practica la respiración profunda durante 3 minutos.',
        points: 20,
        completed: false,
        tags: ['Respiración', 'Calma'],
        currentProgress: 0,
        maxProgress: 7
      }
    ];
  }

  loadUserPosts() {
    const userName = this.user.name;
    console.log('Buscando posts para usuario:', userName);
    this.posts = this.postService.getPostsByUser(userName);
    console.log('Posts encontrados:', this.posts.length);
  }

  updateStats() {
    this.userStats.posts = this.posts.length;
    this.userStats.followers = this.userService.getFollowersCount();
    this.userStats.following = this.userService.getFollowingCount();
  }

  toggleEdit() {
    if (this.editing) {
      if (!this.editableUser.name || this.editableUser.name.trim().length < 2) {
        this.notificationService.warning('El nombre debe tener al menos 2 caracteres');
        return;
      }

      if (this.editableUser.bio && this.editableUser.bio.length > 150) {
        this.notificationService.warning('La biografía no puede exceder 150 caracteres');
        return;
      }

      if (this.editableUser.avatar && this.editableUser.avatar.trim() !== '') {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(this.editableUser.avatar)) {
          this.notificationService.warning('Por favor ingresa una URL válida que comience con http:// o https://');
          return;
        }
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

  goToDailyChallenge(challengeId: string) {
    localStorage.setItem('focusDailyChallenge', challengeId);
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
      const updatedPost = this.postService.getPostById(this.selectedPost.id);
      if (updatedPost) {
        this.selectedPost = updatedPost;
        this.notificationService.showPostLiked(this.selectedPost.likedByMe || false, this.selectedPost.user);
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
      
      const updatedPost = this.postService.getPostById(this.selectedPost.id);
      if (updatedPost) {
        this.selectedPost = updatedPost;
      }
      
      this.newComment = '';
      this.loadUserPosts();
      this.notificationService.showCommentAdded();
    }
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
  
  openEditPostModal(post: Post) {
    this.editingPost = post;
    this.editPostData = {
      text: post.text,
      image: post.image
    };
  }

  closeEditPostModal() {
    this.editingPost = null;
    this.editPostData = {};
  }

  saveEditedPost() {
    if (this.editingPost && this.editPostData.text.trim()) {
      if (this.editPostData.image && this.editPostData.image.trim() !== '') {
        const urlPattern = /^(https?:\/\/|data:image\/)/;
        if (!urlPattern.test(this.editPostData.image)) {
          this.notificationService.warning('Por favor ingresa una URL válida:\n- Comienza con http:// o https://\n- O una URL data:image/ (imagen en base64)');
          return;
        }
      }

      this.postService.updatePost(this.editingPost.id, {
        text: this.editPostData.text,
        image: this.editPostData.image || this.editingPost.image
      });

      this.loadUserPosts();
      
      if (this.selectedPost && this.selectedPost.id === this.editingPost.id) {
        const updatedPost = this.postService.getPostById(this.editingPost.id);
        if (updatedPost) {
          this.selectedPost = updatedPost;
        }
      }

      this.closeEditPostModal();
      this.notificationService.showPostUpdated();
    }
  }

  deletePost(postId: number) {
    const notificationId = this.notificationService.showConfirmAction(
      '¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.',
      'Sí, eliminar',
      () => {
        this.postService.deletePost(postId);
        this.loadUserPosts();
        this.updateStats();
        
        if (this.selectedPost && this.selectedPost.id === postId) {
          this.closeImageModal();
        }
        if (this.editingPost && this.editingPost.id === postId) {
          this.closeEditPostModal();
        }
        
        this.notificationService.showPostDeleted();
      }
    );
  }

  isPostOwner(post: Post): boolean {
    const currentUserName = this.user.name;
    return post.user === currentUserName;
  }
  
  getChallengeIcon(title: string): string {
    const iconMap: { [key: string]: string } = {
      'Meditación': '🧘',
      'Estiramientos': '🏃',
      'Reflexión': '💭',
      'Hidratación': '💧',
      'Pausa digital': '📵',
      'Respiración': '🌬️'
    };
    
    for (const key in iconMap) {
      if (title.includes(key)) {
        return iconMap[key];
      }
    }
    
    return '🌟';
  }
  
  getChallengeProgress(challenge: DailyChallenge): string {
    if (challenge.currentProgress !== undefined && challenge.maxProgress !== undefined) {
      return `${challenge.currentProgress}/${challenge.maxProgress} días`;
    }
    return '0/7 días';
  }
  
  getCompletedChallengesCount(): number {
    try {
      const savedProgress = localStorage.getItem('pearly-wellness-progress');
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        if (progress.dailyChallenges && Array.isArray(progress.dailyChallenges)) {
          return progress.dailyChallenges.filter((d: any) => d.completed).length;
        }
      }
      return 0;
    } catch (error) {
      console.error('Error contando retos completados:', error);
      return 0;
    }
  }
}