import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Heart, Shield, BookOpen, Sparkles, Smile, Compass } from 'lucide-react';
import { useApp } from '../context/AppContext';

const vibes = [
  {
    id: 'compassionate',
    label: 'Compassionate',
    icon: Heart,
    description: 'Warm, nurturing, and deeply caring. Your echo will prioritize emotional support and understanding.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'strict',
    label: 'Strict / Disciplined',
    icon: Shield,
    description: 'Firm, principled, and focused on growth. Your echo will emphasize accountability and structure.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'storyteller',
    label: 'Storyteller',
    icon: BookOpen,
    description: 'Narrative-driven and wise. Your echo will share lessons through stories and parables.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'wise',
    label: 'Wise Mentor',
    icon: Sparkles,
    description: 'Thoughtful and philosophical. Your echo will offer deep insights and guide reflection.',
    color: 'from-purple-500 to-violet-500',
  },
  {
    id: 'playful',
    label: 'Playful',
    icon: Smile,
    description: 'Light-hearted and fun. Your echo will bring joy and humor while still being helpful.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'adventurous',
    label: 'Adventurous',
    icon: Compass,
    description: 'Bold and encouraging. Your echo will inspire courage and embrace of the unknown.',
    color: 'from-cyan-500 to-teal-500',
  },
];

export function EchoVibe() {
  const { persona, setPersona } = useApp();
  const [selectedVibe, setSelectedVibe] = useState(persona.echoVibe || 'compassionate');

  const handleSelect = (vibeId) => {
    setSelectedVibe(vibeId);
    setPersona(prev => ({ ...prev, echoVibe: vibeId }));
  };

  const selectedVibeData = vibes.find(v => v.id === selectedVibe);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-serif text-cream mb-2">Choose Your Echo Vibe</h3>
        <p className="text-cream/60">
          Select the primary mood and personality style for your AI echo.
          This determines how your digital self will communicate.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vibes.map((vibe) => {
          const Icon = vibe.icon;
          const isSelected = selectedVibe === vibe.id;
          return (
            <motion.button
              key={vibe.id}
              onClick={() => handleSelect(vibe.id)}
              className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-gold bg-gold/10'
                  : 'border-gold/20 hover:border-gold/40 bg-navy-light/30'
              }`}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-navy" />
                </motion.div>
              )}

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${vibe.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h4 className="text-cream font-medium text-lg mb-2">{vibe.label}</h4>
              <p className="text-cream/50 text-sm leading-relaxed">{vibe.description}</p>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        key={selectedVibe}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-navy-dark/30 rounded-xl p-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedVibeData?.color} flex items-center justify-center pulse-glow`}>
            {selectedVibeData && <selectedVibeData.icon className="w-8 h-8 text-white" />}
          </div>
          <div>
            <h4 className="text-cream font-serif text-xl">Selected: {selectedVibeData?.label}</h4>
            <p className="text-gold text-sm">This is how your echo will present itself</p>
          </div>
        </div>

        <div className="bg-navy-light/50 rounded-lg p-4 mt-4">
          <p className="text-cream/70 text-sm mb-2">Preview message from your echo:</p>
          <p className="text-cream italic leading-relaxed">
            {selectedVibe === 'compassionate' && (
              "I'm here for you, always. Whatever you're going through, know that you carry the strength of our family within you. Let me share some wisdom that might help..."
            )}
            {selectedVibe === 'strict' && (
              "Remember what I've always taught you: discipline creates freedom. Let's look at this situation practically and find the best path forward."
            )}
            {selectedVibe === 'storyteller' && (
              "Let me tell you a story that might help. When I was about your age, something similar happened to me, and the lesson I learned changed everything..."
            )}
            {selectedVibe === 'wise' && (
              "Consider this carefully, as all meaningful decisions deserve reflection. There's wisdom to be found in every challenge we face..."
            )}
            {selectedVibe === 'playful' && (
              "Hey there, sunshine! Life's thrown you a curveball, huh? Well, let's figure this out together - and maybe have a little fun along the way!"
            )}
            {selectedVibe === 'adventurous' && (
              "This is an opportunity in disguise! Every challenge is a chance to grow. Let me share what I learned from my own adventures..."
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
