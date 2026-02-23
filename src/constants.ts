
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const ROCKET_SPEED_MIN = 30;
export const ROCKET_SPEED_MAX = 70;
export const MISSILE_SPEED = 600;

export const EXPLOSION_MAX_RADIUS = 55;
export const EXPLOSION_GROWTH_RATE = 120;
export const EXPLOSION_DURATION = 1000; // ms

export const CITY_COUNT = 6;
export const BATTERY_COUNT = 3;

export const SCORE_PER_ROCKET = 20;
export const WIN_SCORE = 1000;

export const DIFFICULTY_SETTINGS = {
  EASY: {
    rocketSpeedMin: 20,
    rocketSpeedMax: 50,
    spawnRate: 2.5,
    label: { zh: '入门', en: 'Easy' },
    color: '#10b981'
  },
  NORMAL: {
    rocketSpeedMin: 30,
    rocketSpeedMax: 70,
    spawnRate: 1.8,
    label: { zh: '普通', en: 'Normal' },
    color: '#3b82f6'
  },
  HARD: {
    rocketSpeedMin: 50,
    rocketSpeedMax: 100,
    spawnRate: 1.2,
    label: { zh: '困难', en: 'Hard' },
    color: '#f59e0b'
  },
  EXTREME: {
    rocketSpeedMin: 80,
    rocketSpeedMax: 150,
    spawnRate: 0.8,
    label: { zh: '极限', en: 'Extreme' },
    color: '#ef4444'
  },
  MYTHIC: {
    rocketSpeedMin: 120,
    rocketSpeedMax: 250,
    spawnRate: 0.5,
    label: { zh: '神话', en: 'Mythic' },
    color: '#a855f7'
  }
};

export const BATTERY_CONFIGS = [
  { id: 'left', x: 50, maxMissiles: 50 },
  { id: 'center', x: 400, maxMissiles: 80 },
  { id: 'right', x: 750, maxMissiles: 50 },
];

export const TRANSLATIONS = {
  zh: {
    title: 'LSR 新星防御',
    start: '开始游戏',
    restart: '再玩一次',
    win: '任务成功！你守护了星系。',
    lose: '防线崩溃！城市已被摧毁。',
    score: '得分',
    missiles: '弹药',
    round: '波次',
    targetScore: '目标得分',
  },
  en: {
    title: 'LSR Nova Defense',
    start: 'Start Game',
    restart: 'Play Again',
    win: 'Mission Success! You protected the system.',
    lose: 'Defense Collapsed! Cities destroyed.',
    score: 'Score',
    missiles: 'Ammo',
    round: 'Wave',
    targetScore: 'Target Score',
  }
};
