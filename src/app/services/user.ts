import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, tap } from 'rxjs';

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

// Interfaz para resultados de búsqueda
export interface SearchUserResult {
  id: number;
  name: string;
  avatar?: string;
  bio: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Estado reactivo
  private userData = signal<UserData | null>(null);
  
  // Computed values
  user = computed(() => this.userData());
  isPrivate = computed(() => this.userData()?.isPrivate ?? false);

  // BASE DE DATOS MOCK DE USUARIOS PARA BUSCADOR
  private mockUsers: SearchUserResult[] = [
    { id: 101, name: 'Carlos_Fit', bio: 'Gym & Health', avatar: '' },
    { id: 102, name: 'AnaYoga', bio: 'Profesora de Yoga', avatar: '' },
    { id: 103, name: 'RunnerPro', bio: 'Maratonista', avatar: '' },
    { id: 104, name: 'HealthyFood', bio: 'Nutrición consciente', avatar: '' },
    { id: 105, name: 'MindfulSoul', bio: 'Meditación diaria', avatar: '' }
  ];

  constructor(private http: HttpClient) {
    this.loadFromCache();
    this.syncWithAuthData();
  }

  /**
   * Buscar usuarios por nombre (Simulado)
   */
  searchUsers(query: string): Observable<SearchUserResult[]> {
    if (!query.trim()) return of([]);
    
    const lowerQuery = query.toLowerCase();
    const results = this.mockUsers.filter(u => 
      u.name.toLowerCase().includes(lowerQuery)
    );
    
    return of(results).pipe(delay(300));
  }

  // ═══════════════════════════════════════════════════════════
  // GESTIÓN DE USUARIO ACTUAL
  // ═══════════════════════════════════════════════════════════

  getUser(): UserData {
    return this.userData() || this.getFallbackUser();
  }

  syncWithAuthData(): void {
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userName && userEmail) {
      const cachedUser = this.loadFromCache();
      
      if (cachedUser) {
        this.userData.update(current => 
          current ? { ...current, name: userName, email: userEmail } : cachedUser
        );
      } else {
        const newUser: UserData = {
          id: 0,
          name: userName,
          email: userEmail,
          bio: '🌱 Amante de la vida saludable',
          avatar: '',
          achievements: 0,
          followers: 0,
          following: 0,
          isPrivate: false,
          onlyFollowersMessages: false
        };
        this.userData.set(newUser);
        this.saveToCache(newUser);
      }
    }
  }

  updateUser(updates: Partial<UserData>): void {
    this.userData.update(current => {
      if (!current) return null;
      const updated = { ...current, ...updates };
      this.saveToCache(updated);
      
      if (updates.name) localStorage.setItem('userName', updates.name);
      
      return updated;
    });
  }

  // Métodos simulados que guardan en local
  updatePrivacy(isPrivate: boolean): Observable<void> {
    this.updateUser({ isPrivate });
    return of(void 0).pipe(delay(300));
  }

  updateMessageSettings(onlyFollowers: boolean): Observable<void> {
    this.updateUser({ onlyFollowersMessages: onlyFollowers });
    return of(void 0).pipe(delay(300));
  }

  getFollowersCount(): number { return this.userData()?.followers ?? 0; }
  getFollowingCount(): number { return this.userData()?.following ?? 0; }

  // ═══════════════════════════════════════════════════════════
  // UTILIDADES CACHE
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
        const parsed = JSON.parse(cached);
        this.userData.set(parsed);
        return parsed;
      } catch (e) {
        console.warn('Invalid user cache');
      }
    }
    return null;
  }

  private getFallbackUser(): UserData {
    return {
      id: 0,
      name: localStorage.getItem('userName') || 'Usuario',
      email: localStorage.getItem('userEmail') || '',
      bio: '',
      avatar: '',
      achievements: 0,
      followers: 0, following: 0, isPrivate: false
    };
  }

  clear(): void {
    this.userData.set(null);
    localStorage.removeItem('user-cache');
  }
}