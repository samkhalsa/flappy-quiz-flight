export interface Bird {
  x: number;
  y: number;
  velocity: number;
  radius: number;
}

export interface Pipe {
  x: number;
  topHeight: number;
  bottomY?: number;
  width?: number;
  gap?: number;
  passed?: boolean;
  scored: boolean;
}

export interface QuestionZone {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  category: 'math' | 'science' | 'language';
  question: Question;
  visible?: boolean;
  answered?: boolean;
  triggered: boolean;
}

export interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  category: 'math' | 'science' | 'language';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface GameState {
  bird?: Bird;
  pipes?: Pipe[];
  questionZones?: QuestionZone[];
  particles?: Particle[];
  score: number;
  bonusScore: number;
  gameOver: boolean;
  gameStarted: boolean;
  lastPipeTime?: number;
  lastQuestionZoneTime?: number;
}

export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  BIRD_RADIUS: 20,
  BIRD_JUMP_FORCE: -8,
  GRAVITY: 0.5,
  PIPE_WIDTH: 60,
  PIPE_GAP: 150,
  PIPE_SPEED: 3,
  PIPE_SPAWN_INTERVAL: 2000,
  QUESTION_ZONE_WIDTH: 100,
  QUESTION_ZONE_HEIGHT: 80,
  QUESTION_ZONE_SPAWN_INTERVAL: 8000,
  GROUND_HEIGHT: 100,
};