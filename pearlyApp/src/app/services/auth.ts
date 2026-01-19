import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<any>(null);

  login(email: string, password: string) {
    this.user.set({ id: 1, name: 'Healthy User', email });
  }

  register(name: string, email: string, password: string) {
    this.user.set({ id: 1, name, email });
  }

  logout() {
    this.user.set(null);
  }
}
