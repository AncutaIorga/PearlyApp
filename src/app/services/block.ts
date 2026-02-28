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
  username?: string; 
}

@Injectable({ providedIn: 'root' })
export class BlockService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bloqueos`;

  public blockedUsers = signal<Bloqueo[]>([]);
  public mutedUsers = signal<Bloqueo[]>([]);

  constructor() { 
    this.cargarRestricciones(); 
  }

  private getMyId(): number {
    const id = localStorage.getItem('idUsuario') || localStorage.getItem('userId');
    return id ? Number(id) : 0;
  }
  
  /**
   * Carga las restricciones. Ahora confía plenamente en el Backend
   * porque el DTO de Kotlin ya incluye 'name' y 'avatar'.
   */
  cargarRestricciones() {
    const myId = this.getMyId();
    if (myId === 0) return;

    this.http.get<Bloqueo[]>(`${this.apiUrl}/usuario/${myId}`).subscribe({
      next: (data) => {
        // Limpiamos la lista y asignamos valores por defecto si algo falla
        const mapped = data.map(b => ({
          ...b,
          // Prioridad: El nombre que viene del JOIN, si no, el username, si no, el ID
          name: b.name || b.username || `Usuario ${b.idBloqueado}`
        }));
        
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

  // --- ACCIONES ---

  blockUser(targetId: number | string): Observable<any> {
    return this.restringir(Number(targetId), 'block');
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

  /**
   * Elimina la restricción. He cambiado responseType a 'json' (por defecto)
   * ya que ahora el Back devuelve un Map/JSON con un mensaje.
   */
  unrestrict(targetId: number | string, tipo: 'block' | 'mute'): Observable<any> {
    const params = new HttpParams()
      .set('bloqueador', this.getMyId().toString())
      .set('bloqueado', targetId.toString())
      .set('tipo', tipo);
      
    return this.http.delete(`${this.apiUrl}/eliminar`, { params }).pipe(
      tap(() => this.cargarRestricciones()),
      catchError(err => {
        console.error(`Error al quitar restricción (${tipo}):`, err);
        return throwError(() => err);
      })
    );
  }

  unblockUserByUsername(id: any) { return this.unrestrict(id, 'block'); }
  unmuteUser(id: any) { return this.unrestrict(id, 'mute'); }
}