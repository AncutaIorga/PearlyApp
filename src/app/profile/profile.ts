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

  // Crea un radar que detecta cambios en las publicaciones y refresca la pantalla.
  constructor() {
    effect(() => {
      const allPosts = this.postService.getAllPosts(); 
      if (this.user && (this.user.nombre || this.user.name)) {
        this.loadUserPosts();
      }
    });
  }

  // Verifica la sesion y carga los datos del perfil actual o buscado.
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

  // Limpia las variables para dejar la pantalla lista desde cero.
  private resetState() {
    this.editing = false;
    this.avatarPreview = null;
    this.selectedPost = null;
    this.showFollowModal = false;
  }

  // Carga la informacion publica de un perfil que no es el nuestro.
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

  // Carga nuestros propios datos y progreso en el perfil.
  loadMyData() {
    this.loadUserPosts();
    this.loadWellnessData();
  }

  // Solicita al servidor las publicaciones creadas por el usuario actual.
  loadUserPosts() {
    const userName = this.user.nombre || this.user.name;
    if (!userName) return; 
    
    this.posts = this.postService.getPostsByUser(userName).map(p => ({
      ...p,
      createdAt: (p as any).createdAt || (p as any).date || new Date().toISOString()
    }));
    this.updateStats();
  }

  // Actualiza los contadores de seguidores, seguidos y publicaciones.
  updateStats() {
    this.userStats.posts = this.posts.length;
    const userName = this.user.nombre || this.user.name;
    const targetEmail = this.isOwnProfile ? this.authService.getCurrentUserEmail() : (this.user.email || `${userName}@gmail.com`);
    
    this.userStats.followers = this.getRealFollowersList().length;
    this.userStats.following = this.getRealFollowingList(targetEmail || '').length;
  }

  // Añade o elimina al usuario de nuestra lista de seguidos.
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

  // Cambia entre el modo de ver el perfil y editarlo, guardando los cambios.
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

  // Cancela la edicion sin guardar los cambios del perfil.
  cancelEdit() { this.editing = false; this.avatarPreview = null; }

  // Abre el explorador, comprime la foto elegida y la prepara como nuevo avatar.
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

  // Abre la ventana emergente con la lista de seguidores o seguidos.
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

  // Calcula que usuarios nos siguen buscando internamente.
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

  // Recupera la lista exacta de usuarios a los que seguimos.
  private getRealFollowingList(email: string): string[] {
    return JSON.parse(localStorage.getItem(`following-${email}`) || '[]');
  }

  // Cierra la ventana emergente de seguidores/seguidos.
  closeFollowModal() { this.showFollowModal = false; }
  
  // Abre una publicacion especifica en detalle.
  openImageModal(post: Post) { this.selectedPost = post; }
  
  // Cierra la publicacion en detalle y limpia el comentario.
  closeImageModal() { this.selectedPost = null; this.newComment = ''; }

  // Envia un nuevo comentario a la publicacion abierta.
  addComment() {
    if (this.selectedPost && this.newComment.trim()) {
      const myUser = this.userService.getUser();
      this.postService.addComment(this.selectedPost.id, this.newComment.trim()).subscribe({
        next: () => {
          this.newComment = ''; 
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

  // Determina si tenemos permiso para borrar un comentario.
  canDeleteComment(comment: Comment): boolean {
    const currentUserName = this.authService.getCurrentUserName();
    return comment.user === currentUserName || this.isPostOwner(this.selectedPost);
  }

  // Pide confirmacion y borra un comentario de la publicacion abierta.
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

  // Abre el formulario para editar una publicacion propia.
  openEditPostModal(post: Post) { 
    this.editingPost = post; 
    this.editPostData = { ...post }; 
  }
  
  // Cierra el formulario de edicion sin guardar los cambios.
  closeEditPostModal() { this.editingPost = null; }
  
  // Envia la edicion al servidor y actualiza la pantalla.
  saveEditedPost() { 
    if (this.editingPost) { 
      this.postService.updatePost(this.editingPost.id, this.editPostData); 
      this.closeEditPostModal(); 
      this.loadUserPosts(); 
    } 
  }
  
  // Solicita confirmacion y borra de forma definitiva la publicacion.
  deletePost(id: number) { 
    this.notificationService.showConfirmAction('¿Borrar publicación?', 'Sí, eliminar', () => {
      this.postService.deletePost(id); 
      this.loadUserPosts(); 
      this.closeImageModal();
      this.notificationService.success('Publicación eliminada');
    });
  }

  // Comprueba si el usuario actual es el creador de la publicacion.
  isPostOwner(post: any) { return post?.user === this.authService.getCurrentUserName(); }
  
  // Añade o quita nuestro me gusta de la publicacion.
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
  
  // Devuelve el icono representativo de la categoria especificada.
  getCategoryIcon(cat: string) { 
    const icons: any = { physical: '💪', mental: '🧠', nutrition: '🍎', mindfulness: '🌿' }; 
    return icons[cat] || '🌟'; 
  }

  // Carga los puntos y el progreso guardado permanentemente para el grafico.
  loadWellnessData() {
    const userName = this.user.nombre || this.user.name;
    const targetEmail = this.isOwnProfile ? this.authService.getCurrentUserEmail() : (this.user.email || `${userName}@gmail.com`);
    
    const userId = targetEmail?.replace(/[.#$[\]]/g, '_') || 'anonymous';
    const saved = localStorage.getItem(`pearly-wellness-progress-${userId}`);
    
    if (saved) {
      const data = JSON.parse(saved);
      let needsSave = false;

      if (typeof data.totalPoints !== 'number') {
        data.totalPoints = 0;
        (data.challenges || []).forEach((c: any) => {
          if (c.completed) data.totalPoints += (c.points || 25);
        });
        needsSave = true;
      }

      const currentScores = this.challengeService.calculateWellnessScores(data.challenges || []);
      
      if (!data.permanentScores) {
        data.permanentScores = { mental: 0, physical: 0, mindfulness: 0, nutrition: 0 };
        needsSave = true;
      }

      data.permanentScores.mental = Math.max(data.permanentScores.mental, currentScores.mental);
      data.permanentScores.physical = Math.max(data.permanentScores.physical, currentScores.physical);
      data.permanentScores.mindfulness = Math.max(data.permanentScores.mindfulness, currentScores.mindfulness);
      data.permanentScores.nutrition = Math.max(data.permanentScores.nutrition, currentScores.nutrition);

      if (this.isOwnProfile && data.challenges) {
        data.challenges.forEach((c: any) => {
          if (c.completed && this.challengeService.shouldResetDaily && this.challengeService.shouldResetDaily(c.completedAt)) {
            c.completed = false;
            c.inProgress = false;
            c.completedAt = null;
            needsSave = true;
          }
        });
      }

      if (needsSave) {
        localStorage.setItem(`pearly-wellness-progress-${userId}`, JSON.stringify(data));
      }

      this.totalPoints = data.totalPoints;
      this.levelInfo = this.challengeService.getLevelInfo(this.totalPoints);
      this.rankColor = this.challengeService.getRankColor(this.levelInfo.level);

      this.mentalHealth = data.permanentScores.mental; 
      this.physicalHealth = data.permanentScores.physical;
      this.mindfulnessScore = data.permanentScores.mindfulness; 
      this.nutritionScore = data.permanentScores.nutrition;
      
    } else {
      this.levelInfo = { level: 1, currentXP: 0, nextLevelXP: 500, progressPercent: 0 };
      this.rankColor = '#58595b'; 
      this.mentalHealth = 0;
      this.physicalHealth = 0;
      this.mindfulnessScore = 0;
      this.nutritionScore = 0;
    }
  }
}