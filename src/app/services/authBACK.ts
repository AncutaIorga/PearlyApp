/*import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, delay } from 'rxjs/operators';

// Tipado de respuesta backend
interface LoginResponse {
  token: string;
  user: {
    name: string;
    email: string;
  };
}

// Usuario temporal para mock
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

  // Solo para fallback local
  private registeredUsers: User[] = [
    { name: 'Neli', email: 'neli@gmail.com', password: 'Neli404_' }
  ];

  // --------------------------------------------
  // Cambia a true si quieres usar backend real
  // --------------------------------------------
  
  private useBackend = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
    if (this.isAuthenticated) {
      const name = localStorage.getItem('userName') || '';
      const email = localStorage.getItem('userEmail') || '';
      this.user.set({ name, email });
    }
  }

  // ===============================
  // LOGIN
  // ===============================
  login(email: string, password: string): Observable<LoginResponse> {
    if (this.useBackend) {
      // Backend real
      return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
        tap(res => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userName', res.user.name);
          localStorage.setItem('userEmail', res.user.email);
          this.user.set(res.user);
          this.isAuthenticated = true;
        })
      );
    } else {
      // Fallback mock local
      const user = this.registeredUsers.find(u => u.email === email && u.password === password);
      if (user) {
        const response: LoginResponse = { token: 'fake-jwt-token', user: { name: user.name, email: user.email } };
        return of(response).pipe(
          delay(500), // simula petición HTTP
          tap(res => {
            localStorage.setItem('token', res.token);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', res.user.name);
            localStorage.setItem('userEmail', res.user.email);
            this.user.set(res.user);
            this.isAuthenticated = true;
          })
        );
      } else {
        return throwError(() => new Error('Credenciales incorrectas'));
      }
    }
  }

  // ===============================
  // REGISTER
  // ===============================
  register(name: string, email: string, password: string): Observable<LoginResponse | any> {
    if (this.useBackend) {
      return this.http.post('/api/auth/register', { name, email, password });
    } else {
      // Mock local
      const exists = this.registeredUsers.some(u => u.email === email);
      if (exists) {
        return throwError(() => new Error('Email ya registrado'));
      }
      const newUser: User = { name, email, password };
      this.registeredUsers.push(newUser);

      // Auto-login
      const response: LoginResponse = { token: 'fake-jwt-token', user: { name, email } };
      return of(response).pipe(
        delay(500),
        tap(res => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userName', res.user.name);
          localStorage.setItem('userEmail', res.user.email);
          this.user.set(res.user);
          this.isAuthenticated = true;
        })
      );
    }
  }

  // ===============================
  // LOGOUT
  // ===============================
  logout() {
    this.isAuthenticated = false;
    this.user.set(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }
}
*/