import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  order?: number; // Para mantener el orden original
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
    NavbarComponent
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
  private currentUserId: string = 'anonymous';
  private originalChallenges: Challenge[] = []; // Guardar orden original
  
  get filteredChallenges(): Challenge[] {
    let filtered = this.challenges;
    
    // Filtrar por categoría si no es 'all'
    if (this.activeFilter !== 'all') {
      filtered = this.challenges.filter(c => c.category === this.activeFilter);
    }
    
    // Separar completados y no completados
    const completed = filtered.filter(c => c.completed === true);
    const notCompleted = filtered.filter(c => c.completed === false);
    
    // Ordenar no completados aleatoriamente
    const shuffledNotCompleted = this.shuffleArray([...notCompleted]);
    
    // Si es 'all', mantener orden aleatorio, si es por categoría, ordenar por puntos o ID
    if (this.activeFilter === 'all') {
      // Para 'all': aleatorio + completados abajo
      return [...shuffledNotCompleted, ...completed];
    } else {
      // Para categorías específicas: ordenar por puntos o como prefieras
      const sortedNotCompleted = shuffledNotCompleted.sort((a, b) => b.points - a.points);
      return [...sortedNotCompleted, ...completed];
    }
  }
  
  // Función para mezclar array aleatoriamente (Fisher-Yates)
  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  ngOnInit() {
    // Obtener el email del usuario actual como identificador único
    const userData = this.user();
    if (userData && userData.email) {
      this.currentUserId = userData.email.replace(/[.#$[\]]/g, '_');
    } else {
      this.currentUserId = 'anonymous';
    }
    
    // Inicializar retos SIN COMPLETAR siempre primero
    this.initializeChallengesAsNotCompleted();
    this.initializeDailyChallengesAsNotCompleted();
    
    // Guardar orden original
    this.originalChallenges = [...this.challenges];
    
    // Cargar progreso específico del usuario
    this.loadUserProgress();
    
    this.calculateTotalChallenges();
    
    setTimeout(() => {
      this.checkForFocusedChallenge();
    }, 500);
  }
  
  private getStorageKey(): string {
    return `pearly-wellness-progress-${this.currentUserId}`;
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
      // ===== RETOS MENTALES (6) =====
      {
        id: 'mental-1',
        title: 'Diario de gratitud',
        description: 'Escribe 3 cosas por las que estés agradecido hoy.',
        category: 'mental',
        points: 40,
        completed: false,
        inProgress: false,
        benefits: ['Mejora ánimo', 'Reduce ansiedad', 'Aumenta felicidad']
      },
      {
        id: 'mental-2',
        title: 'Digital detox por 1 hora',
        description: 'Desconéctate de todas las pantallas durante una hora completa.',
        category: 'mental',
        points: 60,
        completed: false,
        inProgress: false,
        benefits: ['Reduce estrés digital', 'Mejora concentración', 'Aumenta productividad']
      },
      {
        id: 'mental-3',
        title: 'Lectura de 20 minutos',
        description: 'Lee un libro o artículo que te inspire durante 20 minutos.',
        category: 'mental',
        points: 45,
        completed: false,
        inProgress: false,
        benefits: ['Estimula mente', 'Reduce estrés', 'Aumenta conocimiento']
      },
      {
        id: 'mental-4',
        title: 'Visualización positiva',
        description: 'Imagina tu mejor versión y visualiza tus metas cumplidas por 5 minutos.',
        category: 'mental',
        points: 35,
        completed: false,
        inProgress: false,
        benefits: ['Aumenta motivación', 'Clarifica objetivos', 'Reduce ansiedad']
      },
      {
        id: 'mental-5',
        title: 'Afirmaciones matutinas',
        description: 'Repite 5 afirmaciones positivas frente al espejo.',
        category: 'mental',
        points: 30,
        completed: false,
        inProgress: false,
        benefits: ['Mejora autoestima', 'Reduce diálogo interno negativo', 'Empodera']
      },
      {
        id: 'mental-6',
        title: 'Organizar un espacio',
        description: 'Ordena un cajón, estante o área pequeña de tu hogar.',
        category: 'mental',
        points: 65,
        completed: false,
        inProgress: false,
        benefits: ['Reduce ansiedad', 'Aumenta sensación de control', 'Claridad mental']
      },
      
      // ===== RETOS FÍSICOS (6) =====
      {
        id: 'physical-1',
        title: 'Caminata de 30 minutos',
        description: 'Da un paseo al aire libre durante 30 minutos para activar tu cuerpo y mente.',
        category: 'physical',
        points: 75,
        completed: false,
        inProgress: false,
        benefits: ['Mejora circulación', 'Quema calorías', 'Despeja mente']
      },
      {
        id: 'physical-2',
        title: 'Entrenamiento de fuerza',
        description: 'Completa una rutina básica de ejercicios de fuerza en casa (15 min).',
        category: 'physical',
        points: 100,
        completed: false,
        inProgress: false,
        benefits: ['Tonifica músculos', 'Fortalece huesos', 'Mejora metabolismo']
      },
      {
        id: 'physical-3',
        title: 'Rutina de estiramientos',
        description: 'Realiza 15 minutos de estiramientos para mejorar tu flexibilidad.',
        category: 'physical',
        points: 55,
        completed: false,
        inProgress: false,
        benefits: ['Previene lesiones', 'Mejora postura', 'Reduce tensión muscular']
      },
      {
        id: 'physical-4',
        title: 'Subir escaleras',
        description: 'Sube y baja escaleras durante 10 minutos en lugar de usar el ascensor.',
        category: 'physical',
        points: 85,
        completed: false,
        inProgress: false,
        benefits: ['Fortalece piernas', 'Mejora capacidad cardiovascular', 'Quema calorías']
      },
      {
        id: 'physical-5',
        title: 'Baile libre',
        description: 'Pon tu música favorita y baila durante 15 minutos.',
        category: 'physical',
        points: 60,
        completed: false,
        inProgress: false,
        benefits: ['Libera endorfinas', 'Mejora coordinación', 'Divertido']
      },
      {
        id: 'physical-6',
        title: 'Yoga matutino',
        description: 'Realiza 20 minutos de yoga para activar el cuerpo.',
        category: 'physical',
        points: 90,
        completed: false,
        inProgress: false,
        benefits: ['Mejora flexibilidad', 'Reduce estrés', 'Equilibra cuerpo-mente']
      },
      
      // ===== RETOS MINDFULNESS (6) =====
      {
        id: 'mindfulness-1',
        title: 'Meditación de 10 minutos',
        description: 'Encuentra un lugar tranquilo y medita durante 10 minutos para calmar tu mente.',
        category: 'mindfulness',
        points: 50,
        completed: false,
        inProgress: false,
        benefits: ['Reduce estrés', 'Mejora concentración', 'Aumenta claridad mental']
      },
      {
        id: 'mindfulness-2',
        title: 'Respiración profunda',
        description: 'Practica la técnica de respiración 4-7-8 durante 5 minutos.',
        category: 'mindfulness',
        points: 35,
        completed: false,
        inProgress: false,
        benefits: ['Calma sistema nervioso', 'Reduce ansiedad', 'Mejora sueño']
      },
      {
        id: 'mindfulness-3',
        title: 'Escaneo corporal',
        description: 'Recorre mentalmente cada parte de tu cuerpo durante 10 minutos.',
        category: 'mindfulness',
        points: 65,
        completed: false,
        inProgress: false,
        benefits: ['Conexión cuerpo-mente', 'Detecta tensiones', 'Relajación profunda']
      },
      {
        id: 'mindfulness-4',
        title: 'Observación consciente',
        description: 'Observa un objeto durante 5 minutos con atención plena.',
        category: 'mindfulness',
        points: 40,
        completed: false,
        inProgress: false,
        benefits: ['Entrena atención', 'Calma mente', 'Presente']
      },
      {
        id: 'mindfulness-5',
        title: 'Caminata mindfulness',
        description: 'Camina 10 minutos prestando atención a cada paso y tu respiración.',
        category: 'mindfulness',
        points: 70,
        completed: false,
        inProgress: false,
        benefits: ['Meditación en movimiento', 'Conexión con entorno', 'Paz interior']
      },
      {
        id: 'mindfulness-6',
        title: 'Gratitud mindfulness',
        description: 'Siéntate 5 minutos sintiendo profundamente la gratitud por algo.',
        category: 'mindfulness',
        points: 75,
        completed: false,
        inProgress: false,
        benefits: ['Cultiva bienestar', 'Aumenta felicidad', 'Conexión emocional']
      },
      
      // ===== RETOS NUTRICIÓN (6) =====
      {
        id: 'nutrition-1',
        title: 'Comida consciente',
        description: 'Come al menos una comida hoy sin distracciones, enfocándote en cada bocado.',
        category: 'nutrition',
        points: 45,
        completed: false,
        inProgress: false,
        benefits: ['Mejora digestión', 'Reconoce saciedad', 'Disfruta alimentos']
      },
      {
        id: 'nutrition-2',
        title: 'Hidratación consciente',
        description: 'Toma 8 vasos de agua durante el día, registrando cada uno.',
        category: 'nutrition',
        points: 70,
        completed: false,
        inProgress: false,
        benefits: ['Hidrata cuerpo', 'Mejora piel', 'Aumenta energía']
      },
      {
        id: 'nutrition-3',
        title: 'Desayuno saludable',
        description: 'Prepara un desayuno equilibrado con proteínas, fibra y fruta.',
        category: 'nutrition',
        points: 55,
        completed: false,
        inProgress: false,
        benefits: ['Energía duradera', 'Mejora metabolismo', 'Evita picos de hambre']
      },
      {
        id: 'nutrition-4',
        title: 'Batch cooking',
        description: 'Prepara comidas saludables para 3 días (verduras, proteínas, granos).',
        category: 'nutrition',
        points: 90,
        completed: false,
        inProgress: false,
        benefits: ['Ahorra tiempo', 'Evita comida chatarra', 'Planificación']
      },
      {
        id: 'nutrition-5',
        title: '5 porciones de vegetales',
        description: 'Consume al menos 5 porciones de frutas y verduras hoy.',
        category: 'nutrition',
        points: 100,
        completed: false,
        inProgress: false,
        benefits: ['Vitaminas y minerales', 'Fibra', 'Antioxidantes']
      },
      {
        id: 'nutrition-6',
        title: 'Reducir azúcar',
        description: 'Evita azúcares añadidos durante todo el día.',
        category: 'nutrition',
        points: 85,
        completed: false,
        inProgress: false,
        benefits: ['Estabiliza energía', 'Mejora salud dental', 'Control peso']
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
    const storageKey = this.getStorageKey();
    const savedProgress = localStorage.getItem(storageKey);
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        
        this.energyPoints = progress.energyPoints || 0;
        this.currentStreak = progress.currentStreak || 0;
        this.mentalHealth = progress.mentalHealth || 0;
        this.physicalHealth = progress.physicalHealth || 0;
        this.completedChallenges = progress.completedChallenges || 0;
        this.dailyTip = progress.dailyTip || this.dailyTip;
        
        // Aplicar estados completados SOLO si existen en el progreso guardado
        const savedChallenges = progress.challenges;
        if (savedChallenges && Array.isArray(savedChallenges) && savedChallenges.length > 0) {
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
        this.resetToInitialState();
      }
    } else {
      // No hay progreso para este usuario -> estado inicial
      this.resetToInitialState();
    }
    
    this.updateWellnessScore();
  }
  
  private resetToInitialState() {
    this.energyPoints = 0;
    this.currentStreak = 0;
    this.mentalHealth = 0;
    this.physicalHealth = 0;
    this.completedChallenges = 0;
    this.wellnessScore = 0;
    
    this.dailyTip = "Completa tu primer reto para desbloquear consejos personalizados.";
    
    this.initializeChallengesAsNotCompleted();
    this.initializeDailyChallengesAsNotCompleted();
    
    // Guardar el estado inicial para este usuario
    this.saveProgress();
  }
  
  private calculateTotalChallenges() {
    this.totalChallenges = this.challenges.length;
  }
  
  private updateWellnessScore() {
    this.wellnessScore = Math.round((this.mentalHealth + this.physicalHealth) / 2);
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
    
    const storageKey = this.getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(progress));
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
    const challengeKey = `challenge-${challengeId}-progress-${this.currentUserId}`;
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
}