import { Component, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  showSettings = false;

  constructor(private elementRef: ElementRef) {}

  toggleSettings(event: Event) {
    event.stopPropagation();
    this.showSettings = !this.showSettings;
  }

  handleSetting(action: string) {
    this.showSettings = false;
    
    switch(action) {
      case 'theme':
        alert('🎨 Configuración de tema (próximamente)');
        break;
      case 'notifications':
        alert('🔔 Configuración de notificaciones (próximamente)');
        break;
      case 'privacy':
        alert('🔒 Configuración de privacidad (próximamente)');
        break;
      case 'account':
        alert('👤 Configuración de cuenta (próximamente)');
        break;
      case 'logout':
        if (confirm('¿Cerrar sesión?')) {
          console.log('Cerrando sesión...');
          alert('👋 Sesión cerrada');
        }
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSettings = false;
    }
  }
}