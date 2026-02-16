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
   * Obtiene la lista de usuarios bloqueados desde el backend
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
   * Bloquea a un usuario (por ID)
   */
  blockUser(userId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${userId}/block`, {}).pipe(
      tap(() => {
        // Actualizar estado local llamando la lista
        this.getBlockedUsers().subscribe();
      })
    );
  }

  /**
   * Desbloquea a un usuario (por ID)
   */
  unblockUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${userId}/block`).pipe(
      tap(() => {
        this.blockedUsers.update(users => users.filter(u => u.id !== userId));
      })
    );
  }

  /**
   * Bloquear usuario por username (actualiza al instante el estado local)
   */
  blockUserByUsername(username: string): Observable<void> {
    // Actualiza local
    const list = this.blockedUsers();
    if (!list.some(u => u.name === username)) {
      this.blockedUsers.set([
        ...list,
        {
          id: Date.now(), // id temporal
          name: username,
          blockedAt: new Date()
        }
      ]);
    }

    // Opcional: enviar al backend
    this.http.post(`${this.API_URL}/block`, { username }).subscribe();

    return new Observable<void>(obs => {
      obs.next();
      obs.complete();
    });
  }

  /**
   * Desbloquear usuario por username (actualiza al instante el estado local)
   */
  unblockUserByUsername(username: string): Observable<void> {
    this.blockedUsers.update(list => list.filter(u => u.name !== username));

    // Opcional: enviar al backend
    this.http.post(`${this.API_URL}/unblock`, { username }).subscribe();

    return new Observable<void>(obs => {
      obs.next();
      obs.complete();
    });
  }

  /**
   * Verifica si un usuario está bloqueado (usa la señal local)
   */
  isBlocked(username: string): boolean {
    return this.blockedUsers().some(u => u.name === username);
  }

  /**
   * Devuelve snapshot de usuarios bloqueados
   */
  getBlockedUsersSnapshot(): BlockedUser[] {
    return this.blockedUsers();
  }
}
