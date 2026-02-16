import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

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
  // Usamos Signal para que la UI se entere de los cambios
  tickets = signal<SupportTicket[]>([]);

  constructor() {
    this.loadTickets();
  }

  private loadTickets() {
    const saved = localStorage.getItem('support-tickets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          respondedAt: t.respondedAt ? new Date(t.respondedAt) : undefined
        }));
        this.tickets.set(parsed);
      } catch (e) {
        console.error('Error cargando tickets', e);
      }
    }
  }

  private saveTickets() {
    localStorage.setItem('support-tickets', JSON.stringify(this.tickets()));
  }

  /**
   * Obtiene todos los tickets (simulado local)
   */
  getMyTickets(): Observable<SupportTicket[]> {
    return of(this.tickets()).pipe(delay(300));
  }

  /**
   * Crea un nuevo ticket y lo guarda
   */
  createTicket(data: CreateTicketDto): Observable<SupportTicket> {
    const newTicket: SupportTicket = {
      id: Date.now(),
      userId: 1, // ID simulado
      subject: data.subject,
      description: data.description,
      status: 'open',
      createdAt: new Date()
    };

    // Actualizamos el signal y guardamos en storage
    this.tickets.update(current => [newTicket, ...current]);
    this.saveTickets();
    
    // Retornamos simulando una petición de red
    return of(newTicket).pipe(delay(500));
  }

  // Getter directo del signal para usar en componentes
  getTicketsSignal() {
    return this.tickets;
  }
}