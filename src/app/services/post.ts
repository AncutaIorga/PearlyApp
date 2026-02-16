import { Injectable, signal } from '@angular/core';

export interface Post {
  id: number;
  user: string;
  userAvatar?: string;
  image: string;
  text: string;
  likes: number; // Contador total acumulado
  likedBy: string[]; // Lista de nombres de usuarios para persistencia
  comments: Comment[];
  createdAt: Date;
  likedByMe?: boolean; // Propiedad virtual para el frontend
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

  // Obtener usuario actual del almacenamiento
  private getCurrentUser(): string {
    return localStorage.getItem('userName') || 'Usuario';
  }

  private loadPosts() {
    const savedPosts = localStorage.getItem('posts');

    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        parsed.forEach((post: any) => {
          post.createdAt = new Date(post.createdAt);
          post.comments.forEach((c: any) => c.createdAt = new Date(c.createdAt));
          // Aseguramos que el array likedBy exista
          if (!post.likedBy || !Array.isArray(post.likedBy)) {
            post.likedBy = [];
          }
        });

        this.posts.set(parsed);
        // Calcular el siguiente ID disponible
        const maxId = parsed.reduce((max: number, p: Post) => Math.max(max, p.id), 0);
        this.nextId = maxId + 1;
      } catch (e) {
        console.error('Error cargando posts, reiniciando...', e);
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
        likes: 12, // Ejemplo con número alto de likes
        likedBy: [], // Vacío inicialmente
        comments: [],
        createdAt: new Date()
      },
      {
        id: 2,
        user: 'Luis',
        userAvatar: '',
        image: 'https://picsum.photos/400/301',
        text: '💧 Meta de hidratación cumplida: 2L de agua.',
        likes: 5,
        likedBy: [],
        comments: [],
        createdAt: new Date()
      }
    ];
    this.posts.set(defaults);
    this.savePosts();
    this.nextId = 3;
  }

  private savePosts() {
    localStorage.setItem('posts', JSON.stringify(this.posts()));
  }

  // --- GETTERS ---

  getAllPosts(): Post[] {
    const currentUser = this.getCurrentUser();
    // Mapeamos los posts para calcular 'likedByMe' en tiempo real
    return this.posts().map(p => ({
      ...p,
      likedByMe: p.likedBy.includes(currentUser)
    }));
  }

  getPostsByUser(userName: string): Post[] {
    return this.getAllPosts().filter(p => p.user === userName);
  }

  getPostById(id: number | string): Post | undefined {
    return this.getAllPosts().find(p => p.id == id);
  }

  // --- ACTIONS ---

  addPost(postData: { image: string; text: string; user?: string; userAvatar?: string }) {
    const userName = localStorage.getItem('userName') || 'Usuario';
    const userAvatar = localStorage.getItem('userAvatar') || '';
    
    const newPost: Post = {
      ...postData,
      id: this.nextId++,
      user: postData.user || userName,
      userAvatar: postData.userAvatar || userAvatar,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: new Date()
    };

    this.posts.update(p => [newPost, ...p]);
    this.savePosts();
    return newPost;
  }

  /**
   * Lógica corregida: Suma o resta 1 al contador actual de likes
   */
  toggleLike(postId: number) {
    const currentUser = this.getCurrentUser();

    this.posts.update(posts =>
      posts.map(p => {
        if (p.id === postId) {
          const hasLiked = p.likedBy.includes(currentUser);
          let newLikedBy = [...p.likedBy];
          let newLikesCount = p.likes;

          if (hasLiked) {
            // Si ya dio like, lo quitamos de la lista y restamos 1 al total
            newLikedBy = newLikedBy.filter(u => u !== currentUser);
            newLikesCount = Math.max(0, p.likes - 1);
          } else {
            // Si no dio like, lo añadimos a la lista y sumamos 1 al total
            newLikedBy.push(currentUser);
            newLikesCount = p.likes + 1;
          }

          return {
            ...p,
            likedBy: newLikedBy,
            likes: newLikesCount
          };
        }
        return p;
      })
    );
    this.savePosts();
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
    this.savePosts();
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
    this.savePosts();
  }

  deletePost(postId: number) {
    this.posts.update(posts => posts.filter(p => p.id !== postId));
    this.savePosts();
  }
}