import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';

interface Challenge {
  id: string;
  title: string;
  category: 'mental' | 'physical' | 'mindfulness' | 'nutrition';
  points: number;
  completed: boolean;
}

@Component({
  standalone: true,
  imports: [FormsModule, NavbarComponent, CommonModule],
  templateUrl: './post-create.html',
  styleUrl: './post-create.css'
})
export class PostCreateComponent implements OnInit {
  private notificationService = inject(NotificationService);
  
  text = '';
  selectedImage: string | null = null;
  selectedChallengeId: string = '';
  selectedChallenge: Challenge | null = null;
  availableChallenges: Challenge[] = [];

  constructor(
    private postService: PostService,
    private userService: UserService,
    private router: Router
  ) {}

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
          // Filtrar solo retos completados
          const completedChallenges = progress.challenges.filter((c: any) => c.completed === true);
          
          // Mapear a objetos Challenge con la información completa
          this.availableChallenges = completedChallenges.map((c: any) => ({
            id: c.id,
            title: this.getChallengeTitle(c.id),
            category: this.getChallengeCategory(c.id),
            points: this.getChallengePoints(c.id),
            completed: true
          }));
        }
      } catch (error) {
        console.error('Error cargando retos:', error);
      }
    }
  }

  private getChallengeTitle(challengeId: string): string {
    const titles: Record<string, string> = {
      // Mentales
      'mental-1': 'Diario de gratitud',
      'mental-2': 'Digital detox por 1 hora',
      'mental-3': 'Lectura de 20 minutos',
      'mental-4': 'Visualización positiva',
      'mental-5': 'Afirmaciones matutinas',
      'mental-6': 'Organizar un espacio',
      // Físicos
      'physical-1': 'Caminata de 30 minutos',
      'physical-2': 'Entrenamiento de fuerza',
      'physical-3': 'Rutina de estiramientos',
      'physical-4': 'Subir escaleras',
      'physical-5': 'Baile libre',
      'physical-6': 'Yoga matutino',
      // Mindfulness
      'mindfulness-1': 'Meditación de 10 minutos',
      'mindfulness-2': 'Respiración profunda',
      'mindfulness-3': 'Escaneo corporal',
      'mindfulness-4': 'Observación consciente',
      'mindfulness-5': 'Caminata mindfulness',
      'mindfulness-6': 'Gratitud mindfulness',
      // Nutrición
      'nutrition-1': 'Comida consciente',
      'nutrition-2': 'Hidratación consciente',
      'nutrition-3': 'Desayuno saludable',
      'nutrition-4': 'Batch cooking',
      'nutrition-5': '5 porciones de vegetales',
      'nutrition-6': 'Reducir azúcar'
    };
    return titles[challengeId] || 'Reto completado';
  }

  private getChallengeCategory(challengeId: string): 'mental' | 'physical' | 'mindfulness' | 'nutrition' {
    if (challengeId.startsWith('mental')) return 'mental';
    if (challengeId.startsWith('physical')) return 'physical';
    if (challengeId.startsWith('mindfulness')) return 'mindfulness';
    if (challengeId.startsWith('nutrition')) return 'nutrition';
    return 'mental';
  }

  private getChallengePoints(challengeId: string): number {
    const points: Record<string, number> = {
      // Mentales
      'mental-1': 40, 'mental-2': 60, 'mental-3': 45, 
      'mental-4': 35, 'mental-5': 30, 'mental-6': 65,
      // Físicos
      'physical-1': 75, 'physical-2': 100, 'physical-3': 55, 
      'physical-4': 85, 'physical-5': 60, 'physical-6': 90,
      // Mindfulness
      'mindfulness-1': 50, 'mindfulness-2': 35, 'mindfulness-3': 65, 
      'mindfulness-4': 40, 'mindfulness-5': 70, 'mindfulness-6': 75,
      // Nutrición
      'nutrition-1': 45, 'nutrition-2': 70, 'nutrition-3': 55, 
      'nutrition-4': 90, 'nutrition-5': 100, 'nutrition-6': 85
    };
    return points[challengeId] || 50;
  }

  onChallengeSelected() {
    if (this.selectedChallengeId) {
      this.selectedChallenge = {
        id: this.selectedChallengeId,
        title: this.getChallengeTitle(this.selectedChallengeId),
        category: this.getChallengeCategory(this.selectedChallengeId),
        points: this.getChallengePoints(this.selectedChallengeId),
        completed: true
      };
      
      // Auto-llenar la descripción con el contexto del reto si está vacía
      if (!this.text.trim()) {
        this.text = `¡Acabo de completar el reto "${this.selectedChallenge.title}"! 💪`;
      }
    }
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'mental': '🧠',
      'physical': '💪',
      'mindfulness': '🌿',
      'nutrition': '🍎'
    };
    return icons[category] || '🌟';
  }

  getCategoryName(category: string): string {
    const names: Record<string, string> = {
      'mental': 'Mental',
      'physical': 'Físico',
      'mindfulness': 'Mindfulness',
      'nutrition': 'Nutrición'
    };
    return names[category] || 'Bienestar';
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
  }

  submit() {
    if (!this.selectedChallengeId) {
      this.notificationService.warning('Por favor selecciona el reto que has completado');
      return;
    }

    if (!this.text.trim()) {
      this.notificationService.warning('Por favor escribe algo sobre tu logro');
      return;
    }

    const currentUser = this.userService.getUser();
    const challenge = this.selectedChallenge;

    // Crear el post con información del reto
    this.postService.addPost({
      user: currentUser.name,
      userAvatar: currentUser.avatar,
      image: this.selectedImage || `https://picsum.photos/400/30${Math.floor(Math.random() * 10)}`,
      text: this.text,
      challengeInfo: challenge ? {
        id: challenge.id,
        title: challenge.title,
        category: challenge.category,
        points: challenge.points
      } : undefined
    });

    // Limpiar el formulario
    this.text = '';
    this.selectedImage = null;
    this.selectedChallengeId = '';
    this.selectedChallenge = null;
    
    this.notificationService.showPostCreated();
    this.router.navigate(['/feed']);
  }
}