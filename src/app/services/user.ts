import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {
  getUser() {
    return {
      name: 'Healthy User',
      bio: 'Viviendo saludable 💚',
      achievements: 5
    };
  }
}
