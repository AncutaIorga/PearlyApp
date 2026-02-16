import { Injectable, signal, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { PostService } from './post'; 

export interface BlockedUser {
  id: number;
  name: string;
  avatar?: string;
  blockedAt: Date;
}

export interface MutedUser {
  name: string;
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class BlockService {
  public blockedUsers = signal<BlockedUser[]>([]);
  public mutedUsers = signal<MutedUser[]>([]);
  private postService = inject(PostService);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const savedBlocks = localStorage.getItem('blocked-users');
    if (savedBlocks) {
      try { this.blockedUsers.set(JSON.parse(savedBlocks)); } catch (e) {}
    }
    const savedMutes = localStorage.getItem('muted-users');
    if (savedMutes) {
      try { this.mutedUsers.set(JSON.parse(savedMutes)); } catch (e) {}
    }
  }

  private saveToStorage() {
    localStorage.setItem('blocked-users', JSON.stringify(this.blockedUsers()));
    localStorage.setItem('muted-users', JSON.stringify(this.mutedUsers()));
  }

  isBlocked(username: string): boolean {
    return this.blockedUsers().some(u => u.name === username);
  }

  isMuted(username: string): boolean {
    return this.mutedUsers().some(u => u.name === username);
  }

  blockUserByUsername(username: string): Observable<void> {
    if (!this.isBlocked(username)) {
      const userPosts = this.postService.getPostsByUser(username);
      const userAvatar = userPosts.length > 0 ? userPosts[0].userAvatar : '';
      this.blockedUsers.update(users => [
        ...users,
        { id: Date.now(), name: username, avatar: userAvatar, blockedAt: new Date() }
      ]);
      this.saveToStorage();
    }
    return of(void 0).pipe(delay(100));
  }

  unblockUser(userId: number): Observable<void> {
    this.blockedUsers.update(users => users.filter(u => u.id !== userId));
    this.saveToStorage();
    return of(void 0).pipe(delay(100));
  }

  // Corregido: añadida la función que pedía el error TS2551
  unblockUserByUsername(username: string): Observable<void> {
    this.blockedUsers.update(users => users.filter(u => u.name !== username));
    this.saveToStorage();
    return of(void 0).pipe(delay(100));
  }

  muteUserByUsername(username: string): Observable<void> {
    if (!this.isMuted(username)) {
      const userPosts = this.postService.getPostsByUser(username);
      this.mutedUsers.update(users => [...users, { name: username, avatar: userPosts.length > 0 ? userPosts[0].userAvatar : '' }]);
      this.saveToStorage();
    }
    return of(void 0).pipe(delay(100));
  }

  unmuteUser(username: string): void {
    this.mutedUsers.update(users => users.filter(u => u.name !== username));
    this.saveToStorage();
  }

  getBlockedUsers(): Observable<BlockedUser[]> {
    return of(this.blockedUsers());
  }
}