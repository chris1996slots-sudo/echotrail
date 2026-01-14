import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Save, RotateCcw, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const traits = [
  { id: 'humor', label: 'Humor', description: 'How often do you use humor in conversations?' },
  { id: 'empathy', label: 'Empathy', description: 'How deeply do you connect with others\' emotions?' },
  { id: 'tradition', label: 'Tradition', description: 'How important are customs and heritage to you?' },
  { id: 'adventure', label: 'Adventure', description: 'How eager are you to explore the unknown?' },
  { id: 'wisdom', label: 'Wisdom', description: 'How much do you value sharing knowledge and life lessons?' },
  { id: 'creativity', label: 'Creativity', description: 'How creative and imaginative are you?' },
  { id: 'patience', label: 'Patience', description: 'How patient are you when explaining things?' },
  { id: 'optimism', label: 'Optimism', description: 'How positive is your outlook on life?' },
];

function Slider({ value, onChange, label, description }) {
  const getValueLabel = (val) => {
    if (val < 25) return 'Low';
    if (val < 50) return 'Moderate';
    if (val < 75) return 'High';
    return 'Very High';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-cream font-medium">{label}</h4>
          <p className="text-cream/40 text-sm">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-gold font-serif text-xl">{value}</span>
          <p className="text-cream/40 text-xs">{getValueLabel(value)}</p>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-navy-dark rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br
            [&::-webkit-slider-thumb]:from-gold [&::-webkit-slider-thumb]:to-gold-light
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-gold/30 [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110"
        />
        <div
          className="absolute top-0 left-0 h-2 bg-gradient-to-r from-gold/50 to-gold rounded-full pointer-events-none"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ValueStore() {
  const { persona, setPersona } = useApp();
  const [values, setValues] = useState(persona.values || {
    humor: 50,
    empathy: 50,
    tradition: 50,
    adventure: 50,
    wisdom: 50,
    creativity: 50,
    patience: 50,
    optimism: 50,
  });
  const [coreValues, setCoreValues] = useState(persona.coreValues || []);
  const [newValue, setNewValue] = useState('');
  const [lifePhilosophy, setLifePhilosophy] = useState(persona.lifePhilosophy || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);

  // Delay chart rendering to avoid width/height -1 warnings
  useEffect(() => {
    const timer = setTimeout(() => setIsChartReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleValueChange = useCallback((trait, value) => {
    setValues(prev => ({ ...prev, [trait]: value }));
    setHasChanges(true);
  }, []);

  const handleAddCoreValue = () => {
    if (newValue.trim() && coreValues.length < 10) {
      setCoreValues(prev => [...prev, newValue.trim()]);
      setNewValue('');
      setHasChanges(true);
    }
  };

  const handleRemoveCoreValue = (index) => {
    setCoreValues(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handlePhilosophyChange = (text) => {
    setLifePhilosophy(text);
    setHasChanges(true);
  };

  const handleSave = () => {
    setPersona(prev => ({
      ...prev,
      values,
      coreValues,
      lifePhilosophy,
    }));
    setHasChanges(false);
  };

  const handleReset = () => {
    const defaultValues = {
      humor: 50,
      empathy: 50,
      tradition: 50,
      adventure: 50,
      wisdom: 50,
      creativity: 50,
      patience: 50,
      optimism: 50,
    };
    setValues(defaultValues);
    setCoreValues([]);
    setLifePhilosophy('');
    setHasChanges(true);
  };

  const chartData = traits.map(trait => ({
    trait: trait.label,
    value: values[trait.id] || 50,
    fullMark: 100,
  }));

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-serif text-cream mb-2">Define Your Personality</h3>
        <p className="text-cream/60">
          Adjust the sliders to reflect your core personality traits. This helps your AI echo
          respond authentically to your descendants.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          {traits.map((trait) => (
            <Slider
              key={trait.id}
              label={trait.label}
              description={trait.description}
              value={values[trait.id] || 50}
              onChange={(val) => handleValueChange(trait.id, val)}
            />
          ))}
        </div>

        <div className="space-y-6">
          {/* Chart with delayed rendering */}
          <motion.div
            className="h-[350px] min-h-[350px] w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {isChartReady && (
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                  <PolarGrid
                    stroke="rgba(212, 175, 55, 0.2)"
                    strokeDasharray="3 3"
                  />
                  <PolarAngleAxis
                    dataKey="trait"
                    tick={{ fill: '#f8f6f0', fontSize: 11 }}
                    tickLine={{ stroke: 'rgba(212, 175, 55, 0.3)' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: 'rgba(248, 246, 240, 0.4)', fontSize: 10 }}
                    tickCount={5}
                    axisLine={false}
                  />
                  <Radar
                    name="Personality"
                    dataKey="value"
                    stroke="#d4af37"
                    fill="#d4af37"
                    fillOpacity={0.3}
                    strokeWidth={2}
                    animationDuration={500}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
            {!isChartReady && (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.div>

          {/* Core Values Tags */}
          <div className="bg-navy-dark/30 rounded-xl p-4">
            <h4 className="text-cream font-serif text-lg mb-3">Your Core Values</h4>
            <p className="text-cream/50 text-sm mb-4">
              Add words or phrases that define what you stand for (max 10)
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {coreValues.map((value, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-3 py-1.5 bg-gold/20 text-gold rounded-full text-sm flex items-center gap-2"
                >
                  {value}
                  <button
                    onClick={() => handleRemoveCoreValue(index)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
              {coreValues.length === 0 && (
                <span className="text-cream/30 text-sm italic">No values added yet...</span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCoreValue()}
                placeholder="e.g., Family, Honesty, Hard Work..."
                className="flex-1 px-4 py-2 bg-navy-light/50 border border-gold/20 rounded-lg text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50"
                maxLength={30}
              />
              <motion.button
                onClick={handleAddCoreValue}
                disabled={!newValue.trim() || coreValues.length >= 10}
                className="px-4 py-2 bg-gold/20 text-gold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Life Philosophy Text Area */}
      <div className="bg-navy-dark/30 rounded-xl p-6">
        <h4 className="text-cream font-serif text-lg mb-2">Your Life Philosophy</h4>
        <p className="text-cream/50 text-sm mb-4">
          Write about your beliefs, what you've learned from life, and the wisdom you want to pass on.
          This will help your AI echo speak with your authentic voice.
        </p>
        <textarea
          value={lifePhilosophy}
          onChange={(e) => handlePhilosophyChange(e.target.value)}
          placeholder="Share your life philosophy here... What do you believe in? What lessons have shaped you? What advice would you give to future generations?"
          className="w-full h-40 px-4 py-3 bg-navy-light/50 border border-gold/20 rounded-xl text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50 resize-none"
          maxLength={2000}
        />
        <div className="flex justify-between mt-2">
          <span className="text-cream/30 text-xs">
            This shapes how your echo communicates and gives advice
          </span>
          <span className="text-cream/30 text-xs">
            {lifePhilosophy.length}/2000
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <motion.button
          onClick={handleReset}
          className="btn-secondary flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </motion.button>
        <motion.button
          onClick={handleSave}
          disabled={!hasChanges}
          className="btn-primary flex items-center disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Values
        </motion.button>
      </div>

      <div className="bg-navy-dark/30 rounded-xl p-6 mt-8">
        <h4 className="text-cream font-serif text-lg mb-4">Personality Summary</h4>
        <p className="text-cream/60 leading-relaxed">
          Based on your values, your AI echo will be{' '}
          <span className="text-gold">
            {values.humor > 60 ? 'humorous and lighthearted' : values.humor < 40 ? 'serious and thoughtful' : 'balanced in humor'}
          </span>
          ,{' '}
          <span className="text-gold">
            {values.empathy > 60 ? 'deeply empathetic' : values.empathy < 40 ? 'pragmatically supportive' : 'understanding'}
          </span>
          ,{' '}
          <span className="text-gold">
            {values.tradition > 60 ? 'rooted in tradition' : values.tradition < 40 ? 'progressive and modern' : 'respectful of heritage'}
          </span>
          ,{' '}
          <span className="text-gold">
            {values.adventure > 60 ? 'encouraging of exploration' : values.adventure < 40 ? 'cautious and protective' : 'open to new experiences'}
          </span>
          ,{' '}
          <span className="text-gold">
            {values.wisdom > 60 ? 'eager to share life lessons' : values.wisdom < 40 ? 'a good listener' : 'wise when needed'}
          </span>
          ,{' '}
          <span className="text-gold">
            {values.creativity > 60 ? 'imaginative and creative' : values.creativity < 40 ? 'practical and grounded' : 'thoughtfully creative'}
          </span>
          ,{' '}
          <span className="text-gold">
            {values.patience > 60 ? 'endlessly patient' : values.patience < 40 ? 'direct and efficient' : 'reasonably patient'}
          </span>
          , and{' '}
          <span className="text-gold">
            {values.optimism > 60 ? 'optimistic and encouraging' : values.optimism < 40 ? 'realistic and pragmatic' : 'balanced in outlook'}
          </span>
          .
        </p>
        {coreValues.length > 0 && (
          <p className="text-cream/60 mt-4">
            Your echo will embody values like{' '}
            <span className="text-gold">{coreValues.slice(0, 3).join(', ')}</span>
            {coreValues.length > 3 && ` and ${coreValues.length - 3} more`}.
          </p>
        )}
      </div>
    </div>
  );
}
