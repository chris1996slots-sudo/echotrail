import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Target,
  Calendar,
  Play,
  Clock,
  CheckCircle,
  Brain,
  Map,
  BookOpen,
} from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import { GameContainer } from '../components/games/GameContainer';
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

export function EchoGamesPage() {
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      setLoading(true);
      const [progressData, sessionsData] = await Promise.all([
        api.getGameProgress(),
        api.getGameSessions(),
      ]);
      setProgress(progressData);
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
    setSelectedGame(gameType);
  };

  const handleGameComplete = (result) => {
    // Reload game data to show updated progress
    loadGameData();
    // Keep game open to show results
  };

  const handleExitGame = () => {
    setSelectedGame(null);
    // Reload data in case game was completed
    loadGameData();
  };

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
              <h1 className="text-3xl md:text-5xl font-serif text-cream mb-4">Echo Games</h1>
              <p className="text-cream/60 text-base md:text-lg max-w-2xl mx-auto">
                Play interactive games and discover family stories through fun challenges.
              </p>
            </div>
          </FadeIn>

          {loading ? (
            <div className="text-center py-20">
              <Gamepad2 className="w-12 h-12 text-green-500/50 mx-auto mb-4 animate-bounce" />
              <p className="text-cream/50">Loading games...</p>
            </div>
          ) : (
            <>
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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

              {/* Game Play Modal */}
              <AnimatePresence>
                {selectedGame && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto"
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-navy-dark border-2 border-green-500/30 rounded-2xl p-8 max-w-5xl w-full my-8"
                    >
                      <GameContainer
                        gameType={selectedGame}
                        onComplete={handleGameComplete}
                        onExit={handleExitGame}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
