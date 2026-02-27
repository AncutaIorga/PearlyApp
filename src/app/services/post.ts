import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification';
import { BlockService } from './block';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Comment {
  id: number;
  idPublicacion: number;
  idUsuario: number;
  user: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface Post {
  id: number;
  idUsuario: number;
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
  private blockService = inject(BlockService);
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
        const mutes = this.blockService.mutedUsers().map(m => m.idBloqueado);
        const blocks = this.blockService.blockedUsers().map(b => b.idBloqueado);
        const restringidos = [...mutes, ...blocks];

        // CORRECCIÓN: Se añaden todos los campos necesarios para cumplir con la interfaz Post
        const mappedPosts: Post[] = data
          .filter(dbPost => !restringidos.includes(dbPost.idUsuario))
          .map(dbPost => ({
            id: dbPost.id,
            idUsuario: dbPost.idUsuario,
            user: dbPost.nombreUsuario || dbPost.user || `Usuario ${dbPost.idUsuario}`,
            userAvatar: dbPost.avatarUsuario || dbPost.avatar || '',
            image: dbPost.imagen,
            text: dbPost.texto,
            likes: dbPost.likesCount || 0,
            likedBy: dbPost.likedBy || [],
            // Mapeo detallado de comentarios
            comments: (dbPost.comments || dbPost.comentarios || []).map((c: any) => ({
              id: c.idComentario || c.id,
              idPublicacion: c.idPublicacion,
              idUsuario: c.idUsuario,
              user: c.nombreUsuario || 'Usuario',
              text: c.contenido || c.texto,
              createdAt: new Date(c.fecha)
            })),
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
      error: (err) => console.error('Error cargando publicaciones', err)
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
    return this.getAllPosts().filter(p => p.user.toLowerCase() === userName.toLowerCase());
  }

  getPostById(id: number | string): Post | undefined {
    return this.getAllPosts().find(p => p.id == id);
  }

  addPost(postData: { image: string; text: string; challengeInfo?: any; }) {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const payload: any = {
      idUsuario: Number(userId),
      texto: postData.text.trim(),
      fecha: new Date().toISOString().split('.')[0],
      imagen: postData.image,
      idRetoVinculado: postData.challengeInfo?.id ? Number(postData.challengeInfo.id) : undefined,
      likesCount: 0,
      likedBy: [],
      nombreUsuario: this.getCurrentUserName(),
      avatarUsuario: undefined
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: () => {
        this.notification.success('¡Publicación creada!');
        this.loadPostsFromBackend(); 
      },
      error: (err) => {
        console.error('Error 400 detallado:', err);
        this.notification.error('Error al crear la publicación.');
      }
    });
  }

  toggleLike(postId: number) {
    const userId = this.getCurrentUserId();
    const currentUser = this.getCurrentUserName();
    const targetPost = this.posts().find(p => p.id === postId);
    
    if (!userId || !targetPost) return;

    const hasLiked = targetPost.likedBy.includes(currentUser);

    if (!hasLiked) {
      this.http.post(`${environment.apiUrl}/likes`, { idUsuario: userId, idPublicacion: postId }).subscribe({
        next: () => this.loadPostsFromBackend()
      });
    } else {
      this.http.delete(`${environment.apiUrl}/likes/${userId}/${postId}`).subscribe({
        next: () => this.loadPostsFromBackend()
      });
    }
  }

  addComment(postId: number, text: string): Observable<any> {
    const userId = Number(localStorage.getItem('idUsuario') || localStorage.getItem('userId'));
    const fechaActual = new Date().toISOString().split('.')[0]; // Formato YYYY-MM-DDTHH:mm:ss

    const payload = {
      idPublicacion: postId,
      idUsuario: userId,
      contenido: text.trim(),
      fecha: fechaActual // <--- Crucial para el Backend
    };
    
    return this.http.post(`${environment.apiUrl}/comentarios`, payload).pipe(
      tap(() => this.loadPostsFromBackend())
    );
  }

  deletePost(postId: number) {
    this.http.delete(`${this.apiUrl}/${postId}`).subscribe({
      next: () => this.loadPostsFromBackend(),
      error: () => this.notification.error('No se pudo eliminar la publicación.')
    });
  }
  
  updatePost(postId: number, data: any) {
    this.http.put(`${this.apiUrl}/${postId}`, data).subscribe(() => this.loadPostsFromBackend());
  }

  deleteComment(postId: number, commentId: number) {
    this.http.delete(`${environment.apiUrl}/comentarios/${commentId}`).subscribe(() => this.loadPostsFromBackend());
  }
}