import React, { useEffect, useRef, useState } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MISSILE_SPEED, 
  EXPLOSION_MAX_RADIUS, 
  EXPLOSION_GROWTH_RATE,
  BATTERY_CONFIGS,
  SCORE_PER_ROCKET,
  WIN_SCORE,
  DIFFICULTY_SETTINGS
} from '../constants';
import { GameStatus, Rocket, Missile, Explosion, Smoke, City, Battery, Difficulty } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  difficulty: Difficulty;
  onScoreUpdate: (score: number) => void;
  onGameEnd: (won: boolean) => void;
  onMissileUpdate: (batteryId: string, count: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, difficulty, onScoreUpdate, onGameEnd, onMissileUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);

  // Game state refs
  const rocketsRef = useRef<Rocket[]>([]);
  const missilesRef = useRef<Missile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const smokesRef = useRef<Smoke[]>([]);
  const citiesRef = useRef<City[]>([]);
  const batteriesRef = useRef<Battery[]>([]);
  const scoreRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const difficultyRef = useRef<Difficulty>(difficulty);
  const manualKillsRef = useRef<number>(0);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    initGame();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      initGame();
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      // Pause or stop loop if not playing
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [status]);

  const initGame = () => {
    scoreRef.current = 0;
    rocketsRef.current = [];
    missilesRef.current = [];
    explosionsRef.current = [];
    smokesRef.current = [];
    spawnTimerRef.current = 0;
    
    // Initialize cities
    const cities: City[] = [];
    for (let i = 0; i < 6; i++) {
        cities.push({
            id: `city-${i}`,
            x: i < 3 ? 150 + i * 70 : 440 + (i-3) * 70,
            y: CANVAS_HEIGHT - 50,
            isDestroyed: false,
            isRepairing: false,
            repairProgress: 0
        });
    }
    citiesRef.current = cities;

    // Initialize batteries
    batteriesRef.current = BATTERY_CONFIGS.map(config => ({
      ...config,
      y: CANVAS_HEIGHT - 60,
      missiles: config.maxMissiles,
      isDestroyed: false,
      angle: -Math.PI / 2,
      isRepairing: false,
      repairProgress: 0,
      shieldActive: false,
      shieldCharging: false,
      shieldChargeProgress: 0
    }));

    manualKillsRef.current = 0;

    // Notify parent
    batteriesRef.current.forEach(b => onMissileUpdate(b.id, b.missiles));
  };

  const spawnRocket = () => {
    const config = DIFFICULTY_SETTINGS[difficultyRef.current];
    const startX = Math.random() * CANVAS_WIDTH;
    const targets = [...citiesRef.current.filter(c => !c.isDestroyed), ...batteriesRef.current.filter(b => !b.isDestroyed)];
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    const speed = config.rocketSpeedMin + Math.random() * (config.rocketSpeedMax - config.rocketSpeedMin);

    rocketsRef.current.push({
      id: Math.random().toString(36).substr(2, 9),
      x: startX,
      y: 0,
      targetX: target.x,
      targetY: target.y,
      speed: speed,
      isDead: false,
      update(dt: number) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 2) {
            this.isDead = true;
            handleImpact(this.targetX, this.targetY);
        } else {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
      },
      draw(ctx: CanvasRenderingContext2D) {
        const diff = difficultyRef.current;
        
        // Trail effect
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(this.x, this.y);
        
        if (diff === Difficulty.MYTHIC) {
          const hue = (performance.now() / 10) % 360;
          ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.5)`;
          ctx.lineWidth = 2;
        } else if (diff === Difficulty.EXTREME) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = 'rgba(255, 68, 68, 0.4)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
        
        // Rocket head
        if (diff === Difficulty.MYTHIC || diff === Difficulty.EXTREME) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = diff === Difficulty.MYTHIC ? '#fff' : '#ef4444';
        }
        
        ctx.fillStyle = diff === Difficulty.MYTHIC ? '#fff' : '#ff4444';
        ctx.fillRect(this.x - 1.5, this.y - 1.5, 3, 3);
        ctx.shadowBlur = 0;
      }
    });
  };

  const handleImpact = (x: number, y: number) => {
    let destroyed = false;
    citiesRef.current.forEach(city => {
        if (!city.isDestroyed && Math.abs(city.x - x) < 20 && Math.abs(city.y - y) < 20) {
            city.isDestroyed = true;
            destroyed = true;
            spawnSmoke(city.x, city.y);
        }
    });
    batteriesRef.current.forEach(battery => {
        if (!battery.isDestroyed && Math.abs(battery.x - x) < 25 && Math.abs(battery.y - y) < 25) {
            if (battery.shieldActive) {
                battery.shieldActive = false;
                explosionsRef.current.push(createExplosion(battery.x, battery.y - 20, 60));
                return; // Shield blocked the hit
            }
            battery.isDestroyed = true;
            destroyed = true;
            onMissileUpdate(battery.id, 0);
            spawnSmoke(battery.x, battery.y);
        }
    });

    explosionsRef.current.push(createExplosion(x, y, destroyed ? 80 : 40));

    if (batteriesRef.current.every(b => b.isDestroyed)) {
        const intact = [...citiesRef.current, ...batteriesRef.current].filter(b => !b.isDestroyed).length;
        onGameEnd(false, intact);
    }
  };

  const spawnSmoke = (x: number, y: number) => {
    for (let i = 0; i < 5; i++) {
        smokesRef.current.push({
            id: Math.random().toString(36).substr(2, 9),
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 10,
            opacity: 0.4 + Math.random() * 0.3,
            size: 10 + Math.random() * 15,
            isDead: false,
            update(dt: number) {
                this.y -= 5 * dt;
                this.x += (Math.random() - 0.5) * 2 * dt;
                this.opacity -= 0.05 * dt;
                if (this.opacity <= 0) this.isDead = true;
            },
            draw(ctx: CanvasRenderingContext2D) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(100, 100, 100, ${this.opacity})`;
                ctx.fill();
            }
        });
    }
  };

  const createExplosion = (x: number, y: number, maxRadius = EXPLOSION_MAX_RADIUS, isTracking = false): Explosion => {
    return {
        id: Math.random().toString(36).substr(2, 9),
        x, y,
        radius: 0,
        maxRadius,
        growthRate: EXPLOSION_GROWTH_RATE,
        isDead: false,
        isTracking,
        update(dt: number) {
            if (this.radius < this.maxRadius) {
                this.radius += this.growthRate * dt;
            } else {
                this.isDead = true;
            }
        },
        draw(ctx: CanvasRenderingContext2D) {
            const diff = difficultyRef.current;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            
            if (this.isTracking) {
                ctx.fillStyle = `rgba(255, 0, 255, ${1 - this.radius / this.maxRadius})`;
            } else if (diff === Difficulty.MYTHIC) {
                const hue = (performance.now() / 5) % 360;
                ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${1 - this.radius / this.maxRadius})`;
            } else if (diff === Difficulty.EXTREME) {
                ctx.fillStyle = `rgba(239, 68, 68, ${1 - this.radius / this.maxRadius})`;
            } else {
                ctx.fillStyle = `rgba(255, 200, 50, ${1 - this.radius / this.maxRadius})`;
            }
            ctx.fill();
        }
    };
  };

  const fireMissile = (targetX: number, targetY: number) => {
    if (status !== GameStatus.PLAYING) return;

    const availableBatteries = batteriesRef.current.filter(b => !b.isDestroyed && b.missiles > 0);
    if (availableBatteries.length === 0) return;

    let closest = availableBatteries[0];
    let minDist = Infinity;

    availableBatteries.forEach(b => {
        const d = Math.abs(b.x - targetX);
        if (d < minDist) {
            minDist = d;
            closest = b;
        }
    });

    closest.missiles--;
    onMissileUpdate(closest.id, closest.missiles);

    const dx = targetX - closest.x;
    const dy = targetY - closest.y;
    closest.angle = Math.atan2(dy, dx);

    spawnMissile(closest.x, closest.y, targetX, targetY, false);
  };

  const spawnMissile = (startX: number, startY: number, targetX: number, targetY: number, isTracking: boolean) => {
    let targetId: string | undefined;
    if (isTracking) {
        const potentialTargets = rocketsRef.current.filter(r => !r.isDead);
        if (potentialTargets.length > 0) {
            const t = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
            targetId = t.id;
            targetX = t.x;
            targetY = t.y;
        } else {
            return; // No targets for tracking missile
        }
    }

    missilesRef.current.push({
        id: Math.random().toString(36).substr(2, 9),
        startX,
        startY,
        x: startX,
        y: startY,
        targetX,
        targetY,
        isTracking,
        targetId,
        speed: MISSILE_SPEED,
        isDead: false,
        update(dt: number) {
            if (this.isTracking && this.targetId) {
                const target = rocketsRef.current.find(r => r.id === this.targetId && !r.isDead);
                if (target) {
                    this.targetX = target.x;
                    this.targetY = target.y;
                }
            }

            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) {
                this.isDead = true;
                explosionsRef.current.push(createExplosion(this.targetX, this.targetY, 50, this.isTracking));
            } else {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        },
        draw(ctx: CanvasRenderingContext2D) {
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = this.isTracking ? '#ff00ff' : '#4488ff';
            ctx.lineWidth = this.isTracking ? 3 : 2;
            ctx.stroke();

            if (!this.isTracking) {
                ctx.beginPath();
                ctx.moveTo(this.targetX - 5, this.targetY - 5);
                ctx.lineTo(this.targetX + 5, this.targetY + 5);
                ctx.moveTo(this.targetX + 5, this.targetY - 5);
                ctx.lineTo(this.targetX - 5, this.targetY + 5);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    });
  };

  const gameLoop = (time: number) => {
    if (status !== GameStatus.PLAYING) return;

    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Update
    const config = DIFFICULTY_SETTINGS[difficultyRef.current];
    spawnTimerRef.current += dt;
    if (spawnTimerRef.current > config.spawnRate) {
        spawnRocket();
        spawnTimerRef.current = 0;
    }

    rocketsRef.current.forEach(r => r.update(dt));
    missilesRef.current.forEach(m => m.update(dt));
    explosionsRef.current.forEach(e => e.update(dt));
    smokesRef.current.forEach(s => s.update(dt));

    citiesRef.current.forEach(city => {
        if (city.isRepairing) {
            city.repairProgress = (city.repairProgress || 0) + dt / 10;
            if (city.repairProgress >= 1) {
                city.isDestroyed = false;
                city.isRepairing = false;
                city.repairProgress = 0;
            }
        }
    });
    batteriesRef.current.forEach(battery => {
        if (battery.isRepairing) {
            battery.repairProgress = (battery.repairProgress || 0) + dt / 20;
            if (battery.repairProgress >= 1) {
                battery.isDestroyed = false;
                battery.isRepairing = false;
                battery.repairProgress = 0;
                battery.missiles = battery.maxMissiles;
                onMissileUpdate(battery.id, battery.missiles);
            }
        }
        if (battery.shieldCharging) {
            battery.shieldChargeProgress = (battery.shieldChargeProgress || 0) + dt / 5;
            if (battery.shieldChargeProgress >= 1) {
                battery.shieldCharging = false;
                battery.shieldActive = true;
                battery.shieldChargeProgress = 0;
            }
        }
    });

    explosionsRef.current.forEach(exp => {
        rocketsRef.current.forEach(rock => {
            if (!rock.isDead) {
                const dx = exp.x - rock.x;
                const dy = exp.y - rock.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < exp.radius) {
                    rock.isDead = true;
                    scoreRef.current += SCORE_PER_ROCKET;
                    
                    // Auto-tracking missile logic
                    if (!exp.isTracking) {
                        manualKillsRef.current++;
                        if (manualKillsRef.current >= 10) {
                            manualKillsRef.current = 0;
                            batteriesRef.current.forEach(b => {
                                if (!b.isDestroyed) {
                                    spawnMissile(b.x, b.y, 0, 0, true);
                                }
                            });
                        }
                    }

                    onScoreUpdate(scoreRef.current);
                    if (scoreRef.current >= WIN_SCORE) {
                        const intact = [...citiesRef.current, ...batteriesRef.current].filter(b => !b.isDestroyed).length;
                        onGameEnd(true, intact);
                    }
                }
            }
        });
    });

    rocketsRef.current = rocketsRef.current.filter(r => !r.isDead);
    missilesRef.current = missilesRef.current.filter(m => !m.isDead);
    explosionsRef.current = explosionsRef.current.filter(e => !e.isDead);
    smokesRef.current = smokesRef.current.filter(s => !s.isDead);

    // Draw
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Ground
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
    
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, CANVAS_HEIGHT - 40);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 40);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 40);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.stroke();

    citiesRef.current.forEach(city => {
        if (!city.isDestroyed) {
            const gradient = ctx.createLinearGradient(city.x - 15, city.y - 30, city.x + 15, city.y);
            gradient.addColorStop(0, '#1e293b');
            gradient.addColorStop(1, '#0f172a');
            ctx.fillStyle = gradient;
            
            ctx.fillRect(city.x - 15, city.y - 20, 30, 20);
            ctx.fillRect(city.x - 10, city.y - 30, 20, 10);
            
            ctx.fillStyle = '#10b981';
            const t = performance.now() / 1000;
            const glow = Math.sin(t * 2) * 0.3 + 0.7;
            ctx.globalAlpha = glow;
            
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    ctx.fillRect(city.x - 12 + col * 9, city.y - 18 + row * 6, 4, 3);
                }
            }
            ctx.fillRect(city.x - 7, city.y - 28, 4, 3);
            ctx.fillRect(city.x + 3, city.y - 28, 4, 3);
            
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(city.x, city.y - 30);
            ctx.lineTo(city.x, city.y - 40);
            ctx.stroke();
            
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(city.x, city.y - 40, 1.5, 0, Math.PI * 2);
            ctx.fill();

            if (city.isRepairing) {
                ctx.fillStyle = '#334155';
                ctx.fillRect(city.x - 15, city.y - 50, 30, 4);
                ctx.fillStyle = '#10b981';
                ctx.fillRect(city.x - 15, city.y - 50, 30 * (city.repairProgress || 0), 4);
            }
        } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(city.x - 15, city.y - 5, 30, 5);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(city.x - 10, city.y - 8, 8, 3);

            if (city.isRepairing) {
                ctx.fillStyle = '#334155';
                ctx.fillRect(city.x - 15, city.y - 15, 30, 4);
                ctx.fillStyle = '#10b981';
                ctx.fillRect(city.x - 15, city.y - 15, 30 * (city.repairProgress || 0), 4);
            }
        }
    });

    batteriesRef.current.forEach(battery => {
        if (!battery.isDestroyed) {
            const baseGrad = ctx.createRadialGradient(battery.x, battery.y, 5, battery.x, battery.y, 25);
            baseGrad.addColorStop(0, '#334155');
            baseGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = baseGrad;
            
            ctx.beginPath();
            ctx.moveTo(battery.x - 25, battery.y + 10);
            ctx.lineTo(battery.x - 15, battery.y - 10);
            ctx.lineTo(battery.x + 15, battery.y - 10);
            ctx.lineTo(battery.x + 25, battery.y + 10);
            ctx.closePath();
            ctx.fill();
            
            const t = performance.now() / 1000;
            const pulse = Math.sin(t * 4) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(16, 185, 129, ${0.3 + pulse * 0.4})`;
            ctx.beginPath();
            ctx.arc(battery.x, battery.y - 5, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.save();
            ctx.translate(battery.x, battery.y - 5);
            ctx.rotate(battery.angle + Math.PI / 2);
            
            ctx.fillStyle = '#475569';
            ctx.fillRect(-8, -25, 4, 20);
            ctx.fillRect(4, -25, 4, 20);
            
            ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
            ctx.fillRect(-7, -23, 2, 16);
            ctx.fillRect(5, -23, 2, 16);
            ctx.restore();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(battery.missiles.toString(), battery.x, battery.y + 8);

            // Shield Visual
            if (battery.shieldActive) {
                ctx.beginPath();
                ctx.arc(battery.x, battery.y - 10, 40, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
                ctx.fill();
            }

            // Shield Charge Bar
            if (battery.shieldCharging) {
                ctx.fillStyle = '#334155';
                ctx.fillRect(battery.x - 20, battery.y - 55, 40, 4);
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(battery.x - 20, battery.y - 55, 40 * (battery.shieldChargeProgress || 0), 4);
            }

            if (battery.isRepairing) {
                ctx.fillStyle = '#334155';
                ctx.fillRect(battery.x - 20, battery.y - 45, 40, 4);
                ctx.fillStyle = '#10b981';
                ctx.fillRect(battery.x - 20, battery.y - 45, 40 * (battery.repairProgress || 0), 4);
            }
        } else {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(battery.x, battery.y, 20, Math.PI, 0);
            ctx.fill();
            ctx.strokeStyle = '#1e293b';
            ctx.stroke();

            if (battery.isRepairing) {
                ctx.fillStyle = '#334155';
                ctx.fillRect(battery.x - 20, battery.y - 15, 40, 4);
                ctx.fillStyle = '#10b981';
                ctx.fillRect(battery.x - 20, battery.y - 15, 40 * (battery.repairProgress || 0), 4);
            }
        }
    });

    rocketsRef.current.forEach(r => r.draw(ctx));
    missilesRef.current.forEach(m => m.draw(ctx));
    smokesRef.current.forEach(s => s.draw(ctx));
    explosionsRef.current.forEach(e => e.draw(ctx));

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Check for repair or shield clicks
    let interactionStarted = false;
    citiesRef.current.forEach(city => {
        if (city.isDestroyed && !city.isRepairing && Math.abs(city.x - x) < 20 && Math.abs(city.y - y) < 20) {
            city.isRepairing = true;
            city.repairProgress = 0;
            interactionStarted = true;
        }
    });
    batteriesRef.current.forEach(battery => {
        if (battery.isDestroyed && !battery.isRepairing && Math.abs(battery.x - x) < 25 && Math.abs(battery.y - y) < 25) {
            battery.isRepairing = true;
            battery.repairProgress = 0;
            interactionStarted = true;
        } else if (!battery.isDestroyed && !battery.shieldActive && !battery.shieldCharging && Math.abs(battery.x - x) < 25 && Math.abs(battery.y - y) < 25) {
            battery.shieldCharging = true;
            battery.shieldChargeProgress = 0;
            interactionStarted = true;
        }
    });

    if (!interactionStarted) {
        fireMissile(x, y);
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] max-w-4xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full cursor-crosshair touch-none"
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
      />
    </div>
  );
};

export default GameCanvas;