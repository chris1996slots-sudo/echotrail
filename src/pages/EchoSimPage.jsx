import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  X,
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Calendar,
  Gift,
  Heart,
  Sun,
  Moon,
  Star,
  MessageCircle,
  Volume2,
  VolumeX,
  User
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
import { useApp } from '../context/AppContext';

const eventSimulations = [
  {
    id: 'christmas',
    name: 'Christmas Dinner',
    icon: Gift,
    description: 'Experience a warm holiday message from your echo',
    scene: 'holiday',
    greeting: "Merry Christmas, my dear! I hope the house is filled with laughter and the smell of good food. Remember those Christmas mornings we shared? The magic never fades...",
  },
  {
    id: 'birthday',
    name: 'Birthday Message',
    icon: Calendar,
    description: 'Receive a heartfelt birthday wish',
    scene: 'celebration',
    greeting: "Happy Birthday! Another year wiser, another year more wonderful. I'm so proud of the person you've become. Let me tell you what I hope for you this year...",
  },
  {
    id: 'morning',
    name: 'Good Morning',
    icon: Sun,
    description: 'Start your day with encouragement',
    scene: 'morning',
    greeting: "Good morning, sunshine! Rise and shine - today is full of possibilities. I always believed in starting each day with gratitude. What are you thankful for today?",
  },
  {
    id: 'evening',
    name: 'Evening Reflection',
    icon: Moon,
    description: 'End your day with wisdom',
    scene: 'evening',
    greeting: "How was your day? As the evening settles in, take a moment to reflect on what went well. Every day brings lessons, and every night brings peace...",
  },
  {
    id: 'encouragement',
    name: 'Need Support',
    icon: Heart,
    description: 'Get comfort during difficult times',
    scene: 'support',
    greeting: "I sense you might need some encouragement. Remember, challenges are temporary, but your strength is permanent. Let me share something that helped me through tough times...",
  },
  {
    id: 'celebration',
    name: 'Celebrate Success',
    icon: Star,
    description: 'Share your achievements',
    scene: 'celebration',
    greeting: "I'm so incredibly proud of you! Every success, big or small, deserves to be celebrated. You've worked hard for this moment. Tell me everything!",
  },
];

function VideoCallModal({ event, onClose, user, persona }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callState, setCallState] = useState('connecting');
  const [showMessage, setShowMessage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const speechRef = useRef(null);

  // TTS function to speak the greeting
  const speakText = (text) => {
    if (!speechEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech
  const stopSpeech = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  // Toggle speech
  const toggleSpeech = () => {
    if (speechEnabled) {
      stopSpeech();
    }
    setSpeechEnabled(!speechEnabled);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCallState('connected');
      setTimeout(() => {
        setShowMessage(true);
        // Speak the greeting when message appears
        setTimeout(() => speakText(event.greeting), 500);
      }, 1000);
    }, 2000);
    return () => clearTimeout(timer);
  }, [event.greeting, speechEnabled]);

  const vibeStyles = {
    compassionate: 'Warm and nurturing',
    strict: 'Firm and guiding',
    storyteller: 'Narrative and wise',
    wise: 'Thoughtful and philosophical',
    playful: 'Light and joyful',
    adventurous: 'Bold and inspiring',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl aspect-video bg-navy-dark rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-navy-light to-navy-dark" />

        <div className="absolute top-4 left-4 flex items-center gap-3 z-20">
          <div className="px-3 py-1 rounded-full bg-navy/80 backdrop-blur text-cream/70 text-sm flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${callState === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            {callState === 'connecting' ? 'Connecting...' : 'Connected'}
          </div>
          <div className="px-3 py-1 rounded-full bg-navy/80 backdrop-blur text-cream/50 text-xs">
            {vibeStyles[persona.echoVibe || 'compassionate']} Mode
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-navy/80 backdrop-blur text-cream/70 hover:text-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center ${
                callState === 'connected' ? 'pulse-glow' : ''
              }`}
              animate={callState === 'connecting' ? {
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
              } : {}}
              transition={{ duration: 1.5, repeat: 9999 }}
            >
              <User className="w-16 h-16 text-navy" />
            </motion.div>

            <h3 className="text-2xl font-serif text-cream mb-2">
              {user?.firstName}'s Echo
            </h3>
            <p className="text-cream/50 mb-4">{event.name}</p>

            <AnimatePresence>
              {showMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-lg mx-auto"
                >
                  <div className={`bg-navy/60 backdrop-blur-lg rounded-xl p-6 border transition-colors ${isSpeaking ? 'border-gold/50' : 'border-gold/20'}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {isSpeaking ? (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.8, repeat: 9999 }}
                          >
                            <Volume2 className="w-5 h-5 text-gold" />
                          </motion.div>
                        ) : (
                          <Volume2 className="w-5 h-5 text-gold/50" />
                        )}
                      </div>
                      <motion.p
                        className="text-cream/90 text-left leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {event.greeting}
                      </motion.p>
                    </div>
                    {isSpeaking && (
                      <div className="mt-3 flex items-center justify-center gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-gold rounded-full"
                            animate={{
                              height: ['8px', '16px', '8px'],
                            }}
                            transition={{
                              duration: 0.5,
                              repeat: 9999,
                              delay: i * 0.1,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <motion.button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-navy-light/80 text-cream/70 hover:text-cream'}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </motion.button>

            <motion.button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-4 rounded-full ${!isVideoOn ? 'bg-red-500/20 text-red-400' : 'bg-navy-light/80 text-cream/70 hover:text-cream'}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </motion.button>

            <motion.button
              onClick={onClose}
              className="p-4 rounded-full bg-red-500 text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <PhoneOff className="w-6 h-6" />
            </motion.button>

            <motion.button
              className="p-4 rounded-full bg-navy-light/80 text-cream/70 hover:text-cream"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.button>

            <motion.button
              onClick={toggleSpeech}
              className={`p-4 rounded-full ${!speechEnabled ? 'bg-red-500/20 text-red-400' : 'bg-navy-light/80 text-cream/70 hover:text-cream'}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={speechEnabled ? 'Mute speech' : 'Enable speech'}
            >
              {speechEnabled ? <Volume2 className={`w-6 h-6 ${isSpeaking ? 'animate-pulse' : ''}`} /> : <VolumeX className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        <div className="absolute bottom-24 right-6">
          <motion.div
            className="w-32 h-24 rounded-lg bg-navy-dark/80 border border-gold/20 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isVideoOn ? (
              <div className="w-full h-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center">
                <User className="w-8 h-8 text-cream/30" />
              </div>
            ) : (
              <VideoOff className="w-8 h-8 text-cream/30" />
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function EchoSimPage({ onNavigate }) {
  const { user, persona } = useApp();
  const [activeEvent, setActiveEvent] = useState(null);

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark py-8">
      <div className="max-w-6xl mx-auto px-4">
        <FadeIn>
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-serif text-cream mb-4">
              Echo Simulator
            </h1>
            <p className="text-cream/60 max-w-2xl mx-auto">
              Experience simulated interactions with your digital echo. Choose an event
              scenario to see how your AI persona would respond.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center pulse-glow">
                  <User className="w-8 h-8 text-navy" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-cream">{user?.firstName}'s Echo</h3>
                  <p className="text-cream/50 text-sm capitalize">
                    {persona.echoVibe || 'Compassionate'} Mode • {persona.lifeStories?.length || 0} stories loaded
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-green-400 text-sm">Online</span>
              </div>
            </div>
          </div>
        </FadeIn>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventSimulations.map((event) => {
            const Icon = event.icon;
            return (
              <StaggerItem key={event.id}>
                <motion.button
                  onClick={() => setActiveEvent(event)}
                  className="w-full glass-card-hover p-6 text-left"
                  whileHover={{ y: -5 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-lg font-serif text-cream mb-2">{event.name}</h3>
                  <p className="text-cream/50 text-sm mb-4">{event.description}</p>
                  <div className="flex items-center text-gold text-sm">
                    <Play className="w-4 h-4 mr-2" />
                    Launch Simulation
                  </div>
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <FadeIn delay={0.3}>
          <div className="mt-12 glass-card p-8 text-center">
            <h3 className="text-xl font-serif text-cream mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-gold font-serif text-xl">1</span>
                </div>
                <h4 className="text-cream font-medium mb-2">Choose an Event</h4>
                <p className="text-cream/50 text-sm">Select a scenario that matches the moment you want to experience.</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-gold font-serif text-xl">2</span>
                </div>
                <h4 className="text-cream font-medium mb-2">Connect with Echo</h4>
                <p className="text-cream/50 text-sm">Experience a simulated video call with your AI persona.</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-gold font-serif text-xl">3</span>
                </div>
                <h4 className="text-cream font-medium mb-2">Receive Wisdom</h4>
                <p className="text-cream/50 text-sm">Hear personalized messages based on your stored values and stories.</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      <AnimatePresence>
        {activeEvent && (
          <VideoCallModal
            event={activeEvent}
            onClose={() => setActiveEvent(null)}
            user={user}
            persona={persona}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
