import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapPin, Trophy, X, Compass, Sparkles, Lock, Unlock } from 'lucide-react';
import api from '../../services/api';

export function TreasureHuntGame({ onComplete, onExit }) {
  const [gameState, setGameState] = useState('loading'); // loading, playing, won
  const [hunt, setHunt] = useState(null);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    startNewHunt();
  }, []);

  const startNewHunt = async () => {
    try {
      setGameState('loading');

      // Generate a treasure hunt based on user's memories and timeline
      const [memories, timeline, stories] = await Promise.all([
        api.getMemoryAnchors(),
        api.getTimelineEvents(),
        api.getLifeStories(),
      ]);

      if (memories.length === 0 && timeline.length === 0) {
        setGameState('no_content');
        return;
      }

      // Combine all content
      const allContent = [
        ...memories.map(m => ({ type: 'memory', title: m.title, description: m.description, data: m })),
        ...timeline.map(t => ({ type: 'event', title: t.title, description: t.description, data: t })),
        ...stories.map(s => ({ type: 'story', title: s.title, description: s.content, data: s })),
      ];

      if (allContent.length === 0) {
        setGameState('no_content');
        return;
      }

      // Select random target treasure
      const treasure = allContent[Math.floor(Math.random() * allContent.length)];

      // Generate clues using AI
      const cluesResponse = await api.generateText({
        prompt: `Create a treasure hunt with 3 progressive clues leading to this treasure:
Title: ${treasure.title}
Description: ${treasure.description}

Generate exactly 3 clues in this format:
CLUE1: [A cryptic clue that hints at the treasure without revealing it directly]
ANSWER1: [A simple one-word or short phrase answer for clue 1]
HINT1: [An easier hint if they're stuck]
CLUE2: [A more specific clue building on clue 1]
ANSWER2: [Answer for clue 2]
HINT2: [Hint for clue 2]
CLUE3: [Final clue that almost reveals the treasure]
ANSWER3: [Answer for clue 3]
HINT3: [Hint for clue 3]`,
        maxTokens: 500,
      });

      // Parse clues from response
      const text = cluesResponse?.text || cluesResponse?.message || '';
      const clues = [];

      // Only parse if we have valid text
      if (text && typeof text === 'string') {
        for (let i = 1; i <= 3; i++) {
          try {
            const clueMatch = text.match(new RegExp(`CLUE${i}:\\s*(.+?)(?=ANSWER${i}:|$)`, 's'));
            const answerMatch = text.match(new RegExp(`ANSWER${i}:\\s*(.+?)(?=HINT${i}:|$)`, 's'));
            const hintMatch = text.match(new RegExp(`HINT${i}:\\s*(.+?)(?=CLUE${i + 1}:|$)`, 's'));

            if (clueMatch && answerMatch) {
              clues.push({
                clue: clueMatch[1].trim(),
                answer: answerMatch[1].trim().toLowerCase(),
                hint: hintMatch ? hintMatch[1].trim() : 'Think about the previous clues...',
              });
            }
          } catch (parseError) {
            console.error(`Failed to parse clue ${i}:`, parseError);
          }
        }
      }

      // Fallback if parsing fails
      if (clues.length === 0) {
        clues.push(
          { clue: 'This memory involves a special moment...', answer: 'memory', hint: 'Think about cherished moments' },
          { clue: 'Look for something from the past...', answer: 'past', hint: 'Think about your timeline' },
          { clue: 'The final piece of the puzzle...', answer: treasure.title.split(' ')[0].toLowerCase(), hint: `It's about: ${treasure.title}` }
        );
      }

      setHunt({
        treasure,
        clues: clues.slice(0, 3),
        completed: [],
      });

      setGameState('playing');
    } catch (error) {
      console.error('Failed to start treasure hunt:', error);
      setGameState('error');
    }
  };

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return;

    const currentClue = hunt.clues[currentClueIndex];
    const userAnswer = answer.toLowerCase().trim();
    const correctAnswer = currentClue.answer.toLowerCase();

    setAttempts(prev => prev + 1);

    // Check if answer is close enough (fuzzy match)
    const isCorrect = userAnswer === correctAnswer ||
                      correctAnswer.includes(userAnswer) ||
                      userAnswer.includes(correctAnswer);

    if (isCorrect) {
      const newCompleted = [...hunt.completed, currentClueIndex];

      setHunt(prev => ({
        ...prev,
        completed: newCompleted,
      }));

      setAnswer('');
      setShowHint(false);
      setAttempts(0);

      // Check if all clues solved
      if (currentClueIndex === hunt.clues.length - 1) {
        endGame(true);
      } else {
        setCurrentClueIndex(prev => prev + 1);
      }
    } else {
      // Wrong answer - maybe show hint after 2 attempts
      if (attempts >= 1) {
        setShowHint(true);
      }
    }
  };

  const endGame = async (won) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const pointsEarned = won ? (100 + (hunt.clues.length - attempts) * 10) : 0;

    setGameState(won ? 'won' : 'lost');

    try {
      const session = await api.createGameSession({
        gameType: 'treasure_hunt',
        difficulty: 'easy',
        questionsAsked: hunt.clues.length,
        correctAnswers: hunt.completed.length + 1,
        hintsUsed: showHint ? 1 : 0,
        timeSpent,
        completed: true,
        won,
        pointsEarned,
        gameData: {
          treasureId: hunt.treasure.data.id,
          cluesSolved: hunt.completed.length + 1,
          totalAttempts: attempts,
        },
      });

      if (onComplete) {
        onComplete({ won, pointsEarned, session });
      }
    } catch (error) {
      console.error('Failed to save game session:', error);
    }
  };

  if (gameState === 'loading') {
    return (
      <div className="text-center py-20">
        <Map className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
        <p className="text-cream/50">Creating your treasure hunt...</p>
      </div>
    );
  }

  if (gameState === 'no_content') {
    return (
      <div className="text-center py-20">
        <Map className="w-16 h-16 text-amber-400/30 mx-auto mb-4" />
        <h3 className="text-xl font-serif text-cream mb-3">No Content Yet</h3>
        <p className="text-cream/50 mb-6">Add some memories or timeline events first!</p>
        <button onClick={onExit} className="btn-primary">
          Go to My Persona
        </button>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="text-center py-20">
        <X className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
        <h3 className="text-xl font-serif text-cream mb-3">Error</h3>
        <p className="text-cream/50 mb-6">Failed to create treasure hunt. Please try again.</p>
        <button onClick={onExit} className="btn-primary">
          Back to Games
        </button>
      </div>
    );
  }

  if (gameState === 'won') {
    const pointsEarned = 100 + (hunt.clues.length - attempts) * 10;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <Trophy className="w-20 h-20 text-gold mx-auto mb-6" />
        <h2 className="text-3xl font-serif text-cream mb-3">Treasure Found!</h2>
        <p className="text-cream/60 mb-6">
          You discovered the hidden {hunt.treasure.type}!
        </p>

        <div className="bg-gold/10 border border-gold/20 rounded-xl p-6 mb-6 max-w-md mx-auto">
          <p className="text-gold text-2xl font-bold mb-2">+{pointsEarned} Points</p>
          <p className="text-cream/50 text-sm">Treasure hunt completed!</p>
        </div>

        <div className="bg-navy-light/50 rounded-xl p-6 mb-6 max-w-md mx-auto">
          <h3 className="text-cream font-medium mb-3">{hunt.treasure.title}</h3>
          <p className="text-cream/70 text-sm">{hunt.treasure.description?.substring(0, 200)}...</p>
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={startNewHunt} className="btn-primary">
            New Hunt
          </button>
          <button onClick={onExit} className="px-6 py-3 bg-navy-light/50 hover:bg-navy-light text-cream rounded-lg transition-colors">
            Back to Games
          </button>
        </div>
      </motion.div>
    );
  }

  const currentClue = hunt?.clues[currentClueIndex];
  const progress = ((currentClueIndex / hunt?.clues.length) * 100) || 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-serif text-cream">Treasure Hunt</h2>
            <p className="text-cream/50 text-sm">Follow the clues to find the hidden treasure</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-cream/70">Progress</span>
          <span className="text-amber-400 font-medium">Clue {currentClueIndex + 1} of {hunt?.clues.length}</span>
        </div>
        <div className="w-full bg-navy-light/50 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Clue Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {hunt?.clues.map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
              hunt.completed.includes(index)
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : index === currentClueIndex
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-navy-light/30 border-cream/20 text-cream/30'
            }`}>
              {hunt.completed.includes(index) ? (
                <Unlock className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            {index < hunt.clues.length - 1 && (
              <div className={`w-12 h-0.5 ${hunt.completed.includes(index) ? 'bg-green-500/50' : 'bg-cream/20'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Current Clue */}
      <motion.div
        key={currentClueIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card p-8 border-2 border-amber-500/30 mb-6"
      >
        <div className="flex items-start gap-4 mb-6">
          <Compass className="w-8 h-8 text-amber-400 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-serif text-cream mb-3">Clue {currentClueIndex + 1}</h3>
            <p className="text-cream/80 text-lg leading-relaxed">{currentClue?.clue}</p>
          </div>
        </div>

        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium mb-1">Hint:</p>
                <p className="text-cream/70 text-sm">{currentClue?.hint}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
            placeholder="Enter your answer..."
            className="w-full px-4 py-3 bg-navy-light/50 border-2 border-amber-500/30 focus:border-amber-500/50 rounded-lg text-cream placeholder-cream/30 outline-none transition-colors"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={handleSubmitAnswer}
              disabled={!answer.trim()}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
            {!showHint && (
              <button
                onClick={() => setShowHint(true)}
                className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors font-medium"
              >
                Show Hint
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Completed Clues */}
      {hunt?.completed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-cream/50 text-sm font-medium mb-3">Solved Clues</h3>
          {hunt.completed.map(index => (
            <div key={index} className="glass-card p-4 border-green-500/20 opacity-60">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-cream/70 text-sm">Clue {index + 1}: {hunt.clues[index].clue.substring(0, 50)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
