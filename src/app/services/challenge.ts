import { Injectable } from '@angular/core';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'mental' | 'physical' | 'mindfulness' | 'nutrition';
  points: number;
  benefits?: string[];
}

export interface DailyChallengeDef {
  id: string;
  title: string;
  description: string;
  points: number;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  
  private readonly MASTER_CHALLENGES: Challenge[] = [
    { id: 'mental-1', title: 'Diario de gratitud', description: 'Escribe 3 cosas por las que estés agradecido hoy.', category: 'mental', points: 40, benefits: ['Mejora ánimo', 'Reduce ansiedad', 'Aumenta felicidad'] },
    { id: 'mental-2', title: 'Digital detox por 1 hora', description: 'Desconéctate de todas las pantallas durante una hora completa.', category: 'mental', points: 60, benefits: ['Reduce estrés digital', 'Mejora concentración', 'Aumenta productividad'] },
    { id: 'mental-3', title: 'Lectura de 20 minutos', description: 'Lee un libro o artículo que te inspire durante 20 minutos.', category: 'mental', points: 45, benefits: ['Estimula mente', 'Reduce estrés', 'Aumenta conocimiento'] },
    { id: 'mental-4', title: 'Visualización positiva', description: 'Imagina tu mejor versión y visualiza tus metas cumplidas por 5 minutos.', category: 'mental', points: 35, benefits: ['Aumenta motivación', 'Clarifica objetivos', 'Reduce ansiedad'] },
    { id: 'mental-5', title: 'Afirmaciones matutinas', description: 'Repite 5 afirmaciones positivas frente al espejo.', category: 'mental', points: 30, benefits: ['Mejora autoestima', 'Reduce diálogo interno negativo', 'Empodera'] },
    { id: 'mental-6', title: 'Organizar un espacio', description: 'Ordena un cajón, estante o área pequeña de tu hogar.', category: 'mental', points: 65, benefits: ['Reduce ansiedad', 'Aumenta sensación de control', 'Claridad mental'] },
    { id: 'physical-1', title: 'Caminata de 30 minutos', description: 'Da un paseo al aire libre durante 30 minutos.', category: 'physical', points: 75, benefits: ['Mejora circulación', 'Quema calorías', 'Despeja mente'] },
    { id: 'physical-2', title: 'Entrenamiento de fuerza', description: 'Rutina básica de ejercicios de fuerza en casa.', category: 'physical', points: 100, benefits: ['Tonifica músculos', 'Mejora metabolismo'] },
    { id: 'physical-3', title: 'Rutina de estiramientos', description: '15 minutos de estiramientos para flexibilidad.', category: 'physical', points: 55, benefits: ['Previene lesiones', 'Mejora postura'] },
    { id: 'physical-4', title: 'Subir escaleras', description: 'Sube escaleras durante 10 minutos.', category: 'physical', points: 85, benefits: ['Fortalece piernas', 'Cardio'] },
    { id: 'physical-5', title: 'Baile libre', description: 'Baila durante 15 minutos.', category: 'physical', points: 60, benefits: ['Libera endorfinas', 'Divertido'] },
    { id: 'physical-6', title: 'Yoga matutino', description: '20 minutos de yoga.', category: 'physical', points: 90, benefits: ['Flexibilidad', 'Equilibrio'] },
    { id: 'mindfulness-1', title: 'Meditación de 10 minutos', description: 'Medita 10 minutos.', category: 'mindfulness', points: 50, benefits: ['Reduce estrés', 'Claridad'] },
    { id: 'mindfulness-2', title: 'Respiración profunda', description: 'Técnica 4-7-8 durante 5 minutos.', category: 'mindfulness', points: 35, benefits: ['Calma sistema nervioso'] },
    { id: 'mindfulness-3', title: 'Escaneo corporal', description: 'Relajación profunda.', category: 'mindfulness', points: 65, benefits: ['Conexión', 'Relajación'] },
    { id: 'mindfulness-4', title: 'Observación consciente', description: 'Observa un objeto 5 minutos.', category: 'mindfulness', points: 40, benefits: ['Atención plena'] },
    { id: 'mindfulness-5', title: 'Caminata mindfulness', description: 'Camina prestando atención a cada paso.', category: 'mindfulness', points: 70, benefits: ['Paz interior'] },
    { id: 'mindfulness-6', title: 'Gratitud mindfulness', description: 'Siente gratitud por algo 5 minutos.', category: 'mindfulness', points: 75, benefits: ['Felicidad'] },
    { id: 'nutrition-1', title: 'Comida consciente', description: 'Come sin distracciones.', category: 'nutrition', points: 45, benefits: ['Mejora digestión'] },
    { id: 'nutrition-2', title: 'Hidratación consciente', description: 'Toma 8 vasos de agua.', category: 'nutrition', points: 70, benefits: ['Hidrata cuerpo'] },
    { id: 'nutrition-3', title: 'Desayuno saludable', description: 'Desayuno con fibra y fruta.', category: 'nutrition', points: 55, benefits: ['Energía duradera'] },
    { id: 'nutrition-4', title: 'Batch cooking', description: 'Prepara comidas para 3 días.', category: 'nutrition', points: 90, benefits: ['Ahorra tiempo'] },
    { id: 'nutrition-5', title: '5 porciones de vegetales', description: 'Consume fruta y verdura.', category: 'nutrition', points: 100, benefits: ['Minerales'] },
    { id: 'nutrition-6', title: 'Reducir azúcar', description: 'Evita azúcares añadidos.', category: 'nutrition', points: 85, benefits: ['Mejora salud dental'] }
  ];

  private readonly MASTER_DAILY_CHALLENGES: DailyChallengeDef[] = [
    { id: 'daily-1', title: 'Meditación matutina', description: '5 minutos de calma.', points: 30, tags: ['Mindfulness'] },
    { id: 'daily-2', title: 'Estiramientos básicos', description: '10 minutos.', points: 25, tags: ['Físico'] },
    { id: 'daily-3', title: 'Reflexión diaria', description: 'Piensa en tu día.', points: 20, tags: ['Mental'] },
    { id: 'daily-4', title: 'Hidratación completa', description: '2 litros de agua.', points: 35, tags: ['Nutrición'] },
    { id: 'daily-5', title: 'Pausa digital', description: '20 min sin pantallas.', points: 30, tags: ['Digital'] },
    { id: 'daily-6', title: 'Respiración consciente', description: '3 min de respiración.', points: 20, tags: ['Calma'] }
  ];

  private readonly WELLNESS_TIPS: string[] = [
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

  constructor() {}

  // Devuelve la lista completa de todos los retos grandes de la aplicacion.
  getAllChallenges(): Challenge[] {
    return [...this.MASTER_CHALLENGES];
  }

  // Devuelve la lista completa de los pequeños retos diarios.
  getAllDailyChallenges(): DailyChallengeDef[] {
    return [...this.MASTER_DAILY_CHALLENGES];
  }

  // Busca los detalles de un reto especifico usando su ID.
  getChallengeById(id: string): Challenge | undefined {
    return this.MASTER_CHALLENGES.find(c => c.id === id);
  }

  // Elige un consejo de bienestar al azar de la lista predefinida.
  getRandomTip(): string {
    return this.WELLNESS_TIPS[Math.floor(Math.random() * this.WELLNESS_TIPS.length)];
  }

  // Calcula el porcentaje de salud de cada categoria para dibujar el grafico del perfil.
  calculateWellnessScores(challenges: {id: string, completed: boolean}[]) {
    const scores = { mental: 0, physical: 0, mindfulness: 0, nutrition: 0 };
    
    challenges.forEach(c => {
      if (c.completed) {
        const def = this.getChallengeById(c.id);
        if (def) {
          scores[def.category] += 20; 
        }
      }
    });

    return {
      mental: Math.min(100, scores.mental),
      physical: Math.min(100, scores.physical),
      mindfulness: Math.min(100, scores.mindfulness),
      nutrition: Math.min(100, scores.nutrition)
    };
  }

  // Convierte los puntos totales del usuario en su Nivel y calcula la experiencia restante.
  getLevelInfo(totalPoints: number) {
    let level = 1;
    let xpRequired = 500; 
    let currentXP = totalPoints;
    
    while (currentXP >= xpRequired) {
      currentXP -= xpRequired;
      level++;
      xpRequired = Math.floor(xpRequired * 1.2); 
    }

    return {
      level: level,
      currentXP: currentXP,
      nextLevelXP: xpRequired,
      progressPercent: (currentXP / xpRequired) * 100
    };
  }

  // Devuelve un color que representa el rango del usuario segun su nivel actual.
  getRankColor(level: number): string {
    if (level < 5) return '#58595b'; 
    if (level < 10) return '#cd7f32'; 
    if (level < 15) return '#c0c0c0'; 
    if (level < 20) return '#ffd700'; 
    if (level < 25) return '#20b2aa'; 
    return '#b9f2ff'; 
  }

  // Determina si un reto completado en el pasado ya puede volver a realizarse hoy.
  shouldResetDaily(lastCompletedDate: string | undefined): boolean {
    if (!lastCompletedDate) return true; 

    const last = new Date(lastCompletedDate);
    const now = new Date();

    const cutoffToday = new Date();
    cutoffToday.setHours(3, 0, 0, 0);

    if (now < cutoffToday) {
      cutoffToday.setDate(cutoffToday.getDate() - 1);
    }

    return last < cutoffToday;
  }
}