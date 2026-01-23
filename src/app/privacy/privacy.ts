import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './privacy.html',
  styleUrls: ['./privacy.css']
})
export class PrivacyComponent {
  showProfile = true;
  showActivity = true;
  
  exportData() {
    alert('📊 Preparando exportación de datos...');
  }
  
  deleteAccount() {
    if (confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
      alert('🗑️ Cuenta marcada para eliminación');
    }
  }
}