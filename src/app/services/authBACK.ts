import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from './notification';
import { environment } from '../../environments/environment';

export interface Usuario {
  idUsuario?: number;
  nombre: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  isPrivate?: boolean;
  name?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  private authUrl = `${environment.apiUrl}/auth`;
  
  private isAuthenticated = false;
  user = signal<Usuario | null>(null);
  
  private notificationService = inject(NotificationService);
  private http = inject(HttpClient);
  private router = inject(Router);

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true 
  };

  constructor() {
    this.checkSession();
  }

  private checkSession() {
    this.isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
    if (this.isAuthenticated) {
      const storedName = localStorage.getItem('userName') || '';
      const storedId = localStorage.getItem('idUsuario') || localStorage.getItem('userId');

      this.user.set({
        idUsuario: storedId ? parseInt(storedId, 10) : undefined,
        nombre: storedName,
        name: storedName,
        email: localStorage.getItem('userEmail') || '',
        avatar: localStorage.getItem('userAvatar') || '',
        bio: localStorage.getItem('userBio') || '',
        isPrivate: localStorage.getItem('userPrivate') === 'true'
      });
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    if (!email || !password) return false;

    try {
      await firstValueFrom(
        this.http.post(`${this.authUrl}/login`, { email, password }, { 
          ...this.httpOptions, 
          responseType: 'text' 
        })
      );

      try {
        const usuarios = await firstValueFrom(this.http.get<any[]>(this.apiUrl, this.httpOptions));
        const userFound = usuarios.find(u => u.email === email);

        if (userFound) {
          // ✅ MAPEADO SEGÚN TU CONSOLA: El back envía 'id', nosotros guardamos 'idUsuario'
          const realId = userFound.id || userFound.idUsuario || userFound.userId;

          const usuarioMapeado: Usuario = {
            idUsuario: realId, 
            nombre: userFound.nombre || userFound.name,
            name: userFound.nombre || userFound.name,
            email: userFound.email,
            avatar: userFound.avatar,
            bio: userFound.bio,
            isPrivate: userFound.isPrivate
          };
          
          this.saveSession(usuarioMapeado);
          this.notificationService.showWelcome(usuarioMapeado.nombre);
          this.router.navigate(['/feed']);
          return true;
        }
      } catch (e) {
        console.warn('Login ok, pero falló carga de datos usuario', e);
        const tempName = email.split('@')[0];
        this.saveSession({ nombre: tempName, name: tempName, email });
        this.router.navigate(['/feed']);
        return true;
      }
      return false;

    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        this.notificationService.showLoginError();
      } else {
        this.notificationService.error('Error de conexión.');
      }
      return false;
    }
  }

  async register(nombre: string, email: string, password: string): Promise<boolean> {
    try {
      const newUser = { nombre, email, password };
      await firstValueFrom(this.http.post(this.apiUrl, newUser, this.httpOptions));
      this.notificationService.success('¡Registro completado!');
      return await this.login(email, password);
    } catch (error: any) {
      if (error.status === 409) this.notificationService.warning('Email ya registrado.');
      else this.notificationService.error('Error en registro.');
      return false;
    }
  }

  logout() {
    this.isAuthenticated = false;
    this.user.set(null);
    this.clearSessionData();
    this.router.navigate(['/login']);
  }

  private saveSession(user: Usuario) {
    this.isAuthenticated = true;
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', user.nombre);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userAvatar', user.avatar || '');
    localStorage.setItem('userBio', user.bio || '');
    localStorage.setItem('userPrivate', String(user.isPrivate || false));
    
    if (user.idUsuario) {
      localStorage.setItem('idUsuario', user.idUsuario.toString());
      localStorage.setItem('userId', user.idUsuario.toString());
    }
    
    this.user.set(user);
  }

  private clearSessionData() {
    localStorage.clear();
  }

  isLoggedIn(): boolean { return this.isAuthenticated; }
  getCurrentUserName(): string { return localStorage.getItem('userName') || ''; }
  getCurrentUserEmail(): string { return localStorage.getItem('userEmail') || ''; }
  getRegisteredUsers(): Usuario[] { return []; }
  isUserTaken(n: string): boolean { return false; }
  updateRegisteredUser(o: string, n: Partial<Usuario>) { 
    if(this.user()) this.saveSession({ ...this.user()!, ...n }); 
  }
}