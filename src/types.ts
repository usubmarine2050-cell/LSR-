
export enum GameStatus {
  START = 'START',
  DIFFICULTY_SELECT = 'DIFFICULTY_SELECT',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
  ROUND_END = 'ROUND_END'
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  EXTREME = 'EXTREME',
  MYTHIC = 'MYTHIC'
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  update: (dt: number) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  isDead: boolean;
}

export interface Rocket extends Entity {
  targetX: number;
  targetY: number;
  speed: number;
}

export interface Missile extends Entity {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  isTracking?: boolean;
  targetId?: string;
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  growthRate: number;
  isTracking?: boolean;
}

export interface Smoke extends Entity {
  opacity: number;
  size: number;
}

export interface City {
  id: string;
  x: number;
  y: number;
  isDestroyed: boolean;
  repairProgress?: number; // 0 to 1
  isRepairing?: boolean;
}

export interface Battery {
  id: string;
  x: number;
  y: number;
  missiles: number;
  maxMissiles: number;
  isDestroyed: boolean;
  angle: number; // in radians
  repairProgress?: number; // 0 to 1
  isRepairing?: boolean;
  shieldActive?: boolean;
  shieldCharging?: boolean;
  shieldChargeProgress?: number;
}

export interface LeaderboardEntry {
  difficulty: Difficulty;
  score: number;
  rating: string;
  date: string;
}

export type Language = 'zh' | 'en';
