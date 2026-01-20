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
  User
} from 'lucide-react';
import api from '../services/api';

// Simli SDK will be loaded dynamically
let SimliClient = null;

// Available demo characters (using Simli preset face IDs from docs.simli.com)
const DEMO_CHARACTERS = [
  { id: '804c347a-26c9-4dcf-bb49-13df4bed61e8', name: 'Mark', gender: 'male', description: 'Professional male' },
  { id: 'd2a5c7c6-fed9-4f55-bcb3-062f7cd20103', name: 'Kate', gender: 'female', description: 'Professional female' },
];

/**
 * SimliDemo - A compact demo avatar for the registration/landing page
 * Works without authentication, uses default face and voice
 */
export function SimliDemo({ className = '' }) {
  const [status, setStatus] = useState('idle'); // Start with idle to require user interaction
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastMessage, setLastMessage] = useState('');
  const [simliConfig, setSimliConfig] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(DEMO_CHARACTERS[0]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const simliClientRef = useRef(null);
  const isPlayingAudioRef = useRef(false);
  const audioQueueRef = useRef([]);

  // Don't auto-initialize - wait for user interaction
  useEffect(() => {
    return () => cleanup();
  }, []);

  const startDemo = async () => {
    setHasUserInteracted(true);
    await initializeSimli();
  };

  const initializeSimli = async () => {
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
        faceID: selectedCharacter.id || config.defaultFaceId,
        handleSilence: true,
        syncAudio: true,
        maxSessionLength: 300, // 5 min demo limit
        maxIdleTime: 120,
        videoRef: videoRef.current,
        audioRef: audioRef.current,
        enableConsoleLogs: false
      };

      client.Initialize(initConfig);

      client.on('connected', async () => {
        setStatus('connected');

        // Send welcome greeting after connection is fully established
        setTimeout(async () => {
          try {
            const greeting = "Hello! I'm your AI avatar demo. Type a message to chat!";
            setLastMessage(greeting);

            const ttsResponse = await api.getSimliDemoTTS(greeting, {
              stability: 0.5,
              similarity_boost: 0.75
            });

            if (ttsResponse.audio && simliClientRef.current) {
              queueAudio(ttsResponse.audio);
            }
          } catch (err) {
            console.error('Greeting error:', err);
          }
        }, 1500); // Longer delay for stable connection
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

  // Queue audio to prevent overlapping playback
  const queueAudio = (base64Audio) => {
    audioQueueRef.current.push(base64Audio);
    processAudioQueue();
  };

  const processAudioQueue = () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    const base64Audio = audioQueueRef.current.shift();
    sendAudioToSimli(base64Audio);
  };

  const sendAudioToSimli = (base64Audio) => {
    if (!simliClientRef.current) return;

    isPlayingAudioRef.current = true;
    setStatus('speaking');

    const binaryString = atob(base64Audio);
    const evenLength = binaryString.length % 2 === 0 ? binaryString.length : binaryString.length - 1;
    const uint8Array = new Uint8Array(evenLength);

    for (let i = 0; i < evenLength; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(uint8Array.buffer);

    // Simli requires 6000 bytes = 3000 Int16 samples per chunk
    const CHUNK_SIZE = 6000;
    const samplesPerChunk = CHUNK_SIZE / 2; // 3000 samples
    const sampleRate = 16000;
    const chunkDurationMs = (samplesPerChunk / sampleRate) * 1000; // ~187.5ms per chunk

    let chunkIndex = 0;
    const totalChunks = Math.ceil(int16Array.length / samplesPerChunk);

    const sendNextChunk = () => {
      if (chunkIndex >= totalChunks || !simliClientRef.current) {
        // Done sending all chunks
        isPlayingAudioRef.current = false;
        setStatus('connected');
        // Process next audio in queue after a small delay
        setTimeout(processAudioQueue, 200);
        return;
      }

      const start = chunkIndex * samplesPerChunk;
      const end = Math.min(start + samplesPerChunk, int16Array.length);
      const chunk = int16Array.slice(start, end);

      try {
        simliClientRef.current.sendAudioData(chunk);
      } catch (err) {
        console.error('Error sending audio chunk:', err);
      }

      chunkIndex++;

      if (chunkIndex < totalChunks) {
        setTimeout(sendNextChunk, chunkDurationMs);
      } else {
        // All chunks sent - wait for audio to finish playing
        const remainingDuration = chunkDurationMs * 2; // Extra buffer
        setTimeout(() => {
          isPlayingAudioRef.current = false;
          setStatus('connected');
          processAudioQueue();
        }, remainingDuration);
      }
    };

    sendNextChunk();
  };

  const cleanup = () => {
    if (simliClientRef.current) {
      try {
        simliClientRef.current.close();
      } catch (e) {}
    }
  };

  const handleSendMessage = async () => {
    // Allow sending while speaking (will queue)
    if (!inputText.trim() || isProcessing) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    try {
      // Simple demo responses - shorter for better performance
      const demoResponses = [
        `Thanks for your message! This is a demo of what your AI avatar can do.`,
        `I heard you! In the full version, I'll know your personality and stories.`,
        `Great! Create an account to customize my voice and appearance.`,
        `Interesting! Your future AI avatar will remember our conversations.`
      ];

      const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      setLastMessage(response);

      const ttsResponse = await api.getSimliDemoTTS(response, {
        stability: 0.5,
        similarity_boost: 0.75
      });

      if (ttsResponse.audio && simliClientRef.current) {
        queueAudio(ttsResponse.audio);
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

            {/* Character Selection */}
            <div className="flex justify-center gap-2 mb-4">
              {DEMO_CHARACTERS.map((char) => (
                <button
                  key={char.name}
                  onClick={() => setSelectedCharacter(char)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
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

        {/* Last Message */}
        {lastMessage && (
          <div className="absolute bottom-3 left-3 right-14 p-2 bg-navy/90 rounded-lg">
            <p className="text-cream/90 text-xs line-clamp-2">{lastMessage}</p>
          </div>
        )}
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
