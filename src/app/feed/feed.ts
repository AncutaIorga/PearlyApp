import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post';
import { BlockService } from '../services/block';
import { PostCardComponent } from '../shared/post-card/post-card';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  selector: 'app-feed', 
  standalone: true,
  imports: [CommonModule, PostCardComponent, NavbarComponent],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class FeedComponent implements OnInit {
  private postService = inject(PostService);
  private blockService = inject(BlockService);

  showTutorial = false;

  // Obtiene y filtra las publicaciones excluyendo las de usuarios bloqueados.
  posts = computed(() => {
    const allPosts = this.postService.getAllPosts();
    const blocks = this.blockService.blockedUsers();
    const mutes = this.blockService.mutedUsers();
    
    return allPosts.filter(post => 
      !blocks.some(b => b.name === post.user) && 
      !mutes.some(m => m.name === post.user)
    );
  });

  // Comprueba si el usuario acaba de registrarse para mostrar el tutorial.
  ngOnInit() {
    const isNew = localStorage.getItem('isNewUser');
    
    if (isNew === 'true') {
      this.showTutorial = true;
      localStorage.removeItem('isNewUser');
    }
  }

  // Cierra la ventana del tutorial introductorio.
  closeTutorial() {
    this.showTutorial = false;
  }
}