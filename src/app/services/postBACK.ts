/* 


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ===============================
// INTERFACES
// ===============================
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
  likedByMe?: boolean;
  comments: Comment[];
  createdAt: Date;
}

// ===============================
// SERVICIO POST - API BACKEND
// ===============================
@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly API_URL = '/api/posts';

  constructor(private http: HttpClient) {}

  // Obtener todos los posts
  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.API_URL);
  }

  // Obtener posts de un usuario
  getPostsByUser(userName: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.API_URL}?user=${encodeURIComponent(userName)}`);
  }

  // Obtener post por ID
  getPostById(postId: number | string): Observable<Post> {
    return this.http.get<Post>(`${this.API_URL}/${postId}`);
  }

  // Crear nuevo post
  addPost(data: { image: string; text: string; user?: string; userAvatar?: string }): Observable<Post> {
    return this.http.post<Post>(this.API_URL, data);
  }

  // Actualizar post existente
  updatePost(postId: number, data: { text?: string; image?: string }): Observable<Post> {
    return this.http.patch<Post>(`${this.API_URL}/${postId}`, data);
  }

  // Eliminar post
  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${postId}`);
  }

  // Dar / quitar like
  toggleLike(postId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${postId}/like`, {});
  }

  // Agregar comentario a un post
  addComment(postId: number, text: string, user: string, userAvatar?: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.API_URL}/${postId}/comments`, { text, user, userAvatar });
  }
}


*/