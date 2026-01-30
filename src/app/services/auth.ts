import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;
  user = signal<{ name: string; email: string } | null>(null);

  constructor(private router: Router) {
    // Verifica si ya hay sesión guardada
    this.isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
    
    if (this.isAuthenticated) {
      const userName = localStorage.getItem('userName') || 'Neli';
      const userEmail = localStorage.getItem('userEmail') || 'Neli';
      this.user.set({ name: userName, email: userEmail });
    }
  }

  login(email: string, password: string) {
    // Usuario y contraseña predefinidos
    if (email === 'Neli' && password === '123456') {
      this.isAuthenticated = true;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', 'Neli');
      localStorage.setItem('userEmail', email);
      this.user.set({ name: 'Neli', email: email });
      this.router.navigate(['/feed']);
      return true;
    } else {
      alert('Usuario o contraseña incorrectos');
      return false;
    }
  }

  register(name: string, email: string, password: string) {
    // Por ahora, solo aceptamos el registro de "Neli"
    if (name === 'Neli' && password === '123456') {
      this.isAuthenticated = true;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', name);
      localStorage.setItem('userEmail', email);
      this.user.set({ name: name, email: email });
      this.router.navigate(['/feed']);
      return true;
    } else {
      alert('No se pudo crear el usuario');
      return false;
    }
  }

  logout() {
    this.isAuthenticated = false;
    this.user.set(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }
}