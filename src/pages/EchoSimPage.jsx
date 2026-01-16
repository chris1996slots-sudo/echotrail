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
  User,
  Loader2,
  RefreshCw,
  AlertCircle,
  Send,
  ChevronDown,
  Image
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const eventSimulations = [
  {
    id: 'christmas',
    name: 'Christmas Dinner',
    icon: Gift,
    description: 'Experience a warm holiday message from your echo',
    scene: 'holiday',
    prompt: "Give a warm Christmas message to your family. Share what the holidays mean to you, recall cherished memories, and wish them joy and peace.",
  },
  {
    id: 'birthday',
    name: 'Birthday Message',
    icon: Calendar,
    description: 'Receive a heartfelt birthday wish',
    scene: 'celebration',
    prompt: "Wish someone a heartfelt happy birthday. Share your hopes for their year ahead and remind them how special they are to you.",
  },
  {
    id: 'morning',
    name: 'Good Morning',
    icon: Sun,
    description: 'Start your day with encouragement',
    scene: 'morning',
    prompt: "Give an encouraging good morning message. Share your thoughts on starting the day with purpose and gratitude.",
  },
  {
    id: 'evening',
    name: 'Evening Reflection',
    icon: Moon,
    description: 'End your day with wisdom',
    scene: 'evening',
    prompt: "Share an evening reflection. Help them wind down the day with thoughts on what went well and finding peace.",
  },
  {
    id: 'encouragement',
    name: 'Need Support',
    icon: Heart,
    description: 'Get comfort during difficult times',
    scene: 'support',
    prompt: "Offer words of comfort and encouragement for someone going through a difficult time. Remind them of their strength and that they're not alone.",
  },
  {
    id: 'celebration',
    name: 'Celebrate Success',
    icon: Star,
    description: 'Share your achievements',
    scene: 'celebration',
    prompt: "Celebrate someone's success and achievement. Express genuine pride and joy for what they've accomplished.",
  },
];

// Fallback messages if AI generation fails
const fallbackMessages = {
  christmas: "Merry Christmas, my dear! I hope the house is filled with laughter and the smell of good food. Remember those Christmas mornings we shared? The magic never fades...",
  birthday: "Happy Birthday! Another year wiser, another year more wonderful. I'm so proud of the person you've become. Let me tell you what I hope for you this year...",
  morning: "Good morning, sunshine! Rise and shine - today is full of possibilities. I always believed in starting each day with gratitude. What are you thankful for today?",
  evening: "How was your day? As the evening settles in, take a moment to reflect on what went well. Every day brings lessons, and every night brings peace...",
  encouragement: "I sense you might need some encouragement. Remember, challenges are temporary, but your strength is permanent. You are capable of more than you know.",
  celebration: "I'm so incredibly proud of you! Every success, big or small, deserves to be celebrated. You've worked hard for this moment!",
};

// Live Video Call Modal with HeyGen + ElevenLabs
function VideoCallModal({ event, onClose, user, persona }) {
  const [callState, setCallState] = useState('connecting'); // connecting, generating, ready, speaking, ended
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAvatarImage, setSelectedAvatarImage] = useState(null);
  const [showAvatarSelect, setShowAvatarSelect] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const audioRef = useRef(null);
  const videoRef = useRef(null);

  // Get active avatar image
  useEffect(() => {
    if (persona?.avatarImages?.length > 0) {
      const active = persona.avatarImages.find(a => a.isActive) || persona.avatarImages[0];
      setSelectedAvatarImage(active);
    }
  }, [persona]);

  // Generate AI response when call connects
  useEffect(() => {
    const generateResponse = async () => {
      try {
        setCallState('generating');

        // Generate personalized message using AI
        const response = await api.generateText(event.prompt, `Event: ${event.name}`);
        setGeneratedMessage(response.response);
        setCallState('ready');

        // Auto-speak the message
        if (speechEnabled) {
          setTimeout(() => speakMessage(response.response), 500);
        }
      } catch (err) {
        console.error('Failed to generate response:', err);
        // Fallback to static message
        const fallback = fallbackMessages[event.id] || event.prompt;
        setGeneratedMessage(fallback);
        setCallState('ready');
        if (speechEnabled) {
          setTimeout(() => speakMessage(fallback), 500);
        }
      }
    };

    const timer = setTimeout(generateResponse, 1500);
    return () => clearTimeout(timer);
  }, [event]);

  // Speak message using ElevenLabs or browser TTS
  const speakMessage = async (text) => {
    if (!speechEnabled) return;

    setIsSpeaking(true);
    setCallState('speaking');

    try {
      // Try ElevenLabs voice clone first
      const audioBlob = await api.textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          setCallState('ready');
          URL.revokeObjectURL(audioUrl);
        };
        audioRef.current.onerror = () => {
          // Fallback to browser TTS
          fallbackToSpeechSynthesis(text);
        };
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('ElevenLabs TTS failed, falling back to browser:', err);
      fallbackToSpeechSynthesis(text);
    }
  };

  // Browser TTS fallback
  const fallbackToSpeechSynthesis = (text) => {
    if (!window.speechSynthesis) {
      setIsSpeaking(false);
      setCallState('ready');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setIsSpeaking(false);
      setCallState('ready');
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCallState('ready');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Stop speech
  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setCallState('ready');
  };

  // Toggle speech
  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
    }
    setSpeechEnabled(!speechEnabled);
  };

  // Generate HeyGen video avatar (Premium feature)
  const generateVideoAvatar = async () => {
    if (!generatedMessage) return;

    setVideoGenerating(true);
    setError(null);

    try {
      const result = await api.generateAvatar(generatedMessage);

      if (result.videoId) {
        // Poll for video status
        const pollStatus = async () => {
          try {
            const status = await api.getAvatarStatus(result.videoId);

            if (status.status === 'completed' && status.video_url) {
              setVideoUrl(status.video_url);
              setVideoGenerating(false);
            } else if (status.status === 'failed') {
              setError('Video generation failed. Please try again.');
              setVideoGenerating(false);
            } else {
              // Keep polling
              setTimeout(pollStatus, 3000);
            }
          } catch (pollErr) {
            setError('Failed to check video status.');
            setVideoGenerating(false);
          }
        };

        setTimeout(pollStatus, 5000);
      }
    } catch (err) {
      console.error('HeyGen error:', err);
      setError(err.message || 'Failed to generate video avatar. This feature requires Premium subscription.');
      setVideoGenerating(false);
    }
  };

  // Send custom message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setGeneratedMessage(message);

    if (speechEnabled) {
      await speakMessage(message);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4"
    >
      <audio ref={audioRef} className="hidden" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl aspect-[4/3] sm:aspect-video bg-navy-dark rounded-2xl overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-light to-navy-dark" />

        {/* Top bar */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-12 sm:right-16 flex items-center gap-2 sm:gap-3 z-20 flex-wrap">
          <div className="px-2 sm:px-3 py-1 rounded-full bg-navy/80 backdrop-blur text-cream/70 text-xs sm:text-sm flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              callState === 'connecting' || callState === 'generating'
                ? 'bg-yellow-500 animate-pulse'
                : callState === 'speaking'
                ? 'bg-green-500 animate-pulse'
                : 'bg-green-500'
            }`} />
            {callState === 'connecting' && 'Connecting...'}
            {callState === 'generating' && 'Generating response...'}
            {callState === 'ready' && 'Connected'}
            {callState === 'speaking' && 'Speaking...'}
          </div>
          <div className="px-2 sm:px-3 py-1 rounded-full bg-navy/80 backdrop-blur text-cream/50 text-xs hidden sm:block">
            {vibeStyles[selectedAvatarImage?.echoVibe || persona?.echoVibe || 'compassionate']} Mode
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 p-2 rounded-full bg-navy/80 backdrop-blur text-cream/70 hover:text-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8">
          {/* Video or Avatar */}
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              autoPlay
              className="w-full max-w-lg rounded-xl shadow-2xl"
              onEnded={() => setVideoUrl(null)}
            />
          ) : (
            <div className="text-center">
              {/* Avatar selector */}
              <div className="relative mb-4 sm:mb-6">
                <motion.div
                  className={`w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full overflow-hidden ${
                    isSpeaking ? 'pulse-glow ring-4 ring-gold/50' : ''
                  } ${callState === 'connecting' || callState === 'generating' ? 'animate-pulse' : ''}`}
                  onClick={() => persona?.avatarImages?.length > 1 && setShowAvatarSelect(!showAvatarSelect)}
                  style={{ cursor: persona?.avatarImages?.length > 1 ? 'pointer' : 'default' }}
                >
                  {selectedAvatarImage?.imageData ? (
                    <img
                      src={selectedAvatarImage.imageData}
                      alt="Echo Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-navy" />
                    </div>
                  )}
                </motion.div>

                {persona?.avatarImages?.length > 1 && (
                  <button
                    onClick={() => setShowAvatarSelect(!showAvatarSelect)}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-navy/80 text-cream/70 text-xs flex items-center gap-1"
                  >
                    <Image className="w-3 h-3" />
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}

                {/* Avatar dropdown */}
                <AnimatePresence>
                  {showAvatarSelect && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-navy-light/95 backdrop-blur rounded-xl p-2 shadow-xl z-30 flex gap-2"
                    >
                      {persona.avatarImages.map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => {
                            setSelectedAvatarImage(avatar);
                            setShowAvatarSelect(false);
                          }}
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 transition-all ${
                            selectedAvatarImage?.id === avatar.id
                              ? 'border-gold scale-110'
                              : 'border-transparent hover:border-gold/50'
                          }`}
                        >
                          <img
                            src={avatar.imageData}
                            alt={avatar.label || 'Avatar'}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif text-cream mb-1 sm:mb-2">
                {user?.firstName}'s Echo
              </h3>
              <p className="text-cream/50 text-sm mb-4 sm:mb-6">{event.name}</p>

              {/* Message display */}
              <AnimatePresence mode="wait">
                {generatedMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-lg mx-auto"
                  >
                    <div className={`bg-navy/60 backdrop-blur-lg rounded-xl p-4 sm:p-6 border transition-colors ${
                      isSpeaking ? 'border-gold/50' : 'border-gold/20'
                    }`}>
                      <div className="flex items-start gap-3 max-h-48 sm:max-h-64 overflow-y-auto">
                        <div className="flex-shrink-0 mt-1 sticky top-0">
                          {isSpeaking ? (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            >
                              <Volume2 className="w-5 h-5 text-gold" />
                            </motion.div>
                          ) : (
                            <Volume2 className="w-5 h-5 text-gold/50" />
                          )}
                        </div>
                        <p className="text-cream/90 text-left leading-relaxed text-sm sm:text-base">
                          {generatedMessage}
                        </p>
                      </div>

                      {/* Audio visualization when speaking */}
                      {isSpeaking && (
                        <div className="mt-3 flex items-center justify-center gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1 bg-gold rounded-full"
                              animate={{ height: ['8px', '20px', '8px'] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        <motion.button
                          onClick={() => speakMessage(generatedMessage)}
                          disabled={isSpeaking}
                          className="px-3 py-1.5 rounded-lg bg-gold/20 text-gold text-sm flex items-center gap-2 hover:bg-gold/30 disabled:opacity-50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <RefreshCw className="w-4 h-4" />
                          Repeat
                        </motion.button>

                        {/* HeyGen video generation (Premium) */}
                        <motion.button
                          onClick={generateVideoAvatar}
                          disabled={videoGenerating}
                          className="px-3 py-1.5 rounded-lg bg-gold/20 text-gold text-sm flex items-center gap-2 hover:bg-gold/30 disabled:opacity-50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {videoGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating Video...
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4" />
                              Generate Video
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Error display */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Loading state */}
                {(callState === 'connecting' || callState === 'generating') && !generatedMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                    <p className="text-cream/50 text-sm">
                      {callState === 'connecting' ? 'Connecting to your Echo...' : 'Creating personalized message...'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Custom message input */}
        <div className="absolute bottom-20 left-4 right-4 sm:left-8 sm:right-8">
          <div className="flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a custom message..."
              className="flex-1 px-4 py-2 rounded-full bg-navy/80 border border-gold/20 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50"
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isSpeaking}
              className="p-2 rounded-full bg-gold text-navy disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Control bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            <motion.button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 sm:p-4 rounded-full ${
                isMuted ? 'bg-red-500/20 text-red-400' : 'bg-navy-light/80 text-cream/70 hover:text-cream'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
            </motion.button>

            <motion.button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3 sm:p-4 rounded-full ${
                !isVideoOn ? 'bg-red-500/20 text-red-400' : 'bg-navy-light/80 text-cream/70 hover:text-cream'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isVideoOn ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
            </motion.button>

            <motion.button
              onClick={onClose}
              className="p-3 sm:p-4 rounded-full bg-red-500 text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>

            <motion.button
              className="p-3 sm:p-4 rounded-full bg-navy-light/80 text-cream/70 hover:text-cream"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>

            <motion.button
              onClick={toggleSpeech}
              className={`p-3 sm:p-4 rounded-full ${
                !speechEnabled ? 'bg-red-500/20 text-red-400' : 'bg-navy-light/80 text-cream/70 hover:text-cream'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={speechEnabled ? 'Mute speech' : 'Enable speech'}
            >
              {speechEnabled ? (
                <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
              ) : (
                <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Self view */}
        <div className="absolute bottom-20 sm:bottom-24 right-4 sm:right-6 hidden sm:block">
          <motion.div
            className="w-24 h-18 sm:w-32 sm:h-24 rounded-lg bg-navy-dark/80 border border-gold/20 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isVideoOn ? (
              <div className="w-full h-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-cream/30" />
              </div>
            ) : (
              <VideoOff className="w-6 h-6 sm:w-8 sm:h-8 text-cream/30" />
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
  const [hasVoiceClone, setHasVoiceClone] = useState(false);

  // Check if user has a voice clone
  useEffect(() => {
    const checkVoiceClone = async () => {
      try {
        const status = await api.getVoiceCloneStatus();
        setHasVoiceClone(status.hasClonedVoice);
      } catch (err) {
        console.error('Failed to check voice clone status:', err);
      }
    };
    checkVoiceClone();
  }, []);

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4">
        <FadeIn>
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-cream mb-3 sm:mb-4">
              Echo Simulator
            </h1>
            <p className="text-cream/60 max-w-2xl mx-auto text-sm sm:text-base">
              Experience interactive conversations with your digital echo. Choose an event
              scenario to hear personalized messages in your voice.
            </p>
          </div>
        </FadeIn>

        {/* Echo status card */}
        <FadeIn delay={0.1}>
          <div className="glass-card p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden pulse-glow">
                  {persona?.avatarImages?.find(a => a.isActive)?.imageData ? (
                    <img
                      src={persona.avatarImages.find(a => a.isActive).imageData}
                      alt="Your Echo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                      <User className="w-7 h-7 sm:w-8 sm:h-8 text-navy" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-serif text-cream">{user?.firstName}'s Echo</h3>
                  <p className="text-cream/50 text-xs sm:text-sm capitalize">
                    {persona?.echoVibe || 'Compassionate'} Mode
                    <span className="mx-2">•</span>
                    {persona?.lifeStories?.length || 0} stories
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Voice clone status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm ${
                  hasVoiceClone ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <Mic className="w-3 h-3 sm:w-4 sm:h-4" />
                  {hasVoiceClone ? 'Voice cloned' : 'No voice clone'}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-green-400 text-xs sm:text-sm">Online</span>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Event cards */}
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {eventSimulations.map((event) => {
            const Icon = event.icon;
            return (
              <StaggerItem key={event.id}>
                <motion.button
                  onClick={() => setActiveEvent(event)}
                  className="w-full glass-card-hover p-5 sm:p-6 text-left"
                  whileHover={{ y: -5 }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                  </div>
                  <h3 className="text-base sm:text-lg font-serif text-cream mb-2">{event.name}</h3>
                  <p className="text-cream/50 text-xs sm:text-sm mb-3 sm:mb-4">{event.description}</p>
                  <div className="flex items-center text-gold text-xs sm:text-sm">
                    <Play className="w-4 h-4 mr-2" />
                    Launch Simulation
                  </div>
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* How it works */}
        <FadeIn delay={0.3}>
          <div className="mt-8 sm:mt-12 glass-card p-6 sm:p-8 text-center">
            <h3 className="text-lg sm:text-xl font-serif text-cream mb-4 sm:mb-6">How It Works</h3>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-gold font-serif text-lg sm:text-xl">1</span>
                </div>
                <h4 className="text-cream font-medium mb-2 text-sm sm:text-base">Choose an Event</h4>
                <p className="text-cream/50 text-xs sm:text-sm">Select a scenario that matches the moment you want to experience.</p>
              </div>
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-gold font-serif text-lg sm:text-xl">2</span>
                </div>
                <h4 className="text-cream font-medium mb-2 text-sm sm:text-base">AI Generates Response</h4>
                <p className="text-cream/50 text-xs sm:text-sm">Your Echo creates a personalized message based on your personality and stories.</p>
              </div>
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-gold font-serif text-lg sm:text-xl">3</span>
                </div>
                <h4 className="text-cream font-medium mb-2 text-sm sm:text-base">Hear Your Voice</h4>
                <p className="text-cream/50 text-xs sm:text-sm">Listen to the message in your cloned voice, or generate a video avatar.</p>
              </div>
            </div>

            {/* Feature badges */}
            <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3">
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gold/10 border border-gold/20 text-cream/70 text-xs sm:text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gold" />
                ElevenLabs Voice Clone
              </div>
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gold/10 border border-gold/20 text-cream/70 text-xs sm:text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-gold" />
                HeyGen Video Avatar
              </div>
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gold/10 border border-gold/20 text-cream/70 text-xs sm:text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gold" />
                AI Personalization
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Video call modal */}
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
