import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PostService {
  posts = signal([
    {
      id: 1,
      user: 'Ana',
      image: 'https://picsum.photos/400/300',
      text: '🏃‍♀️ Corrí 10K hoy',
      likes: 12,
      createdAt: new Date()
    },
    {
      id: 2,
      user: 'Luis',
      image: 'https://picsum.photos/400/301',
      text: '💧 2L de agua diarios',
      likes: 8,
      createdAt: new Date()
    }
  ]);

  addPost(post: any) {
    this.posts.update(p => [post, ...p]);
  }

  /** 🔍 Obtener un post por id */
  getPostById(id: string | number) {
    return this.posts().find(p => p.id == id);
  }

  /** ✏️ Actualizar un post existente */
  updatePost(updatedPost: any) {
    this.posts.update(posts =>
      posts.map(p =>
        p.id === updatedPost.id ? { ...p, ...updatedPost } : p
      )
    );
  }
}
