import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function LegacyScore({ showLabel = true, size = 'md' }) {
  const { legacyScore } = useApp();

  const sizes = {
    sm: { height: 'h-2', text: 'text-xs', container: 'w-32' },
    md: { height: 'h-3', text: 'text-sm', container: 'w-48' },
    lg: { height: 'h-4', text: 'text-base', container: 'w-64' },
  };

  const { height, text, container } = sizes[size];

  return (
    <div className={`${container}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className={`${text} text-cream/70 font-medium flex items-center`}>
            <Sparkles className="w-4 h-4 mr-1 text-gold" />
            Legacy Score
          </span>
          <span className={`${text} text-gold font-semibold`}>{legacyScore}%</span>
        </div>
      )}
      <div className={`${height} bg-navy-dark/50 rounded-full overflow-hidden border border-gold/20`}>
        <motion.div
          className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${legacyScore}%` }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </div>
  );
}

export function LegacyScoreCard() {
  const { legacyScore, user, persona, memories, timeCapsules } = useApp();

  const milestones = [
    { score: 25, label: 'Seedling', description: 'Your digital essence is taking root' },
    { score: 50, label: 'Growing', description: 'Your legacy is flourishing' },
    { score: 75, label: 'Thriving', description: 'A rich tapestry of memories' },
    { score: 100, label: 'Eternal', description: 'Your essence is immortalized' },
  ];

  const currentMilestone = milestones.reduce((acc, m) => (legacyScore >= m.score ? m : acc), milestones[0]);

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-serif text-cream">Your Legacy Journey</h3>
        <span className="text-2xl font-serif text-gold">{legacyScore}%</span>
      </div>

      <div className="h-4 bg-navy-dark/50 rounded-full overflow-hidden border border-gold/20 mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-gold via-gold-light to-gold rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${legacyScore}%` }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </motion.div>
      </div>

      <div className="flex justify-between mb-6">
        {milestones.map((m) => (
          <div
            key={m.score}
            className={`text-center ${legacyScore >= m.score ? 'text-gold' : 'text-cream/30'}`}
          >
            <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
              legacyScore >= m.score ? 'bg-gold' : 'bg-navy-dark border border-cream/30'
            }`} />
            <span className="text-xs">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-navy-dark/30 rounded-lg p-4 text-center">
        <p className="text-gold font-serif text-lg mb-1">{currentMilestone.label}</p>
        <p className="text-cream/60 text-sm">{currentMilestone.description}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6 text-center">
        <div>
          <p className="text-2xl font-serif text-gold">{persona?.lifeStories?.length || 0}</p>
          <p className="text-xs text-cream/50">Stories</p>
        </div>
        <div>
          <p className="text-2xl font-serif text-gold">{memories?.length || 0}</p>
          <p className="text-xs text-cream/50">Memories</p>
        </div>
        <div>
          <p className="text-2xl font-serif text-gold">{timeCapsules?.length || 0}</p>
          <p className="text-xs text-cream/50">Capsules</p>
        </div>
        <div>
          <p className="text-2xl font-serif text-gold">{persona?.echoVibe ? 1 : 0}</p>
          <p className="text-xs text-cream/50">Vibes</p>
        </div>
      </div>
    </motion.div>
  );
}
