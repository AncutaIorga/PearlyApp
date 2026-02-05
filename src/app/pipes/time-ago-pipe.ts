import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(date: Date | string): string {
    const postDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - postDate.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    if (days < 7) return `Hace ${days} día${days !== 1 ? 's' : ''}`;

    const day = String(postDate.getDate()).padStart(2, '0');
    const month = String(postDate.getMonth() + 1).padStart(2, '0');
    const year = postDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
