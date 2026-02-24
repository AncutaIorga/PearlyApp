import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';
import { ChallengeService, Challenge, DailyChallengeDef } from '../services/challenge';

interface ChallengeState extends Challenge {
  completed: boolean;
  inProgress: boolean;
}

interface DailyChallengeState extends DailyChallengeDef {
  completed: boolean;
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
  private challengeService = inject(ChallengeService);
  
  user = this.authService.user;
  userProfile = this.userService.getUser();
  
  energyPoints = 0;
  totalPoints = 0; // ✅ Variable crítica para el nivel
  currentStreak = 0;
  wellnessScore = 0;
  mentalHealth = 0;
  physicalHealth = 0;
  mindfulnessScore = 0;
  nutritionScore = 0;
  
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
  challenges: ChallengeState[] = [];
  dailyChallenges: DailyChallengeState[] = [];
  private currentUserId: string = 'anonymous';
  
  showCustomConfirmModal = false;
  challengeToConfirm: ChallengeState | null = null;
  
  get filteredChallenges(): ChallengeState[] {
    let filtered = this.challenges;
    if (this.activeFilter !== 'all') {
      filtered = this.challenges.filter(c => c.category === this.activeFilter);
    }
    const completed = filtered.filter(c => c.completed);
    const notCompleted = filtered.filter(c => !c.completed);
    return [...notCompleted, ...completed];
  }
  
  ngOnInit() {
    // ✅ 1. OBTENCIÓN SEGURA DEL ID (Evita guardar en 'anonymous')
    const email = this.authService.getCurrentUserEmail();
    this.currentUserId = email ? email.replace(/[.#$[\]]/g, '_') : 'anonymous';
    
    this.initializeFromService();
    this.loadUserProgress();
    this.calculateTotalChallenges();
    setTimeout(() => this.checkForFocusedChallenge(), 500);
  }

  private initializeFromService() {
    this.challenges = this.challengeService.getAllChallenges().map(c => ({
      ...c, completed: false, inProgress: false
    }));
    this.dailyChallenges = this.challengeService.getAllDailyChallenges().map(d => ({
      ...d, completed: false
    }));
  }

  getFilterIcon(filterId: string): string {
    const icons: Record<string, string> = {
      'all': '⟡', 'mental': '⚛︎', 'physical': '⚡︎', 'mindfulness': '☘︎', 'nutrition': '❧'
    };
    return icons[filterId] || '📋';
  }

  resetFilters() {
    this.activeFilter = 'all';
    this.notificationService.info('🌿 Mostrando todos los retos de bienestar');
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = { 
      mental: '⚛︎', physical: '⚡︎', mindfulness: '☘︎', nutrition: '❧' 
    };
    return icons[category] || '🌟';
  }
  
  getCategoryName(category: string): string {
    const names: Record<string, string> = { mental: 'Mental', physical: 'Físico', mindfulness: 'Mindfulness', nutrition: 'Nutrición' };
    return names[category] || 'Bienestar';
  }

  private loadUserProgress() {
    const saved = localStorage.getItem(`pearly-wellness-progress-${this.currentUserId}`);
    if (saved) {
      const p = JSON.parse(saved);
      
      this.energyPoints = p.energyPoints || 0;
      this.totalPoints = p.totalPoints || 0; // Carga los puntos del nivel
      this.currentStreak = p.currentStreak || 0;
      this.dailyTip = p.dailyTip || this.dailyTip;
      
      // 1. Cargar estado de Retos Maestros y Reset 3AM
      let challengesChanged = false;
      if (p.challenges) {
          p.challenges.forEach((c: any) => {
            if (c.completed && this.challengeService.shouldResetDaily(c.completedAt)) {
                c.completed = false;
                c.inProgress = false;
                c.completedAt = null;
                challengesChanged = true;
            }
          });
      }

      // Aplicar estado visual a Retos Maestros
      if (p.challenges) {
        this.challenges = this.challenges.map(c => {
          const s = p.challenges.find((sc: any) => sc.id === c.id);
          return s ? { ...c, completed: s.completed, inProgress: s.inProgress } : c;
        });
      }

      // 2. ✅ CARGAR ESTADO DE RETOS DIARIOS (¡Esto faltaba!)
      // Si no cargamos esto, los diarios se reinician siempre y causan inconsistencia
      if (p.dailyChallenges) {
        this.dailyChallenges = this.dailyChallenges.map(d => {
           const s = p.dailyChallenges.find((sd: any) => sd.id === d.id);
           return s ? { ...d, completed: s.completed } : d;
        });
      }

      // 3. Recálculo de seguridad: Si totalPoints es 0 por error, reconstruimos
      let calculatedTotal = 0;
      // Sumar maestros
      this.challenges.forEach(c => { if(c.completed) calculatedTotal += c.points; });
      // Sumar diarios (Ahora sí podemos porque los hemos cargado)
      this.dailyChallenges.forEach(d => { if(d.completed) calculatedTotal += d.points; });

      if (this.totalPoints < calculatedTotal) {
          this.totalPoints = calculatedTotal;
          challengesChanged = true;
      }

      // Guardamos correcciones si hubo
      if(challengesChanged) {
          this.saveProgress();
      }

      this.updateScoresFromService();
    }
  }

  private updateScoresFromService() {
    const scores = this.challengeService.calculateWellnessScores(this.challenges);
    this.mentalHealth = scores.mental;
    this.physicalHealth = scores.physical;
    this.mindfulnessScore = scores.mindfulness;
    this.nutritionScore = scores.nutrition;
    this.wellnessScore = Math.round((this.mentalHealth + this.physicalHealth + this.mindfulnessScore + this.nutritionScore) / 4);
    this.completedChallenges = this.challenges.filter(c => c.completed).length;
  }

  private saveProgress() {
    const data = {
      energyPoints: this.energyPoints,
      totalPoints: this.totalPoints, // ✅ Guardamos XP del Nivel
      currentStreak: this.currentStreak,
      mentalHealth: this.mentalHealth,
      physicalHealth: this.physicalHealth,
      mindfulness: this.mindfulnessScore,
      nutrition: this.nutritionScore,
      completedChallenges: this.completedChallenges,
      // Guardamos Retos Maestros
      challenges: this.challenges.map(c => ({ 
        id: c.id, 
        completed: c.completed, 
        inProgress: c.inProgress,
        completedAt: c.completed ? new Date().toISOString() : undefined 
      })),
      // ✅ GUARDAMOS RETOS DIARIOS (Vital para que no se pierdan)
      dailyChallenges: this.dailyChallenges.map(d => ({
        id: d.id,
        completed: d.completed
      })),
      dailyTip: this.dailyTip
    };
    
    // Guardamos en el localStorage asociado al usuario real
    localStorage.setItem(`pearly-wellness-progress-${this.currentUserId}`, JSON.stringify(data));
  }

  setFilter(id: string) { this.activeFilter = id; }
  private calculateTotalChallenges() { this.totalChallenges = this.challenges.length; }

  handleChallengeAction(challenge: ChallengeState) {
    if (challenge.completed) return;
    this.challengeToConfirm = challenge;
    this.showCustomConfirmModal = true;
  }

  confirmChallengeStart() {
    if (!this.challengeToConfirm) return;
    const c = this.challenges.find(x => x.id === this.challengeToConfirm!.id);
    
    if (c) {
      if (['physical', 'mindfulness'].includes(c.category) && !c.inProgress) {
        c.inProgress = true;
        this.notificationService.info(`⏱️ Reto en curso: ${c.title}. ¡Tú puedes!`);
        this.saveProgress();
      } else {
        this.completeChallenge(c.id);
      }
    }
    this.closeConfirmModal();
  }

  closeConfirmModal() { this.showCustomConfirmModal = false; this.challengeToConfirm = null; }

  getChallengeButtonText(c: ChallengeState): string {
    if (c.completed) return '✓ COMPLETADO';
    if (c.inProgress) return '⊹ FINALIZAR RETO';
    return (['physical', 'mindfulness'].includes(c.category) ? '◴ COMENZAR' : '✧ COMPLETAR');
  }

  completeChallenge(id: string) {
    const c = this.challenges.find(x => x.id === id);
    if (c && !c.completed) {
      c.completed = true;
      c.inProgress = false;
      this.energyPoints += c.points;
      this.totalPoints += c.points; // ✅ Sumar XP
      
      this.updateScoresFromService();
      this.notificationService.showChallengeCompleted(c.title, c.points);
      this.saveProgress();
    }
  }

  completeDailyChallenge(id: string) {
    const d = this.dailyChallenges.find(x => x.id === id);
    if (d && !d.completed) {
      d.completed = true;
      this.energyPoints += d.points;
      this.totalPoints += d.points; // ✅ Sumar XP
      this.saveProgress();
    }
  }

  refreshTip() {
    this.dailyTip = this.challengeService.getRandomTip();
    this.notificationService.info('💡 Nuevo consejo de bienestar cargado', { duration: 2000 });
    this.saveProgress();
  }

  private checkForFocusedChallenge() {}
}