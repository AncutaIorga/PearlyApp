import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface NotificationSettings {
  followers: boolean;
  comments: boolean;
  likes: boolean;
  messages: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = '/api/notifications';
  
  private settings = signal<NotificationSettings>({
    followers: true,
    comments: true,
    likes: true,
    messages: true
  });

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la configuración de notificaciones
   */
  getSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.API_URL}/settings`).pipe(
      tap(settings => this.settings.set(settings))
    );
  }

  /**
   * Actualiza la configuración de notificaciones
   */
  updateSettings(settings: NotificationSettings): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/settings`, settings).pipe(
      tap(() => this.settings.set(settings))
    );
  }

  getNotificationSettings() {
    return this.settings();
  }
}