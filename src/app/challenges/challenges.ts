import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/authBACK';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';
import { NotificationService } from '../services/notification';
import { ChallengeService, Challenge, DailyChallengeDef } from '../services/challenge';

interface ChallengeState extends Challenge {
  completed: boolean;
  inProgress: boolean;
  progress?: number; 
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
  totalPoints = 0;
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
  
  get inProgressChallenges(): ChallengeState[] {
    return this.challenges.filter(c => c.inProgress && !c.completed);
  }
  
  get filteredChallenges(): ChallengeState[] {
    let filtered = this.challenges.filter(c => !c.inProgress || c.completed);
    
    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(c => c.category === this.activeFilter);
    }
    
    const completed = filtered.filter(c => c.completed);
    const notCompleted = filtered.filter(c => !c.completed);
    return [...notCompleted, ...completed];
  }
  
  ngOnInit() {
    const email = this.authService.getCurrentUserEmail();
    this.currentUserId = email ? email.replace(/[.#$[\]]/g, '_') : 'anonymous';
    
    this.initializeFromService();
    this.loadUserProgress();
    this.calculateTotalChallenges();
    setTimeout(() => this.checkForFocusedChallenge(), 500);
  }

  private initializeFromService() {
    this.challenges = this.challengeService.getAllChallenges().map(c => ({
      ...c, 
      completed: false, 
      inProgress: false,
      progress: 0 
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
    const names: Record<string, string> = { 
      mental: 'Mental', 
      physical: 'Físico', 
      mindfulness: 'Mindfulness', 
      nutrition: 'Nutrición' 
    };
    return names[category] || 'Bienestar';
  }

  private loadUserProgress() {
    const saved = localStorage.getItem(`pearly-wellness-progress-${this.currentUserId}`);
    if (saved) {
      const p = JSON.parse(saved);
      
      this.energyPoints = p.energyPoints || 0;
      this.totalPoints = p.totalPoints || 0;
      this.currentStreak = p.currentStreak || 0;
      this.dailyTip = p.dailyTip || this.dailyTip;
      
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

      if (p.challenges) {
        this.challenges = this.challenges.map(c => {
          const s = p.challenges.find((sc: any) => sc.id === c.id);
          if (s) {
            return { 
              ...c, 
              completed: s.completed, 
              inProgress: s.inProgress,
              progress: s.progress || this.calculateProgress(c.category, s.inProgress)
            };
          }
          return c;
        });
      }

      if (p.dailyChallenges) {
        this.dailyChallenges = this.dailyChallenges.map(d => {
           const s = p.dailyChallenges.find((sd: any) => sd.id === d.id);
           return s ? { ...d, completed: s.completed } : d;
        });
      }

      let calculatedTotal = 0;
      this.challenges.forEach(c => { if(c.completed) calculatedTotal += c.points; });
      this.dailyChallenges.forEach(d => { if(d.completed) calculatedTotal += d.points; });

      if (this.totalPoints < calculatedTotal) {
          this.totalPoints = calculatedTotal;
          challengesChanged = true;
      }

      if(challengesChanged) {
          this.saveProgress();
      }

      this.updateScoresFromService();
    }
  }

  private calculateProgress(category: string, inProgress: boolean): number {
    if (!inProgress) return 0;
    
    switch(category) {
      case 'physical': return 30;
      case 'mindfulness': return 45;
      case 'mental': return 60;
      case 'nutrition': return 75;
      default: return 25;
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
      totalPoints: this.totalPoints,
      currentStreak: this.currentStreak,
      mentalHealth: this.mentalHealth,
      physicalHealth: this.physicalHealth,
      mindfulness: this.mindfulnessScore,
      nutrition: this.nutritionScore,
      completedChallenges: this.completedChallenges,
      challenges: this.challenges.map(c => ({ 
        id: c.id, 
        completed: c.completed, 
        inProgress: c.inProgress,
        progress: c.progress,
        completedAt: c.completed ? new Date().toISOString() : undefined 
      })),
      dailyChallenges: this.dailyChallenges.map(d => ({
        id: d.id,
        completed: d.completed
      })),
      dailyTip: this.dailyTip
    };
    
    localStorage.setItem(`pearly-wellness-progress-${this.currentUserId}`, JSON.stringify(data));
  }

  setFilter(id: string) { this.activeFilter = id; }
  private calculateTotalChallenges() { this.totalChallenges = this.challenges.length; }

  handleChallengeAction(challenge: ChallengeState) {
    if (challenge.completed) return;
    
    if (challenge.inProgress) {
      this.completeChallenge(challenge.id);
      return;
    }
    
    this.challengeToConfirm = challenge;
    this.showCustomConfirmModal = true;
  }

  confirmChallengeStart() {
    if (!this.challengeToConfirm) return;
    const c = this.challenges.find(x => x.id === this.challengeToConfirm!.id);
    
    if (c) {
      if (['physical', 'mindfulness'].includes(c.category) && !c.inProgress) {
        c.inProgress = true;
        c.progress = 10; 
        this.notificationService.info(`⏱️ Reto en curso: ${c.title}. ¡Tú puedes!`);
        this.saveProgress();
      } else {
        this.completeChallenge(c.id);
      }
    }
    this.closeConfirmModal();
  }

  closeConfirmModal() { 
    this.showCustomConfirmModal = false; 
    this.challengeToConfirm = null; 
  }

  completeChallenge(id: string) {
    const c = this.challenges.find(x => x.id === id);
    if (c && !c.completed) {
      c.completed = true;
      c.inProgress = false;
      c.progress = 100;
      this.energyPoints += c.points;
      this.totalPoints += c.points;
      
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
      this.totalPoints += d.points;
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