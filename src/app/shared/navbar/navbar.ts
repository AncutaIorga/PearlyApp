import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { PostService } from '../../services/post'; // <-- IMPORTANTE: Para sacar las fotos
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  router = inject(Router);
  private authService = inject(AuthService);
  private postService = inject(PostService); // Inyectamos esto para buscar el avatar

  isSearchActive = false;
  searchQuery = '';
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(150), // Bajado a 150ms para que sea súper rápido y fluido
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  // Ahora recibe el texto exacto que se está escribiendo al instante
  onSearchInput(value: string) {
    this.searchSubject.next(value);
  }

  performSearch(query: string) {
    const cleanQuery = (query || '').toLowerCase().trim();
    
    if (cleanQuery.length === 0) {
      this.searchResults = [];
      return;
    }
    
    // Filtramos los usuarios registrados
    const allUsers = this.authService.getRegisteredUsers();
    this.searchResults = allUsers.filter(user => 
      user.name.toLowerCase().includes(cleanQuery)
    );
  }

  // Truco: buscamos si el usuario tiene posts para sacar su foto real
// Le decimos que el nombre puede ser undefined, y devolvemos siempre un string vacío por defecto
  getUserAvatar(username: string | undefined): string {
    if (!username) return ''; // Si no hay nombre, salimos rápido
    
    const posts = this.postService.getPostsByUser(username);
    
    // Si hay posts, intentamos sacar el avatar. Si es undefined, devolvemos '' con el ||
    return posts.length > 0 ? (posts[0].userAvatar || '') : '';
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearchActive = false;
  }

  closeSearch() {
    // Pequeño timeout para que dé tiempo a hacer clic en un usuario
    setTimeout(() => {
      this.isSearchActive = false;
    }, 150);
  }

  goToUserProfile(username: string) {
    this.closeSearch();
    this.searchQuery = '';
    this.router.navigate(['/profile', username]);
  }
}