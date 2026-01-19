import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Trophy,
  Target,
  Zap,
  Star,
  TrendingUp,
  Calendar,
  Award,
  Lock,
  Play,
  Clock,
  CheckCircle,
  X,
  Sparkles,
  Brain,
  Map,
  Film,
  BookOpen,
  ChevronRight,
  Medal,
  Flame
} from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import api from '../services/api';

const gameTypes = [
  {
    id: 'twenty_questions',
    name: '20 Questions',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500/30 hover:border-blue-500/50',
    description: 'Guess the story, memory, or fact in 20 questions or less',
    difficulty: 'Medium',
  },
  {
    id: 'treasure_hunt',
    name: 'Treasure Hunt',
    icon: Map,
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/30 hover:border-amber-500/50',
    description: 'Follow clues to discover hidden memories and stories',
    difficulty: 'Easy',
  },
  {
    id: 'guess_year',
    name: 'Guess the Year',
    icon: Calendar,
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-500/30 hover:border-purple-500/50',
    description: 'Match events to their correct years from your timeline',
    difficulty: 'Hard',
  },
  {
    id: 'story_match',
    name: 'Story Match',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500',
    borderColor: 'border-green-500/30 hover:border-green-500/50',
    description: 'Match story fragments to complete life memories',
    difficulty: 'Medium',
  },
];

const achievementRarities = {
  common: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  rare: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  epic: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  legendary: { color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20' },
};

export function EchoGamesPage() {
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      setLoading(true);
      const [progressData, achievementsData, sessionsData] = await Promise.all([
        api.getGameProgress(),
        api.getAchievements(),
        api.getGameSessions(),
      ]);
      setProgress(progressData);
      setAchievements(achievementsData);
      setSessions(sessionsData.slice(0, 5)); // Recent 5
    } catch (error) {
      console.error('Failed to load game data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGameStats = (gameType) => {
    if (!progress) return { played: 0, won: 0, winRate: 0 };

    let played = 0;
    let won = 0;

    switch (gameType) {
      case 'twenty_questions':
        played = progress.twentyQuestionsPlayed;
        won = progress.twentyQuestionsWon;
        break;
      case 'treasure_hunt':
        won = progress.treasureHuntsCompleted;
        played = won; // Only completed hunts are tracked
        break;
      case 'guess_year':
        played = progress.guessTheYearPlayed;
        won = progress.guessTheYearCorrect;
        break;
      default:
        break;
    }

    const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
    return { played, won, winRate };
  };

  const handlePlayGame = (gameType) => {
    // TODO: Navigate to game play interface
    setSelectedGame(gameType);
  };

  const getLevelProgress = () => {
    if (!progress) return { current: 1, next: 2, percentage: 0 };
    const current = progress.level;
    const pointsForNext = current * 1000; // Example: level * 1000 points
    const currentPoints = progress.totalPoints % pointsForNext;
    const percentage = (currentPoints / pointsForNext) * 100;
    return { current, next: current + 1, percentage };
  };

  const levelInfo = getLevelProgress();

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-navy-light py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <FadeIn>
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
              >
                <Gamepad2 className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-5xl font-serif text-cream mb-4">Echo Games</h1>
              <p className="text-cream/60 text-lg max-w-2xl mx-auto">
                Play interactive games and discover family stories while earning points and unlocking achievements.
              </p>
            </div>
          </FadeIn>

          {loading ? (
            <div className="text-center py-20">
              <Gamepad2 className="w-12 h-12 text-green-500/50 mx-auto mb-4 animate-bounce" />
              <p className="text-cream/50">Loading your progress...</p>
            </div>
          ) : (
            <>
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Level & Points */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 border-gold/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gold to-amber-500 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-navy" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-cream">Level {progress?.level || 1}</h3>
                      <p className="text-cream/50 text-sm">{progress?.totalPoints || 0} points</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-cream/50">
                      <span>Progress to Level {levelInfo.next}</span>
                      <span>{Math.round(levelInfo.percentage)}%</span>
                    </div>
                    <div className="w-full bg-navy-light/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-gold to-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${levelInfo.percentage}%` }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Current Streak */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-6 border-orange-500/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-cream">{progress?.currentStreak || 0} Day Streak</h3>
                      <p className="text-cream/50 text-sm">Best: {progress?.longestStreak || 0} days</p>
                    </div>
                  </div>
                  <p className="text-xs text-cream/40">
                    Play daily to maintain your streak and earn bonus points!
                  </p>
                </motion.div>

                {/* Achievements */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-6 border-purple-500/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-cream">{progress?.badgesEarned || 0} Badges</h3>
                      <p className="text-cream/50 text-sm">{achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked</p>
                    </div>
                  </div>
                  <p className="text-xs text-cream/40">
                    Complete challenges to unlock rare achievements!
                  </p>
                </motion.div>
              </div>

              {/* Game Selection */}
              <div className="mb-12">
                <h2 className="text-2xl font-serif text-cream mb-6 flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-green-400" />
                  Choose Your Game
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gameTypes.map((game, index) => {
                    const stats = getGameStats(game.id);
                    const Icon = game.icon;
                    return (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`glass-card p-6 border-2 ${game.borderColor} transition-all cursor-pointer group hover:scale-105`}
                        onClick={() => handlePlayGame(game.id)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-14 h-14 bg-gradient-to-br ${game.color} rounded-xl flex items-center justify-center`}>
                              <Icon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-serif text-cream">{game.name}</h3>
                              <span className="text-xs text-cream/50">{game.difficulty}</span>
                            </div>
                          </div>
                          <button className="p-2 rounded-lg bg-navy-light/50 group-hover:bg-green-500/20 text-cream/70 group-hover:text-green-400 transition-colors">
                            <Play className="w-5 h-5" />
                          </button>
                        </div>

                        <p className="text-cream/60 text-sm mb-4">{game.description}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 pt-4 border-t border-cream/10">
                          <div className="flex items-center gap-1 text-cream/50 text-sm">
                            <Target className="w-4 h-4" />
                            <span>{stats.played} played</span>
                          </div>
                          {stats.played > 0 && (
                            <div className="flex items-center gap-1 text-green-400 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              <span>{stats.winRate}% win rate</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Sessions */}
              {sessions.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-serif text-cream mb-6 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-blue-400" />
                    Recent Games
                  </h2>
                  <div className="glass-card border-blue-500/20 overflow-hidden">
                    <div className="divide-y divide-cream/10">
                      {sessions.map((session) => {
                        const game = gameTypes.find(g => g.id === session.gameType);
                        const Icon = game?.icon || Gamepad2;
                        return (
                          <div key={session.id} className="p-4 hover:bg-navy-light/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 bg-gradient-to-br ${game?.color || 'from-gray-500 to-gray-600'} rounded-lg flex items-center justify-center`}>
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-cream font-medium">{game?.name || 'Unknown Game'}</h4>
                                  <p className="text-cream/50 text-sm">
                                    {new Date(session.createdAt).toLocaleDateString()} • {session.questionsAsked || 0} questions
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {session.won ? (
                                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                                    Won +{session.pointsEarned}pts
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full">
                                    Lost
                                  </span>
                                )}
                                {session.timeSpent && (
                                  <div className="flex items-center gap-1 text-cream/40 text-sm">
                                    <Clock className="w-4 h-4" />
                                    {Math.floor(session.timeSpent / 60)}:{(session.timeSpent % 60).toString().padStart(2, '0')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Achievements */}
              <div>
                <h2 className="text-2xl font-serif text-cream mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-gold" />
                  Achievements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement, index) => {
                    const rarity = achievementRarities[achievement.rarity] || achievementRarities.common;
                    return (
                      <motion.div
                        key={achievement.key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`glass-card p-4 border-2 ${rarity.border} ${!achievement.unlocked && 'opacity-50'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 ${rarity.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            {achievement.unlocked ? (
                              <Medal className={`w-6 h-6 ${rarity.color}`} />
                            ) : (
                              <Lock className="w-6 h-6 text-cream/30" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-cream font-medium mb-1">{achievement.name}</h4>
                            <p className="text-cream/50 text-xs mb-2">{achievement.description}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${rarity.bg} ${rarity.color}`}>
                                {achievement.rarity}
                              </span>
                              <span className="text-xs text-gold">+{achievement.pointsReward}pts</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Coming Soon Overlay for Game Play */}
              <AnimatePresence>
                {selectedGame && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setSelectedGame(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-navy-dark border-2 border-green-500/30 rounded-2xl p-8 max-w-md w-full"
                    >
                      <button
                        onClick={() => setSelectedGame(null)}
                        className="absolute top-4 right-4 p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="text-center">
                        <Sparkles className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-serif text-cream mb-3">Coming Soon!</h2>
                        <p className="text-cream/60 mb-6">
                          The game play interface is currently in development. Soon you'll be able to play interactive games and earn achievements!
                        </p>
                        <button
                          onClick={() => setSelectedGame(null)}
                          className="btn-primary w-full"
                        >
                          Got it!
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Info Box */}
          {!loading && (
            <div className="mt-12 bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
              <Gamepad2 className="w-8 h-8 text-green-400/60 mx-auto mb-3" />
              <p className="text-cream/70 text-sm">
                Play games to earn points, unlock achievements, and discover new stories about your family legacy.
                <br />
                The more you play, the more you learn!
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
