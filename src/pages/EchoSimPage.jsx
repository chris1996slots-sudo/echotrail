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
  Image,
  Sparkles,
  Radio
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import LiveChat from '../components/LiveChat';

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
  const [videoProgress, setVideoProgress] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [showFullText, setShowFullText] = useState(false);

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

  // Refresh the talking_photo_id for the avatar
  const refreshAvatarId = async () => {
    try {
      setError(null);
      setVideoProgress('Refreshing avatar...');
      const result = await api.refreshPhotoAvatar();
      console.log('Refresh result:', result);

      if (result.updated) {
        setVideoProgress('Avatar updated! Try generating video again.');
        setTimeout(() => setVideoProgress(''), 3000);
      } else if (result.success) {
        setVideoProgress('Avatar is ready.');
        setTimeout(() => setVideoProgress(''), 2000);
      } else {
        setError('Could not find a valid avatar. Please re-create your Photo Avatar on the Persona page.');
        console.log('Available avatars:', result.availableAvatars);
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError('Failed to refresh avatar: ' + (err.message || 'Unknown error'));
    }
  };

  // Generate HeyGen video avatar (Premium feature)
  const generateVideoAvatar = async () => {
    if (!generatedMessage) return;

    setVideoGenerating(true);
    setVideoProgress('Starting video generation...');
    setError(null);

    try {
      const result = await api.generateAvatar(generatedMessage);
      console.log('HeyGen generate result:', result);

      if (result.videoId) {
        setVideoProgress('Video is being rendered...');

        // Poll for video status
        let pollCount = 0;
        const maxPolls = 60; // Max 3 minutes (60 * 3s)

        const pollStatus = async () => {
          try {
            pollCount++;
            const status = await api.getAvatarStatus(result.videoId);
            console.log('Video status:', status);

            if (status.status === 'completed' && status.video_url) {
              console.log('Video ready:', status.video_url);
              setVideoUrl(status.video_url);
              setVideoGenerating(false);
              setVideoProgress('');
            } else if (status.status === 'failed') {
              setError('Video generation failed: ' + (status.error || 'Unknown error'));
              setVideoGenerating(false);
              setVideoProgress('');
            } else if (pollCount >= maxPolls) {
              setError('Video generation timed out. Please try again.');
              setVideoGenerating(false);
              setVideoProgress('');
            } else {
              // Update progress message
              const progressMessages = [
                'Processing your avatar...',
                'Syncing lip movements...',
                'Adding voice synthesis...',
                'Finalizing video...',
                'Almost ready...'
              ];
              setVideoProgress(progressMessages[Math.min(Math.floor(pollCount / 4), progressMessages.length - 1)]);

              // Keep polling
              setTimeout(pollStatus, 3000);
            }
          } catch (pollErr) {
            console.error('Poll error:', pollErr);
            setError('Failed to check video status: ' + pollErr.message);
            setVideoGenerating(false);
            setVideoProgress('');
          }
        };

        setTimeout(pollStatus, 5000);
      } else {
        setError('Failed to start video generation. No video ID returned.');
        setVideoGenerating(false);
        setVideoProgress('');
      }
    } catch (err) {
      console.error('HeyGen error:', err);
      // Check if it's a server error that suggests avatar ID issue
      const errorMsg = err.message || 'Failed to generate video avatar';
      if (errorMsg.includes('wrong') || errorMsg.includes('contact') || errorMsg.includes('500')) {
        setError(errorMsg + ' - The avatar ID may be incorrect. Try clicking "Refresh Avatar ID" below.');
      } else {
        setError(errorMsg);
      }
      if (err.debug) {
        console.log('HeyGen debug info:', err.debug);
      }
      setVideoGenerating(false);
      setVideoProgress('');
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 sm:p-4 overflow-y-auto"
    >
      <audio ref={audioRef} className="hidden" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-5xl min-h-[80vh] max-h-[95vh] bg-navy-dark rounded-2xl overflow-hidden flex flex-col"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-light via-navy-dark to-black" />

        {/* Top bar - fixed */}
        <div className="relative z-20 flex items-center justify-between p-3 sm:p-4 border-b border-gold/10">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
            className="p-2 rounded-full bg-navy/80 backdrop-blur text-cream/70 hover:text-cream hover:bg-red-500/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main content - scrollable */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col items-center">
            {/* Video display - when HeyGen video is ready */}
            {videoUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl mx-auto"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-2 ring-gold/30">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    autoPlay
                    className="w-full aspect-video bg-black"
                    onEnded={() => {
                      // Don't auto-hide, let user watch again
                    }}
                  />
                </div>

                {/* Video controls */}
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  <motion.button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play();
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-gold/20 text-gold text-sm flex items-center gap-2 hover:bg-gold/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Replay Video
                  </motion.button>
                  <motion.button
                    onClick={() => setVideoUrl(null)}
                    className="px-4 py-2 rounded-lg bg-navy/60 text-cream/70 text-sm flex items-center gap-2 hover:bg-navy/80"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X className="w-4 h-4" />
                    Close Video
                  </motion.button>
                </div>

                {/* Show message below video */}
                {generatedMessage && (
                  <div className="mt-6 bg-navy/40 backdrop-blur rounded-xl p-4 border border-gold/20">
                    <p className="text-cream/80 text-sm leading-relaxed">{generatedMessage}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Normal view - Avatar + Message */
              <div className="w-full max-w-2xl mx-auto text-center">
                {/* Avatar section */}
                <div className="relative mb-6">
                  <motion.div
                    className={`w-28 h-28 sm:w-36 sm:h-36 mx-auto rounded-full overflow-hidden border-4 ${
                      isSpeaking ? 'border-gold shadow-lg shadow-gold/30' : 'border-gold/30'
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
                        <User className="w-14 h-14 sm:w-18 sm:h-18 text-navy" />
                      </div>
                    )}
                  </motion.div>

                  {/* Speaking indicator */}
                  {isSpeaking && (
                    <motion.div
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-gold/20"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-gold rounded-full"
                          animate={{ height: ['4px', '12px', '4px'] }}
                          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* Avatar selector dropdown */}
                  {persona?.avatarImages?.length > 1 && (
                    <button
                      onClick={() => setShowAvatarSelect(!showAvatarSelect)}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-navy/80 text-cream/70 text-xs flex items-center gap-1 hover:bg-navy"
                    >
                      <Image className="w-3 h-3" />
                      <ChevronDown className={`w-3 h-3 transition-transform ${showAvatarSelect ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  <AnimatePresence>
                    {showAvatarSelect && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-navy-light/95 backdrop-blur rounded-xl p-3 shadow-xl z-30 flex gap-2"
                      >
                        {persona.avatarImages.map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => {
                              setSelectedAvatarImage(avatar);
                              setShowAvatarSelect(false);
                            }}
                            className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
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

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-serif text-cream mb-1">
                  {user?.firstName}'s Echo
                </h3>
                <p className="text-cream/50 text-sm mb-6">{event.name}</p>

                {/* Message display */}
                <AnimatePresence mode="wait">
                  {generatedMessage ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full"
                    >
                      {/* Message box */}
                      <div className={`bg-navy/50 backdrop-blur-lg rounded-2xl p-5 sm:p-6 border-2 transition-colors ${
                        isSpeaking ? 'border-gold/60' : 'border-gold/20'
                      }`}>
                        {/* Message content - full text, no truncation */}
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {isSpeaking ? (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                              >
                                <Volume2 className="w-6 h-6 text-gold" />
                              </motion.div>
                            ) : (
                              <Volume2 className="w-6 h-6 text-gold/50" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-cream text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                              {generatedMessage}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-6 pt-4 border-t border-gold/10 flex flex-wrap gap-3 justify-center">
                          <motion.button
                            onClick={() => speakMessage(generatedMessage)}
                            disabled={isSpeaking}
                            className="px-4 py-2 rounded-xl bg-gold/20 text-gold text-sm font-medium flex items-center gap-2 hover:bg-gold/30 disabled:opacity-50 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isSpeaking ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Speaking...
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-4 h-4" />
                                Play Audio
                              </>
                            )}
                          </motion.button>

                          <motion.button
                            onClick={() => speakMessage(generatedMessage)}
                            disabled={isSpeaking}
                            className="px-4 py-2 rounded-xl bg-navy/60 text-cream/70 text-sm font-medium flex items-center gap-2 hover:bg-navy/80 disabled:opacity-50 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <RefreshCw className="w-4 h-4" />
                            Repeat
                          </motion.button>

                          {/* HeyGen video generation (Premium) */}
                          <motion.button
                            onClick={generateVideoAvatar}
                            disabled={videoGenerating || !persona?.heygenAvatarId}
                            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                              persona?.heygenAvatarId
                                ? 'bg-gradient-to-r from-gold to-gold-light text-navy hover:opacity-90'
                                : 'bg-navy/40 text-cream/40 cursor-not-allowed'
                            }`}
                            whileHover={persona?.heygenAvatarId ? { scale: 1.02 } : {}}
                            whileTap={persona?.heygenAvatarId ? { scale: 0.98 } : {}}
                            title={!persona?.heygenAvatarId ? 'Create a Photo Avatar first on My Persona page' : ''}
                          >
                            {videoGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {videoProgress || 'Generating...'}
                              </>
                            ) : (
                              <>
                                <Video className="w-4 h-4" />
                                Generate Talking Video
                              </>
                            )}
                          </motion.button>
                        </div>

                        {/* Missing avatar hint */}
                        {!persona?.heygenAvatarId && (
                          <p className="mt-3 text-cream/40 text-xs text-center">
                            To generate talking videos, create a Photo Avatar on the My Persona page first.
                          </p>
                        )}
                      </div>

                      {/* Error display */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                          </div>
                          {/* Show refresh button if it's an avatar error */}
                          {(error.includes('wrong') || error.includes('Refresh') || error.includes('avatar')) && persona?.heygenAvatarId && (
                            <motion.button
                              onClick={refreshAvatarId}
                              className="mt-3 ml-8 px-3 py-1.5 rounded-lg bg-gold/20 text-gold text-xs flex items-center gap-2 hover:bg-gold/30"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <RefreshCw className="w-3 h-3" />
                              Refresh Avatar ID
                            </motion.button>
                          )}
                        </motion.div>
                      )}

                      {/* Video generation progress */}
                      {videoGenerating && videoProgress && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4 px-4 py-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm flex items-center justify-center gap-3"
                        >
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{videoProgress}</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    /* Loading state */
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-4 py-8"
                    >
                      <Loader2 className="w-10 h-10 text-gold animate-spin" />
                      <p className="text-cream/60 text-base">
                        {callState === 'connecting' ? 'Connecting to your Echo...' : 'Creating personalized message...'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Custom message input */}
        <div className="relative z-20 p-4 border-t border-gold/10 bg-navy-dark/80">
          <div className="flex gap-3 max-w-xl mx-auto">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a custom message for your Echo to speak..."
              className="flex-1 px-4 py-3 rounded-xl bg-navy/80 border border-gold/20 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50 transition-colors"
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isSpeaking}
              className="px-4 py-3 rounded-xl bg-gold text-navy font-medium disabled:opacity-50 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Control bar */}
        <div className="relative z-20 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <motion.button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-colors ${
                isMuted ? 'bg-red-500/30 text-red-400' : 'bg-navy-light/80 text-cream/70 hover:text-cream hover:bg-navy-light'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>

            <motion.button
              onClick={toggleSpeech}
              className={`p-3 rounded-full transition-colors ${
                !speechEnabled ? 'bg-red-500/30 text-red-400' : 'bg-navy-light/80 text-cream/70 hover:text-cream hover:bg-navy-light'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={speechEnabled ? 'Disable speech' : 'Enable speech'}
            >
              {speechEnabled ? (
                <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-gold' : ''}`} />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </motion.button>

            <motion.button
              onClick={onClose}
              className="p-4 rounded-full bg-red-500 text-white shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </motion.button>

            <motion.button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3 rounded-full transition-colors ${
                !isVideoOn ? 'bg-red-500/30 text-red-400' : 'bg-navy-light/80 text-cream/70 hover:text-cream hover:bg-navy-light'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isVideoOn ? 'Turn off video' : 'Turn on video'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </motion.button>

            <motion.button
              className="p-3 rounded-full bg-navy-light/80 text-cream/70 hover:text-cream hover:bg-navy-light transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Chat"
            >
              <MessageCircle className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function EchoSimPage({ onNavigate }) {
  const { user, persona } = useApp();
  const [activeEvent, setActiveEvent] = useState(null);
  const [hasVoiceClone, setHasVoiceClone] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [hasPhotoAvatar, setHasPhotoAvatar] = useState(false);

  // Check if user has a voice clone and photo avatar
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [voiceStatus, photoStatus] = await Promise.all([
          api.getVoiceCloneStatus(),
          api.getPhotoAvatarStatus()
        ]);
        setHasVoiceClone(voiceStatus.hasClonedVoice);
        setHasPhotoAvatar(photoStatus.hasPhotoAvatar);
      } catch (err) {
        console.error('Failed to check status:', err);
      }
    };
    checkStatus();
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

        {/* Live Chat Card - Premium Feature */}
        <FadeIn delay={0.15}>
          <motion.div
            className="glass-card p-5 sm:p-6 mb-6 sm:mb-8 border border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-navy-dark"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg sm:text-xl font-serif text-cream">Live Conversation</h3>
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium">
                      NEW
                    </span>
                  </div>
                  <p className="text-cream/60 text-sm mb-2">
                    Have a real-time video conversation with your Echo. Type messages and watch your avatar respond with lip-synced video using your cloned voice.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      hasPhotoAvatar ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {hasPhotoAvatar ? '✓ Photo Avatar' : '✗ Needs Photo Avatar'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      hasVoiceClone ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {hasVoiceClone ? '✓ Voice Clone' : '○ Voice Clone (optional)'}
                    </span>
                  </div>
                </div>
              </div>
              <motion.button
                onClick={() => setShowLiveChat(true)}
                disabled={!hasPhotoAvatar}
                className={`px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                  hasPhotoAvatar
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
                whileHover={hasPhotoAvatar ? { scale: 1.05 } : {}}
                whileTap={hasPhotoAvatar ? { scale: 0.95 } : {}}
              >
                <Sparkles className="w-5 h-5" />
                Start Live Chat
              </motion.button>
            </div>
            {!hasPhotoAvatar && (
              <p className="mt-3 text-cream/40 text-xs text-center sm:text-left">
                Create a Photo Avatar on the My Persona page to enable Live Conversation.
              </p>
            )}
          </motion.div>
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
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs sm:text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                Live Streaming Avatar
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

      {/* Live Chat modal */}
      {showLiveChat && (
        <LiveChat
          onClose={() => setShowLiveChat(false)}
          userName={user?.firstName}
        />
      )}
    </PageTransition>
  );
}
