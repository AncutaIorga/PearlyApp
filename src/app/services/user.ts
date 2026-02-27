import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, Usuario } from './authBACK';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
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

  getUser(): Usuario {
    this.syncWithAuthData();
    return this.userSignal();
  }

  updateUser(data: Partial<Usuario>): Observable<Usuario> {
    const currentUser = this.getUser();
    
    const userId = currentUser.idUsuario;

    if (!userId) {
      console.error('No se encontró el ID del usuario actual.');
      return throwError(() => new Error('Falta ID de usuario'));
    }

    if (data.name && !data.nombre) data.nombre = data.name;

    const payload: Usuario = {
      ...currentUser,
      ...data
    };

    console.log('Enviando actualización de perfil al servidor:', payload);

    return this.http.put(`${this.apiUrl}/${userId}`, payload, { responseType: 'text' }).pipe(
      map(() => payload),
      tap((finalUser) => {
        console.log('Perfil actualizado localmente tras respuesta OK del servidor');
        this.authService.updateRegisteredUser(currentUser.nombre, finalUser);
        this.syncWithAuthData();
      }),
      catchError(err => {
        console.error('Error al actualizar perfil en el backend:', err);
        return throwError(() => err);
      })
    );
  }

  updatePrivacy(isPrivate: boolean): Observable<any> {
    return this.updateUser({ isPrivate });
  }

  // MÉTODO AÑADIDO PARA LA BÚSQUEDA
  buscarUsuariosPorNombre(query: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, {
      params: { nombre: query }
    }).pipe(
      catchError(err => {
        console.error('Error buscando usuarios:', err);
        return throwError(() => err);
      })
    );
  }
}