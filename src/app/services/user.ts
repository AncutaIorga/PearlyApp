import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, Usuario } from './authBACK';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`; 

  private userSignal = signal<Usuario>({ nombre: '', email: '' });

  constructor() {
    this.syncWithAuthData();
  }

  syncWithAuthData() {
    const current = this.authService.user();
    if (current) { 
        if (!current.nombre && current.name) current.nombre = current.name;
        this.userSignal.set(current); 
    }
  }

  getUser() {
    this.syncWithAuthData();
    return this.userSignal();
  }

  updateUser(data: Partial<Usuario>): Observable<Usuario> {
    const currentUser = this.getUser();
    
    // ✅ Usamos idUsuario o id según lo que tengamos
    const userId = currentUser.idUsuario || currentUser.idUsuario;

    if (!userId) {
      return throwError(() => new Error('Falta ID de usuario'));
    }

    if (data.name && !data.nombre) data.nombre = data.name;

    // ✅ URL correcta con idUsuario
    return this.http.put<Usuario>(`${this.apiUrl}/${userId}`, data).pipe(
      tap(updatedUser => {
        const merged = { ...currentUser, ...updatedUser };
        this.authService.updateRegisteredUser(currentUser.nombre, merged);
        this.syncWithAuthData();
      }),
      catchError(err => throwError(() => err))
    );
  }

  updatePrivacy(isPrivate: boolean): Observable<any> {
    return this.updateUser({ isPrivate });
  }
}