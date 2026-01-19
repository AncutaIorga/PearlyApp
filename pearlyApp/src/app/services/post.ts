import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PostService {
  posts = signal([
    {
      id: 1,
      user: 'Ana',
      image: 'https://picsum.photos/400/300',
      text: '🏃‍♀️ Corrí 10K hoy',
      likes: 12
    },
    {
      id: 2,
      user: 'Luis',
      image: 'https://picsum.photos/400/301',
      text: '💧 2L de agua diarios',
      likes: 8
    }
  ]);

  addPost(post: any) {
    this.posts.update(p => [post, ...p]);
  }
}
