import { Injectable, signal, inject, computed } from '@angular/core';
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

  private rawPosts = signal<Post[]>([]);

  // Filtra de forma automatica y oculta los posts de personas bloqueadas.
  public posts = computed(() => {
    const restringidos = new Set([
      ...this.blockService.mutedUsers().map(m => m.idBloqueado),
      ...this.blockService.blockedUsers().map(b => b.idBloqueado)
    ]);

    const currentUser = this.getCurrentUserName();

    return this.rawPosts()
      .filter(p => !restringidos.has(p.idUsuario))
      .map(p => ({
        ...p,
        likedByMe: p.likedBy?.includes(currentUser) || false
      }));
  });

  // Carga todas las publicaciones nada mas abrir la aplicacion.
  constructor() {
    this.loadPostsFromBackend();
  }

  // Obtiene el identificador numerico del usuario actual.
  private getCurrentUserId(): number | null {
    const idStr = localStorage.getItem('idUsuario') || localStorage.getItem('userId');
    return idStr ? parseInt(idStr, 10) : null;
  }

  // Obtiene el nombre del usuario actual.
  private getCurrentUserName(): string {
    return localStorage.getItem('userName') || 'Usuario';
  }

  // Pide al servidor todas las publicaciones y las ordena por fecha de creacion.
  loadPostsFromBackend() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        const mappedPosts: Post[] = data.map(dbPost => ({
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
        this.rawPosts.set(mappedPosts);
      },
      error: (err) => console.error('Error cargando publicaciones', err)
    });
  }

  // Devuelve la lista de publicaciones ya filtrada sin la gente toxica.
  getAllPosts(): Post[] {
    return this.posts();
  }

  // Devuelve solamente las publicaciones que ha creado un usuario en especifico.
  getPostsByUser(userName: string): Post[] {
    return this.posts().filter(p => p.user.toLowerCase() === userName.toLowerCase());
  }

  // Busca los datos de una unica publicacion segun su numero de ID.
  getPostById(id: number | string): Post | undefined {
    return this.posts().find(p => p.id == id);
  }

  // Envia al servidor los datos y la foto para crear un post nuevo.
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

  // Guarda los cambios del texto de una publicacion localmente para simular que se ha editado.
  updatePost(postId: number, data: any) {
    const editedPosts = JSON.parse(localStorage.getItem('pearly_edited_posts') || '{}');
    editedPosts[postId] = data;
    localStorage.setItem('pearly_edited_posts', JSON.stringify(editedPosts));

    this.rawPosts.update(posts => posts.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          text: data.text !== undefined ? data.text : p.text,
          image: data.image !== undefined ? data.image : p.image
        };
      }
      return p;
    }));

    this.notification.success('Publicación actualizada');
  }

  // Borra una publicacion visualmente de la lista sin tener que esperar al backend.
  deletePost(postId: number) {
    const deletedPosts = JSON.parse(localStorage.getItem('pearly_deleted_posts') || '[]');
    if (!deletedPosts.includes(postId)) {
      deletedPosts.push(postId);
      localStorage.setItem('pearly_deleted_posts', JSON.stringify(deletedPosts));
    }

    this.rawPosts.update(posts => posts.filter(p => p.id !== postId));
  }

  // Da o quita el me gusta y se lo envia al backend.
  toggleLike(postId: number) {
    const userId = this.getCurrentUserId();
    const currentUser = this.getCurrentUserName();
    const targetPost = this.rawPosts().find(p => p.id === postId);
    
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

  // Envia un comentario nuevo hacia una publicacion especifica.
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

  // Borra un comentario existente del servidor.
  deleteComment(postId: number, commentId: number) {
    this.http.delete(`${environment.apiUrl}/comentarios/${commentId}`).subscribe({
      next: () => {
        this.notification.success('Comentario eliminado');
        this.loadPostsFromBackend();
      },
      error: () => this.notification.error('No se pudo eliminar el comentario')
    });
  }
}