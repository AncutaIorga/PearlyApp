import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/authBACK';
import { UserService } from '../../services/user'; 
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
  private userService = inject(UserService); 

  isSearchActive = false;
  searchQuery = '';
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();
  
  currentRoute: string = '';

  // Actualiza la variable de la ruta actual para saber que boton del menu pintar.
  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
    this.currentRoute = this.router.url;
  }

  // Espera medio segundo despues de teclear para buscar y no saturar el servidor.
  constructor() {
    this.searchSubject.pipe(
      debounceTime(300), 
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  // Comprueba si el link de la pestaña actual coincide con el boton del menu.
  isActive(route: string): boolean {
    if (route === '/profile' && this.currentRoute.startsWith('/profile')) {
      return true;
    }
    return this.currentRoute === route;
  }

  // Comprueba especificamente si estas dentro de la rueda de engranaje (ajustes).
  isSettingsActive(): boolean {
    return this.currentRoute === '/ajustes';
  }

  // Avisa de que has escrito algo nuevo en la barra buscadora.
  onSearchInput(value: string) {
    this.searchSubject.next(value);
  }

  // Ejecuta la busqueda real en el backend usando el texto escrito.
  performSearch(query: string) {
    const cleanQuery = (query || '').trim();
    
    if (cleanQuery.length === 0) {
      this.searchResults = [];
      return;
    }
    
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

  // Cierra el buscador, oculta los resultados y borra el texto con retardo para evitar fallos.
  closeSearch() {
    setTimeout(() => {
      this.isSearchActive = false;
      this.searchQuery = '';
      this.searchResults = [];
    }, 200);
  }

  // Cierra el buscador y viaja a la pagina del perfil de la persona seleccionada.
  goToUserProfile(username: string) {
    if (username) {
      this.router.navigate(['/profile', username]);
      this.closeSearch();
    }
  }

  // Viaja directamente a la pestaña de ajustes.
  goToSettings() {
    this.router.navigate(['/ajustes']);
  }
}