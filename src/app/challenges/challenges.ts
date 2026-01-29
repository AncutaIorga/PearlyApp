import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'mental' | 'physical' | 'mindfulness' | 'nutrition';
  points: number;
  duration: string;
  participants: number;
  completed: boolean;
  inProgress: boolean;
  difficulty: 'Fácil' | 'Moderado' | 'Desafiante';
  benefits?: string[];
  progress?: {
    current: number;
    total: number;
  };
}

interface DailyChallenge {
  id: string;
  day: number;
  title: string;
  description: string;
  points: number;
  claimed: boolean;
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
    NavbarComponent
  ],
  templateUrl: './challenges.html',
  styleUrls: ['./challenges.css']
})
export class ChallengesComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  
  user = this.authService.user;
  userProfile = this.userService.getUser();
  
  // Estadísticas de bienestar
  energyPoints = 850;
  currentStreak = 7;
  wellnessScore = 78;
  mentalHealth = 75;
  physicalHealth = 80;
  
  completedChallenges = 5;
  totalChallenges = 12;
  
  // Consejo del día
  dailyTip = "Hoy, tómate 5 minutos para respirar profundamente. Inhala durante 4 segundos, mantén 4 segundos, exhala 6 segundos. Reduce el estrés instantáneamente.";
  
  // Filtros para bienestar
  filters: Filter[] = [
    { id: 'all', label: 'Todos' },
    { id: 'mental', label: 'Mental' },
    { id: 'physical', label: 'Físico' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'nutrition', label: 'Nutrición' }
  ];
  
  activeFilter = 'all';
  
  // Retos de bienestar
  challenges: Challenge[] = [
    {
      id: '1',
      title: 'Meditación de 10 minutos',
      description: 'Encuentra un lugar tranquilo y medita durante 10 minutos para calmar tu mente.',
      category: 'mindfulness',
      points: 50,
      duration: '1 día',
      participants: 2450,
      completed: true,
      inProgress: false,
      difficulty: 'Fácil',
      benefits: ['Reduce estrés', 'Mejora concentración', 'Aumenta claridad mental']
    },
    {
      id: '2',
      title: 'Caminata de 30 minutos',
      description: 'Da un paseo al aire libre durante 30 minutos para activar tu cuerpo y mente.',
      category: 'physical',
      points: 75,
      duration: '1 día',
      participants: 1876,
      completed: false,
      inProgress: true,
      difficulty: 'Fácil',
      progress: { current: 20, total: 30 }
    },
    {
      id: '3',
      title: 'Diario de gratitud',
      description: 'Escribe 3 cosas por las que estés agradecido hoy.',
      category: 'mental',
      points: 40,
      duration: '7 días',
      participants: 1543,
      completed: false,
      inProgress: false,
      difficulty: 'Fácil',
      benefits: ['Mejora ánimo', 'Reduce ansiedad', 'Aumenta felicidad']
    },
    {
      id: '4',
      title: 'Entrenamiento de fuerza',
      description: 'Completa una rutina básica de ejercicios de fuerza en casa.',
      category: 'physical',
      points: 100,
      duration: '3 días',
      participants: 932,
      completed: false,
      inProgress: false,
      difficulty: 'Moderado'
    },
    {
      id: '5',
      title: 'Digital detox por 1 hora',
      description: 'Desconéctate de todas las pantallas durante una hora completa.',
      category: 'mental',
      points: 60,
      duration: '1 día',
      participants: 1321,
      completed: false,
      inProgress: false,
      difficulty: 'Moderado'
    },
    {
      id: '6',
      title: 'Comida consciente',
      description: 'Come al menos una comida hoy sin distracciones, enfocándote en cada bocado.',
      category: 'nutrition',
      points: 45,
      duration: '1 día',
      participants: 876,
      completed: true,
      inProgress: false,
      difficulty: 'Fácil'
    },
    {
      id: '7',
      title: 'Rutina de estiramientos',
      description: 'Realiza 15 minutos de estiramientos para mejorar tu flexibilidad.',
      category: 'physical',
      points: 55,
      duration: '5 días',
      participants: 654,
      completed: false,
      inProgress: false,
      difficulty: 'Fácil',
      progress: { current: 2, total: 5 }
    },
    {
      id: '8',
      title: 'Respiración profunda',
      description: 'Practica la técnica de respiración 4-7-8 durante 5 minutos.',
      category: 'mindfulness',
      points: 35,
      duration: '1 día',
      participants: 2345,
      completed: false,
      inProgress: false,
      difficulty: 'Fácil'
    },
    {
      id: '9',
      title: 'Hidratación consciente',
      description: 'Toma 8 vasos de agua durante el día, registrando cada uno.',
      category: 'nutrition',
      points: 70,
      duration: '3 días',
      participants: 1876,
      completed: false,
      inProgress: false,
      difficulty: 'Moderado'
    }
  ];
  
  // Retos diarios de bienestar
  dailyChallenges: DailyChallenge[] = [
    {
      id: 'd1',
      day: 1,
      title: 'Levántate y estírate',
      description: 'Haz 5 minutos de estiramientos al despertar.',
      points: 25,
      claimed: true,
      tags: ['Mañana', 'Fácil', 'Energía']
    },
    {
      id: 'd2',
      day: 2,
      title: 'Bebe agua con limón',
      description: 'Comienza el día con un vaso de agua tibia con limón.',
      points: 20,
      claimed: true,
      tags: ['Hidratación', 'Salud']
    },
    {
      id: 'd3',
      day: 3,
      title: 'Pausa activa de 5 min',
      description: 'Toma 5 minutos para moverte durante tu jornada.',
      points: 30,
      claimed: false,
      tags: ['Trabajo', 'Movimiento']
    },
    {
      id: 'd4',
      day: 4,
      title: 'Agradece algo hoy',
      description: 'Reflexiona sobre algo positivo en tu vida.',
      points: 15,
      claimed: false,
      tags: ['Mental', 'Gratitud']
    },
    {
      id: 'd5',
      day: 5,
      title: 'Cena sin pantallas',
      description: 'Disfruta tu cena sin dispositivos electrónicos.',
      points: 35,
      claimed: false,
      tags: ['Nutrición', 'Mindfulness']
    }
  ];
  
  get filteredChallenges(): Challenge[] {
    if (this.activeFilter === 'all') return this.challenges;
    return this.challenges.filter(c => c.category === this.activeFilter);
  }
  
  ngOnInit() {
    this.loadWellnessProgress();
    this.updateWellnessScore();
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
  
  getActionButtonText(challenge: Challenge): string {
    const texts: Record<string, string> = {
      'mental': '🧠 Comenzar',
      'physical': '💪 Comenzar',
      'mindfulness': '🌿 Comenzar',
      'nutrition': '🍎 Comenzar'
    };
    return texts[challenge.category] || '🚀 Comenzar';
  }
  
  handleChallengeAction(challenge: Challenge) {
    if (challenge.completed) return;
    
    if (challenge.inProgress) {
      this.continueChallenge(challenge.id);
    } else {
      this.startChallenge(challenge.id);
    }
  }
  
  setFilter(filterId: string) {
    this.activeFilter = filterId;
  }
  
  startChallenge(challengeId: string) {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge && !challenge.completed) {
      challenge.inProgress = true;
      
      // Mostrar mensaje según categoría
      const categoryMessages = {
        'mental': '🧠 Comenzando reto mental',
        'physical': '💪 Comenzando reto físico',
        'mindfulness': '🌿 Comenzando práctica de mindfulness',
        'nutrition': '🍎 Comenzando reto nutricional'
      };
      
      this.showToast(`${categoryMessages[challenge.category]}: "${challenge.title}"`);
      
      if (!challenge.progress) {
        challenge.progress = { current: 0, total: 1 };
      }
      
      setTimeout(() => {
        if (challenge.progress) {
          challenge.progress.current++;
          if (challenge.progress.current >= challenge.progress.total) {
            this.completeChallenge(challengeId);
          }
          this.saveWellnessProgress();
        }
      }, 2000);
      
      this.updateWellnessStats();
      this.saveWellnessProgress();
    }
  }
  
  private continueChallenge(challengeId: string) {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge && challenge.inProgress && !challenge.completed) {
      this.showToast(`⏳ Continuando reto: "${challenge.title}"`);
      
      if (challenge.progress) {
        challenge.progress.current++;
        
        if (challenge.progress.current >= challenge.progress.total) {
          setTimeout(() => {
            this.completeChallenge(challengeId);
          }, 1000);
        }
        
        this.saveWellnessProgress();
      }
    }
  }
  
  completeChallenge(challengeId: string) {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.completed = true;
      challenge.inProgress = false;
      this.energyPoints += challenge.points;
      this.completedChallenges++;
      
      // Actualizar estadísticas según categoría
      switch(challenge.category) {
        case 'mental':
          this.mentalHealth = Math.min(100, this.mentalHealth + 5);
          break;
        case 'physical':
          this.physicalHealth = Math.min(100, this.physicalHealth + 5);
          break;
        case 'mindfulness':
          this.mentalHealth = Math.min(100, this.mentalHealth + 3);
          this.physicalHealth = Math.min(100, this.physicalHealth + 2);
          break;
        case 'nutrition':
          this.physicalHealth = Math.min(100, this.physicalHealth + 4);
          break;
      }
      
      this.showToast(`🎉 Reto completado! +${challenge.points} ⚡ de energía`);
      this.updateWellnessScore();
      this.updateWellnessStats();
      this.saveWellnessProgress();
    }
  }
  
  claimDaily(dailyId: string) {
    const daily = this.dailyChallenges.find(d => d.id === dailyId);
    if (daily && !daily.claimed) {
      daily.claimed = true;
      this.energyPoints += daily.points;
      this.currentStreak++;
      this.showToast(`✨ Hábito completado! +${daily.points} ⚡ y racha: ${this.currentStreak} días 🔥`);
      this.saveWellnessProgress();
    }
  }
  
  resetFilters() {
    this.activeFilter = 'all';
    this.showToast('🌿 Mostrando todos los retos de bienestar');
  }
  
  refreshTip() {
    const tips = [
      "Recuerda beber agua regularmente durante el día. La hidratación es clave para el funcionamiento óptimo del cuerpo y la mente.",
      "Cuando te sientas estresado, prueba la técnica 5-5-5: Nombra 5 cosas que ves, 4 que sientes, 3 que oyes, 2 que hueles y 1 que saboreas.",
      "Programa pausas activas cada 50 minutos de trabajo. Levántate, estírate y camina unos minutos para reactivar la circulación.",
      "Antes de dormir, escribe 3 logros del día, por pequeños que sean. Esto mejora la autoestima y la calidad del sueño.",
      "Practica la alimentación consciente: come despacio, mastica bien y disfruta cada bocado sin distracciones.",
      "Incorpora ejercicios de respiración profunda en tu rutina matutina para empezar el día con calma y claridad.",
      "Dedica 10 minutos al día a una actividad que realmente disfrutes, sin sentir que es una obligación.",
      "Cuando hagas ejercicio, concéntrate en cómo se siente tu cuerpo en movimiento, no solo en los resultados.",
      "Establece límites digitales: designa momentos del día sin dispositivos para reconectar contigo mismo.",
      "Practica la autocompasión: habla contigo mismo como lo harías con un buen amigo."
    ];
    
    this.dailyTip = tips[Math.floor(Math.random() * tips.length)];
    this.showToast('💡 Nuevo consejo de bienestar cargado');
  }
  
  getProgressPercentage(): number {
    return (this.completedChallenges / this.totalChallenges) * 100;
  }
  
  private updateWellnessScore() {
    this.wellnessScore = Math.round((this.mentalHealth + this.physicalHealth) / 2);
  }
  
  private updateWellnessStats() {
    // Simular mejora gradual en las estadísticas
    if (this.energyPoints > 1000) {
      this.currentStreak = Math.max(this.currentStreak, Math.floor(this.energyPoints / 150));
    }
  }
  
  private loadWellnessProgress() {
    const savedProgress = localStorage.getItem('pearly-wellness-progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        this.energyPoints = progress.energyPoints || this.energyPoints;
        this.currentStreak = progress.currentStreak || this.currentStreak;
        this.mentalHealth = progress.mentalHealth || this.mentalHealth;
        this.physicalHealth = progress.physicalHealth || this.physicalHealth;
        this.completedChallenges = progress.completedChallenges || this.completedChallenges;
        
        const savedChallenges = progress.challenges;
        if (savedChallenges && Array.isArray(savedChallenges)) {
          this.challenges = this.challenges.map(challenge => {
            const saved = savedChallenges.find((c: any) => c.id === challenge.id);
            return saved ? { ...challenge, ...saved } : challenge;
          });
        }
        
        const savedDaily = progress.dailyChallenges;
        if (savedDaily && Array.isArray(savedDaily)) {
          this.dailyChallenges = this.dailyChallenges.map(daily => {
            const saved = savedDaily.find((d: any) => d.id === daily.id);
            return saved ? { ...daily, ...saved } : daily;
          });
        }
        
        this.updateWellnessScore();
      } catch (error) {
        console.error('Error cargando progreso de bienestar:', error);
      }
    }
  }
  
  private saveWellnessProgress() {
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
        inProgress: c.inProgress,
        progress: c.progress
      })),
      dailyChallenges: this.dailyChallenges.map(d => ({
        id: d.id,
        claimed: d.claimed
      })),
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('pearly-wellness-progress', JSON.stringify(progress));
  }
  
  private showToast(message: string) {
    let toastContainer = document.querySelector('.toast-container') as HTMLElement;
    
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      background: linear-gradient(135deg, #4a90e2 0%, #5cdb95 100%);
      color: white;
      padding: 14px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(74, 144, 226, 0.3);
      font-weight: 600;
      font-size: 0.95rem;
      animation: slideIn 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
      backdrop-filter: blur(10px);
    `;
    
    if (!document.querySelector('#toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.cssText = `
        background: linear-gradient(135deg, #4a90e2 0%, #5cdb95 100%);
        color: white;
        padding: 14px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(74, 144, 226, 0.3);
        font-weight: 600;
        font-size: 0.95rem;
        animation: slideOut 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
        backdrop-filter: blur(10px);
      `;
      
      setTimeout(() => {
        toast.remove();
        if (toastContainer && toastContainer.children.length === 0) {
          toastContainer.remove();
        }
      }, 300);
    }, 3000);
  }
  
  // Métodos adicionales para bienestar
  getMotivationalQuote(): string {
    const quotes = [
      "Cuida tu cuerpo, es el único lugar que tienes para vivir. - Jim Rohn",
      "La salud es la mayor posesión. La alegría es el mayor tesoro. - Lao Tzu",
      "El autocuidado no es egoísta, es esencial.",
      "Pequeños pasos diarios llevan a grandes cambios.",
      "Tu cuerpo te agradece cada elección saludable.",
      "La mente sana comienza con un cuerpo sano, y viceversa."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  
  // Calorías quemadas estimadas (para retos físicos)
  getEstimatedCalories(challenge: Challenge): number {
    if (challenge.category !== 'physical') return 0;
    
    const baseCalories: Record<string, number> = {
      'Fácil': 50,
      'Moderado': 120,
      'Desafiante': 200
    };
    
    return baseCalories[challenge.difficulty] || 0;
  }
}