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
    const savedPosts = localStorage.getItem('posts');

    if (savedPosts) {
      const parsed = JSON.parse(savedPosts);

      parsed.forEach((post: any) => {
        post.createdAt = new Date(post.createdAt);
        post.comments.forEach((c: any) => {
          c.createdAt = new Date(c.createdAt);
        });
      });

      this.posts.set(parsed);

      const maxId = Math.max(...parsed.map((p: Post) => p.id), 0);
      this.nextId = maxId + 1;
    } else {
      this.posts.set([
        {
          id: this.nextId++,
          user: 'Ana',
          image: 'https://picsum.photos/400/300',
          text: '🏃‍♀️ Corrí 10K hoy',
          likes: 12,
          comments: [
            {
              id: 1,
              user: 'Luis',
              text: '¡Increíble! 💪',
              createdAt: new Date()
            }
          ],
          createdAt: new Date(),
          likedByMe: false
        },
        {
          id: this.nextId++,
          user: 'Luis',
          image: 'https://picsum.photos/400/301',
          text: '💧 2L de agua diarios',
          likes: 8,
          comments: [],
          createdAt: new Date(),
          likedByMe: false
        }
      ]);

      this.savePosts();
    }
  }

  private savePosts() {
    localStorage.setItem('posts', JSON.stringify(this.posts()));
  }

  // ✅ USAR DESDE FEED
  getAllPosts(): Post[] {
    return this.posts();
  }

  getPostsByUser(userName: string): Post[] {
    return this.posts().filter(p => p.user === userName);
  }

  getPostById(id: number | string): Post | undefined {
    return this.posts().find(p => p.id == id);
  }

  addPost(post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'likedByMe'>) {
    const newPost: Post = {
      ...post,
      id: this.nextId++,
      likes: 0,
      comments: [],
      createdAt: new Date(),
      likedByMe: false
    };

    this.posts.update(p => [newPost, ...p]);
    this.savePosts();
    return newPost;
  }

  updatePost(updatedPost: Post) {
    this.posts.update(posts =>
      posts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p)
    );
    this.savePosts();
  }

  toggleLike(postId: number) {
    this.posts.update(posts =>
      posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: p.likedByMe ? p.likes - 1 : p.likes + 1,
            likedByMe: !p.likedByMe
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

  deletePost(postId: number) {
    this.posts.update(posts => posts.filter(p => p.id !== postId));
    this.savePosts();
  }
}
