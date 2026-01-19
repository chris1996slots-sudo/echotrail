import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, MessageCircle, CheckCircle, XCircle, HelpCircle, Trophy, X, Sparkles } from 'lucide-react';
import api from '../../services/api';

export function TwentyQuestionsGame({ onComplete, onExit }) {
  const [gameState, setGameState] = useState('loading'); // loading, playing, won, lost
  const [targetStory, setTargetStory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionsLeft, setQuestionsLeft] = useState(20);
  const [guessing, setGuessing] = useState(false);
  const [guess, setGuess] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    try {
      setGameState('loading');
      // In production: Call API to get a random story from user's life stories
      // For now, use placeholder
      const stories = await api.getLifeStories();
      if (stories.length === 0) {
        // No stories available
        setGameState('no_stories');
        return;
      }

      const randomStory = stories[Math.floor(Math.random() * stories.length)];
      setTargetStory(randomStory);
      setGameState('playing');
    } catch (error) {
      console.error('Failed to start game:', error);
      setGameState('error');
    }
  };

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim() || questionsLeft <= 0) return;

    const newQuestion = {
      question: currentQuestion,
      answer: 'pending',
      timestamp: Date.now(),
    };

    setQuestions([...questions, newQuestion]);

    try {
      // Call AI to answer yes/no based on target story
      const response = await api.generateText({
        prompt: `You are playing 20 questions. The secret is: "${targetStory.title}" - ${targetStory.content}

Question: ${currentQuestion}

Answer with ONLY "Yes", "No", or "Maybe" (if the question cannot be answered with yes/no).`,
        maxTokens: 10,
      });

      const answer = response.text.trim();

      // Update question with answer
      setQuestions(prev => {
        const updated = [...prev];
        updated[updated.length - 1].answer = answer;
        return updated;
      });

      setQuestionsLeft(prev => prev - 1);
      setCurrentQuestion('');

      // Auto-lose after 20 questions
      if (questionsLeft - 1 <= 0) {
        endGame(false);
      }
    } catch (error) {
      console.error('Failed to get answer:', error);
      // Remove failed question
      setQuestions(prev => prev.slice(0, -1));
    }
  };

  const handleMakeGuess = async () => {
    if (!guess.trim()) return;

    try {
      // Check if guess is correct using AI
      const response = await api.generateText({
        prompt: `The correct answer is: "${targetStory.title}"
The user's guess is: "${guess}"

Is this guess correct? Consider it correct if it's very close or captures the main idea.
Answer with ONLY "CORRECT" or "INCORRECT".`,
        maxTokens: 10,
      });

      const result = response.text.trim().toUpperCase();
      const won = result.includes('CORRECT');

      endGame(won);
    } catch (error) {
      console.error('Failed to check guess:', error);
    }
  };

  const endGame = async (won) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const pointsEarned = won ? (questionsLeft * 10 + 50) : 0;

    setGameState(won ? 'won' : 'lost');

    try {
      // Create game session
      const session = await api.createGameSession({
        gameType: 'twenty_questions',
        difficulty: 'medium',
        questionsAsked: 20 - questionsLeft,
        correctAnswers: won ? 1 : 0,
        hintsUsed: 0,
        timeSpent,
        completed: true,
        won,
        pointsEarned,
        gameData: {
          targetStoryId: targetStory?.id,
          questions: questions,
        },
      });

      setSessionId(session.id);

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
        <Brain className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
        <p className="text-cream/50">Selecting a story...</p>
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
          <Brain className="w-16 h-16 text-blue-400/30 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-cream mb-3">No Stories Yet</h3>
          <p className="text-cream/50 mb-6">Add some life stories first to play 20 Questions!</p>
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
          <p className="text-cream/50 mb-6">Failed to start game. Please try again.</p>
          <button onClick={onExit} className="btn-primary">
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'won' || gameState === 'lost') {
    const won = gameState === 'won';
    const pointsEarned = won ? (questionsLeft * 10 + 50) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        {won ? (
          <>
            <Trophy className="w-20 h-20 text-gold mx-auto mb-6" />
            <h2 className="text-3xl font-serif text-cream mb-3">You Won!</h2>
            <p className="text-cream/60 mb-6">
              You guessed the story with {questionsLeft} questions remaining!
            </p>
            <div className="bg-gold/10 border border-gold/20 rounded-xl p-6 mb-6 max-w-md mx-auto">
              <p className="text-gold text-2xl font-bold mb-2">+{pointsEarned} Points</p>
              <p className="text-cream/50 text-sm">Bonus for unused questions!</p>
            </div>
          </>
        ) : (
          <>
            <HelpCircle className="w-20 h-20 text-blue-400/50 mx-auto mb-6" />
            <h2 className="text-3xl font-serif text-cream mb-3">Out of Questions!</h2>
            <p className="text-cream/60 mb-6">
              The story was about: <strong>{targetStory?.title}</strong>
            </p>
          </>
        )}

        <div className="bg-navy-light/50 rounded-xl p-6 mb-6 max-w-md mx-auto">
          <h3 className="text-cream font-medium mb-3">The Story</h3>
          <p className="text-cream/70 text-sm italic">"{targetStory?.content?.substring(0, 200)}..."</p>
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-serif text-cream">20 Questions</h2>
            <p className="text-cream/50 text-sm">Guess the story by asking yes/no questions</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Questions Left */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-cream/70">Questions Remaining</span>
          <span className="text-3xl font-bold text-blue-400">{questionsLeft}</span>
        </div>
      </div>

      {/* Questions History */}
      <div className="mb-6 max-h-96 overflow-y-auto space-y-3">
        <AnimatePresence>
          {questions.map((q, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4 border-blue-500/20"
            >
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-cream mb-2">{q.question}</p>
                  {q.answer === 'pending' ? (
                    <div className="flex items-center gap-2 text-cream/50 text-sm">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      Thinking...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {q.answer.toLowerCase().includes('yes') ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : q.answer.toLowerCase().includes('no') ? (
                        <XCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-cream/70 text-sm font-medium">{q.answer}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      {!guessing ? (
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              placeholder="Ask a yes/no question..."
              className="w-full px-4 py-3 bg-navy-light/50 border-2 border-blue-500/30 focus:border-blue-500/50 rounded-lg text-cream placeholder-cream/30 outline-none transition-colors"
              disabled={questionsLeft <= 0}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAskQuestion}
              disabled={!currentQuestion.trim() || questionsLeft <= 0}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ask Question
            </button>
            <button
              onClick={() => setGuessing(true)}
              className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors font-medium"
            >
              Make a Guess
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-medium text-cream">What's your guess?</h3>
          </div>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleMakeGuess()}
            placeholder="Type the story title or description..."
            className="w-full px-4 py-3 bg-navy-light/50 border-2 border-green-500/30 focus:border-green-500/50 rounded-lg text-cream placeholder-cream/30 outline-none transition-colors mb-4"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={handleMakeGuess}
              disabled={!guess.trim()}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Guess
            </button>
            <button
              onClick={() => {
                setGuessing(false);
                setGuess('');
              }}
              className="px-6 py-3 bg-navy-light/50 hover:bg-navy-light text-cream rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
