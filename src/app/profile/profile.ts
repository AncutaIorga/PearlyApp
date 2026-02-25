import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user';
import { PostService, Post, Comment } from '../services/post';
import { AuthService } from '../services/auth';
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
  inProgressChallenges: any[] = [];

  mentalHealth = 0; physicalHealth = 0; mindfulnessScore = 0; nutritionScore = 0;
  
  // Variables de Nivel
  levelInfo = { level: 1, currentXP: 0, nextLevelXP: 500, progressPercent: 0 };
  rankColor = '#58595b';
  totalPoints = 0;

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
    const found = allUsers.find(u => u.name.toLowerCase() === username.toLowerCase());
    this.user = found ? { ...found } : { name: username, bio: 'Usuario Pearly', avatar: '' };

    const myEmail = this.authService.getCurrentUserEmail();
    const myFollowing = JSON.parse(localStorage.getItem(`following-${myEmail}`) || '[]');
    this.isFollowing = myFollowing.includes(this.user.name);

    this.loadUserPosts();
    this.loadWellnessData();
  }

  loadMyData() {
    this.loadUserPosts();
    this.loadWellnessData();
  }

  loadUserPosts() {
    this.posts = this.postService.getPostsByUser(this.user.name).map(p => ({
      ...p,
      createdAt: (p as any).createdAt || (p as any).date || new Date().toISOString()
    }));
    this.updateStats();
  }

  updateStats() {
    this.userStats.posts = this.posts.length;
    const targetEmail = this.isOwnProfile ? this.authService.getCurrentUserEmail() : (this.user.email || `${this.user.name}@gmail.com`);
    
    this.userStats.followers = this.getRealFollowersList().length;
    this.userStats.following = this.getRealFollowingList(targetEmail || '').length;
  }

  toggleFollow() {
    const myEmail = this.authService.getCurrentUserEmail();
    let myFollowing = JSON.parse(localStorage.getItem(`following-${myEmail}`) || '[]');
    if (this.isFollowing) {
      myFollowing = myFollowing.filter((n: string) => n !== this.user.name);
    } else {
      myFollowing.push(this.user.name);
    }
    localStorage.setItem(`following-${myEmail}`, JSON.stringify(myFollowing));
    this.isFollowing = !this.isFollowing;
    this.updateStats();
  }

  toggleEdit() {
    if (this.editing) {
      const newName = this.editableUser.name.trim();
      const oldName = this.user.name;

      if (newName.toLowerCase() !== oldName.toLowerCase() && this.authService.isUserTaken(newName)) {
        this.notificationService.error('⛔ Ese nombre ya existe. Elige otro.');
        return;
      }

      if (this.avatarPreview) this.editableUser.avatar = this.avatarPreview;
      this.userService.updateUser(this.editableUser);
      this.user = { ...this.editableUser };
      this.postService.updateUserPosts(oldName, this.user.name, this.user.avatar);
      this.notificationService.showProfileUpdated();
    } else {
      this.editableUser = { ...this.user };
    }
    this.editing = !this.editing;
  }

  cancelEdit() { this.editing = false; this.avatarPreview = null; }

  openFollowModal(type: 'followers' | 'following') {
    this.followModalType = type;
    const targetEmail = this.isOwnProfile ? this.authService.getCurrentUserEmail() : (this.user.email || `${this.user.name}@gmail.com`);
    const namesList = (type === 'followers') ? this.getRealFollowersList() : this.getRealFollowingList(targetEmail || '');

    const allUsers = this.authService.getRegisteredUsers();
    this.followModalList = namesList.map(name => {
      const found = allUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
      return { name: name, avatar: found ? found.avatar : '' };
    });
    this.showFollowModal = true;
  }

  private getRealFollowersList(): string[] {
    const followers = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('following-')) {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        if (list.includes(this.user.name)) followers.push(key.replace('following-', '').split('@')[0]);
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
      this.postService.addComment(this.selectedPost.id, this.newComment.trim(), myUser.name, myUser.avatar);
      
      // Actualizar el post seleccionado
      const updatedPost = this.postService.getPostById(this.selectedPost.id);
      if (updatedPost) {
        this.selectedPost.comments = updatedPost.comments;
      }
      
      this.newComment = '';
      this.notificationService.showCommentAdded();
    }
  }

  // ===== NUEVO: Verificar si puede eliminar un comentario =====
  canDeleteComment(comment: Comment): boolean {
    const currentUserName = this.authService.getCurrentUserName();
    // Puede eliminar si: es dueño del comentario O es dueño del post
    return comment.user === currentUserName || this.isPostOwner(this.selectedPost);
  }

  // ===== NUEVO: Eliminar comentario =====
  deleteComment(postId: number, commentId: number, event: Event) {
    event.stopPropagation(); // Evitar que cierre el modal
    
    this.notificationService.showConfirmAction(
      '¿Eliminar este comentario?',
      'Sí, eliminar',
      () => {
        // Llamar al servicio para eliminar el comentario
        this.postService.deleteComment(postId, commentId);
        
        // Actualizar el post seleccionado
        const updatedPost = this.postService.getPostById(postId);
        if (updatedPost) {
          this.selectedPost.comments = updatedPost.comments;
        }
        
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

  openFileSelector() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e: any) => {
      const reader = new FileReader();
      reader.onload = (ev: any) => this.avatarPreview = ev.target.result;
      reader.readAsDataURL(e.target.files[0]);
    };
    input.click();
  }

  isPostOwner(post: any) { return post?.user === this.authService.getCurrentUserName(); }
  
  toggleLike() { 
    if (this.selectedPost) {
      this.postService.toggleLike(this.selectedPost.id);
      
      // Actualizar el estado local
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

  completeInProgressChallenge(id: any, e: Event) { 
    e.stopPropagation(); 
    this.notificationService.success("¡Reto finalizado!");
    
    this.inProgressChallenges = this.inProgressChallenges.filter(c => c.id !== id);
    
    const userData = this.userService.getUser();
    const userId = userData?.email?.replace(/[.#$[\]]/g, '_') || 'anonymous';
    const saved = localStorage.getItem(`pearly-wellness-progress-${userId}`);
    if (saved) {
       const data = JSON.parse(saved);
       const target = data.challenges.find((c:any) => c.id === id);
       const masterDef = this.challengeService.getChallengeById(id);
       const pointsEarned = masterDef ? masterDef.points : 0;

       if(target) { 
           target.completed = true; 
           target.inProgress = false;
           target.completedAt = new Date().toISOString(); 
       }
       
       data.totalPoints = (data.totalPoints || 0) + pointsEarned;

       localStorage.setItem(`pearly-wellness-progress-${userId}`, JSON.stringify(data));
       this.loadWellnessData();
    }
  }

  loadWellnessData() {
    const targetEmail = this.isOwnProfile ? this.authService.getCurrentUserEmail() : (this.user.email || `${this.user.name}@gmail.com`);
    const userId = targetEmail?.replace(/[.#$[\]]/g, '_') || 'anonymous';
    const saved = localStorage.getItem(`pearly-wellness-progress-${userId}`);
    
    if (saved) {
      const data = JSON.parse(saved);
      let challengesChanged = false;

      // Reseteo de 3 AM (Solo si es mi perfil, para no tocar datos de otros)
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
          this.inProgressChallenges = [];
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
      
      this.inProgressChallenges = (data.challenges || [])
        .filter((c: any) => c.inProgress && !c.completed)
        .map((c: any) => {
          const masterData = this.challengeService.getChallengeById(c.id);
          if (masterData) {
            return { ...c, ...masterData }; 
          }
          return c;
        });
    } else {
        // Datos por defecto
        this.levelInfo = { level: 1, currentXP: 0, nextLevelXP: 500, progressPercent: 0 };
        this.rankColor = '#58595b'; // Hierro
    }
  }
}