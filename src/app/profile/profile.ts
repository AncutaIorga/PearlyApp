import { Component, OnInit, inject, effect } from '@angular/core'; 
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user';
import { PostService, Post, Comment } from '../services/post';
import { AuthService, Usuario } from '../services/authBACK'; 
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';
import { TimeAgoPipe } from '../pipes/time-ago-pipe';
import { StatsChartComponent } from './stats-chart/stats-chart';
import { ChallengeService } from '../services/challenge';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule, TimeAgoPipe, RouterModule, StatsChartComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private challengeService = inject(ChallengeService);
  private router = inject(Router);

  user: any = {};
  isOwnProfile = true;
  editing = false;
  isFollowing = false;
  editableUser: any = {};
  avatarPreview: string | null = null;
  posts: Post[] = [];
  userStats = { posts: 0, followers: 0, following: 0, achievements: 0 };

  selectedPost: any = null;
  editingPost: any = null;
  editPostData: any = {};
  newComment = '';
  showFollowModal = false;
  followModalType: 'followers' | 'following' = 'followers';
  followModalList: any[] = [];

  mentalHealth = 0; physicalHealth = 0; mindfulnessScore = 0; nutritionScore = 0;
  
  levelInfo = { level: 1, currentXP: 0, nextLevelXP: 500, progressPercent: 0 };
  rankColor = '#58595b';
  totalPoints = 0;

  constructor() {
    effect(() => {
      const allPosts = this.postService.getAllPosts(); 
      if (this.user && (this.user.nombre || this.user.name)) {
        this.loadUserPosts();
      }
    });
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.route.paramMap.subscribe(params => {
      this.resetState();
      const usernameParam = params.get('username');
      const currentUserName = this.authService.getCurrentUserName();

      if (usernameParam && usernameParam !== currentUserName) {
        this.isOwnProfile = false;
        this.loadOtherUserProfile(usernameParam);
      } else {
        this.isOwnProfile = true;
        this.user = this.userService.getUser();
        this.loadMyData();
      }
    });
  }

  private resetState() {
    this.editing = false;
    this.avatarPreview = null;
    this.selectedPost = null;
    this.showFollowModal = false;
  }

  loadOtherUserProfile(username: string) {
    const allUsers = this.authService.getRegisteredUsers();
    const found = allUsers.find((u: any) => (u.nombre || u.name).toLowerCase() === username.toLowerCase());
    
    this.user = found ? { ...found } : { name: username, nombre: username, bio: 'Usuario Pearly', avatar: '' };

    const myEmail = this.authService.getCurrentUserEmail();
    const myFollowing = JSON.parse(localStorage.getItem(`following-${myEmail}`) || '[]');
    this.isFollowing = myFollowing.includes(this.user.nombre || this.user.name);

    this.loadUserPosts();
    this.loadWellnessData();
  }

  loadMyData() {
    this.loadUserPosts();
    this.loadWellnessData();
  }

  loadUserPosts() {
    const userName = this.user.nombre || this.user.name;
    if (!userName) return; 
    
    this.posts = this.postService.getPostsByUser(userName).map(p => ({
      ...p,
      createdAt: (p as any).createdAt || (p as any).date || new Date().toISOString()
    }));
    this.updateStats();
  }

  updateStats() {
    this.userStats.posts = this.posts.length;
    const userName = this.user.nombre || this.user.name;
    const targetEmail = this.isOwnProfile ? this.authService.getCurrentUserEmail() : (this.user.email || `${userName}@gmail.com`);
    
    this.userStats.followers = this.getRealFollowersList().length;
    this.userStats.following = this.getRealFollowingList(targetEmail || '').length;
  }

  toggleFollow() {
    const myEmail = this.authService.getCurrentUserEmail();
    let myFollowing = JSON.parse(localStorage.getItem(`following-${myEmail}`) || '[]');
    const targetName = this.user.nombre || this.user.name;
    
    if (this.isFollowing) {
      myFollowing = myFollowing.filter((n: string) => n !== targetName);
    } else {
      myFollowing.push(targetName);
    }
    localStorage.setItem(`following-${myEmail}`, JSON.stringify(myFollowing));
    this.isFollowing = !this.isFollowing;
    this.updateStats();
  }

  toggleEdit() {
    if (this.editing) {
      const newName = (this.editableUser.nombre || this.editableUser.name)?.trim();
      
      if (!newName) {
        this.notificationService.warning('El nombre de usuario no puede estar vacío');
        return;
      }

      if (this.avatarPreview) this.editableUser.avatar = this.avatarPreview;
      if (this.editableUser.name && !this.editableUser.nombre) this.editableUser.nombre = this.editableUser.name;

      this.userService.updateUser(this.editableUser).subscribe({
        next: (updatedUser) => {
          setTimeout(() => {
            this.user = { ...updatedUser };
            this.editing = false;
            this.avatarPreview = null;
            this.notificationService.success('¡Perfil actualizado con éxito!');
          });
        },
        error: (err) => {
          setTimeout(() => {
            console.error('Error al actualizar perfil', err);
            this.notificationService.error('Error al guardar en el servidor.');
          });
        }
      });
      
    } else {
      this.editableUser = { ...this.user };
      this.editing = true;
    }
  }

  cancelEdit() { this.editing = false; this.avatarPreview = null; }

  openFileSelector() {
    const input = document.createElement('input'); 
    input.type = 'file'; 
    input.accept = 'image/*';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.src = e.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
          }

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          this.avatarPreview = compressedBase64;
          
          console.log(`✅ Tamaño del Avatar a enviar: ${Math.round(compressedBase64.length / 1024)} KB`);
        };
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  openFollowModal(type: 'followers' | 'following') {
    this.followModalType = type;
    const userName = this.user.nombre || this.user.name;
    const targetEmail = this.isOwnProfile ? this.authService.getCurrentUserEmail() : (this.user.email || `${userName}@gmail.com`);
    const namesList = (type === 'followers') ? this.getRealFollowersList() : this.getRealFollowingList(targetEmail || '');

    const allUsers = this.authService.getRegisteredUsers(); 
    
    this.followModalList = namesList.map(name => {
      const found = allUsers.find((u: any) => (u.nombre || u.name).toLowerCase() === name.toLowerCase());
      return { name: name, nombre: name, avatar: found ? found.avatar : '' };
    });
    this.showFollowModal = true;
  }

  private getRealFollowersList(): string[] {
    const followers = [];
    const targetName = this.user.nombre || this.user.name;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('following-')) {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        if (list.includes(targetName)) followers.push(key.replace('following-', '').split('@')[0]);
      }
    }
    return followers;
  }

  private getRealFollowingList(email: string): string[] {
    return JSON.parse(localStorage.getItem(`following-${email}`) || '[]');
  }

  closeFollowModal() { this.showFollowModal = false; }
  openImageModal(post: Post) { this.selectedPost = post; }
  closeImageModal() { this.selectedPost = null; this.newComment = ''; }

  addComment() {
    if (this.selectedPost && this.newComment.trim()) {
      const myUser = this.userService.getUser();
      this.postService.addComment(this.selectedPost.id, this.newComment.trim()).subscribe({
        next: () => {
          this.newComment = ''; // Limpia el campo tras el éxito
          this.notificationService.showCommentAdded();
        },
        error: (err) => console.error('Error al comentar:', err)
      });      
      const updatedPost = this.postService.getPostById(this.selectedPost.id);
      if (updatedPost) {
        this.selectedPost.comments = updatedPost.comments;
      }
      
      this.newComment = '';
      this.notificationService.showCommentAdded();
    }
  }

  canDeleteComment(comment: Comment): boolean {
    const currentUserName = this.authService.getCurrentUserName();
    return comment.user === currentUserName || this.isPostOwner(this.selectedPost);
  }

  deleteComment(postId: number, commentId: number, event: Event) {
    event.stopPropagation();
    this.notificationService.showConfirmAction(
      '¿Eliminar este comentario?',
      'Sí, eliminar',
      () => {
        this.postService.deleteComment(postId, commentId);
        const updatedPost = this.postService.getPostById(postId);
        if (updatedPost) this.selectedPost.comments = updatedPost.comments;
        this.notificationService.success('Comentario eliminado');
      }
    );
  }

  openEditPostModal(post: Post) { 
    this.editingPost = post; 
    this.editPostData = { ...post }; 
  }
  closeEditPostModal() { this.editingPost = null; }
  
  saveEditedPost() { 
    if (this.editingPost) { 
      this.postService.updatePost(this.editingPost.id, this.editPostData); 
      this.closeEditPostModal(); 
      this.loadUserPosts(); 
    } 
  }
  
  deletePost(id: number) { 
    this.notificationService.showConfirmAction('¿Borrar publicación?', 'Sí, eliminar', () => {
      this.postService.deletePost(id); 
      this.loadUserPosts(); 
      this.closeImageModal();
      this.notificationService.success('Publicación eliminada');
    });
  }

  isPostOwner(post: any) { return post?.user === this.authService.getCurrentUserName(); }
  
  toggleLike() { 
    if (this.selectedPost) {
      this.postService.toggleLike(this.selectedPost.id);
      const updatedPost = this.postService.getPostById(this.selectedPost.id);
      if (updatedPost) {
        this.selectedPost.likes = updatedPost.likes;
        this.selectedPost.likedByMe = updatedPost.likedByMe;
      }
    }
  }
  
  getCategoryIcon(cat: string) { 
    const icons: any = { physical: '💪', mental: '🧠', nutrition: '🍎', mindfulness: '🌿' }; 
    return icons[cat] || '🌟'; 
  }

  loadWellnessData() {
    const userName = this.user.nombre || this.user.name;
    const targetEmail = this.isOwnProfile ? this.authService.getCurrentUserEmail() : (this.user.email || `${userName}@gmail.com`);
    
    const userId = targetEmail?.replace(/[.#$[\]]/g, '_') || 'anonymous';
    const saved = localStorage.getItem(`pearly-wellness-progress-${userId}`);
    
    if (saved) {
      const data = JSON.parse(saved);
      let challengesChanged = false;

      if (this.isOwnProfile && data.challenges) {
        data.challenges.forEach((c: any) => {
          if (c.completed && this.challengeService.shouldResetDaily(c.completedAt)) {
            c.completed = false;
            c.inProgress = false;
            c.completedAt = null;
            challengesChanged = true;
          }
        });
        if (challengesChanged) {
          localStorage.setItem(`pearly-wellness-progress-${userId}`, JSON.stringify(data));
        }
      }

      this.totalPoints = data.totalPoints || 0;
      this.levelInfo = this.challengeService.getLevelInfo(this.totalPoints);
      this.rankColor = this.challengeService.getRankColor(this.levelInfo.level);

      const scores = this.challengeService.calculateWellnessScores(data.challenges || []);
      this.mentalHealth = scores.mental; 
      this.physicalHealth = scores.physical;
      this.mindfulnessScore = scores.mindfulness; 
      this.nutritionScore = scores.nutrition;
      
    } else {
        this.levelInfo = { level: 1, currentXP: 0, nextLevelXP: 500, progressPercent: 0 };
        this.rankColor = '#58595b'; 
    }
  }
}