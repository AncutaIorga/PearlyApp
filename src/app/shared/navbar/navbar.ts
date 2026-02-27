import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/authBACK';
import { UserService } from '../../services/user'; // IMPORTANTE: Asegúrate que la ruta sea correcta
import { Subject, filter } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  router = inject(Router);
  private authService = inject(AuthService);
  private userService = inject(UserService); // INYECTADO

  isSearchActive = false;
  searchQuery = '';
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();
  
  currentRoute: string = '';

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
    this.currentRoute = this.router.url;
  }

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300), // Subido a 300ms para mejor rendimiento con el servidor
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  isActive(route: string): boolean {
    if (route === '/profile' && this.currentRoute.startsWith('/profile')) {
      return true;
    }
    return this.currentRoute === route;
  }

  isSettingsActive(): boolean {
    return this.currentRoute === '/ajustes';
  }

  onSearchInput(value: string) {
    this.searchSubject.next(value);
  }

  performSearch(query: string) {
    const cleanQuery = (query || '').trim();
    
    if (cleanQuery.length === 0) {
      this.searchResults = [];
      return;
    }
    
    // CAMBIO: Ahora llama al UserService para buscar en el Backend
    this.userService.buscarUsuariosPorNombre(cleanQuery).subscribe({
      next: (usuarios) => {
        this.searchResults = usuarios;
      },
      error: (err) => {
        console.error('Error en el buscador del navbar', err);
        this.searchResults = [];
      }
    });
  }

  closeSearch() {
    setTimeout(() => {
      this.isSearchActive = false;
      this.searchQuery = '';
      this.searchResults = [];
    }, 200);
  }

goToUserProfile(username: string) {
  if (username) {
    this.router.navigate(['/profile', username]);
    this.closeSearch();
  }
}

  goToSettings() {
    this.router.navigate(['/ajustes']);
  }
}