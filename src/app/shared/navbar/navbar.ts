import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
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

  isSearchActive = false;
  searchQuery = '';
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();
  
  // Variable para controlar la ruta activa
  currentRoute: string = '';

  ngOnInit() {
    // Detectar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
    
    // Valor inicial
    this.currentRoute = this.router.url;
  }

  constructor() {
    this.searchSubject.pipe(
      debounceTime(150),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  // Método para verificar si una ruta está activa
  isActive(route: string): boolean {
    if (route === '/profile' && this.currentRoute.startsWith('/profile')) {
      return true;
    }
    return this.currentRoute === route;
  }

  // Método específico para el botón de ajustes
  isSettingsActive(): boolean {
    return this.currentRoute === '/ajustes';
  }

  onSearchInput(value: string) {
    this.searchSubject.next(value);
  }

  performSearch(query: string) {
    const cleanQuery = (query || '').toLowerCase().trim();
    
    if (cleanQuery.length === 0) {
      this.searchResults = [];
      return;
    }
    
    const allUsers = this.authService.getRegisteredUsers();
    
    this.searchResults = allUsers.filter(user => 
      user.name.toLowerCase().includes(cleanQuery)
    );
  }

  closeSearch() {
    setTimeout(() => {
      this.isSearchActive = false;
      this.searchQuery = '';
      this.searchResults = [];
    }, 200);
  }

  goToUserProfile(username: string) {
    this.router.navigate(['/profile', username]);
    this.closeSearch();
  }

  // Navegar a ajustes
  goToSettings() {
    this.router.navigate(['/ajustes']);
  }
}