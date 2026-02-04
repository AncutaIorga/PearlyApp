import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface BlockedUser {
  id: number;
  name: string;
  avatar?: string;
  blockedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BlockService {
  private readonly API_URL = '/api/users';
  
  private blockedUsers = signal<BlockedUser[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de usuarios bloqueados
   */
  getBlockedUsers(): Observable<BlockedUser[]> {
    return this.http.get<BlockedUser[]>(`${this.API_URL}/me/blocked`).pipe(
      tap(users => {
        const parsed = users.map(u => ({
          ...u,
          blockedAt: new Date(u.blockedAt)
        }));
        this.blockedUsers.set(parsed);
      })
    );
  }

  /**
   * Bloquea a un usuario
   */
  blockUser(userId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${userId}/block`, {}).pipe(
      tap(() => {
        // Recargar lista
        this.getBlockedUsers().subscribe();
      })
    );
  }

  /**
   * Desbloquea a un usuario
   */
  unblockUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${userId}/block`).pipe(
      tap(() => {
        this.blockedUsers.update(users =>
          users.filter(u => u.id !== userId)
        );
      })
    );
  }

  /**
   * Verifica si un usuario está bloqueado
   */
  isBlocked(userId: number): boolean {
    return this.blockedUsers().some(u => u.id === userId);
  }

  getBlocked() {
    return this.blockedUsers();
  }
}