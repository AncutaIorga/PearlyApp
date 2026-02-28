import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Inicializamos por defecto en 'light'
  currentTheme = signal<'light' | 'dark'>('light');
  
  constructor() {
    this.loadSavedTheme();
  }
  
  private loadSavedTheme() {
    // Buscamos la preferencia en el navegador
    const savedTheme = localStorage.getItem('pearly-theme') as 'light' | 'dark' | null;
    
    // Si existe una preferencia guardada, la aplicamos; si no, forzamos 'light'
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('light');
    }
  }
  
  setTheme(theme: 'light' | 'dark') {
    this.currentTheme.set(theme);
    localStorage.setItem('pearly-theme', theme);
    
    // Aplicamos el atributo al HTML (útil para variables CSS :root)
    document.documentElement.setAttribute('data-theme', theme);
    
    // Gestión de clases en el body
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }
  
  toggleTheme(): 'light' | 'dark' {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }
  
  isDarkMode(): boolean {
    return this.currentTheme() === 'dark';
  }
}