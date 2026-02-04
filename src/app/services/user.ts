import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';

export interface UserData {
  id?: number;
  name: string;
  email: string;
  bio: string;
  avatar?: string;
  achievements: number;
  followers: number;
  following: number;
  isPrivate?: boolean;
  onlyFollowersMessages?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = '/api/users';
  
  // Estado reactivo
  private userData = signal<UserData | null>(null);
  
  // Computed values
  user = computed(() => this.userData());
  isPrivate = computed(() => this.userData()?.isPrivate ?? false);
  canReceiveMessages = computed(() => !this.userData()?.onlyFollowersMessages);

  constructor(private http: HttpClient) {
    this.loadFromCache();
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS PRINCIPALES
  // ═══════════════════════════════════════════════════════════

  /**
   * Obtiene el usuario actual
   */
  getUser(): UserData {
    const user = this.userData();
    if (!user) {
      return this.getFallbackUser();
    }
    return user;
  }

  /**
   * Sincroniza datos del usuario con la información de autenticación
   */
  syncWithAuthData(): void {
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userName && userEmail) {
      const cachedUser = this.loadFromCache();
      
      if (cachedUser) {
        // Si hay cache, actualizar solo name y email
        this.userData.update(current => 
          current ? { ...current, name: userName, email: userEmail } : cachedUser
        );
      } else {
        // Crear usuario nuevo desde auth data
        const newUser: UserData = {
          id: 0,
          name: userName,
          email: userEmail,
          bio: '🌱 Amante de la vida saludable | 🏃‍♀️ Runner | 💪 Fitness enthusiast',
          avatar: '',
          achievements: 12,
          followers: 234,
          following: 189,
          isPrivate: false,
          onlyFollowersMessages: false
        };
        this.userData.set(newUser);
        this.saveToCache(newUser);
      }
    }
  }

  /**
   * Actualiza el usuario en memoria
   */
  updateUser(updates: Partial<UserData>): void {
    this.userData.update(current => {
      if (!current) return null;
      
      const updated = { ...current, ...updates };
      this.saveToCache(updated);
      
      // Sincronizar con localStorage de autenticación
      if (updates.name) {
        localStorage.setItem('userName', updates.name);
      }
      if (updates.email) {
        localStorage.setItem('userEmail', updates.email);
      }
      
      return updated;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════

  getFollowersCount(): number {
    return this.userData()?.followers ?? 0;
  }

  getFollowingCount(): number {
    return this.userData()?.following ?? 0;
  }

  addFollower(): void {
    this.userData.update(user =>
      user ? { ...user, followers: user.followers + 1 } : user
    );
    this.saveToCache(this.userData());
  }

  removeFollower(): void {
    this.userData.update(user =>
      user ? { ...user, followers: Math.max(0, user.followers - 1) } : user
    );
    this.saveToCache(this.userData());
  }

  addAchievement(): void {
    this.userData.update(user =>
      user ? { ...user, achievements: user.achievements + 1 } : user
    );
    this.saveToCache(this.userData());
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS CON API (Para cuando tengas backend)
  // ═══════════════════════════════════════════════════════════

  loadMe(): Observable<UserData> {
    return this.http.get<UserData>(`${this.API_URL}/me`).pipe(
      tap(user => {
        this.userData.set(user);
        this.saveToCache(user);
      }),
      catchError(error => {
        console.error('Error loading user:', error);
        return of(this.getFallbackUser());
      })
    );
  }

  updateProfile(data: Partial<UserData>): Observable<UserData> {
    return this.http.patch<UserData>(`${this.API_URL}/me`, data).pipe(
      tap(updatedUser => {
        this.userData.set(updatedUser);
        this.saveToCache(updatedUser);
      })
    );
  }

  updatePrivacy(isPrivate: boolean): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/me/privacy`, { isPrivate }).pipe(
      tap(() => {
        this.userData.update(user => 
          user ? { ...user, isPrivate } : user
        );
        this.saveToCache(this.userData());
      })
    );
  }

  updateMessageSettings(onlyFollowers: boolean): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/me/messages`, {
      onlyFollowersMessages: onlyFollowers
    }).pipe(
      tap(() => {
        this.userData.update(user =>
          user ? { ...user, onlyFollowersMessages: onlyFollowers } : user
        );
        this.saveToCache(this.userData());
      })
    );
  }

  canUserSendMessage(userId: number): Observable<boolean> {
    return this.http.get<{ canSend: boolean }>(
      `${this.API_URL}/me/messages/can-send/${userId}`
    ).pipe(
      map(result => result.canSend),
      catchError(() => of(false))
    );
  }

  followUser(userId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${userId}/follow`, {}).pipe(
      tap(() => {
        this.userData.update(user =>
          user ? { ...user, following: user.following + 1 } : user
        );
        this.saveToCache(this.userData());
      })
    );
  }

  unfollowUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${userId}/follow`).pipe(
      tap(() => {
        this.userData.update(user =>
          user ? { ...user, following: Math.max(0, user.following - 1) } : user
        );
        this.saveToCache(this.userData());
      })
    );
  }

  // ═══════════════════════════════════════════════════════════
  // CACHE LOCAL
  // ═══════════════════════════════════════════════════════════

  private saveToCache(user: UserData | null): void {
    if (user) {
      localStorage.setItem('user-cache', JSON.stringify(user));
    }
  }

  private loadFromCache(): UserData | null {
    const cached = localStorage.getItem('user-cache');
    if (cached) {
      try {
        const parsedUser = JSON.parse(cached);
        this.userData.set(parsedUser);
        return parsedUser;
      } catch (e) {
        console.warn('Invalid user cache');
        localStorage.removeItem('user-cache');
      }
    }
    return null;
  }

  private getFallbackUser(): UserData {
    const userName = localStorage.getItem('userName') || 'Usuario';
    const userEmail = localStorage.getItem('userEmail') || '';
    
    return {
      id: 0,
      name: userName,
      email: userEmail,
      bio: '',
      avatar: '',
      achievements: 0,
      followers: 0,
      following: 0,
      isPrivate: false,
      onlyFollowersMessages: false
    };
  }

  /**
   * Limpia el estado (al cerrar sesión)
   */
  clear(): void {
    this.userData.set(null);
    localStorage.removeItem('user-cache');
  }
}