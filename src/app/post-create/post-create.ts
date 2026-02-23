import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';
import { ChallengeService } from '../services/challenge';

// Definimos la interfaz localmente para evitar errores de importación si no existe en el servicio
interface CompletedChallenge {
  id: string;
  title: string;
  category: string;
  points: number;
  completed?: boolean;
}

@Component({
  standalone: true,
  imports: [FormsModule, NavbarComponent, CommonModule],
  templateUrl: './post-create.html',
  styleUrl: './post-create.css'
})
export class PostCreateComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private challengeService = inject(ChallengeService);
  private userService = inject(UserService);
  private postService = inject(PostService);
  private router = inject(Router);
  
  text = '';
  selectedImage: string | null = null;
  selectedChallengeId: string = '';
  selectedChallenge: CompletedChallenge | null = null;
  availableChallenges: CompletedChallenge[] = [];
  
  // ✅ Variable para bloquear el botón durante el envío
  isSubmitting = false;

  ngOnInit() {
    this.loadAvailableChallenges();
  }

  private loadAvailableChallenges() {
    const userData = this.userService.getUser();
    const userId = userData?.email ? userData.email.replace(/[.#$[\]]/g, '_') : 'anonymous';
    const savedProgress = localStorage.getItem(`pearly-wellness-progress-${userId}`);
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        if (progress.challenges && Array.isArray(progress.challenges)) {
          // Filtramos solo los completados para que pueda presumir de ellos
          const completedIds = progress.challenges
            .filter((c: any) => c.completed === true)
            .map((c: any) => c.id);
          
          // Recuperamos la info completa del servicio de retos
          this.availableChallenges = completedIds
            .map((id: string) => {
              const masterDef = this.challengeService.getChallengeById(id);
              return masterDef ? { ...masterDef, completed: true } : null;
            })
            .filter((c: any) => c !== null); // Eliminamos nulos
        }
      } catch (error) {
        console.error('Error cargando retos:', error);
      }
    }
  }

  // Se ejecuta cuando el usuario elige un reto del desplegable
  onChallengeSelected() {
    // Busque el reto seleccionado en la lista
    // IMPORTANTE: Convertimos selectedChallengeId a string para comparar, por si viene como número
    const found = this.availableChallenges.find(c => String(c.id) === String(this.selectedChallengeId));
    
    if (found) {
      this.selectedChallenge = found;
      // Si el textarea está vacío, le ponemos un texto por defecto
      if (!this.text.trim()) {
        this.text = `¡He conseguido completar el reto "${this.selectedChallenge.title}"! 💪`;
      }
    }
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = { 'mental': '🧠', 'physical': '💪', 'mindfulness': '🌿', 'nutrition': '🍎' };
    return icons[category] || '🌟';
  }

  getCategoryName(category: string): string {
    const names: Record<string, string> = { 'mental': 'Mental', 'physical': 'Físico', 'mindfulness': 'Mindfulness', 'nutrition': 'Nutrición' };
    return names[category] || 'Bienestar';
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validación de tamaño (opcional, ej: 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.warning('La imagen es demasiado grande (Máx 5MB)');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e: any) => this.selectedImage = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  removeImage() { this.selectedImage = null; }

  async submit() {
    // 1. Validaciones
    // NOTA: Si quieres permitir posts sin reto, quita esta validación. 
    // Pero tu lógica original obligaba a seleccionar uno.
    if (!this.selectedChallengeId) {
      this.notificationService.warning('Por favor selecciona el reto que has completado');
      return;
    }

    if (!this.text.trim()) {
      this.notificationService.warning('Por favor escribe algo sobre tu logro');
      return;
    }

    if (!this.selectedImage) {
        this.notificationService.warning('Añade una foto para inspirar a otros 📸');
        return;
    }

    // 2. Bloqueo del botón
    this.isSubmitting = true;

    try {
        // Simulamos espera de red (UX)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // (Opcional) Descomenta para probar errores
        // if (Math.random() > 0.8) throw new Error('Error de conexión simulado');

        const currentUser = this.userService.getUser();
        
        // 3. Crear el post
        this.postService.addPost({
          user: currentUser.name,
          userAvatar: currentUser.avatar,
          image: this.selectedImage, 
          text: this.text,
          challengeInfo: this.selectedChallenge ? {
            id: this.selectedChallenge.id,
            title: this.selectedChallenge.title,
            category: this.selectedChallenge.category,
            points: this.selectedChallenge.points
          } : undefined
        });

        // 4. Éxito y Redirección
        this.notificationService.success('¡Publicado con éxito! 🎉');
        this.router.navigate(['/feed']);

    } catch (error: any) {
        console.error(error);
        this.notificationService.error(error.message || 'Error al publicar. Inténtalo de nuevo.');
        this.isSubmitting = false; // Desbloqueamos para reintentar
    }
  }
}