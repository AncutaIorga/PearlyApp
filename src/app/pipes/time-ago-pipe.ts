import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
  name: 'timeAgo', 
  standalone: true,
  pure: false 
})
export class TimeAgoPipe implements PipeTransform {
  transform(date: Date | string): string {
    if (!date) return '';
    
    const postDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - postDate.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    if (days < 7) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    if (weeks < 4) return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;

    // Para fechas muy antiguas (más de 4 semanas), mostrar fecha exacta
    const day = String(postDate.getDate()).padStart(2, '0');
    const month = String(postDate.getMonth() + 1).padStart(2, '0');
    const year = postDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
}