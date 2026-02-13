import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'mental' | 'physical' | 'mindfulness' | 'nutrition';
  points: number;
  completed: boolean;
  inProgress: boolean;
  benefits?: string[];
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  tags: string[];
}

interface Filter {
  id: string;
  label: string;
}

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    NavbarComponent,
    NgClass
  ],
  templateUrl: './challenges.html',
  styleUrls: ['./challenges.css']
})
export class ChallengesComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  
  user = this.authService.user;
  userProfile = this.userService.getUser();
  
  energyPoints = 0;
  currentStreak = 0;
  wellnessScore = 0;
  mentalHealth = 0;
  physicalHealth = 0;
  
  completedChallenges = 0;
  totalChallenges = 0;
  
  dailyTip = "Completa tu primer reto para desbloquear consejos personalizados.";
  
  filters: Filter[] = [
    { id: 'all', label: 'Todos' },
    { id: 'mental', label: 'Mental' },
    { id: 'physical', label: 'Físico' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'nutrition', label: 'Nutrición' }
  ];
  
  activeFilter = 'all';
  
  challenges: Challenge[] = [];
  dailyChallenges: DailyChallenge[] = [];
  
  get filteredChallenges(): Challenge[] {
    if (this.activeFilter === 'all') return this.challenges;
    return this.challenges.filter(c => c.category === this.activeFilter);
  }
  
  ngOnInit() {
    this.loadUserProgress();
    
    if (this.challenges.length === 0) {
      this.initializeChallengesAsNotCompleted();
    }
    
    if (this.dailyChallenges.length === 0) {
      this.initializeDailyChallengesAsNotCompleted();
    }
    
    this.calculateTotalChallenges();
    
    setTimeout(() => {
      this.checkForFocusedChallenge();
    }, 500);
  }
  
  private checkForFocusedChallenge() {
    const focusedChallengeId = localStorage.getItem('focusDailyChallenge');
    
    if (focusedChallengeId) {
      localStorage.removeItem('focusDailyChallenge');
      
      const challenge = this.dailyChallenges.find(d => d.id === focusedChallengeId);
      
      if (challenge) {
        const dailySection = document.querySelector('.daily-section-box');
        if (dailySection) {
          dailySection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
          
          setTimeout(() => {
            const challengeElement = document.querySelector(`[data-daily-id="${focusedChallengeId}"]`);
            if (challengeElement) {
              challengeElement.classList.add('highlighted');
              setTimeout(() => {
                challengeElement.classList.remove('highlighted');
              }, 2000);
            }
          }, 1000);
          
          this.notificationService.info(`✨ Navegando al reto: ${challenge.title}`);
        }
      }
    }
  }
  
  private initializeChallengesAsNotCompleted() {
    this.challenges = [
      {
        id: '1',
        title: 'Meditación de 10 minutos',
        description: 'Encuentra un lugar tranquilo y medita durante 10 minutos para calmar tu mente.',
        category: 'mindfulness',
        points: 50,
        completed: false,
        inProgress: false,
        benefits: ['Reduce estrés', 'Mejora concentración', 'Aumenta claridad mental']
      },
      {
        id: '2',
        title: 'Caminata de 30 minutos',
        description: 'Da un paseo al aire libre durante 30 minutos para activar tu cuerpo y mente.',
        category: 'physical',
        points: 75,
        completed: false,
        inProgress: false
      },
      {
        id: '3',
        title: 'Diario de gratitud',
        description: 'Escribe 3 cosas por las que estés agradecido hoy.',
        category: 'mental',
        points: 40,
        completed: false,
        inProgress: false,
        benefits: ['Mejora ánimo', 'Reduce ansiedad', 'Aumenta felicidad']
      },
      {
        id: '4',
        title: 'Entrenamiento de fuerza',
        description: 'Completa una rutina básica de ejercicios de fuerza en casa.',
        category: 'physical',
        points: 100,
        completed: false,
        inProgress: false
      },
      {
        id: '5',
        title: 'Digital detox por 1 hora',
        description: 'Desconéctate de todas las pantallas durante una hora completa.',
        category: 'mental',
        points: 60,
        completed: false,
        inProgress: false
      },
      {
        id: '6',
        title: 'Comida consciente',
        description: 'Come al menos una comida hoy sin distracciones, enfocándote en cada bocado.',
        category: 'nutrition',
        points: 45,
        completed: false,
        inProgress: false
      },
      {
        id: '7',
        title: 'Rutina de estiramientos',
        description: 'Realiza 15 minutos de estiramientos para mejorar tu flexibilidad.',
        category: 'physical',
        points: 55,
        completed: false,
        inProgress: false
      },
      {
        id: '8',
        title: 'Respiración profunda',
        description: 'Practica la técnica de respiración 4-7-8 durante 5 minutos.',
        category: 'mindfulness',
        points: 35,
        completed: false,
        inProgress: false
      },
      {
        id: '9',
        title: 'Hidratación consciente',
        description: 'Toma 8 vasos de agua durante el día, registrando cada uno.',
        category: 'nutrition',
        points: 70,
        completed: false,
        inProgress: false
      }
    ];
  }
  
  private initializeDailyChallengesAsNotCompleted() {
    this.dailyChallenges = [
      {
        id: 'daily-1',
        title: 'Meditación matutina',
        description: 'Dedica 5 minutos por la mañana para meditar y centrar tu mente.',
        points: 30,
        completed: false,
        tags: ['Mindfulness', '5 min']
      },
      {
        id: 'daily-2',
        title: 'Estiramientos básicos',
        description: 'Realiza 10 minutos de estiramientos para activar tu cuerpo.',
        points: 25,
        completed: false,
        tags: ['Físico', '10 min']
      },
      {
        id: 'daily-3',
        title: 'Reflexión diaria',
        description: 'Tómate un momento para reflexionar sobre tu día.',
        points: 20,
        completed: false,
        tags: ['Mental', '5 min']
      },
      {
        id: 'daily-4',
        title: 'Hidratación completa',
        description: 'Bebe al menos 2 litros de agua durante el día.',
        points: 35,
        completed: false,
        tags: ['Nutrición', 'Salud']
      },
      {
        id: 'daily-5',
        title: 'Pausa digital',
        description: 'Descansa 20 minutos sin mirar ninguna pantalla.',
        points: 30,
        completed: false,
        tags: ['Digital', '20 min']
      },
      {
        id: 'daily-6',
        title: 'Respiración consciente',
        description: 'Practica la respiración profunda durante 3 minutos.',
        points: 20,
        completed: false,
        tags: ['Respiración', 'Calma']
      }
    ];
  }
  
  private loadUserProgress() {
    const savedProgress = localStorage.getItem('pearly-wellness-progress');
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        
        this.energyPoints = progress.energyPoints || 0;
        this.currentStreak = progress.currentStreak || 0;
        this.mentalHealth = progress.mentalHealth || 0;
        this.physicalHealth = progress.physicalHealth || 0;
        this.completedChallenges = progress.completedChallenges || 0;
        this.dailyTip = progress.dailyTip || this.dailyTip;
        
        const savedChallenges = progress.challenges;
        if (savedChallenges && Array.isArray(savedChallenges) && savedChallenges.length > 0) {
          this.initializeChallengesAsNotCompleted();
          
          this.challenges = this.challenges.map(challenge => {
            const saved = savedChallenges.find((c: any) => c.id === challenge.id);
            if (saved) {
              return { 
                ...challenge, 
                completed: saved.completed || false,
                inProgress: saved.inProgress || false
              };
            }
            return challenge;
          });
        }
        
        const savedDaily = progress.dailyChallenges;
        if (savedDaily && Array.isArray(savedDaily) && savedDaily.length > 0) {
          this.initializeDailyChallengesAsNotCompleted();
          
          this.dailyChallenges = this.dailyChallenges.map(daily => {
            const saved = savedDaily.find((d: any) => d.id === daily.id);
            if (saved) {
              return { ...daily, completed: saved.completed || false };
            }
            return daily;
          });
        }
        
      } catch (error) {
        console.error('Error cargando progreso:', error);
        this.resetAllProgress();
      }
    } else {
      this.resetAllProgress();
    }
    
    this.updateWellnessScore();
    this.calculateTotalChallenges();
  }
  
  private calculateTotalChallenges() {
    this.totalChallenges = this.challenges.length;
  }
  
  private updateWellnessScore() {
    this.wellnessScore = Math.round((this.mentalHealth + this.physicalHealth) / 2);
  }
  
  private resetAllProgress() {
    this.energyPoints = 0;
    this.currentStreak = 0;
    this.mentalHealth = 0;
    this.physicalHealth = 0;
    this.completedChallenges = 0;
    this.wellnessScore = 0;
    
    this.dailyTip = "Completa tu primer reto para desbloquear consejos personalizados.";
    
    this.initializeChallengesAsNotCompleted();
    this.initializeDailyChallengesAsNotCompleted();
    
    this.saveProgress();
  }
  
  private saveProgress() {
    const progress = {
      energyPoints: this.energyPoints,
      currentStreak: this.currentStreak,
      mentalHealth: this.mentalHealth,
      physicalHealth: this.physicalHealth,
      wellnessScore: this.wellnessScore,
      completedChallenges: this.completedChallenges,
      challenges: this.challenges.map(c => ({
        id: c.id,
        completed: c.completed,
        inProgress: c.inProgress
      })),
      dailyChallenges: this.dailyChallenges.map(d => ({
        id: d.id,
        completed: d.completed
      })),
      dailyTip: this.dailyTip,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('pearly-wellness-progress', JSON.stringify(progress));
  }
  
  getFilterIcon(filterId: string): string {
    const icons: Record<string, string> = {
      'all': '🌟',
      'mental': '🧠',
      'physical': '💪',
      'mindfulness': '🌿',
      'nutrition': '🍎'
    };
    return icons[filterId] || '📋';
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
      'mental': 'Salud Mental',
      'physical': 'Salud Física',
      'mindfulness': 'Mindfulness',
      'nutrition': 'Nutrición'
    };
    return names[category] || 'Bienestar';
  }
  
  handleChallengeAction(challenge: Challenge) {
    if (challenge.completed) return;
    this.completeChallenge(challenge.id);
  }
  
  setFilter(filterId: string) {
    this.activeFilter = filterId;
    this.notificationService.info(`Filtrando por: ${this.filters.find(f => f.id === filterId)?.label}`);
  }
  
  completeChallenge(challengeId: string) {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge && !challenge.completed) {
      challenge.completed = true;
      challenge.inProgress = false;
      
      this.energyPoints += challenge.points;
      this.completedChallenges++;
      
      switch(challenge.category) {
        case 'mental':
          this.mentalHealth = Math.min(100, this.mentalHealth + 8);
          break;
        case 'physical':
          this.physicalHealth = Math.min(100, this.physicalHealth + 8);
          break;
        case 'mindfulness':
          this.mentalHealth = Math.min(100, this.mentalHealth + 5);
          this.physicalHealth = Math.min(100, this.physicalHealth + 3);
          break;
        case 'nutrition':
          this.physicalHealth = Math.min(100, this.physicalHealth + 6);
          this.mentalHealth = Math.min(100, this.mentalHealth + 2);
          break;
      }
      
      this.notificationService.showChallengeCompleted(challenge.title, challenge.points);
      this.notificationService.showEnergyGained(challenge.points);
      
      this.updateWellnessScore();
      this.saveProgress();
      
      if (this.completedChallenges === 1) {
        this.dailyTip = "¡Buen trabajo en tu primer reto! Recuerda que la constancia es clave para el bienestar.";
        this.saveProgress();
      }
    }
  }
  
  completeDailyChallenge(dailyId: string) {
    const daily = this.dailyChallenges.find(d => d.id === dailyId);
    if (daily && !daily.completed) {
      daily.completed = true;
      
      this.energyPoints += daily.points;
      this.currentStreak++;
      
      this.saveChallengeProgress(dailyId);
      
      if (daily.tags.some(tag => ['Mental', 'Mindfulness', 'Respiración'].includes(tag))) {
        this.mentalHealth = Math.min(100, this.mentalHealth + 3);
      }
      
      if (daily.tags.some(tag => ['Físico'].includes(tag))) {
        this.physicalHealth = Math.min(100, this.physicalHealth + 3);
      }
      
      if (daily.tags.some(tag => ['Nutrición', 'Salud'].includes(tag))) {
        this.physicalHealth = Math.min(100, this.physicalHealth + 2);
        this.mentalHealth = Math.min(100, this.mentalHealth + 1);
      }
      
      this.notificationService.showDailyChallengeCompleted(daily.title, daily.points);
      this.notificationService.showStreakUpdated(this.currentStreak);
      this.notificationService.showEnergyGained(daily.points);
      
      this.updateWellnessScore();
      this.saveProgress();
    }
  }
  
  private saveChallengeProgress(challengeId: string) {
    const challengeKey = `challenge-${challengeId}-progress`;
    const savedProgress = localStorage.getItem(challengeKey);
    
    let currentProgress = 0;
    let maxProgress = 7;
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        currentProgress = progress.current || 0;
        maxProgress = progress.max || 7;
      } catch (e) {
        console.error('Error cargando progreso:', e);
      }
    }
    
    currentProgress = Math.min(maxProgress, currentProgress + 1);
    
    localStorage.setItem(challengeKey, JSON.stringify({
      current: currentProgress,
      max: maxProgress,
      lastUpdated: new Date().toISOString()
    }));
  }
  
  resetFilters() {
    this.activeFilter = 'all';
    this.notificationService.info('🌿 Mostrando todos los retos de bienestar');
  }
  
  refreshTip() {
    const tips = [
      "Los retos diarios son oportunidades para construir hábitos saludables.",
      "La consistencia en pequeños hábitos diarios crea grandes cambios a largo plazo.",
      "Cada reto completado te acerca a una versión más saludable de ti mismo.",
      "Equilibra retos mentales y físicos para un bienestar completo.",
      "Celebra cada reto diario completado. ¡Estás construyendo una mejor versión de ti!",
      "La magia está en la constancia. Los retos diarios te ayudan a mantener el rumbo.",
      "Pequeños pasos diarios te llevarán lejos en tu camino de bienestar.",
      "El bienestar es un viaje, disfruta cada pequeño logro.",
      "Hoy es un buen día para cuidar de ti. ¡Cada reto cuenta!",
      "Tu bienestar es una inversión, no un gasto. ¡Invierte en ti!"
    ];
    
    this.dailyTip = tips[Math.floor(Math.random() * tips.length)];
    this.notificationService.info('💡 Nuevo consejo de bienestar cargado', {
      duration: 2000
    });
    this.saveProgress();
  }
  
  public forceResetForNewUser() {
    localStorage.removeItem('pearly-wellness-progress');
    
    this.energyPoints = 0;
    this.currentStreak = 0;
    this.mentalHealth = 0;
    this.physicalHealth = 0;
    this.wellnessScore = 0;
    this.completedChallenges = 0;
    
    this.initializeChallengesAsNotCompleted();
    this.initializeDailyChallengesAsNotCompleted();
    
    this.dailyTip = "Completa tu primer reto para desbloquear consejos personalizados.";
    
    this.saveProgress();
    
    this.notificationService.success('🔄 Progreso reiniciado. Todos los retos están disponibles para completar.');
  }
}