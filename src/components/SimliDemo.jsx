import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Loader2,
  Sparkles,
  Volume2,
  VolumeX,
  MessageCircle,
  Play,
  User,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

// Simli SDK will be loaded dynamically
let SimliClient = null;

// Available demo characters (using Simli preset face IDs from docs.simli.com)
const DEMO_CHARACTERS = [
  { id: 'b9e5fba3-071a-4e35-896e-211c4d6eaa7b', name: 'Luna', gender: 'female', description: 'Friendly female' },
  { id: 'afdb6a3e-3939-40aa-92df-01604c23101c', name: 'Ms Patel', gender: 'female', description: 'Professional female' },
  { id: '121cd5ae-7df7-4ea3-a389-401a9463db52', name: 'Edna', gender: 'female', description: 'Elderly woman' },
  { id: 'b1f6ad8f-ed78-430b-85ef-2ec672728104', name: 'Tiffany', gender: 'female', description: 'Young female' },
  { id: '14de6eb1-0ea6-4fde-9522-8552ce691cb6', name: 'Baby', gender: 'neutral', description: 'Baby' },
];

/**
 * SimliDemo - A compact demo avatar for the registration/landing page
 * Works without authentication, uses default face and voice
 */
export function SimliDemo({ className = '', autoStart = false }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastMessage, setLastMessage] = useState('');
  const [simliConfig, setSimliConfig] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(DEMO_CHARACTERS[0]);
  const [hasUserInteracted, setHasUserInteracted] = useState(autoStart);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(autoStart); // Track if we need user to unlock audio

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const simliClientRef = useRef(null);

  // Auto-start if enabled (with Luna as default)
  useEffect(() => {
    if (autoStart) {
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        initializeSimli(DEMO_CHARACTERS[0]); // Luna
      }, 500);
      return () => clearTimeout(timer);
    }
    return () => cleanup();
  }, [autoStart]);

  // Function to unlock audio after user interaction and replay greeting
  const unlockAudio = async () => {
    if (audioRef.current) {
      // Play to unlock audio context
      try {
        await audioRef.current.play();
      } catch (e) {
        console.log('[SimliDemo] Audio play attempt:', e);
      }
      setNeedsAudioUnlock(false);

      // Re-send the greeting now that audio is unlocked
      if (simliClientRef.current && selectedCharacter) {
        try {
          const greeting = `Hello! I'm ${selectedCharacter.name}. Ask me anything!`;
          setLastMessage(greeting);

          const ttsResponse = await api.getSimliDemoTTS(greeting, {
            stability: 0.65,
            similarity_boost: 0.75
          }, selectedCharacter.id);

          if (ttsResponse.audio) {
            sendAudioToSimli(ttsResponse.audio);
          }
        } catch (err) {
          console.error('Greeting replay error:', err);
        }
      }
    }
  };

  const startDemo = async () => {
    setHasUserInteracted(true);
    await initializeSimli();
  };

  const initializeSimli = async (characterOverride = null) => {
    // Use override if provided (for character switching), otherwise use state
    const character = characterOverride || selectedCharacter;

    try {
      setStatus('initializing');
      setError(null);

      // Load Simli SDK
      if (!SimliClient) {
        try {
          const simliModule = await import('simli-client');
          SimliClient = simliModule.SimliClient;
        } catch (e) {
          console.warn('Simli SDK not available');
          setError('Demo not available');
          setStatus('error');
          return;
        }
      }

      // Get config from backend (public demo endpoint - no auth required)
      const config = await api.getSimliDemoSession();
      setSimliConfig(config);

      if (!config.simliApiKey) {
        throw new Error('Demo not configured');
      }

      // Create client
      const client = new SimliClient();
      simliClientRef.current = client;

      const initConfig = {
        apiKey: config.simliApiKey,
        faceID: character.id || config.defaultFaceId,
        handleSilence: true,
        syncAudio: true,          // Enable audio synchronization for better lip-sync
        maxSessionLength: 600,    // 10 minutes for demo
        maxIdleTime: 300,         // 5 minutes idle timeout
        videoRef: videoRef.current,
        audioRef: audioRef.current,
        enableConsoleLogs: true,
        model: 'fasttalk'         // Use faster model for lower latency
      };

      client.Initialize(initConfig);

      client.on('connected', async () => {
        console.log('[SimliDemo] Simli connected with character:', character.name);
        setStatus('connected');

        // Send welcome greeting after connection is FULLY established
        // Use 1500ms delay to ensure Simli WebRTC is ready (same as main app)
        setTimeout(async () => {
          try {
            const greeting = `Hello! I'm ${character.name}. Ask me anything!`;
            setLastMessage(greeting);

            console.log('[SimliDemo] Sending greeting TTS...');
            const ttsResponse = await api.getSimliDemoTTS(greeting, {
              stability: 0.65,  // Higher stability for smoother speech
              similarity_boost: 0.75
            }, character.id);
            console.log('[SimliDemo] TTS received, audio length:', ttsResponse.audio?.length);

            if (ttsResponse.audio && simliClientRef.current) {
              sendAudioToSimli(ttsResponse.audio);
            }
          } catch (err) {
            console.error('Greeting error:', err);
          }
        }, 1500); // Increased delay to match SimliAvatar.jsx timing
      });

      client.on('disconnected', () => setStatus('ended'));
      client.on('failed', () => {
        setStatus('error');
        setError('Connection failed');
      });
      client.on('speaking', () => setStatus('speaking'));
      client.on('silent', () => {
        if (status !== 'error' && status !== 'ended') {
          setStatus('connected');
        }
      });

      setStatus('connecting');
      await client.start();

    } catch (err) {
      console.error('Simli demo error:', err);
      setError('Demo unavailable');
      setStatus('error');
    }
  };

  // Send audio to Simli - optimized for lower latency
  const sendAudioToSimli = (base64Audio) => {
    if (!simliClientRef.current) return;

    // Convert base64 to Uint8Array (raw bytes)
    const binaryString = atob(base64Audio);

    // Ensure length is even for Int16Array (2 bytes per sample)
    const evenLength = binaryString.length % 2 === 0 ? binaryString.length : binaryString.length - 1;

    // Create Uint8Array with even length
    const uint8Array = new Uint8Array(evenLength);
    for (let i = 0; i < evenLength; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    // Convert Uint8Array to Int16Array (PCM16 format - little endian)
    const int16Array = new Int16Array(uint8Array.buffer);

    console.log('[SimliDemo] Sending audio:', int16Array.length, 'samples');

    // For demo: Send all audio at once using immediate method for lower latency
    // This sends the entire buffer immediately without chunking delay
    simliClientRef.current.sendAudioData(uint8Array);
  };

  const cleanup = () => {
    if (simliClientRef.current) {
      try {
        simliClientRef.current.close();
      } catch (e) {}
    }
  };

  // Switch to a different character - closes current session and starts new one
  const switchCharacter = async (newCharacter) => {
    if (newCharacter.id === selectedCharacter.id) return;

    setSelectedCharacter(newCharacter);
    setLastMessage('');
    cleanup();

    // Small delay before reinitializing with the new character
    setTimeout(() => {
      initializeSimli(newCharacter);
    }, 100);
  };

  const handleSendMessage = async () => {
    // Allow sending while speaking (will queue)
    if (!inputText.trim() || isProcessing) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    try {
      // Very short demo responses for speed
      const demoResponses = [
        `Thanks! This is a demo of your future AI avatar.`,
        `I heard you! Create an account to customize me.`,
        `Great question! Sign up to learn more.`,
        `Interesting! Your avatar will remember this.`
      ];

      const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      setLastMessage(response);

      console.log('[SimliDemo] Sending message TTS...');
      const ttsResponse = await api.getSimliDemoTTS(response, {
        stability: 0.65,       // Higher stability for smoother speech
        similarity_boost: 0.75
      }, selectedCharacter.id);
      console.log('[SimliDemo] TTS received, audio length:', ttsResponse.audio?.length);

      if (ttsResponse.audio && simliClientRef.current) {
        sendAudioToSimli(ttsResponse.audio);
      }
    } catch (err) {
      console.error('Message error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render idle state (waiting for user to start)
  if (status === 'idle' && !hasUserInteracted) {
    return (
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-navy-light to-navy border-2 border-gold/30 ${className}`}>
        <div className="aspect-[4/3] flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/30 to-gold/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-gold" />
            </div>
            <h3 className="text-cream font-medium mb-2">Live AI Avatar Demo</h3>
            <p className="text-cream/60 text-sm mb-4">Choose a character and start chatting!</p>

            {/* Character Selection - 3x2 Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4 max-w-xs mx-auto">
              {DEMO_CHARACTERS.map((char) => (
                <button
                  key={char.name}
                  onClick={() => setSelectedCharacter(char)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    selectedCharacter.name === char.name
                      ? 'bg-gold text-navy'
                      : 'bg-navy-light border border-gold/30 text-cream/70 hover:border-gold/50'
                  }`}
                >
                  <User className="w-3 h-3" />
                  {char.name}
                </button>
              ))}
            </div>

            <motion.button
              onClick={startDemo}
              className="px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-navy font-medium rounded-xl flex items-center gap-2 mx-auto hover:shadow-lg hover:shadow-gold/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-5 h-5" />
              Start Demo
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // Render fallback if error
  if (status === 'error') {
    return (
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-navy-light to-navy border-2 border-gold/30 ${className}`}>
        <div className="aspect-[4/3] flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-cream/70 text-sm">AI Avatar Demo</p>
            <p className="text-cream/50 text-xs mt-2">Demo temporarily unavailable</p>
            <motion.button
              onClick={startDemo}
              className="mt-4 px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm hover:bg-gold/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-black border-2 border-gold/30 shadow-2xl ${className}`}>
      {/* Video Container */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-navy-dark to-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <audio ref={audioRef} autoPlay muted={isMuted} />

        {/* Loading Overlay */}
        {(status === 'initializing' || status === 'connecting') && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-dark/80">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-3" />
              <p className="text-cream/70 text-sm">
                {status === 'initializing' ? 'Loading AI...' : 'Connecting...'}
              </p>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {status === 'connected' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/90 rounded-full">
              <motion.div
                className="w-2 h-2 bg-white rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-white text-xs font-medium">LIVE</span>
            </div>
          )}
          {status === 'speaking' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/90 rounded-full">
              <motion.div
                className="flex items-end gap-0.5 h-3"
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-white rounded-full"
                    animate={{ height: ['4px', '12px', '4px'] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </motion.div>
              <span className="text-white text-xs font-medium">Speaking</span>
            </div>
          )}
        </div>

        {/* AI Badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-purple-600/80 rounded-full">
          <span className="text-white text-xs font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Demo
          </span>
        </div>

        {/* Mute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-3 right-3 p-2 bg-navy/80 rounded-full text-cream/70 hover:text-cream transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Audio Unlock Overlay - shown when autoStart but user hasn't interacted */}
        {needsAudioUnlock && status === 'connected' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={unlockAudio}
            className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-16 h-16 mx-auto mb-3 rounded-full bg-gold/20 flex items-center justify-center border-2 border-gold"
              >
                <Volume2 className="w-8 h-8 text-gold" />
              </motion.div>
              <p className="text-cream font-medium">Tap to hear Luna</p>
              <p className="text-cream/60 text-sm">Enable audio</p>
            </div>
          </motion.button>
        )}

        {/* Last Message */}
        {lastMessage && !needsAudioUnlock && (
          <div className="absolute bottom-3 left-3 right-14 p-2 bg-navy/90 rounded-lg">
            <p className="text-cream/90 text-xs line-clamp-2">{lastMessage}</p>
          </div>
        )}
      </div>

      {/* Character Switcher */}
      <div className="px-3 py-2 bg-navy-dark/80 border-t border-gold/10">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3 h-3 text-cream/40 flex-shrink-0" />
          <span className="text-cream/40 text-xs">Switch:</span>
          <div className="flex gap-1 overflow-x-auto">
            {DEMO_CHARACTERS.map((char) => (
              <button
                key={char.name}
                onClick={() => switchCharacter(char)}
                disabled={status === 'initializing' || status === 'connecting'}
                className={`px-2 py-0.5 rounded text-xs whitespace-nowrap transition-all ${
                  selectedCharacter.name === char.name
                    ? 'bg-gold/30 text-gold'
                    : 'bg-navy-light/50 text-cream/50 hover:text-cream/80 hover:bg-navy-light'
                } disabled:opacity-50`}
              >
                {char.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-3 bg-navy-dark/90 border-t border-gold/20">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-gold/50 flex-shrink-0" />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message to try..."
            disabled={status !== 'connected' || isProcessing}
            className="flex-1 bg-navy-light/50 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm placeholder-cream/40 focus:outline-none focus:border-gold/50 disabled:opacity-50"
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isProcessing || status !== 'connected'}
            className="p-2 bg-gold/20 hover:bg-gold/30 rounded-lg text-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
        <p className="text-cream/40 text-xs mt-2 text-center">
          Try the demo! Create an account to customize your avatar.
        </p>
      </div>
    </div>
  );
}
