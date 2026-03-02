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

  // Inicializa el servicio cargando la lista de bloqueos desde el servidor.
  constructor() { 
    this.cargarRestricciones(); 
  }

  // Obtiene el ID del usuario actual desde el almacenamiento local.
  private getMyId(): number {
    const id = localStorage.getItem('idUsuario') || localStorage.getItem('userId');
    return id ? Number(id) : 0;
  }
  
  // Solicita al servidor y guarda la lista de usuarios que hemos bloqueado o silenciado.
  cargarRestricciones() {
    const myId = this.getMyId();
    if (myId === 0) return;

    this.http.get<Bloqueo[]>(`${this.apiUrl}/usuario/${myId}`).subscribe({
      next: (data) => {
        const mapped = data.map(b => ({
          ...b,
          name: b.name || b.username || `Usuario ${b.idBloqueado}`
        }));
        
        this.blockedUsers.set(mapped.filter(r => r.tipo === 'block'));
        this.mutedUsers.set(mapped.filter(r => r.tipo === 'mute'));
      },
      error: (err) => console.error('Error cargando restricciones:', err)
    });
  }

  // Comprueba si un usuario especifico esta en nuestra lista de bloqueados.
  isBlocked(targetId: number | string): boolean {
    return this.blockedUsers().some(u => u.idBloqueado === Number(targetId));
  }

  // Comprueba si un usuario especifico esta en nuestra lista de silenciados.
  isMuted(targetId: number | string): boolean {
    return this.mutedUsers().some(u => u.idBloqueado === Number(targetId));
  }

  // Envia una orden al servidor para bloquear a un usuario.
  blockUser(targetId: number | string): Observable<any> {
    return this.restringir(Number(targetId), 'block');
  }

  // Envia una orden al servidor para silenciar a un usuario.
  muteUser(targetId: number | string): Observable<any> {
    return this.restringir(Number(targetId), 'mute');
  }

  // Metodo interno que ejecuta la peticion HTTP para bloquear o silenciar.
  private restringir(targetId: number, tipo: 'block' | 'mute'): Observable<any> {
    const payload = { idBloqueador: this.getMyId(), idBloqueado: targetId, tipo };
    return this.http.post(this.apiUrl, payload).pipe(
      tap(() => this.cargarRestricciones())
    );
  }

  // Elimina una restriccion (bloqueo o silencio) de un usuario en el servidor.
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

  // Llama a la funcion de eliminar restriccion especificamente para desbloquear.
  unblockUserByUsername(id: any) { return this.unrestrict(id, 'block'); }
  
  // Llama a la funcion de eliminar restriccion especificamente para quitar el silencio.
  unmuteUser(id: any) { return this.unrestrict(id, 'mute'); }
}