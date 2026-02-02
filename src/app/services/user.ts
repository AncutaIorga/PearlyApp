import { Injectable, signal } from '@angular/core';

interface UserData {
  name: string;
  email: string;
  bio: string;
  avatar: string;
  achievements: number;
  followers: number;
  following: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userData = signal<UserData>(this.getInitialUserData());

  constructor() {
    this.loadUserData();
  }

  private getInitialUserData(): UserData {
    // Intentar obtener datos del localStorage
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      return JSON.parse(savedUser);
    }

    // Intentar obtener nombre del usuario autenticado
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userName) {
      return {
        name: userName,
        email: userEmail || '',
        bio: '🌱 Amante de la vida saludable | 🏃‍♀️ Runner | 💪 Fitness enthusiast',
        avatar: '',
        achievements: 12,
        followers: 234,
        following: 189
      };
    }

    // Datos por defecto
    return {
      name: 'Usuario',
      email: '',
      bio: '🌱 Amante de la vida saludable | 🏃‍♀️ Runner | 💪 Fitness enthusiast',
      avatar: '',
      achievements: 12,
      followers: 234,
      following: 189
    };
  }

  private loadUserData() {
    // Verificar si hay un usuario autenticado en localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    if (isLoggedIn && userName) {
      const currentData = this.userData();
      // Solo actualizar si el nombre es diferente
      if (currentData.name !== userName) {
        const updatedData = {
          ...currentData,
          name: userName,
          email: userEmail || currentData.email
        };
        this.userData.set(updatedData);
        this.saveUser();
      }
    }
  }

  getUser() {
    return this.userData();
  }

  updateUser(user: Partial<UserData>) {
    const currentData = this.userData();
    const updatedData = { ...currentData, ...user };
    this.userData.set(updatedData);
    this.saveUser();
  }

  private saveUser() {
    localStorage.setItem('userData', JSON.stringify(this.userData()));
  }

  // Sincronizar con datos de autenticación
  syncWithAuthData() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    if (isLoggedIn && userName) {
      const currentData = this.userData();
      // Actualizar con datos de autenticación
      if (currentData.name !== userName) {
        const updatedData = {
          ...currentData,
          name: userName,
          email: userEmail || currentData.email
        };
        this.userData.set(updatedData);
        this.saveUser();
      }
    }
  }

  getFollowersCount(): number {
    return this.userData().followers;
  }

  getFollowingCount(): number {
    return this.userData().following;
  }

  // Métodos para actualizar estadísticas
  addFollower() {
    const currentUser = this.userData();
    currentUser.followers++;
    this.updateUser(currentUser);
  }

  removeFollower() {
    const currentUser = this.userData();
    if (currentUser.followers > 0) {
      currentUser.followers--;
      this.updateUser(currentUser);
    }
  }

  followUser() {
    const currentUser = this.userData();
    currentUser.following++;
    this.updateUser(currentUser);
  }

  unfollowUser() {
    const currentUser = this.userData();
    if (currentUser.following > 0) {
      currentUser.following--;
      this.updateUser(currentUser);
    }
  }

  addAchievement() {
    const currentUser = this.userData();
    currentUser.achievements++;
    this.updateUser(currentUser);
  }
}