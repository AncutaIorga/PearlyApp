import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';
import { ChallengeService } from '../services/challenge';

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
          const completedIds = progress.challenges
            .filter((c: any) => c.completed === true)
            .map((c: any) => c.id);
          
          this.availableChallenges = completedIds
            .map((id: string) => {
              const masterDef = this.challengeService.getChallengeById(id);
              return masterDef ? { ...masterDef, completed: true } : null;
            })
            .filter((c: any) => c !== null);
        }
      } catch (error) {
        console.error('Error cargando retos:', error);
      }
    }
  }

  onChallengeSelected() {
    const found = this.availableChallenges.find(c => String(c.id) === String(this.selectedChallengeId));
    
    if (found) {
      this.selectedChallenge = found;
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

  // ✅ COMPRESOR EXTREMO (Asegura que la foto pese menos de 50-80 KB)
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Reducimos el máximo a 500px (Suficiente para un feed tipo Instagram)
        const MAX_SIZE = 500; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // 1. Pintamos un fondo blanco (Vital si la foto era un PNG sin fondo)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          
          // 2. Dibujamos la imagen encima
          ctx.drawImage(img, 0, 0, width, height);
        }

        // 3. Comprimimos a JPEG con calidad 0.6 (Reduce el peso drásticamente)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        
        this.selectedImage = compressedBase64;
        
        // 🔍 CHIVATO PARA LA CONSOLA: Te dirá cuánto pesa exactamente
        const pesoFinalKB = Math.round(compressedBase64.length / 1024);
        console.log(`✅ Tamaño del Base64 a enviar: ${pesoFinalKB} KB`);
        
        if (pesoFinalKB > 150) {
           this.notificationService.warning(`La imagen sigue pesando ${pesoFinalKB}KB, el servidor podría rechazarla.`);
        }
      };
    };
    
    reader.readAsDataURL(file);
  }

  removeImage() { this.selectedImage = null; }

  async submit() {
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

    this.isSubmitting = true;

    try {
        await new Promise(resolve => setTimeout(resolve, 800));

        this.postService.addPost({
          image: this.selectedImage, 
          text: this.text,
          challengeInfo: this.selectedChallenge ? {
            id: String(this.selectedChallenge.id),
            title: this.selectedChallenge.title,
            category: this.selectedChallenge.category,
            points: this.selectedChallenge.points
          } : undefined
        });

        // La redirección ocurrirá instantáneamente, y el post aparecerá al recargar
        this.router.navigate(['/feed']);

    } catch (error: any) {
        console.error(error);
        this.notificationService.error(error.message || 'Error al publicar. Inténtalo de nuevo.');
        this.isSubmitting = false; 
    }
  }
}