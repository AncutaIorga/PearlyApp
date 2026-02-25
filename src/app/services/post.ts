import { Injectable, signal } from '@angular/core';

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
          
          if (!post.likedBy || !Array.isArray(post.likedBy)) {
            post.likedBy = [];
          }
          
          if (post.challengeInfo && !post.challengeInfo.category) {
            post.challengeInfo.category = this.inferCategoryFromId(post.challengeInfo.id);
          }
        });

        this.posts.set(parsed);
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
        likes: 12,
        likedBy: [], 
        comments: [],
        createdAt: new Date(),
        challengeInfo: { 
          id: 'physical-1',
          title: 'Caminata de 30 minutos',
          category: 'physical',
          points: 75
        }
      }
    ];
    this.posts.set(defaults);
    this.savePosts();
    this.nextId = 2;
  }

  private savePosts() {
    try {
      localStorage.setItem('posts', JSON.stringify(this.posts()));
    } catch (e) {
      console.warn('Memoria local llena: El post se guardó solo en sesión.');
    }
  }

  getAllPosts(): Post[] {
    const currentUser = this.getCurrentUser();
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

  addPost(postData: { 
    image: string; 
    text: string; 
    user?: string; 
    userAvatar?: string;
    challengeInfo?: any; 
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
      challengeInfo: postData.challengeInfo 
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
            newLikedBy = newLikedBy.filter(u => u !== currentUser);
          } else {
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
              { id: Date.now(), user, userAvatar, text, createdAt: new Date() }
            ]
          };
        }
        return p;
      })
    );
    this.savePosts();
  }

  deleteComment(postId: number, commentId: number) {
    this.posts.update(posts =>
      posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.filter(c => c.id !== commentId)
          };
        }
        return p;
      })
    );
    this.savePosts();
  }

  updatePost(postId: number, data: any) {
    this.posts.update(posts =>
      posts.map(p => (p.id === postId ? { ...p, ...data } : p))
    );
    this.savePosts();
  }

  deletePost(postId: number) {
    this.posts.update(posts => posts.filter(p => p.id !== postId));
    this.savePosts();
  }

  updateUserPosts(oldName: string, newName: string, newAvatar?: string) {
    this.posts.update(posts => 
      posts.map(p => {
        if (p.user === oldName) {
          return { 
            ...p, 
            user: newName,
            userAvatar: newAvatar !== undefined ? newAvatar : p.userAvatar 
          };
        }
        return p;
      })
    );
    this.savePosts();
  }
}