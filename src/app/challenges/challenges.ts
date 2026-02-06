import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
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
  
  user = this.authService.user;
  userProfile = this.userService.getUser();
  
  // ESTADÍSTICAS VACÍAS AL INICIO
  energyPoints = 0;
  currentStreak = 0;
  wellnessScore = 0;
  mentalHealth = 0;
  physicalHealth = 0;
  
  completedChallenges = 0;
  totalChallenges = 0;
  
  // Consejo del día
  dailyTip = "Completa tu primer reto para desbloquear consejos personalizados.";
  
  // Filtros para bienestar
  filters: Filter[] = [
    { id: 'all', label: 'Todos' },
    { id: 'mental', label: 'Mental' },
    { id: 'physical', label: 'Físico' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'nutrition', label: 'Nutrición' }
  ];
  
  activeFilter = 'all';
  
  // RETOS BASE (todos incompletos al inicio)
  challenges: Challenge[] = [
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
  
  // RETOS DIARIOS - Siempre disponibles
  dailyChallenges: DailyChallenge[] = [
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
  
  get filteredChallenges(): Challenge[] {
    if (this.activeFilter === 'all') return this.challenges;
    return this.challenges.filter(c => c.category === this.activeFilter);
  }
  
  ngOnInit() {
    this.loadUserProgress();
    this.calculateTotalChallenges();
  }
  
  // Carga el progreso del usuario desde localStorage
  private loadUserProgress() {
    const savedProgress = localStorage.getItem('pearly-wellness-progress');
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        
        // Cargar estadísticas
        this.energyPoints = progress.energyPoints || 0;
        this.currentStreak = progress.currentStreak || 0;
        this.mentalHealth = progress.mentalHealth || 0;
        this.physicalHealth = progress.physicalHealth || 0;
        this.completedChallenges = progress.completedChallenges || 0;
        
        // Cargar estado de retos principales
        const savedChallenges = progress.challenges;
        if (savedChallenges && Array.isArray(savedChallenges)) {
          this.challenges = this.challenges.map(challenge => {
            const saved = savedChallenges.find((c: any) => c.id === challenge.id);
            return saved ? { ...challenge, ...saved } : challenge;
          });
        }
        
        // Cargar estado de retos diarios
        const savedDaily = progress.dailyChallenges;
        if (savedDaily && Array.isArray(savedDaily)) {
          this.dailyChallenges = this.dailyChallenges.map(daily => {
            const saved = savedDaily.find((d: any) => d.id === daily.id);
            return saved ? { ...daily, ...saved } : daily;
          });
        }
        
        // Cargar consejo del día si existe
        if (progress.dailyTip) {
          this.dailyTip = progress.dailyTip;
        }
        
      } catch (error) {
        console.error('Error cargando progreso:', error);
        // Si hay error, empezar desde cero
        this.resetAllProgress();
      }
    } else {
      // No hay progreso guardado, empezar desde cero
      this.resetAllProgress();
    }
    
    this.updateWellnessScore();
    this.calculateTotalChallenges();
  }
  
  // Calcula el total de retos disponibles
  private calculateTotalChallenges() {
    this.totalChallenges = this.challenges.length;
  }
  
  // Actualiza el score de bienestar
  private updateWellnessScore() {
    this.wellnessScore = Math.round((this.mentalHealth + this.physicalHealth) / 2);
  }
  
  // Reinicia todo el progreso
  private resetAllProgress() {
    this.energyPoints = 0;
    this.currentStreak = 0;
    this.mentalHealth = 0;
    this.physicalHealth = 0;
    this.completedChallenges = 0;
    this.wellnessScore = 0;
    
    // Resetear todos los retos principales a no completados
    this.challenges = this.challenges.map(challenge => ({
      ...challenge,
      completed: false,
      inProgress: false
    }));
    
    // Resetear retos diarios
    this.dailyChallenges = this.dailyChallenges.map(daily => ({
      ...daily,
      completed: false
    }));
    
    this.saveProgress();
  }
  
  // Guarda el progreso en localStorage
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
    
    // Marcar como completado
    this.completeChallenge(challenge.id);
  }
  
  setFilter(filterId: string) {
    this.activeFilter = filterId;
    this.showToast(`Filtrando por: ${this.filters.find(f => f.id === filterId)?.label}`);
  }
  
  // Completa un reto principal
  completeChallenge(challengeId: string) {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge && !challenge.completed) {
      challenge.completed = true;
      challenge.inProgress = false;
      
      // Añadir puntos de energía
      this.energyPoints += challenge.points;
      
      // Aumentar contador de retos completados
      this.completedChallenges++;
      
      // Actualizar estadísticas según categoría
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
      
      // Mostrar mensaje
      const categoryMessages = {
        'mental': '🧠 Reto mental completado',
        'physical': '💪 Reto físico completado',
        'mindfulness': '🌿 Práctica de mindfulness completada',
        'nutrition': '🍎 Reto nutricional completado'
      };
      
      this.showToast(`${categoryMessages[challenge.category]}: "${challenge.title}" - +${challenge.points} ⚡`);
      
      // Actualizar score y guardar
      this.updateWellnessScore();
      this.saveProgress();
      
      // Si es el primer reto completado, actualizar consejo
      if (this.completedChallenges === 1) {
        this.dailyTip = "¡Buen trabajo en tu primer reto! Recuerda que la constancia es clave para el bienestar.";
        this.saveProgress();
      }
    }
  }
  
  // Completa un reto diario
  completeDailyChallenge(dailyId: string) {
    const daily = this.dailyChallenges.find(d => d.id === dailyId);
    if (daily && !daily.completed) {
      daily.completed = true;
      
      // Añadir puntos de energía
      this.energyPoints += daily.points;
      
      // Aumentar racha
      this.currentStreak++;
      
      // Aumentar estadísticas según tags
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
      
      this.showToast(`✨ Reto diario completado: "${daily.title}" - +${daily.points} ⚡`);
      
      this.updateWellnessScore();
      this.saveProgress();
    }
  }
  
  // Reiniciar filtros
  resetFilters() {
    this.activeFilter = 'all';
    this.showToast('🌿 Mostrando todos los retos de bienestar');
  }
  
  // Refrescar consejo
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
    this.showToast('💡 Nuevo consejo de bienestar cargado');
    this.saveProgress();
  }
  
  // Método para mostrar notificaciones
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
      toast.style.animation = 'slideOut 0.3s ease';
      
      setTimeout(() => {
        toast.remove();
        if (toastContainer && toastContainer.children.length === 0) {
          toastContainer.remove();
        }
      }, 300);
    }, 3000);
  }
}