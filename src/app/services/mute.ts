import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MuteService {

  private key = 'muted-users';

  getMuted(): string[] {
    return JSON.parse(localStorage.getItem(this.key) || '[]');
  }

  isMuted(userId: string): boolean {
    return this.getMuted().includes(userId);
  }

  mute(userId: string) {
    const list = this.getMuted();
    if (!list.includes(userId)) {
      list.push(userId);
      localStorage.setItem(this.key, JSON.stringify(list));
    }
  }

  unmute(userId: string) {
    const list = this.getMuted().filter(id => id !== userId);
    localStorage.setItem(this.key, JSON.stringify(list));
  }
}
