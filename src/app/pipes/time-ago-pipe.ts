import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | undefined): string {
    if (!value) return '';
    
    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) {
      return 'Hace un momento';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
      return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    
    const years = Math.floor(days / 365);
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
  }
}