import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Trophy, X, Clock, Target, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

export function GuessTheYearGame({ onComplete, onExit }) {
  const [gameState, setGameState] = useState('loading');
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [startTime] = useState(Date.now());
  const [timeLimit] = useState(60); // 60 seconds per round
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const startNewGame = async () => {
    try {
      setGameState('loading');
      const timelineEvents = await api.getTimelineEvents();

      if (timelineEvents.length < 3) {
        setGameState('no_events');
        return;
      }

      // Select 5 random events (or all if less than 5)
      const shuffled = [...timelineEvents].sort(() => Math.random() - 0.5);
      const selectedEvents = shuffled.slice(0, Math.min(5, shuffled.length));

      setEvents(selectedEvents);
      setGameState('playing');
      setTimeLeft(timeLimit);
    } catch (error) {
      console.error('Failed to start game:', error);
      setGameState('error');
    }
  };

  const handleSubmitGuess = () => {
    if (!guess.trim()) return;

    const currentEvent = events[currentEventIndex];
    const correctYear = new Date(currentEvent.eventDate).getFullYear();
    const guessedYear = parseInt(guess);

    const difference = Math.abs(correctYear - guessedYear);
    let points = 0;

    // Scoring: exact = 20, ±1 year = 15, ±2 = 10, ±3 = 5, else 0
    if (difference === 0) points = 20;
    else if (difference === 1) points = 15;
    else if (difference === 2) points = 10;
    else if (difference === 3) points = 5;

    setScore(prev => prev + points);
    setResults(prev => [...prev, {
      event: currentEvent,
      guessedYear,
      correctYear,
      difference,
      points,
    }]);

    // Move to next event or end game
    if (currentEventIndex === events.length - 1) {
      endGame();
    } else {
      setCurrentEventIndex(prev => prev + 1);
      setGuess('');
    }
  };

  const endGame = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const correctGuesses = results.filter(r => r.difference === 0).length;
    const won = score >= (events.length * 10); // Win if average 10+ points per event

    setGameState('finished');

    try {
      const session = await api.createGameSession({
        gameType: 'guess_year',
        difficulty: 'hard',
        questionsAsked: events.length,
        correctAnswers: correctGuesses,
        hintsUsed: 0,
        timeSpent,
        completed: true,
        won,
        pointsEarned: score,
        gameData: {
          results: results,
          totalEvents: events.length,
        },
      });

      if (onComplete) {
        onComplete({ won, pointsEarned: score, session });
      }
    } catch (error) {
      console.error('Failed to save game session:', error);
    }
  };

  if (gameState === 'loading') {
    return (
      <div className="text-center py-20">
        <Calendar className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
        <p className="text-cream/50">Loading timeline events...</p>
      </div>
    );
  }

  if (gameState === 'no_events') {
    return (
      <div className="relative">
        <button
          onClick={onExit}
          className="absolute top-0 right-0 p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-cream mb-3">Not Enough Events</h3>
          <p className="text-cream/50 mb-6">Add at least 3 timeline events to play!</p>
          <button onClick={onExit} className="btn-primary">
            Go to Echo Timeline
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="relative">
        <button
          onClick={onExit}
          className="absolute top-0 right-0 p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center py-20">
          <XCircle className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-cream mb-3">Error</h3>
          <p className="text-cream/50 mb-6">Failed to load events. Please try again.</p>
          <button onClick={onExit} className="btn-primary">
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const correctCount = results.filter(r => r.difference === 0).length;
    const closeCount = results.filter(r => r.difference > 0 && r.difference <= 3).length;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto py-12"
      >
        <div className="text-center mb-8">
          <Trophy className="w-20 h-20 text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl font-serif text-cream mb-3">Game Complete!</h2>
          <p className="text-cream/60">Your final score:</p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-8 text-center">
          <p className="text-purple-400 text-4xl font-bold mb-2">{score} Points</p>
          <p className="text-cream/50 text-sm">
            {correctCount} exact • {closeCount} close ({correctCount + closeCount}/{events.length})
          </p>
        </div>

        {/* Results */}
        <div className="space-y-3 mb-8">
          {results.map((result, index) => (
            <div key={index} className="glass-card p-4 border-purple-500/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-cream font-medium mb-1">{result.event.title}</h4>
                  <p className="text-cream/50 text-sm">
                    Your guess: {result.guessedYear} • Correct: {result.correctYear}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {result.difference === 0 ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">+{result.points}</span>
                    </>
                  ) : result.points > 0 ? (
                    <>
                      <Target className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">+{result.points}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400/50" />
                      <span className="text-red-400/50 font-medium">+0</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={startNewGame} className="btn-primary">
            Play Again
          </button>
          <button onClick={onExit} className="px-6 py-3 bg-navy-light/50 hover:bg-navy-light text-cream rounded-lg transition-colors">
            Back to Games
          </button>
        </div>
      </motion.div>
    );
  }

  const currentEvent = events[currentEventIndex];
  const progress = ((currentEventIndex / events.length) * 100) || 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-serif text-cream">Guess the Year</h2>
            <p className="text-cream/50 text-sm">Match events to their correct years</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="text-center">
            <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-cream">{timeLeft}s</p>
            <p className="text-cream/50 text-xs">Time Left</p>
          </div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="text-center">
            <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-cream">{score}</p>
            <p className="text-cream/50 text-xs">Score</p>
          </div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="text-center">
            <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-cream">{currentEventIndex + 1}/{events.length}</p>
            <p className="text-cream/50 text-xs">Progress</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-navy-light/50 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Event */}
      <motion.div
        key={currentEventIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card p-8 border-2 border-purple-500/30 mb-6"
      >
        <div className="mb-6">
          <h3 className="text-2xl font-serif text-cream mb-4">{currentEvent?.title}</h3>
          {currentEvent?.description && (
            <p className="text-cream/70 leading-relaxed">{currentEvent.description}</p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-cream/70 text-sm mb-2">What year did this happen?</label>
            <input
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitGuess()}
              placeholder="Enter year (e.g., 2020)"
              min="1900"
              max={new Date().getFullYear()}
              className="w-full px-4 py-3 bg-navy-light/50 border-2 border-purple-500/30 focus:border-purple-500/50 rounded-lg text-cream placeholder-cream/30 outline-none transition-colors text-xl text-center font-bold"
              autoFocus
            />
          </div>
          <button
            onClick={handleSubmitGuess}
            disabled={!guess.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Guess
          </button>
        </div>

        <div className="mt-6 bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <p className="text-cream/60 text-sm text-center">
            💡 <strong>Scoring:</strong> Exact = 20pts • ±1 year = 15pts • ±2 = 10pts • ±3 = 5pts
          </p>
        </div>
      </motion.div>

      {/* Previous Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-cream/50 text-sm font-medium mb-3">Previous Guesses</h3>
          {results.slice(-3).reverse().map((result, index) => (
            <div key={index} className="glass-card p-3 border-purple-500/20 opacity-60">
              <div className="flex items-center justify-between">
                <span className="text-cream/70 text-sm">{result.event.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-cream/50 text-xs">{result.guessedYear} → {result.correctYear}</span>
                  {result.difference === 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : result.points > 0 ? (
                    <Target className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400/50" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
