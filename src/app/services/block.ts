import { Injectable, signal, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { PostService } from './post'; 

export interface BlockedUser {
  id: number;
  name: string;
  avatar?: string;
  blockedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class BlockService {
  private blockedUsers = signal<BlockedUser[]>([]);
  private postService = inject(PostService);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const saved = localStorage.getItem('blocked-users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.blockedUsers.set(parsed);
      } catch (e) {
        console.error('Error cargando bloqueados', e);
      }
    }
  }

  private saveToStorage() {
    localStorage.setItem('blocked-users', JSON.stringify(this.blockedUsers()));
  }

  /**
   * Obtiene la lista de usuarios bloqueados
   */
  getBlockedUsers(): Observable<BlockedUser[]> {
    return of(this.blockedUsers()).pipe(delay(200));
  }

  /**
   * Bloquea a un usuario capturando su avatar de los posts existentes
   */
  blockUserByUsername(username: string): Observable<void> {
    const currentList = this.blockedUsers();
    
    if (!currentList.some(u => u.name === username)) {
      // Buscar avatar del usuario en los posts para guardarlo en la lista de bloqueados
      const userPosts = this.postService.getPostsByUser(username);
      const userAvatar = userPosts.length > 0 ? userPosts[0].userAvatar : '';

      this.blockedUsers.update(users => [
        ...users,
        {
          id: Date.now(),
          name: username,
          avatar: userAvatar,
          blockedAt: new Date()
        }
      ]);
      this.saveToStorage();
    }
    return of(void 0).pipe(delay(300));
  }

  /**
   * Desbloquea por ID (Usado en Ajustes)
   */
  unblockUser(userId: number): Observable<void> {
    this.blockedUsers.update(users => users.filter(u => u.id !== userId));
    this.saveToStorage();
    return of(void 0).pipe(delay(300));
  }

  /**
   * Desbloquea por nombre (Usado en PostOptions)
   */
  unblockUserByUsername(username: string): Observable<void> {
    this.blockedUsers.update(users => users.filter(u => u.name !== username));
    this.saveToStorage();
    return of(void 0).pipe(delay(300));
  }

  /**
   * Verifica si un usuario está en la lista de bloqueados
   * ESTA ES LA FUNCIÓN QUE FALTABA
   */
  isBlocked(username: string): boolean {
    return this.blockedUsers().some(u => u.name === username);
  }
}