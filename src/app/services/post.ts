import { Injectable, signal } from '@angular/core';

export interface Post {
  id: number;
  user: string;
  userAvatar?: string;
  image: string;
  text: string;
  likes: number;
  comments: Comment[];
  createdAt: Date;
  likedByMe?: boolean;
}

export interface Comment {
  id: number;
  user: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private posts = signal<Post[]>([]);
  private nextId = 1;

  constructor() {
    this.loadPosts();
  }

  private loadPosts() {
    const savedPosts = localStorage.getItem('posts');

    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        // Recuperar fechas correctamente (JSON las guarda como string)
        parsed.forEach((post: any) => {
          post.createdAt = new Date(post.createdAt);
          post.comments.forEach((c: any) => {
            c.createdAt = new Date(c.createdAt);
          });
        });

        this.posts.set(parsed);
        // Actualizar el nextId para no sobrescribir posts
        const maxId = parsed.reduce((max: number, p: Post) => Math.max(max, p.id), 0);
        this.nextId = maxId + 1;
      } catch (e) {
        console.error('Error al leer posts, reiniciando...', e);
        this.initializeDefaults();
      }
    } else {
      this.initializeDefaults();
    }
  }

  private initializeDefaults() {
    const defaults: Post[] = [
      {
        id: 1,
        user: 'Neli',
        userAvatar: '',
        image: 'https://picsum.photos/400/300',
        text: '🏃‍♀️ Corrí 10K hoy. ¡Me siento genial!',
        likes: 12,
        comments: [
          {
            id: 101,
            user: 'Luis',
            userAvatar: '',
            text: '¡Increíble! 💪',
            createdAt: new Date()
          }
        ],
        createdAt: new Date(),
        likedByMe: false
      },
      {
        id: 2,
        user: 'Luis',
        userAvatar: '',
        image: 'https://picsum.photos/400/301',
        text: '💧 Meta de hidratación cumplida: 2L de agua.',
        likes: 8,
        comments: [],
        createdAt: new Date(),
        likedByMe: false
      }
    ];
    this.posts.set(defaults);
    this.savePosts();
    this.nextId = 3;
  }

  private savePosts() {
    localStorage.setItem('posts', JSON.stringify(this.posts()));
  }

  // ✅ GETTERS
  getAllPosts(): Post[] {
    return this.posts();
  }

  getPostsByUser(userName: string): Post[] {
    return this.posts().filter(p => p.user === userName);
  }

  getPostById(id: number | string): Post | undefined {
    return this.posts().find(p => p.id == id);
  }

  // ✅ ACTIONS
  addPost(postData: { image: string; text: string; user?: string; userAvatar?: string }) {
    const userName = localStorage.getItem('userName') || 'Usuario';
    const userAvatarFromStorage = localStorage.getItem('userAvatar') || '';
    
    const newPost: Post = {
      ...postData,
      id: this.nextId++,
      user: postData.user || userName,
      userAvatar: postData.userAvatar || userAvatarFromStorage,
      likes: 0,
      comments: [],
      createdAt: new Date(),
      likedByMe: false
    };

    this.posts.update(p => [newPost, ...p]);
    this.savePosts(); // Guardar cambios
    return newPost;
  }

  updatePost(postId: number, data: { text?: string; image?: string }) {
    this.posts.update(posts =>
      posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            ...data,
            text: data.text || p.text,
            image: data.image || p.image
          };
        }
        return p;
      })
    );
    this.savePosts(); // Guardar cambios
  }

  toggleLike(postId: number) {
    this.posts.update(posts =>
      posts.map(p => {
        if (p.id === postId) {
          const isLikedNow = !p.likedByMe;
          return {
            ...p,
            likes: isLikedNow ? p.likes + 1 : p.likes - 1,
            likedByMe: isLikedNow
          };
        }
        return p;
      })
    );
    this.savePosts(); // Guardar inmediatamente
  }

  addComment(postId: number, text: string, user: string, userAvatar?: string) {
    this.posts.update(posts =>
      posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: Date.now(),
                user,
                userAvatar,
                text,
                createdAt: new Date()
              }
            ]
          };
        }
        return p;
      })
    );
    this.savePosts(); // Guardar cambios
  }

  deletePost(postId: number) {
    this.posts.update(posts => posts.filter(p => p.id !== postId));
    this.savePosts(); // Guardar cambios
  }
}