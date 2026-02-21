import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post';
import { BlockService } from '../services/block';
import { PostCardComponent } from '../shared/post-card/post-card';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
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
    // ARREGLO ONBOARDING: Comprueba en LocalStorage si el usuario ya vio el tutorial
    const tutorialDone = localStorage.getItem('tutorialPearlyDone');
    
    // Si no lo ha hecho, se activa la variable que muestra el HTML del tutorial
    if (!tutorialDone) {
      this.showTutorial = true;
    }
  }

  // Método que se ejecuta cuando el usuario pulsa "¡Empezar ahora!" en el tutorial
  closeTutorial() {
    this.showTutorial = false;
    // Guardamos en LocalStorage que ya lo ha visto para que no le vuelva a salir mañana
    localStorage.setItem('tutorialPearlyDone', 'true');
  }
}