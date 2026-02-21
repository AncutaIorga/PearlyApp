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
  
  user: any = {};
  isOwnProfile = true; 
  isFollowing = false;
  
  editing = false;
  editableUser: any = {};
  selectedPost: Post | null = null;
  editingPost: Post | null = null;
  editPostData: any = {};
  newComment = '';
  
  selectedAvatarFile: File | null = null;
  avatarPreview: string | null = null;
  
  userStats = { posts: 0, followers: 0, following: 0 };
  posts: Post[] = [];
  pendingDailyChallenges: DailyChallenge[] = []; 

  // --- VARIABLES PARA EL MODAL DE SEGUIDORES ---
  showFollowModal = false;
  followModalType: 'followers' | 'following' = 'followers';
  followModalList: string[] = [];

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

    this.route.paramMap.subscribe(params => {
      const usernameParam = params.get('username');
      const currentUserName = localStorage.getItem('userName');

      if (usernameParam && usernameParam !== currentUserName) {
        this.isOwnProfile = false;
        this.loadOtherUserProfile(usernameParam);
      } else {
        this.isOwnProfile = true;
        this.userService.syncWithAuthData();
        this.user = this.userService.getUser();
        this.loadMyData();
      }
    });
  }

  loadOtherUserProfile(username: string) {
    const userPosts = this.postService.getPostsByUser(username);
    const avatar = userPosts.length > 0 ? userPosts[0].userAvatar : '';
    const myEmail = localStorage.getItem('userEmail') || 'default';
    const followedList = JSON.parse(localStorage.getItem(`following-${myEmail}`) || '[]');
    
    this.isFollowing = followedList.includes(username);

    this.user = {
      name: username,
      bio: `Perfil público de ${username}.`,
      avatar: avatar,
      achievements: Math.floor(Math.random() * 10),
      // Inferimos un email ficticio para el perfil de otro (si no lo tenemos)
      email: username.toLowerCase().replace(/\s+/g, '') + '@gmail.com' 
    };
    
    this.posts = userPosts;
    this.updateStats();
  }

  toggleFollow() {
    const myEmail = localStorage.getItem('userEmail') || 'default';
    let followedList: string[] = JSON.parse(localStorage.getItem(`following-${myEmail}`) || '[]');

    this.isFollowing = !this.isFollowing;
    
    if (this.isFollowing) {
      followedList.push(this.user.name);
      this.notificationService.success(`Ahora sigues a ${this.user.name}`);
    } else {
      followedList = followedList.filter(u => u !== this.user.name);
      this.notificationService.info(`Has dejado de seguir a ${this.user.name}`);
    }
    
    localStorage.setItem(`following-${myEmail}`, JSON.stringify(followedList));
    this.updateStats(); // Recalcular estadisticas al instante
  }

  // --- LÓGICA DE SEGUIDORES REALES ---
  getRealFollowers(username: string): string[] {
    const followers: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('following-')) {
        const followerEmail = key.replace('following-', '');
        try {
          const followsList = JSON.parse(localStorage.getItem(key) || '[]');
          if (followsList.includes(username)) {
            const cachedUser = localStorage.getItem(`user-cache-${followerEmail}`);
            if (cachedUser) {
              followers.push(JSON.parse(cachedUser).name);
            } else {
              followers.push(followerEmail.split('@')[0]); 
            }
          }
        } catch(e) {}
      }
    }
    return followers;
  }

  getRealFollowing(email: string): string[] {
    return JSON.parse(localStorage.getItem(`following-${email}`) || '[]');
  }

  loadMyData() {
    this.loadUserPosts();
    this.updateStats();
    this.loadPendingDailyChallenges(); 
  }

  loadUserPosts() {
    this.posts = this.postService.getPostsByUser(this.user.name);
  }

  updateStats() {
    this.userStats.posts = this.posts.length;
    
    // Obtenemos el email real si es nuestro, o el del usuario visitado
    const targetEmail = this.isOwnProfile ? 
      (localStorage.getItem('userEmail') || 'default') : 
      (this.user.email);

    this.userStats.following = this.getRealFollowing(targetEmail).length;
    this.userStats.followers = this.getRealFollowers(this.user.name).length;
  }

  // --- MODAL FOLLOWERS ---
  openFollowModal(type: 'followers' | 'following') {
    this.followModalType = type;
    const targetEmail = this.isOwnProfile ? 
      (localStorage.getItem('userEmail') || 'default') : 
      (this.user.email);

    if (type === 'followers') {
      this.followModalList = this.getRealFollowers(this.user.name);
    } else {
      this.followModalList = this.getRealFollowing(targetEmail);
    }
    this.showFollowModal = true;
  }

  closeFollowModal() {
    this.showFollowModal = false;
  }

  private loadPendingDailyChallenges() {
    const userData = this.userService.getUser();
    const userId = userData?.email ? userData.email.replace(/[.#$[\]]/g, '_') : 'anonymous';
    const savedProgress = localStorage.getItem(`pearly-wellness-progress-${userId}`);
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        if (progress.dailyChallenges && Array.isArray(progress.dailyChallenges)) {
          const pending = progress.dailyChallenges.filter((d: any) => d.completed === false);
          
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
      'daily-1': 'Meditación matutina', 'daily-2': 'Estiramientos básicos', 'daily-3': 'Reflexión diaria',
      'daily-4': 'Hidratación completa', 'daily-5': 'Pausa digital', 'daily-6': 'Respiración consciente'
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
    const points: Record<string, number> = { 'daily-1': 30, 'daily-2': 25, 'daily-3': 20, 'daily-4': 35, 'daily-5': 30, 'daily-6': 20 };
    return points[id] || 25;
  }

  private getDailyChallengeTags(id: string): string[] {
    const tags: Record<string, string[]> = {
      'daily-1': ['Mindfulness', '5 min'], 'daily-2': ['Físico', '10 min'], 'daily-3': ['Mental', '5 min'],
      'daily-4': ['Nutrición', 'Salud'], 'daily-5': ['Digital', '20 min'], 'daily-6': ['Respiración', 'Calma']
    };
    return tags[id] || ['Bienestar'];
  }

  private getDailyChallengeCategory(id: string): string {
    const categories: Record<string, string> = {
      'daily-1': 'mindfulness', 'daily-2': 'physical', 'daily-3': 'mental',
      'daily-4': 'nutrition', 'daily-5': 'mental', 'daily-6': 'mindfulness'
    };
    return categories[id] || 'mental';
  }

  compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(event.target.result); 
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  async onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        this.selectedAvatarFile = file;
        const optimizedImage = await this.compressImage(file);
        
        this.avatarPreview = optimizedImage;
        this.user.avatar = optimizedImage; 
        
        this.notificationService.success('¡Foto procesada con éxito!');
      } catch (error) {
        this.notificationService.error('Error al procesar la imagen.');
      }
    }
  }

  toggleEdit() {
    if (!this.isOwnProfile) return;

    if (this.editing) {
      if (!this.editableUser.name || this.editableUser.name.trim().length < 2) {
        this.notificationService.warning('El nombre debe tener al menos 2 caracteres.');
        return;
      }
      
      if (this.avatarPreview) {
        this.editableUser.avatar = this.avatarPreview;
      }
      
      this.user = { ...this.editableUser };
      this.userService.updateUser(this.user);
      localStorage.setItem('userName', this.user.name);
      
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

  openImageModal(post: Post) { this.selectedPost = post; }

  closeImageModal() {
    this.selectedPost = null;
    this.newComment = '';
  }

  toggleLike() {
    if (this.selectedPost) {
      this.postService.toggleLike(this.selectedPost.id);
      this.selectedPost.likedByMe = !this.selectedPost.likedByMe;
      this.selectedPost.likes += this.selectedPost.likedByMe ? 1 : -1;
      this.loadUserPosts(); 
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
  
  goToDailyChallenge(id: string) {
    if (id !== 'all') {
      localStorage.setItem('focusDailyChallenge', id);
    }
    this.router.navigate(['/challenges']);
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'mental': '🧠', 'physical': '💪', 'mindfulness': '🌿', 'nutrition': '🍎'
    };
    return icons[category] || '🌟';
  }

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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      this.onAvatarSelected(event);
    };
    input.click();
  }
}