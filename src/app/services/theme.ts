import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<'light' | 'dark'>('light');
  
  // Verifica el tema preferido del usuario al abrir la aplicacion.
  constructor() {
    this.loadSavedTheme();
  }
  
  // Carga desde el navegador si el usuario tenia modo oscuro o modo claro.
  private loadSavedTheme() {
    const savedTheme = localStorage.getItem('pearly-theme') as 'light' | 'dark' | null;
    
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('light');
    }
  }
  
  // Aplica el tema elegido cambiando las variables CSS del HTML de la pagina entera.
  setTheme(theme: 'light' | 'dark') {
    this.currentTheme.set(theme);
    localStorage.setItem('pearly-theme', theme);
    
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }
  
  // Alterna entre encender el modo oscuro si esta en claro y viceversa.
  toggleTheme(): 'light' | 'dark' {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }
  
  // Devuelve verdadero si la aplicacion esta actualmente en modo oscuro.
  isDarkMode(): boolean {
    return this.currentTheme() === 'dark';
  }
}