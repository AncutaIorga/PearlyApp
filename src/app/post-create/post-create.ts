import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';
import { ChallengeService, Challenge } from '../services/challenge'; // <-- Importación correcta

interface CompletedChallenge extends Challenge {
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
  private challengeService = inject(ChallengeService);
  private userService = inject(UserService);
  private postService = inject(PostService);
  private router = inject(Router);
  
  text = '';
  selectedImage: string | null = null;
  selectedChallengeId: string = '';
  selectedChallenge: CompletedChallenge | null = null;
  availableChallenges: CompletedChallenge[] = [];

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
    const found = this.availableChallenges.find(c => c.id === this.selectedChallengeId);
    if (found) {
      this.selectedChallenge = found;
      if (!this.text.trim()) {
        this.text = `¡Acabo de completar el reto "${this.selectedChallenge.title}"! 💪`;
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
      const reader = new FileReader();
      reader.onload = (e: any) => this.selectedImage = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  removeImage() { this.selectedImage = null; }

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
    this.postService.addPost({
      user: currentUser.name,
      userAvatar: currentUser.avatar,
      image: this.selectedImage || `https://picsum.photos/400/30${Math.floor(Math.random() * 10)}`,
      text: this.text,
      challengeInfo: this.selectedChallenge ? {
        id: this.selectedChallenge.id,
        title: this.selectedChallenge.title,
        category: this.selectedChallenge.category,
        points: this.selectedChallenge.points
      } : undefined
    });

    this.notificationService.showPostCreated();
    this.router.navigate(['/feed']);
  }
}