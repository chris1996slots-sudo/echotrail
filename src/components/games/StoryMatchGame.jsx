import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, X, Shuffle, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import api from '../../services/api';

export function StoryMatchGame({ onComplete, onExit }) {
  const [gameState, setGameState] = useState('loading');
  const [story, setStory] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [selectedFragments, setSelectedFragments] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    try {
      setGameState('loading');
      const stories = await api.getLifeStories();

      if (stories.length === 0) {
        setGameState('no_stories');
        return;
      }

      // Select a random story with enough content
      const longStories = stories.filter(s => s.content && s.content.length > 100);
      if (longStories.length === 0) {
        setGameState('no_stories');
        return;
      }

      const selectedStory = longStories[Math.floor(Math.random() * longStories.length)];

      // Split story into fragments using AI
      const response = await api.generateText({
        prompt: `Split this story into exactly 4 meaningful fragments that tell a sequence.
Each fragment should be a complete sentence or thought.
Format: FRAG1: [text] | FRAG2: [text] | FRAG3: [text] | FRAG4: [text]

Story:
${selectedStory.content}`,
        maxTokens: 300,
      });

      // Parse fragments
      const text = response.text;
      const fragMatches = [];
      for (let i = 1; i <= 4; i++) {
        const match = text.match(new RegExp(`FRAG${i}:\\s*(.+?)(?=\\s*\\||\\s*$)`, 's'));
        if (match) {
          fragMatches.push(match[1].trim());
        }
      }

      // Fallback if parsing fails
      if (fragMatches.length < 4) {
        // Simple split by sentences
        const sentences = selectedStory.content.match(/[^.!?]+[.!?]+/g) || [];
        const chunkSize = Math.ceil(sentences.length / 4);
        for (let i = 0; i < 4; i++) {
          const start = i * chunkSize;
          const chunk = sentences.slice(start, start + chunkSize).join(' ');
          if (chunk) fragMatches.push(chunk);
        }
      }

      // Create fragment objects with correct order
      const orderedFragments = fragMatches.slice(0, 4).map((text, index) => ({
        id: index,
        text,
        correctPosition: index,
      }));

      // Shuffle fragments
      const shuffled = [...orderedFragments].sort(() => Math.random() - 0.5);

      setStory(selectedStory);
      setFragments(shuffled);
      setGameState('playing');
    } catch (error) {
      console.error('Failed to start game:', error);
      setGameState('error');
    }
  };

  const handleFragmentClick = (fragment) => {
    // Toggle selection
    if (selectedFragments.find(f => f.id === fragment.id)) {
      setSelectedFragments(prev => prev.filter(f => f.id !== fragment.id));
    } else {
      setSelectedFragments(prev => [...prev, fragment]);
    }
  };

  const handleCheckOrder = () => {
    // Check if all fragments are selected
    if (selectedFragments.length !== fragments.length) {
      return;
    }

    // Check if order is correct
    const isCorrect = selectedFragments.every((frag, index) => frag.correctPosition === index);

    if (isCorrect) {
      endGame(true);
    } else {
      setAttempts(prev => prev + 1);
      if (attempts + 1 >= maxAttempts) {
        endGame(false);
      } else {
        // Show wrong feedback but allow retry
        setTimeout(() => {
          setSelectedFragments([]);
        }, 1000);
      }
    }
  };

  const handleShuffle = () => {
    setFragments(prev => [...prev].sort(() => Math.random() - 0.5));
    setSelectedFragments([]);
  };

  const endGame = async (won) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const pointsEarned = won ? (100 - (attempts * 20)) : 0;

    setGameState(won ? 'won' : 'lost');

    try {
      const session = await api.createGameSession({
        gameType: 'story_match',
        difficulty: 'medium',
        questionsAsked: 1,
        correctAnswers: won ? 1 : 0,
        hintsUsed: 0,
        timeSpent,
        completed: true,
        won,
        pointsEarned,
        gameData: {
          storyId: story?.id,
          attempts,
          maxAttempts,
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
        <BookOpen className="w-12 h-12 text-green-400 mx-auto mb-4 animate-pulse" />
        <p className="text-cream/50">Loading stories...</p>
      </div>
    );
  }

  if (gameState === 'no_stories') {
    return (
      <div className="relative">
        <button
          onClick={onExit}
          className="absolute top-0 right-0 p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-green-400/30 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-cream mb-3">No Stories Yet</h3>
          <p className="text-cream/50 mb-6">Add some life stories to play Story Match!</p>
          <button onClick={onExit} className="btn-primary">
            Go to My Persona
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
          <p className="text-cream/50 mb-6">Failed to load story. Please try again.</p>
          <button onClick={onExit} className="btn-primary">
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'won' || gameState === 'lost') {
    const won = gameState === 'won';
    const pointsEarned = won ? (100 - (attempts * 20)) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto py-12"
      >
        <div className="text-center mb-8">
          {won ? (
            <>
              <Trophy className="w-20 h-20 text-gold mx-auto mb-6" />
              <h2 className="text-3xl font-serif text-cream mb-3">Perfect Match!</h2>
              <p className="text-cream/60">You arranged the story correctly!</p>
            </>
          ) : (
            <>
              <BookOpen className="w-20 h-20 text-green-400/50 mx-auto mb-6" />
              <h2 className="text-3xl font-serif text-cream mb-3">Out of Attempts</h2>
              <p className="text-cream/60">Here's the correct order:</p>
            </>
          )}
        </div>

        {won && (
          <div className="bg-gold/10 border border-gold/20 rounded-xl p-6 mb-8 text-center">
            <p className="text-gold text-3xl font-bold mb-2">+{pointsEarned} Points</p>
            <p className="text-cream/50 text-sm">Completed in {attempts + 1} attempt{attempts !== 0 ? 's' : ''}!</p>
          </div>
        )}

        {/* Correct Story Order */}
        <div className="space-y-3 mb-8">
          <h3 className="text-cream font-medium mb-4">The Complete Story</h3>
          {fragments
            .sort((a, b) => a.correctPosition - b.correctPosition)
            .map((fragment, index) => (
              <div key={fragment.id} className="glass-card p-4 border-green-500/20">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0 text-green-400 font-bold">
                    {index + 1}
                  </div>
                  <p className="text-cream/80 leading-relaxed">{fragment.text}</p>
                </div>
              </div>
            ))}
        </div>

        <div className="bg-navy-light/50 rounded-xl p-6 mb-8">
          <h3 className="text-cream font-medium mb-2">{story?.title}</h3>
          <p className="text-cream/50 text-sm">{story?.category || 'Life Story'}</p>
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={startNewGame} className="btn-primary">
            New Story
          </button>
          <button onClick={onExit} className="px-6 py-3 bg-navy-light/50 hover:bg-navy-light text-cream rounded-lg transition-colors">
            Back to Games
          </button>
        </div>
      </motion.div>
    );
  }

  const isAllSelected = selectedFragments.length === fragments.length;
  const attemptsLeft = maxAttempts - attempts;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-serif text-cream">Story Match</h2>
            <p className="text-cream/50 text-sm">Arrange the fragments in the correct order</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-cream">{attemptsLeft}</p>
            <p className="text-cream/50 text-sm">Attempts Left</p>
          </div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-cream">{selectedFragments.length}/{fragments.length}</p>
            <p className="text-cream/50 text-sm">Fragments Selected</p>
          </div>
        </div>
      </div>

      {/* Story Info */}
      <div className="bg-navy-light/50 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-green-400" />
          <h3 className="text-cream font-medium">{story?.title}</h3>
        </div>
        <p className="text-cream/50 text-sm">Click fragments in the correct order to rebuild the story</p>
      </div>

      {/* Selected Order Display */}
      {selectedFragments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-cream/70 text-sm mb-3">Your Order</h3>
          <div className="flex flex-wrap gap-2">
            {selectedFragments.map((fragment, index) => (
              <motion.div
                key={fragment.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2"
              >
                <span className="text-green-400 font-bold">{index + 1}</span>
                <span className="text-cream/70 text-sm">Fragment {fragment.id + 1}</span>
                <button
                  onClick={() => handleFragmentClick(fragment)}
                  className="ml-2 text-cream/50 hover:text-cream"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Fragments */}
      <div className="space-y-3 mb-6">
        <AnimatePresence>
          {fragments.map((fragment, index) => {
            const isSelected = selectedFragments.find(f => f.id === fragment.id);
            const selectedIndex = selectedFragments.findIndex(f => f.id === fragment.id);

            return (
              <motion.div
                key={fragment.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleFragmentClick(fragment)}
                className={`glass-card p-4 border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-green-500/50 bg-green-500/10 opacity-50'
                    : 'border-green-500/20 hover:border-green-500/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                    isSelected
                      ? 'bg-green-500/30 border-green-500/50 text-green-400'
                      : 'bg-navy-light/50 border-green-500/20 text-cream/50'
                  }`}>
                    {isSelected ? (
                      <span className="font-bold">{selectedIndex + 1}</span>
                    ) : (
                      <span className="text-sm">{fragment.id + 1}</span>
                    )}
                  </div>
                  <p className="text-cream/80 leading-relaxed flex-1">{fragment.text}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCheckOrder}
          disabled={!isAllSelected}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAllSelected ? (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Check Order
            </>
          ) : (
            `Select All Fragments (${selectedFragments.length}/${fragments.length})`
          )}
        </button>
        <button
          onClick={handleShuffle}
          className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors font-medium"
        >
          <Shuffle className="w-5 h-5" />
        </button>
      </div>

      {/* Tip */}
      <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <p className="text-cream/60 text-sm text-center">
          💡 <strong>Tip:</strong> Read all fragments first, then think about the logical flow of the story
        </p>
      </div>
    </div>
  );
}
