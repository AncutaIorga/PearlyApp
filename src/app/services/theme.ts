import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal para el tema actual
  currentTheme = signal<'light' | 'dark'>('light');
  
  constructor() {
    this.loadSavedTheme();
  }
  
  private loadSavedTheme() {
    const savedTheme = localStorage.getItem('pearly-theme') as 'light' | 'dark';
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('light');
    }
  }
  
  setTheme(theme: 'light' | 'dark') {
    this.currentTheme.set(theme);
    localStorage.setItem('pearly-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('light-theme', theme === 'light');
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }
  
  isDarkMode() {
    return this.currentTheme() === 'dark';
  }
}