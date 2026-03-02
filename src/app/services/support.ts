import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateTicketDto {
  subject: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/soportes`;
  private ticketsSignal = signal<any[]>([]);

  // Envia un formulario de ayuda tecnica a la base de datos de soporte.
  createTicket(data: CreateTicketDto): Observable<any> {
    const userIdStr = localStorage.getItem('idUsuario') || localStorage.getItem('userId');
    const userId = userIdStr ? parseInt(userIdStr, 10) : null;

    if (userId === null || isNaN(userId)) {
      return throwError(() => new Error('Usuario no identificado'));
    }
    const payload: any = {
      idUsuario: userId,
      asunto: data.subject.trim(),
      descripcion: data.description.trim()
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    console.log('Intento de envío definitivo:', payload);

    return this.http.post<any>(this.apiUrl, payload, { headers }).pipe(
      tap(newTicket => {
        this.ticketsSignal.update(c => [newTicket, ...c]);
      }),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  // Devuelve la variable que avisa si se han creado nuevos tickets.
  getTicketsSignal() { return this.ticketsSignal; }
}