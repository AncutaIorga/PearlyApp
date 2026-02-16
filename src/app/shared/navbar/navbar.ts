import { Component, inject, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, SearchUserResult } from '../../services/user';
import { NotificationService } from '../../services/notification';
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
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  // Buscador
  isSearchActive = false;
  searchQuery = '';
  searchResults: SearchUserResult[] = [];
  private searchSubject = new Subject<string>();

  constructor() {
    // Debounce para no buscar en cada tecla
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  performSearch(query: string) {
    if (query.trim().length === 0) {
      this.searchResults = [];
      return;
    }
    
    this.userService.searchUsers(query).subscribe(results => {
      this.searchResults = results;
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearchActive = false;
  }

  closeSearch() {
    this.isSearchActive = false;
  }

  goToUserProfile(user: SearchUserResult) {
    this.closeSearch();
    this.searchQuery = '';
    // Como aún no tenemos ruta de perfil público (/profile/:id), simulamos la navegación
    this.notificationService.info(`Visitando perfil de ${user.name}`);
    // Opcional: navegar a una ruta dummy si existiera
    // this.router.navigate(['/profile', user.id]);
  }
}