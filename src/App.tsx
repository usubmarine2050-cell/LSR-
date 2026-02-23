import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Target, Zap, Globe, RefreshCcw, Trophy, Skull, Flame, Sparkles, Sword, Crown, History } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { GameStatus, Language, Difficulty, LeaderboardEntry } from './types';
import { TRANSLATIONS, WIN_SCORE, DIFFICULTY_SETTINGS } from './constants';

export default function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [lang, setLang] = useState<Language>('zh');
  const [score, setScore] = useState(0);
  const [missiles, setMissiles] = useState<Record<string, number>>({
    left: 50,
    center: 80,
    right: 50
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lsr_leaderboard');
    if (saved) {
      setLeaderboard(JSON.parse(saved));
    }
  }, []);

  const t = TRANSLATIONS[lang];

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  const handleGameEnd = useCallback((won: boolean, intactBuildings?: number) => {
    setStatus(won ? GameStatus.WON : GameStatus.LOST);
    
    const count = intactBuildings ?? 0;
    let rating = "F";
    if (count === 9) rating = "S";
    else if (count >= 7) rating = "A";
    else if (count >= 5) rating = "B";
    else if (count >= 3) rating = "C";
    else if (count >= 1) rating = "D";

    const newEntry: LeaderboardEntry = {
        difficulty,
        score,
        rating,
        date: new Date().toLocaleDateString()
    };

    setLeaderboard(prev => {
        const updated = [...prev, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 50);
        localStorage.setItem('lsr_leaderboard', JSON.stringify(updated));
        return updated;
    });
  }, [difficulty, score]);

  const handleMissileUpdate = useCallback((id: string, count: number) => {
    setMissiles(prev => ({ ...prev, [id]: count }));
  }, []);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setStatus(GameStatus.PLAYING);
  };

  const toggleLang = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const difficultyOptions = [
    { id: Difficulty.EASY, icon: Shield, class: 'from-emerald-500/20 to-emerald-500/5 hover:border-emerald-500/50' },
    { id: Difficulty.NORMAL, icon: Target, class: 'from-blue-500/20 to-blue-500/5 hover:border-blue-500/50' },
    { id: Difficulty.HARD, icon: Sword, class: 'from-amber-500/20 to-amber-500/5 hover:border-amber-500/50' },
    { id: Difficulty.EXTREME, icon: Flame, class: 'from-red-500/20 to-red-500/5 hover:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' },
    { id: Difficulty.MYTHIC, icon: Crown, class: 'from-purple-500/20 to-purple-500/5 hover:border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.3)]' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Header / HUD */}
      <header className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">{t.title}</h1>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Orbital Defense Initiative</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-white/40 uppercase">{t.score}</span>
            <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              {score.toString().padStart(5, '0')}
            </span>
          </div>
          
          <div className="h-10 w-px bg-white/10" />

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-white/40 uppercase">{t.targetScore}</span>
            <span className="text-xl font-mono text-white/60">{WIN_SCORE}</span>
          </div>

          <button 
            onClick={toggleLang}
            className="p-2 hover:bg-white/5 rounded-full transition-colors border border-white/10"
          >
            <Globe className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-5xl mx-auto px-4 pb-12 relative">
        <div className="relative group">
          <GameCanvas 
            status={status} 
            difficulty={difficulty}
            onScoreUpdate={handleScoreUpdate}
            onGameEnd={handleGameEnd}
            onMissileUpdate={handleMissileUpdate}
          />

          {/* Overlays */}
          <AnimatePresence>
            {status !== GameStatus.PLAYING && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/90 backdrop-blur-md rounded-xl border border-white/10"
              >
                <div className="text-center p-8 w-full max-w-2xl">
                  {status === GameStatus.START && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/40">
                        <Target className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h2 className="text-3xl font-bold mb-4 tracking-tighter uppercase">{t.title}</h2>
                      <p className="text-white/60 mb-12 text-sm leading-relaxed max-w-md mx-auto">
                        {lang === 'zh' 
                          ? '拦截敌方火箭，保护你的城市。点击屏幕发射导弹，利用爆炸范围摧毁威胁。' 
                          : 'Intercept enemy rockets and protect your cities. Click to fire missiles and use explosion AOE to destroy threats.'}
                      </p>
                      
                      <div className="flex flex-col md:flex-row justify-center gap-4 mb-12">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
                          {difficultyOptions.map((opt) => {
                            const Icon = opt.icon;
                            const config = DIFFICULTY_SETTINGS[opt.id];
                            return (
                              <button
                                key={opt.id}
                                onClick={() => startGame(opt.id)}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-gradient-to-b ${opt.class} transition-all hover:scale-105 active:scale-95 group`}
                              >
                                <Icon className="w-6 h-6 transition-transform group-hover:rotate-12" style={{ color: config.color }} />
                                <span className="text-xs font-bold uppercase tracking-wider">{config.label[lang]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button 
                        onClick={() => setShowLeaderboard(true)}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl font-mono text-[10px] uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2 mx-auto"
                      >
                        <History className="w-4 h-4" />
                        {lang === 'zh' ? '查看历史战绩' : 'View Combat History'}
                      </button>
                    </motion.div>
                  )}

                  {status === GameStatus.WON && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <div className="relative inline-block mb-6">
                        <Trophy className="w-20 h-20 text-yellow-500" />
                        <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-pulse" />
                      </div>
                      <h2 className="text-4xl font-black mb-4 text-yellow-500 uppercase tracking-tighter">{t.win}</h2>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 inline-block">
                        <p className="text-white/40 text-xs uppercase mb-1">{t.score}</p>
                        <p className="text-4xl font-mono font-bold text-white">{score}</p>
                      </div>
                      <div className="flex flex-col md:flex-row justify-center gap-4">
                        <button 
                          onClick={() => setStatus(GameStatus.START)}
                          className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCcw className="w-5 h-5" />
                          {t.restart}
                        </button>
                        <button 
                          onClick={() => setShowLeaderboard(true)}
                          className="px-8 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-white/10"
                        >
                          <History className="w-5 h-5" />
                          {lang === 'zh' ? '排行榜' : 'Leaderboard'}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {status === GameStatus.LOST && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <Skull className="w-20 h-20 text-red-500 mx-auto mb-6" />
                      <h2 className="text-4xl font-black mb-4 text-red-500 uppercase tracking-tighter">{t.lose}</h2>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 inline-block">
                        <p className="text-white/40 text-xs uppercase mb-1">{t.score}</p>
                        <p className="text-4xl font-mono font-bold text-white">{score}</p>
                      </div>
                      <div className="flex flex-col md:flex-row justify-center gap-4">
                        <button 
                          onClick={() => setStatus(GameStatus.START)}
                          className="px-8 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCcw className="w-5 h-5" />
                          {t.restart}
                        </button>
                        <button 
                          onClick={() => setShowLeaderboard(true)}
                          className="px-8 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-white/10"
                        >
                          <History className="w-5 h-5" />
                          {lang === 'zh' ? '排行榜' : 'Leaderboard'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Stats / Controls */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {['left', 'center', 'right'].map((id) => (
            <div key={id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${missiles[id] > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
                  {id === 'center' ? (lang === 'zh' ? '主炮塔' : 'Main Battery') : (id === 'left' ? (lang === 'zh' ? '左翼' : 'Left Wing') : (lang === 'zh' ? '右翼' : 'Right Wing'))}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-mono font-bold ${missiles[id] === 0 ? 'text-red-500' : 'text-white'}`}>
                  {missiles[id]}
                </span>
                <span className="text-[10px] font-mono text-white/20">/ {id === 'center' ? 80 : 50}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard Modal */}
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter uppercase">
                        {lang === 'zh' ? '防御纪录' : 'Defense Records'}
                      </h2>
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Global Leaderboard</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowLeaderboard(false)}
                    className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-20">
                      <History className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
                        {lang === 'zh' ? '暂无作战记录' : 'No combat records found'}
                      </p>
                    </div>
                  ) : (
                    leaderboard.map((entry, i) => (
                      <div key={i} className="group flex items-center justify-between p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 transition-all">
                        <div className="flex items-center gap-6">
                          <span className={`text-2xl font-black italic w-8 ${i < 3 ? 'text-yellow-500' : 'text-white/20'}`}>
                            {(i + 1).toString().padStart(2, '0')}
                          </span>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-xl font-mono font-bold text-white tabular-nums">{entry.score}</span>
                              <span className="text-[10px] font-mono text-white/20 uppercase">PTS</span>
                            </div>
                            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{entry.date}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                          <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                            entry.difficulty === Difficulty.MYTHIC ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            entry.difficulty === Difficulty.EXTREME ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            entry.difficulty === Difficulty.HARD ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            entry.difficulty === Difficulty.NORMAL ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {DIFFICULTY_SETTINGS[entry.difficulty].label[lang]}
                          </div>
                          <div className="text-4xl font-black text-emerald-500 italic drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            {entry.rating}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions Footer */}
        <footer className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-[11px] font-mono text-white/40 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {lang === 'zh' ? '点击发射' : 'Click to Fire'}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {lang === 'zh' ? '预判提前量' : 'Lead your shots'}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {lang === 'zh' ? '守护城市' : 'Defend Cities'}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
