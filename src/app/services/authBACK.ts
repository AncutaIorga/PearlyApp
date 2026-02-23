/* import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from './notification';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  private authUrl = `${environment.apiUrl}/auth`; // Nueva ruta para el login
  
  private isAuthenticated = false;
  user = signal<{ name: string; email: string; id?: number } | null>(null);
  
  private notificationService = inject(NotificationService);
  private http = inject(HttpClient);
  private router = inject(Router);

  // 🔥 EL SECRETO DE LAS COOKIES: Esto obliga a Angular a enviar y recibir la cookie de sesión del Backend
  private httpOptions = {
    withCredentials: true 
  };

  constructor() {
    this.isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
    
    if (this.isAuthenticated) {
      const userName = localStorage.getItem('userName') || '';
      const userEmail = localStorage.getItem('userEmail') || '';
      const userId = localStorage.getItem('userId');
      this.user.set({ 
        name: userName, 
        email: userEmail,
        id: userId ? parseInt(userId, 10) : undefined 
      });
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber && hasSymbol && password.length >= 8;
  }

  private getPasswordError(password: string): string {
    const errors: string[] = [];
    if (password.length < 8) errors.push('mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('una mayúscula');
    if (!/[a-z]/.test(password)) errors.push('una minúscula');
    if (!/[0-9]/.test(password)) errors.push('un número');
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/.test(password)) errors.push('un símbolo');
    return `La contraseña debe contener: ${errors.join(', ')}`;
  }

  async login(email: string, password: string): Promise<boolean> {
    if (!email || !password) {
      this.notificationService.warning('Por favor completa todos los campos');
      return false;
    }

    if (!this.isValidEmail(email)) {
      this.notificationService.warning('El formato del correo es incorrecto.');
      return false;
    }

    try {
      // 1. Hacemos la petición real al Backend para hacer login y que nos guarde la Cookie.
      // Como el endpoint devuelve un texto ("Login exitoso") y no un JSON, usamos responseType: 'text'
      await firstValueFrom(
        this.http.post(`${this.authUrl}/login`, { email, password }, { 
          withCredentials: true, 
          responseType: 'text' 
        })
      );

      // 2. Como el login fue exitoso, buscamos los datos del usuario para guardarnos su ID
      // (En el futuro, pide a Backend que el endpoint de login devuelva directamente el JSON del usuario)
      const usuarios = await firstValueFrom(this.http.get<Usuario[]>(this.apiUrl, this.httpOptions));
      const user = usuarios.find(u => u.email === email);

      if (user) {
        this.isAuthenticated = true;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', user.nombre); 
        localStorage.setItem('userEmail', user.email);
        if (user.idUsuario) localStorage.setItem('userId', user.idUsuario.toString());
        
        this.user.set({ name: user.nombre, email: user.email, id: user.idUsuario });
        this.notificationService.showWelcome(user.nombre);
        this.router.navigate(['/feed']);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error al conectar con el servidor:', error);
      if (error.status === 401 || error.status === 403) {
        this.notificationService.showLoginError(); // Credenciales incorrectas
      } else {
        this.notificationService.error('Error de conexión con el servidor.');
      }
      return false;
    }
  }

  async register(name: string, email: string, password: string): Promise<boolean> {
    if (!name || !email || !password) {
      this.notificationService.warning('Por favor completa todos los campos');
      return false;
    }

    if (name.trim().length < 2) {
      this.notificationService.warning('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (!this.isValidPassword(password)) {
      this.notificationService.warning(this.getPasswordError(password));
      return false;
    }

    try {
      const newUserData: Usuario = {
        nombre: name.trim(),
        email: email.toLowerCase().trim(),
        password: password
      };

      // 1. Enviamos el POST al servidor para crear el usuario
      await firstValueFrom(this.http.post<Usuario>(this.apiUrl, newUserData, this.httpOptions));

      // 2. Si se crea correctamente, hacemos login automático para obtener la Cookie de sesión
      this.notificationService.success('¡Registro completado! Iniciando sesión...');
      return await this.login(email, password);

    } catch (error: any) {
      console.error('Error en el registro:', error);
      if (error.status === 409 || error.status === 400) {
        this.notificationService.warning('Este email ya está registrado o los datos son inválidos.');
      } else {
        this.notificationService.error('Error al intentar registrar el usuario.');
      }
      return false;
    }
  }

  logout() {
    // Si el backend tiene un endpoint de logout, lo ideal sería llamarlo aquí
    // this.http.post(`${this.authUrl}/logout`, {}, this.httpOptions).subscribe();

    this.isAuthenticated = false;
    this.user.set(null);
    
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId'); // Borramos el ID al salir
    
    this.notificationService.showLogout();
    setTimeout(() => {
      window.location.href = '/login'; 
    }, 500);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getCurrentUserName(): string {
    return localStorage.getItem('userName') || 'Usuario';
  }

  getCurrentUserEmail(): string {
    return localStorage.getItem('userEmail') || '';
  }
} */