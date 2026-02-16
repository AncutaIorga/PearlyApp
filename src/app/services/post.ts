import { Injectable, signal } from '@angular/core';

export interface Post {
  id: number;
  user: string;
  userAvatar?: string;
  image: string;
  text: string;
  likes: number;
  likedBy: string[]; // Lista de usuarios que han dado like
  comments: Comment[];
  createdAt: Date;
  likedByMe?: boolean; // Propiedad virtual para el frontend
  challengeInfo?: { // NUEVO: Información del reto asociado
    id: string;
    title: string;
    category: string;
    points: number;
  };
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
          // Aseguramos que challengeInfo exista si estaba en el post guardado
          if (post.challengeInfo && !post.challengeInfo.category) {
            post.challengeInfo.category = this.inferCategoryFromId(post.challengeInfo.id);
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

  private inferCategoryFromId(id: string): string {
    if (id.startsWith('mental')) return 'mental';
    if (id.startsWith('physical')) return 'physical';
    if (id.startsWith('mindfulness')) return 'mindfulness';
    if (id.startsWith('nutrition')) return 'nutrition';
    return 'mental';
  }

  private initializeDefaults() {
    const defaults: Post[] = [
      {
        id: 1,
        user: 'Neli',
        userAvatar: '',
        image: 'https://picsum.photos/400/300',
        text: '🏃‍♀️ Corrí 10K hoy. ¡Me siento genial!',
        likes: 2,
        likedBy: ['Luis', 'Ana'], // Usuarios simulados que dieron like
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
        challengeInfo: { // Añadido ejemplo de reto
          id: 'physical-1',
          title: 'Caminata de 30 minutos',
          category: 'physical',
          points: 75
        }
      },
      {
        id: 2,
        user: 'Luis',
        userAvatar: '',
        image: 'https://picsum.photos/400/301',
        text: '💧 Meta de hidratación cumplida: 2L de agua.',
        likes: 1,
        likedBy: ['Neli'],
        comments: [],
        createdAt: new Date(),
        challengeInfo: { // Añadido ejemplo de reto
          id: 'nutrition-2',
          title: 'Hidratación consciente',
          category: 'nutrition',
          points: 70
        }
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

  addPost(postData: { 
    image: string; 
    text: string; 
    user?: string; 
    userAvatar?: string;
    challengeInfo?: { // NUEVO: Aceptar challengeInfo
      id: string;
      title: string;
      category: string;
      points: number;
    };
  }) {
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
      createdAt: new Date(),
      challengeInfo: postData.challengeInfo // Guardar la info del reto
    };

    this.posts.update(p => [newPost, ...p]);
    this.savePosts();
    return newPost;
  }

  toggleLike(postId: number) {
    const currentUser = this.getCurrentUser();

    this.posts.update(posts =>
      posts.map(p => {
        if (p.id === postId) {
          const hasLiked = p.likedBy.includes(currentUser);
          let newLikedBy = [...p.likedBy];

          if (hasLiked) {
            // Si ya dio like, lo quitamos
            newLikedBy = newLikedBy.filter(u => u !== currentUser);
          } else {
            // Si no dio like, lo añadimos
            newLikedBy.push(currentUser);
          }

          return {
            ...p,
            likedBy: newLikedBy,
            likes: newLikedBy.length
          };
        }
        return p;
      })
    );
    // Guardamos INMEDIATAMENTE para que persista al refrescar
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