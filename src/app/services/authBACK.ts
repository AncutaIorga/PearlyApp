import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from './notification';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  private isAuthenticated = false;
  user = signal<{ name: string; email: string; id?: number } | null>(null);
  private notificationService = inject(NotificationService);
  private http = inject(HttpClient);
  private router = inject(Router);

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

  // Ahora login devuelve una Promesa porque espera al servidor
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
      // Pedimos TODOS los usuarios al servidor.
      // (Lo ideal sería que el backend tuviera un endpoint /login que hiciera la comprobación)
      const usuarios = await firstValueFrom(this.http.get<Usuario[]>(this.apiUrl));
      
      const user = usuarios.find(
        u => u.email === email && u.password === password
      );

      if (user) {
        this.isAuthenticated = true;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', user.nombre); // Fíjate que ahora es user.nombre
        localStorage.setItem('userEmail', user.email);
        if (user.idUsuario) localStorage.setItem('userId', user.idUsuario.toString());
        
        this.user.set({ name: user.nombre, email: user.email, id: user.idUsuario });
        this.notificationService.showWelcome(user.nombre);
        this.router.navigate(['/feed']);
        return true;
      } else {
        this.notificationService.showLoginError();
        return false;
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      this.notificationService.error('Error de conexión con el servidor.');
      return false;
    }
  }

  // Ahora register devuelve una Promesa porque envía datos al servidor
  async register(name: string, email: string, password: string): Promise<boolean> {
    if (!name || !email || !password) {
      this.notificationService.warning('Por favor completa todos los campos');
      return false;
    }

    if (name.trim().length < 2) {
      this.notificationService.warning('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (!this.isValidEmail(email)) {
      this.notificationService.warning('El formato del correo es incorrecto.');
      return false;
    }

    if (!this.isValidPassword(password)) {
      this.notificationService.warning(this.getPasswordError(password));
      return false;
    }

    try {
      // Primero, comprobamos si el email ya existe pidiendo los usuarios
      const usuarios = await firstValueFrom(this.http.get<Usuario[]>(this.apiUrl));
      const emailExists = usuarios.some(u => u.email === email.toLowerCase().trim());
      
      if (emailExists) {
        this.notificationService.warning('Este email ya está registrado');
        return false;
      }

      // Preparamos el objeto con el formato del backend (Usuario)
      const newUserData: Usuario = {
        nombre: name.trim(),
        email: email.toLowerCase().trim(),
        password: password
      };

      // Enviamos el POST al servidor
      const createdUser = await firstValueFrom(this.http.post<Usuario>(this.apiUrl, newUserData));

      this.isAuthenticated = true;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', createdUser.nombre);
      localStorage.setItem('userEmail', createdUser.email);
      if (createdUser.idUsuario) localStorage.setItem('userId', createdUser.idUsuario.toString());
      
      this.user.set({ name: createdUser.nombre, email: createdUser.email, id: createdUser.idUsuario });
      
      this.notificationService.showRegistrationSuccess(createdUser.nombre);
      this.router.navigate(['/feed']);
      return true;

    } catch (error) {
      console.error('Error en el registro:', error);
      this.notificationService.error('Error al intentar registrar el usuario.');
      return false;
    }
  }

  logout() {
    this.isAuthenticated = false;
    this.user.set(null);
    
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    
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
}