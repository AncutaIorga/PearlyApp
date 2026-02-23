import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification';

export interface User {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  isPrivate?: boolean; // ✅ Añadido para evitar errores en Ajustes
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticated = false;
  user = signal<User | null>(null);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private registeredUsers: User[] = [];

  constructor() {
    this.loadUsersFromStorage();
    this.checkSession();
  }

  private checkSession() {
    this.isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
    if (this.isAuthenticated) {
      this.user.set({
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        avatar: localStorage.getItem('userAvatar') || '',
        bio: localStorage.getItem('userBio') || '',
        isPrivate: localStorage.getItem('userPrivate') === 'true',
        password: ''
      });
    }
  }

  private loadUsersFromStorage() {
    const saved = localStorage.getItem('all_registered_users');
    this.registeredUsers = saved ? JSON.parse(saved) : [
      { name: 'Neli', email: 'neli@gmail.com', password: 'Neli404_', avatar: '', bio: 'Creadora de PearlyApp 🫧' }
    ];
  }

  private saveUsersToStorage() {
    localStorage.setItem('all_registered_users', JSON.stringify(this.registeredUsers));
  }

  isUserTaken(name: string): boolean {
    return this.registeredUsers.some(u => u.name.toLowerCase() === name.toLowerCase().trim());
  }

  updateRegisteredUser(oldName: string, newUserData: Partial<User>) {
    const index = this.registeredUsers.findIndex(u => u.name === oldName);
    if (index !== -1) {
      this.registeredUsers[index] = { ...this.registeredUsers[index], ...newUserData };
      this.saveUsersToStorage();
      
      if (oldName === localStorage.getItem('userName')) {
        const u = this.registeredUsers[index];
        this.user.set(u);
        localStorage.setItem('userName', u.name);
        localStorage.setItem('userAvatar', u.avatar || '');
        localStorage.setItem('userBio', u.bio || '');
        localStorage.setItem('userPrivate', String(u.isPrivate || false));
      }
    }
  }

  login(email: string, password: string): boolean {
    const user = this.registeredUsers.find(u => u.email === email && u.password === password);
    if (user) {
      this.isAuthenticated = true;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userAvatar', user.avatar || '');
      localStorage.setItem('userBio', user.bio || '');
      localStorage.setItem('userPrivate', String(user.isPrivate || false));
      this.user.set(user);
      this.notificationService.showWelcome(user.name);
      this.router.navigate(['/feed']);
      return true;
    }
    this.notificationService.showLoginError();
    return false;
  }

  register(name: string, email: string, password: string): boolean {
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('userBio');
    
    if (this.isUserTaken(name)) {
      this.notificationService.warning('Nombre ya en uso');
      return false;
    }

    const newUser: User = { 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password, 
      avatar: '', 
      bio: `¡Hola! Soy ${name} y me acabo de unir a Pearly.`,
      isPrivate: false 
    };

    this.registeredUsers.push(newUser);
    this.saveUsersToStorage();
    localStorage.setItem('isNewUser', 'true');
    return this.login(newUser.email, newUser.password);
  }

  logout() {
    this.isAuthenticated = false;
    this.user.set(null);
    const users = localStorage.getItem('all_registered_users');
    const posts = localStorage.getItem('posts');
    localStorage.clear(); 
    if(users) localStorage.setItem('all_registered_users', users);
    if(posts) localStorage.setItem('posts', posts);

    this.notificationService.showLogout();
    setTimeout(() => window.location.href = '/login', 500);
  }

  getRegisteredUsers(): User[] { return this.registeredUsers; }
  isLoggedIn(): boolean { return this.isAuthenticated; }
}