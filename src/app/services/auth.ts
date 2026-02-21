import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification';

export interface User { // 👈 Cambiado a export para que el Navbar pueda leerlo
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;
  user = signal<{ name: string; email: string } | null>(null);
  private notificationService = inject(NotificationService);
  
  // 🚨 ARREGLO: Inicializamos vacío y luego cargamos de localStorage
  private registeredUsers: User[] = [];

  constructor(private router: Router) {
    // 1. Cargamos los usuarios guardados del localStorage
    this.loadUsersFromStorage();

    // 2. Comprobamos si hay alguien logueado
    this.isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
    
    if (this.isAuthenticated) {
      const userName = localStorage.getItem('userName') || '';
      const userEmail = localStorage.getItem('userEmail') || '';
      this.user.set({ name: userName, email: userEmail });
    }
  }

  // --- NUEVA FUNCIÓN: CARGAR USUARIOS ---
  private loadUsersFromStorage() {
    const savedUsers = localStorage.getItem('all_registered_users');
    if (savedUsers) {
      this.registeredUsers = JSON.parse(savedUsers);
    } 
    
    // Si está vacío (primera vez que entra), añadimos a Neli por defecto
    if (this.registeredUsers.length === 0) {
      this.registeredUsers = [
        { name: 'Neli', email: 'neli@gmail.com', password: 'Neli404_' }
      ];
      this.saveUsersToStorage();
    }
  }

  // --- NUEVA FUNCIÓN: GUARDAR USUARIOS ---
  private saveUsersToStorage() {
    localStorage.setItem('all_registered_users', JSON.stringify(this.registeredUsers));
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
    
    if (password.length < 8) {
      errors.push('mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('una minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('un número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/.test(password)) {
      errors.push('un símbolo (!@#$%^&*_-...)');
    }
    
    return `La contraseña debe contener: ${errors.join(', ')}`;
  }

  login(email: string, password: string): boolean {
    if (!email || !password) {
      this.notificationService.warning('Por favor completa todos los campos');
      return false;
    }

    if (!this.isValidEmail(email)) {
      this.notificationService.warning('El formato del correo es incorrecto.');
      return false;
    }

    const user = this.registeredUsers.find(
      u => u.email === email && u.password === password
    );

    if (user) {
      this.isAuthenticated = true;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      this.user.set({ name: user.name, email: user.email });
      this.notificationService.showWelcome(user.name);
      this.router.navigate(['/feed']);
      return true;
    } else {
      this.notificationService.showLoginError();
      return false;
    }
  }

  register(name: string, email: string, password: string): boolean {
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

    const emailExists = this.registeredUsers.some(u => u.email === email);
    if (emailExists) {
      this.notificationService.warning('Este email ya está registrado', {
        action: {
          label: '¿Olvidaste tu contraseña?',
          handler: () => this.router.navigate(['/recover-password'])
        }
      });
      return false;
    }

    const newUser: User = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password
    };

    // 🚨 ARREGLO: Añadimos y GUARDAMOS permanentemente
    this.registeredUsers.push(newUser);
    this.saveUsersToStorage();

    this.isAuthenticated = true;
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', newUser.name);
    localStorage.setItem('userEmail', newUser.email);
    this.user.set({ name: newUser.name, email: newUser.email });
    
    this.notificationService.showRegistrationSuccess(newUser.name);
    this.router.navigate(['/feed']);
    return true;
  }

  logout() {
    this.isAuthenticated = false;
    this.user.set(null);
    
    // 🚨 ARREGLO MUY IMPORTANTE 🚨
    // No podemos hacer localStorage.clear() porque borraría la base de datos de usuarios registrados (all_registered_users).
    // En su lugar, borramos solo los datos de sesión activa:
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    // Si tenías progreso de retos, puedes hacer removeItem de esas keys también.
    
    this.notificationService.showLogout();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getRegisteredUsers(): User[] {
    // Si por lo que sea el array en memoria está vacío, lo intenta cargar de localStorage
    if (this.registeredUsers.length === 0) {
       this.loadUsersFromStorage();
    }
    return this.registeredUsers;
  }

  getCurrentUserName(): string {
    return localStorage.getItem('userName') || 'Usuario';
  }

  getCurrentUserEmail(): string {
    return localStorage.getItem('userEmail') || '';
  }
}