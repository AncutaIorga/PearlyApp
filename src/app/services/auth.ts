import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification';

interface User {
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
  
  private registeredUsers: User[] = [
    {
      name: 'Neli',
      email: 'neli@gmail.com',
      password: 'Neli404_'
    }
  ];

  constructor(private router: Router) {
    this.isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
    
    if (this.isAuthenticated) {
      const userName = localStorage.getItem('userName') || '';
      const userEmail = localStorage.getItem('userEmail') || '';
      this.user.set({ name: userName, email: userEmail });
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
      this.notificationService.warning('Por favor ingresa un email válido');
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
      this.notificationService.warning('Por favor ingresa un email válido');
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

    this.registeredUsers.push(newUser);
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
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    this.notificationService.showLogout();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getRegisteredUsers(): User[] {
    return this.registeredUsers;
  }

  getCurrentUserName(): string {
    return localStorage.getItem('userName') || 'Usuario';
  }

  getCurrentUserEmail(): string {
    return localStorage.getItem('userEmail') || '';
  }
}