import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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

  isSearchActive = false;
  searchQuery = '';
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(150),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
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
    
    // 🔥 TRUCO: Volvemos a pedir la lista actualizada al servicio
    // Asegúrate de que en auth.ts el método sea público
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
    this.isSearchActive = false; 
    this.searchQuery = '';
    this.searchResults = [];
  }
}