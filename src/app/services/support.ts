import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  response?: string;
  createdAt: Date;
  respondedAt?: Date;
}

export interface CreateTicketDto {
  subject: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private readonly API_URL = '/api/support';
  
  private tickets = signal<SupportTicket[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los tickets del usuario autenticado
   */
  getMyTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.API_URL}/tickets`).pipe(
      tap(tickets => {
        // Convertir strings de fecha a objetos Date
        const parsedTickets = tickets.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt),
          respondedAt: t.respondedAt ? new Date(t.respondedAt) : undefined
        }));
        this.tickets.set(parsedTickets);
      })
    );
  }

  /**
   * Crea un nuevo ticket de soporte
   */
  createTicket(data: CreateTicketDto): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.API_URL}/tickets`, data).pipe(
      tap(ticket => {
        const parsedTicket = {
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          respondedAt: ticket.respondedAt ? new Date(ticket.respondedAt) : undefined
        };
        this.tickets.update(tickets => [parsedTicket, ...tickets]);
      })
    );
  }

  /**
   * Obtiene un ticket específico
   */
  getTicketById(id: number): Observable<SupportTicket> {
    return this.http.get<SupportTicket>(`${this.API_URL}/tickets/${id}`).pipe(
      tap(ticket => ({
        ...ticket,
        createdAt: new Date(ticket.createdAt),
        respondedAt: ticket.respondedAt ? new Date(ticket.respondedAt) : undefined
      }))
    );
  }

  /**
   * Cierra un ticket (usuario)
   */
  closeTicket(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/tickets/${id}/close`, {}).pipe(
      tap(() => {
        this.tickets.update(tickets =>
          tickets.map(t => t.id === id ? { ...t, status: 'closed' as const } : t)
        );
      })
    );
  }

  getTickets() {
    return this.tickets();
  }
}