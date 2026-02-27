import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface Bloqueo {
  id?: number;
  idBloqueador: number;
  idBloqueado: number;
  tipo: 'block' | 'mute';
  name?: string; 
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class BlockService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bloqueos`;

  public blockedUsers = signal<Bloqueo[]>([]);
  public mutedUsers = signal<Bloqueo[]>([]);

  constructor() { this.cargarRestricciones(); }

  private getMyId(): number {
    const id = localStorage.getItem('idUsuario') || localStorage.getItem('userId');
    return id ? Number(id) : 0;
  }
  
  /**
   * Carga las restricciones desde el backend y actualiza los signals locales.
   */
  cargarRestricciones() {
    const myId = this.getMyId();
    if (myId === 0) return;

    // CORRECCIÓN: Se define la URL completa usando el ID del usuario
    const fetchUrl = `${this.apiUrl}/usuario/${myId}`;

    this.http.get<Bloqueo[]>(fetchUrl).subscribe({
      next: (data) => {
        const mapped = data.map(b => ({
          ...b,
          name: b.name || `Usuario ${b.idBloqueado}`
        }));
        
        // Seteamos los signals filtrando por tipo para que el HTML los pinte bien
        this.blockedUsers.set(mapped.filter(r => r.tipo === 'block'));
        this.mutedUsers.set(mapped.filter(r => r.tipo === 'mute'));
      },
      error: (err) => console.error('Error cargando restricciones:', err)
    });
  }

  isBlocked(targetId: number | string): boolean {
    return this.blockedUsers().some(u => u.idBloqueado === Number(targetId));
  }

  isMuted(targetId: number | string): boolean {
    return this.mutedUsers().some(u => u.idBloqueado === Number(targetId));
  }

  blockUser(targetId: number): Observable<any> {
    return this.restringir(targetId, 'block');
  }

  muteUser(targetId: number | string): Observable<any> {
    return this.restringir(Number(targetId), 'mute');
  }

  private restringir(targetId: number, tipo: 'block' | 'mute'): Observable<any> {
    const payload = { idBloqueador: this.getMyId(), idBloqueado: targetId, tipo };
    return this.http.post(this.apiUrl, payload).pipe(
      tap(() => this.cargarRestricciones())
    );
  }

  unrestrict(targetId: number | string, tipo: 'block' | 'mute'): Observable<any> {
    const params = new HttpParams()
      .set('bloqueador', this.getMyId().toString())
      .set('bloqueado', targetId.toString())
      .set('tipo', tipo);
      
    return this.http.delete(`${this.apiUrl}/eliminar`, { params, responseType: 'text' }).pipe(
      tap(() => this.cargarRestricciones())
    );
  }

  // Métodos de compatibilidad
  blockUserByUsername(id: any) { return this.blockUser(Number(id)); }
  unblockUserByUsername(id: any) { return this.unrestrict(id, 'block'); }
  unmuteUser(id: any) { return this.unrestrict(id, 'mute'); }
}