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
  private userData = signal<UserData>({
    name: 'Neli',
    email: 'neli@gmail.com',
    bio: '🌱 Amante de la vida saludable | 🏃‍♀️ Runner | 💪 Fitness enthusiast',
    avatar: '', // URL de imagen o vacío para usar inicial
    achievements: 12,
    followers: 234,
    following: 189
  });

  constructor() {
    // Cargar datos guardados si existen
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      this.userData.set(JSON.parse(savedUser));
    }
  }

  getUser() {
    return this.userData();
  }

  updateUser(user: UserData) {
    this.userData.set(user);
    // Guardar en localStorage
    localStorage.setItem('userData', JSON.stringify(user));
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