import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Calendar,
  Heart,
  RefreshCw,
  Clock,
  Star,
  Volume2,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Settings
} from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const cardStyles = [
  { id: 'default', label: 'Classic', gradient: 'from-gold/20 to-amber-500/20' },
  { id: 'vintage', label: 'Vintage', gradient: 'from-orange-900/20 to-yellow-800/20' },
  { id: 'modern', label: 'Modern', gradient: 'from-blue-500/20 to-purple-500/20' },
  { id: 'minimalist', label: 'Minimal', gradient: 'from-gray-500/20 to-slate-500/20' },
];

const accentColors = [
  { id: 'gold', color: 'text-gold border-gold bg-gold/10' },
  { id: 'blue', color: 'text-blue-400 border-blue-400 bg-blue-500/10' },
  { id: 'purple', color: 'text-purple-400 border-purple-400 bg-purple-500/10' },
  { id: 'green', color: 'text-green-400 border-green-400 bg-green-500/10' },
];

export function WisdomCardsPage({ onNavigate }) {
  const { persona } = useApp();
  const [todayCard, setTodayCard] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllCards, setShowAllCards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [generating, setGenerating] = useState(false);

  // Check if Value Store is completed
  const isValueStoreComplete = () => {
    if (!persona) return false;

    // Check if at least some personality traits have been modified from default (50)
    const traits = ['humor', 'empathy', 'tradition', 'adventure', 'wisdom', 'creativity', 'patience', 'optimism'];
    const modifiedTraits = traits.filter(t => persona[t] !== undefined && persona[t] !== 50);
    const hasModifiedTraits = modifiedTraits.length >= 3; // At least 3 traits modified

    // Check if core values or life philosophy is filled
    const hasCoreValues = persona.coreValues && persona.coreValues.length > 0;
    const hasLifePhilosophy = persona.lifePhilosophy && persona.lifePhilosophy.trim().length > 20;

    return hasModifiedTraits || hasCoreValues || hasLifePhilosophy;
  };

  const valueStoreComplete = isValueStoreComplete();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const [today, all] = await Promise.all([
        api.getTodayWisdomCard(),
        api.getWisdomCards(),
      ]);
      setTodayCard(today);
      setAllCards(all);
    } catch (error) {
      console.error('Failed to load wisdom cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.markWisdomCardAsRead(id);
      loadCards();
    } catch (error) {
      console.error('Failed to mark card as read:', error);
    }
  };

  const handleGenerateCard = async () => {
    try {
      setGenerating(true);
      const newCard = await api.generateWisdomCard();
      // Reload cards to show the new one
      await loadCards();
      // Switch to all cards view and navigate to the new card
      setShowAllCards(true);
      setCurrentCardIndex(0); // New card will be first (latest)
    } catch (error) {
      console.error('Failed to generate wisdom card:', error);
    } finally {
      setGenerating(false);
    }
  };

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % allCards.length);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + allCards.length) % allCards.length);
  };

  const getCardStyle = (styleId) => {
    return cardStyles.find(s => s.id === styleId) || cardStyles[0];
  };

  const getAccentColor = (colorId) => {
    return accentColors.find(c => c.id === colorId) || accentColors[0];
  };

  const displayCard = showAllCards && allCards.length > 0 ? allCards[currentCardIndex] : todayCard;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-navy-light py-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <FadeIn>
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gold to-amber-500 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-10 h-10 text-navy" />
              </motion.div>
              <h1 className="text-3xl md:text-5xl font-serif text-cream mb-4">Wisdom Cards</h1>
              <p className="text-cream/60 text-base md:text-lg max-w-2xl mx-auto">
                Daily inspiration and wisdom from your digital legacy.
                {!showAllCards && " Today's card awaits you."}
              </p>
            </div>
          </FadeIn>

          {/* Value Store Not Complete Warning */}
          {!valueStoreComplete && (
            <FadeIn delay={0.1}>
              <div className="glass-card p-8 mb-8 border-2 border-amber-500/30 bg-amber-500/5">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h3 className="text-xl font-serif text-cream mb-2">Complete Your Value Store First</h3>
                    <p className="text-cream/60 mb-4">
                      To generate personalized Wisdom Cards, we need to know more about you.
                      Please complete your personality traits, core values, or life philosophy in the Value Store.
                    </p>
                    <motion.button
                      onClick={() => onNavigate && onNavigate('persona')}
                      className="btn-primary inline-flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Go to My Persona
                    </motion.button>
                  </div>
                </div>
              </div>
            </FadeIn>
          )}

          {/* Toggle View */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8 px-4">
            <button
              onClick={() => setShowAllCards(false)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                !showAllCards
                  ? 'bg-gold text-navy'
                  : 'bg-navy-light/50 text-cream/70 hover:bg-navy-light'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Today's Card
            </button>
            <button
              onClick={() => setShowAllCards(true)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                showAllCards
                  ? 'bg-gold text-navy'
                  : 'bg-navy-light/50 text-cream/70 hover:bg-navy-light'
              }`}
            >
              <Star className="w-5 h-5 inline mr-2" />
              All Cards ({allCards.length})
            </button>
            <button
              onClick={handleGenerateCard}
              disabled={generating || !valueStoreComplete}
              className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={!valueStoreComplete ? 'Complete your Value Store first' : ''}
            >
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 inline mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 inline mr-2" />
                  Generate New Card
                </>
              )}
            </button>
          </div>

          {/* Main Card Display */}
          {loading ? (
            <div className="text-center py-20">
              <RefreshCw className="w-12 h-12 text-gold/50 mx-auto mb-4 animate-spin" />
              <p className="text-cream/50">Loading your wisdom...</p>
            </div>
          ) : displayCard ? (
            <motion.div
              key={displayCard.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Navigation Arrows for All Cards View */}
              {showAllCards && allCards.length > 1 && (
                <>
                  <button
                    onClick={prevCard}
                    className="absolute left-0 md:left-auto md:-translate-x-16 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-navy-dark/80 hover:bg-navy-dark border-2 border-gold/30 hover:border-gold/50 rounded-full flex items-center justify-center text-gold transition-all z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextCard}
                    className="absolute right-0 md:right-auto md:translate-x-16 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-navy-dark/80 hover:bg-navy-dark border-2 border-gold/30 hover:border-gold/50 rounded-full flex items-center justify-center text-gold transition-all z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Card */}
              <div className={`glass-card p-8 md:p-12 border-2 bg-gradient-to-br ${getCardStyle(displayCard.cardStyle).gradient}`}>
                <div className={`border-2 rounded-xl p-8 ${getAccentColor(displayCard.accentColor).color}`}>
                  {/* Card Header */}
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Sparkles className="w-6 h-6" />
                      <h2 className="text-3xl font-serif">{displayCard.title}</h2>
                    </div>
                    {showAllCards && (
                      <p className="text-sm opacity-60">
                        {new Date(displayCard.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Main Message */}
                  <div className="mb-8">
                    <p className="text-cream text-xl md:text-2xl leading-relaxed text-center font-serif italic">
                      "{displayCard.message}"
                    </p>
                  </div>

                  {/* Quote if exists */}
                  {displayCard.quote && (
                    <div className="mb-8 pt-8 border-t border-current/20">
                      <p className="text-cream/80 text-lg text-center italic">
                        {displayCard.quote}
                      </p>
                    </div>
                  )}

                  {/* Additional Wisdom */}
                  {displayCard.wisdom && (
                    <div className="bg-navy-dark/30 rounded-lg p-6">
                      <p className="text-cream/70 text-center">{displayCard.wisdom}</p>
                    </div>
                  )}

                  {/* Audio Player if exists */}
                  {displayCard.audioUrl && (
                    <div className="mt-8 flex justify-center">
                      <button className="flex items-center gap-3 px-6 py-3 bg-navy-dark/50 hover:bg-navy-dark rounded-lg transition-colors">
                        <Volume2 className="w-5 h-5" />
                        <span className="text-cream/80">Listen to Avatar's Voice</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cream/50 text-sm">
                    <Clock className="w-4 h-4" />
                    {!showAllCards && "Today's wisdom"}
                    {showAllCards && `Card ${currentCardIndex + 1} of ${allCards.length}`}
                  </div>
                  <div className="flex gap-2">
                    {!displayCard.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(displayCard.id)}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                    {displayCard.isRead && (
                      <span className="px-4 py-2 bg-green-500/10 text-green-400/60 rounded-lg text-sm">
                        ✓ Read
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Counter for All Cards View */}
              {showAllCards && allCards.length > 0 && (
                <div className="mt-6 flex justify-center gap-2">
                  {allCards.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCardIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentCardIndex
                          ? 'w-8 bg-gold'
                          : 'bg-gold/30 hover:bg-gold/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gold/30 mx-auto mb-4" />
              <p className="text-cream/50 mb-2">No wisdom cards yet.</p>
              <p className="text-cream/30 text-sm">Your daily card will appear here automatically.</p>
            </div>
          )}

          {/* Stats */}
          {!loading && allCards.length > 0 && (
            <div className="mt-12 grid grid-cols-3 gap-4">
              <div className="glass-card p-6 text-center border-gold/20">
                <div className="text-3xl font-bold text-gold mb-2">{allCards.length}</div>
                <div className="text-cream/50 text-sm">Total Cards</div>
              </div>
              <div className="glass-card p-6 text-center border-gold/20">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {allCards.filter(c => c.isRead).length}
                </div>
                <div className="text-cream/50 text-sm">Read</div>
              </div>
              <div className="glass-card p-6 text-center border-gold/20">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {allCards.filter(c => c.isFavorite).length}
                </div>
                <div className="text-cream/50 text-sm">Favorites</div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-12 bg-gold/10 border border-gold/20 rounded-xl p-6 text-center">
            <Sparkles className="w-8 h-8 text-gold/60 mx-auto mb-3" />
            <p className="text-cream/70 text-sm">
              A new wisdom card appears every day, generated with your avatar's personality and life experiences.
              <br />
              Collect them all and revisit your favorite moments of inspiration.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
