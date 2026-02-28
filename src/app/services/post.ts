import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification';
import { BlockService } from './block';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
  idRetoVinculado?: number;
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
        const restringidos = new Set([
          ...this.blockService.mutedUsers().map(m => m.idBloqueado),
          ...this.blockService.blockedUsers().map(b => b.idBloqueado)
        ]);

        const mappedPosts: Post[] = data
          .filter(dbPost => !restringidos.has(dbPost.idUsuario))
          .map(dbPost => ({
            id: dbPost.id,
            idUsuario: dbPost.idUsuario,
            user: dbPost.nombreUsuario || `Usuario ${dbPost.idUsuario}`,
            userAvatar: dbPost.avatarUsuario || '',
            image: dbPost.imagen,
            text: dbPost.texto,
            likes: dbPost.likesCount || 0,
            likedBy: dbPost.likedBy || [],
            comments: (dbPost.comments || []).map((c: any) => ({
              id: c.id || c.idComentario,
              idPublicacion: c.idPublicacion,
              idUsuario: c.idUsuario,
              user: c.nombreUsuario || 'Usuario',
              text: c.contenido || c.texto,
              createdAt: new Date(c.fecha)
            })),
            createdAt: new Date(dbPost.fecha),
            idRetoVinculado: dbPost.idRetoVinculado
          }));
        
        mappedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        this.posts.set(mappedPosts);
      },
      error: (err) => console.error('Error cargando publicaciones', err)
    });
  }

  // --- MÉTODOS RECUPERADOS PARA EL PERFIL Y COMPATIBILIDAD ---

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
    // Usamos == para permitir comparaciones entre string y number si fuera necesario
    return this.getAllPosts().find(p => p.id == id);
  }

  updatePost(postId: number, data: any) {
    this.http.put(`${this.apiUrl}/${postId}`, data).subscribe({
      next: () => {
        this.notification.success('Publicación actualizada');
        this.loadPostsFromBackend();
      },
      error: () => this.notification.error('Error al actualizar')
    });
  }

  // ---------------------------------------------------------

  addPost(postData: { image: string; text: string; idRetoVinculado?: number; }) {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const payload = {
      idUsuario: userId,
      texto: postData.text.trim(),
      imagen: postData.image,
      idRetoVinculado: postData.idRetoVinculado || null
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: () => {
        this.notification.success('¡Publicación creada!');
        this.loadPostsFromBackend(); 
      },
      error: (err) => {
        console.error('Error al crear post:', err);
        this.notification.error('No se pudo publicar.');
      }
    });
  }

  addComment(postId: number, text: string): Observable<any> {
    const userId = this.getCurrentUserId();
    const payload = {
      idPublicacion: postId,
      idUsuario: userId,
      contenido: text.trim()
    };
    
    return this.http.post(`${environment.apiUrl}/comentarios`, payload).pipe(
      tap(() => this.loadPostsFromBackend())
    );
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

  deleteComment(postId: number, commentId: number) {
    this.http.delete(`${environment.apiUrl}/comentarios/${commentId}`).subscribe({
      next: () => {
        this.notification.success('Comentario eliminado');
        this.loadPostsFromBackend();
      },
      error: () => this.notification.error('No se pudo eliminar el comentario')
    });
  }

  deletePost(postId: number) {
    this.http.delete(`${this.apiUrl}/${postId}`).subscribe({
      next: () => this.loadPostsFromBackend(),
      error: () => this.notification.error('Error al eliminar.')
    });
  }
}