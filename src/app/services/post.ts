import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification';

export interface Comment {
  id: number;
  user: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface Post {
  id: number;
  user: string;
  userAvatar?: string;
  image: string;
  text: string;
  likes: number; 
  likedBy: string[]; 
  comments: Comment[];
  createdAt: Date;
  likedByMe?: boolean; 
  challengeInfo?: { 
    id: string;
    title: string;
    category: string;
    points: number;
  };
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private http = inject(HttpClient);
  private notification = inject(NotificationService);
  private apiUrl = `${environment.apiUrl}/publicaciones`; 

  private posts = signal<Post[]>([]);

  constructor() {
    this.loadPostsFromBackend();
  }

  private getCurrentUserId(): number | null {
    const idStr = localStorage.getItem('idUsuario') || localStorage.getItem('userId');
    return idStr ? parseInt(idStr, 10) : null;
  }

  private getCurrentUserName(): string {
    return localStorage.getItem('userName') || 'Usuario';
  }

  loadPostsFromBackend() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        const mappedPosts: Post[] = data.map(dbPost => ({
          id: dbPost.id,
          user: dbPost.nombreUsuario || `Usuario ${dbPost.idUsuario || dbPost.id_usuario}`, 
          userAvatar: dbPost.avatarUsuario || '',
          image: dbPost.imagen,
          text: dbPost.texto,
          likes: dbPost.likesCount || 0,
          likedBy: dbPost.likedBy || [],
          comments: dbPost.comentarios || [],
          createdAt: new Date(dbPost.fecha),
          challengeInfo: dbPost.idRetoVinculado ? {
            id: String(dbPost.idRetoVinculado),
            title: 'Reto Completado',
            category: 'mental',
            points: 0
          } : undefined
        }));
        
        mappedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        this.posts.set(mappedPosts);
      },
      error: (err) => {
        console.error('Error cargando publicaciones del servidor', err);
      }
    });
  }

  getAllPosts(): Post[] {
    const currentUser = this.getCurrentUserName();
    return this.posts().map(p => ({
      ...p,
      likedByMe: p.likedBy?.includes(currentUser) || false
    }));
  }

  getPostsByUser(userName: string): Post[] {
    return this.getAllPosts().filter(p => p.user === userName);
  }

  getPostById(id: number | string): Post | undefined {
    return this.getAllPosts().find(p => p.id == id);
  }

addPost(postData: { image: string; text: string; challengeInfo?: any; }) {
    const userId = this.getCurrentUserId();
    
    if (!userId) {
      this.notification.error('Error de sesión. No se puede publicar.');
      return;
    }

    let retoId = null;
    if (postData.challengeInfo && postData.challengeInfo.id) {
      const idString = String(postData.challengeInfo.id);
      const parts = idString.split('-');
      retoId = parts.length > 1 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
      
      if (isNaN(retoId)) retoId = null;
    }

    const fechaKotlin = new Date().toISOString().split('.')[0];

    const payload = {
      idUsuario: userId,
      texto: postData.text.trim(),
      fecha: fechaKotlin, // 👈 Fecha limpia y perfecta para el Back
      imagen: postData.image,
      idRetoVinculado: retoId
    };

    console.log('Enviando payload con fecha limpia:', payload);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.post<any>(this.apiUrl, payload, { headers }).subscribe({
      next: (newDbPost) => {
        this.notification.success('¡Publicación creada!');
        this.loadPostsFromBackend(); 
      },
      error: (err) => {
        console.error('Error al crear publicación:', err);
        this.notification.error('Error al enviar la publicación. Revisa la consola.');
      }
    });
  }
// ✅ LIKES: PONER Y QUITAR (TOGGLE REAL CON EL BACKEND)
  toggleLike(postId: number) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.notification.error('Error de sesión.');
      return;
    }

    const currentUser = this.getCurrentUserName();
    const targetPost = this.posts().find(p => p.id === postId);
    
    if (!targetPost) return;

    // 1. Comprobamos si el usuario ya le había dado like
    const hasLiked = targetPost.likedBy.includes(currentUser);

    // 2. Estrategia Optimista (Cambiamos el color del corazón al instante)
    this.posts.update(posts => posts.map(p => {
      if (p.id === postId) {
        let newLikedBy = [...p.likedBy];
        if (hasLiked) {
          newLikedBy = newLikedBy.filter(u => u !== currentUser); // Quitar
        } else {
          newLikedBy.push(currentUser); // Añadir
        }
        return { ...p, likedBy: newLikedBy, likes: newLikedBy.length };
      }
      return p;
    }));

    // 3. Petición al Backend según lo que estemos haciendo
    if (!hasLiked) {
      // 🟢 DAR LIKE (POST)
      const likeUrl = `${environment.apiUrl}/likes`;
      const payload = { idUsuario: userId, idPublicacion: postId };
      
      this.http.post(likeUrl, payload).subscribe({
        next: () => console.log('¡Like añadido (201)!'),
        error: (err) => {
          console.error('Error al dar like:', err);
          this.loadPostsFromBackend(); // Si falla, revertimos el corazón
        }
      });
    } else {
      // 🔴 QUITAR LIKE (DELETE)
      // Usamos la ruta que ha creado tu compañero: /likes/{usuario}/{pub}
      const deleteUrl = `${environment.apiUrl}/likes/${userId}/${postId}`;
      
      this.http.delete(deleteUrl).subscribe({
        next: () => console.log('¡Like eliminado (200)!'),
        error: (err) => {
          console.error('Error al quitar like:', err);
          this.loadPostsFromBackend(); // Si falla, revertimos el corazón
        }
      });
    }
  }

  addComment(postId: number, text: string, user: string, userAvatar?: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const comentarioUrl = `${environment.apiUrl}/comentarios`;
    const payload = {
      idPublicacion: postId,
      id_publicacion: postId,
      idUsuario: userId,
      id_usuario: userId,
      contenido: text.trim()
    };

    this.http.post<any>(comentarioUrl, payload).subscribe({
      next: () => this.loadPostsFromBackend(),
      error: () => this.notification.error('No se pudo enviar el comentario.')
    });
  }

  deletePost(postId: number) {
    this.http.delete(`${this.apiUrl}/${postId}`).subscribe({
      next: () => this.posts.update(posts => posts.filter(p => p.id !== postId)),
      error: () => this.notification.error('No se pudo eliminar la publicación.')
    });
  }
  
  updateUserPosts(oldName: string, newName: string, newAvatar?: string) {}
  deleteComment(postId: number, commentId: number) {}
  updatePost(postId: number, data: any) {}
}