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
import { StatsChartComponent } from './stats-chart/stats-chart';
import { ChallengeService } from '../services/challenge';

@Component({
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
  isFollowing = false; // ✅ Añadido
  editableUser: any = {};
  avatarPreview: string | null = null;
  posts: Post[] = [];
  userStats = { posts: 0, followers: 0, following: 0, achievements: 0 };

  // Modales y Estados
  selectedPost: Post | null = null;
  editingPost: Post | null = null;
  editPostData: any = {};
  newComment = '';
  showFollowModal = false;
  followModalType: 'followers' | 'following' = 'followers';
  followModalList: string[] = [];
  inProgressChallenges: any[] = [];

  // Salud
  mentalHealth = 0; physicalHealth = 0; mindfulnessScore = 0; nutritionScore = 0;

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.route.paramMap.subscribe(params => {
      this.resetState();
      const usernameParam = params.get('username');
      const currentUserName = localStorage.getItem('userName');

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
    this.showFollowModal = false;
    this.selectedPost = null;
    this.editingPost = null;
  }

  loadOtherUserProfile(username: string) {
    const allUsers = this.authService.getRegisteredUsers();
    const found = allUsers.find(u => u.name.toLowerCase() === username.toLowerCase());
    this.user = found ? { ...found } : { name: username, bio: 'Usuario Pearly', avatar: '' };
    this.loadUserPosts();
  }

  loadMyData() {
    this.loadUserPosts();
    this.loadWellnessData();
  }

  loadUserPosts() {
    this.posts = this.postService.getPostsByUser(this.user.name);
    this.userStats.posts = this.posts.length;
  }

  // ✅ FUNCIONES DE SEGUIMIENTO
  toggleFollow() {
    this.isFollowing = !this.isFollowing;
    this.isFollowing ? this.notificationService.success('Siguiendo') : this.notificationService.info('Dejado de seguir');
  }

  openFollowModal(type: 'followers' | 'following') {
    this.followModalType = type;
    this.showFollowModal = true;
    this.followModalList = []; 
  }

  closeFollowModal() { this.showFollowModal = false; }

  // ✅ FUNCIONES DE PERFIL Y AVATAR
  toggleEdit() {
    if (this.editing) {
      if (this.avatarPreview) this.editableUser.avatar = this.avatarPreview;
      this.userService.updateUser(this.editableUser);
      this.user = { ...this.editableUser };
      this.notificationService.showProfileUpdated();
    } else {
      this.editableUser = { ...this.user };
    }
    this.editing = !this.editing;
  }

  cancelEdit() { this.editing = false; this.avatarPreview = null; }

  openFileSelector() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev: any) => this.avatarPreview = ev.target.result;
      reader.readAsDataURL(file);
    };
    input.click();
  }

  // ✅ FUNCIONES DE POSTS
  isPostOwner(post: Post | null): boolean {
    return post?.user === localStorage.getItem('userName');
  }

  openImageModal(post: Post) { this.selectedPost = post; }
  closeImageModal() { this.selectedPost = null; }
  
  openEditPostModal(post: Post) { this.editingPost = post; this.editPostData = { ...post }; }
  closeEditPostModal() { this.editingPost = null; }
  
  saveEditedPost() {
    if(this.editingPost) this.postService.updatePost(this.editingPost.id, this.editPostData);
    this.closeEditPostModal();
    this.loadMyData();
  }

  deletePost(id: any) {
    if(confirm('¿Borrar publicación?')) {
      this.postService.deletePost(id);
      this.loadMyData();
      this.closeImageModal();
    }
  }

  toggleLike() { if (this.selectedPost) this.postService.toggleLike(this.selectedPost.id); }
  addComment() { this.newComment = ''; this.notificationService.success('Comentario añadido'); }

  // ✅ OTROS
  completeInProgressChallenge(id: string, event: Event) {
    event.stopPropagation();
    this.notificationService.success("¡Reto completado!");
  }

  getCategoryIcon(cat: string) {
    const icons: any = { physical: '💪', mental: '🧠', nutrition: '🍎', mindfulness: '🌿' };
    return icons[cat] || '🌟';
  }

  loadWellnessData() { /* Lógica de puntos y salud */ }
}