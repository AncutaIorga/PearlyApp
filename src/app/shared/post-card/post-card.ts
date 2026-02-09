import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostOptionsComponent } from '../post-options/post-options';
import { TimeAgoPipe } from '../../pipes/time-ago-pipe';

export interface Post {
  id: number;
  user: string;
  image: string;
  text: string;
  likes: number;
  createdAt: Date; 
  content?: string;
}

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, PostOptionsComponent, TimeAgoPipe], // ✅ Importar el pipe
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css']
})
export class PostCardComponent implements OnInit, OnDestroy {
  @Input() post!: Post;
  isLiked = false;
  
  private intervalId?: number;

  ngOnInit() {
    // ✅ Actualizar cada minuto para mantener el "hace X minutos" actualizado
    this.intervalId = window.setInterval(() => {
      // Forzar detección de cambios cada 60 segundos
    }, 60000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  toggleLike() {
    this.isLiked = !this.isLiked;
    this.post.likes += this.isLiked ? 1 : -1;
  }

  onOptionSelected(event: { action: string; postId: number }) {
    console.log('Opción seleccionada:', event);
  }
}