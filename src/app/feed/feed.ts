import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post';
import { BlockService } from '../services/block';
import { PostCardComponent } from '../shared/post-card/post-card';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  selector: 'app-feed', // He añadido el selector por si acaso
  standalone: true,
  imports: [CommonModule, PostCardComponent, NavbarComponent],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class FeedComponent implements OnInit {
  private postService = inject(PostService);
  private blockService = inject(BlockService);

  // Variable que controla si se muestra o no el popup del tutorial
  showTutorial = false;

  // Calculamos los posts excluyendo a los usuarios bloqueados o silenciados
  posts = computed(() => {
    const allPosts = this.postService.getAllPosts();
    const blocks = this.blockService.blockedUsers();
    const mutes = this.blockService.mutedUsers();
    
    return allPosts.filter(post => 
      !blocks.some(b => b.name === post.user) && 
      !mutes.some(m => m.name === post.user)
    );
  });

  ngOnInit() {
    // CAMBIO CLAVE: Ahora comprobamos si venimos de un REGISTRO reciente
    const isNew = localStorage.getItem('isNewUser');
    
    if (isNew === 'true') {
      this.showTutorial = true;
      // IMPORTANTE: Borramos la marca inmediatamente.
      // Así, si el usuario recarga la página (F5), el tutorial no le vuelve a saltar.
      localStorage.removeItem('isNewUser');
    }
  }

  closeTutorial() {
    this.showTutorial = false;
    // Ya no necesitamos guardar nada en localStorage aquí, 
    // porque la lógica depende solo del momento del registro.
  }
}