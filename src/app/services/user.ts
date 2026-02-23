import { Injectable, signal, inject } from '@angular/core';
import { AuthService, User } from './auth';
import { of, Observable } from 'rxjs'; // ✅ Necesario para el .subscribe()

@Injectable({ providedIn: 'root' })
export class UserService {
  private authService = inject(AuthService);
  private userSignal = signal<User>({ name: '', email: '', avatar: '', password: '', bio: '', isPrivate: false });

  syncWithAuthData() {
    const current = this.authService.user();
    if (current) {
      this.userSignal.set(current);
    }
  }

  getUser() {
    this.syncWithAuthData();
    return this.userSignal();
  }

  updateUser(data: Partial<User>) {
    const oldName = localStorage.getItem('userName') || '';
    this.authService.updateRegisteredUser(oldName, data);
    this.syncWithAuthData();
  }

  // ✅ Corregido para que Ajustes.ts pueda suscribirse
  updatePrivacy(isPrivate: boolean): Observable<any> {
    this.updateUser({ isPrivate });
    return of({ success: true });
  }
}