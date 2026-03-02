import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MuteService {

  private key = 'muted-users';

  // Obtiene la lista de usuarios silenciados guardada en el navegador.
  getMuted(): string[] {
    return JSON.parse(localStorage.getItem(this.key) || '[]');
  }

  // Comprueba si un usuario en especifico esta silenciado localmente.
  isMuted(userId: string): boolean {
    return this.getMuted().includes(userId);
  }

  // Añade un nuevo usuario a la lista local de silenciados.
  mute(userId: string) {
    const list = this.getMuted();
    if (!list.includes(userId)) {
      list.push(userId);
      localStorage.setItem(this.key, JSON.stringify(list));
    }
  }

  // Elimina a un usuario de la lista local de silenciados.
  unmute(userId: string) {
    const list = this.getMuted().filter(id => id !== userId);
    localStorage.setItem(this.key, JSON.stringify(list));
  }
}