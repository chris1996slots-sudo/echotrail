import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Send,
  Settings,
  X
} from 'lucide-react';
import api from '../services/api';

// Simli SDK will be loaded dynamically
let SimliClient = null;

export function SimliAvatar({ onClose, persona, user, config }) {
  const [status, setStatus] = useState('initializing'); // initializing, connecting, connected, speaking, error, ended
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [simliConfig, setSimliConfig] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(config); // User's face and voice selection
  const [showSettings, setShowSettings] = useState(false);

  // Voice settings (adjustable by user)
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.65,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true
  });

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const simliClientRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Initialize Simli
  useEffect(() => {
    initializeSimli();
    return () => {
      cleanup();
    };
  }, []);

  const initializeSimli = async () => {
    try {
      setStatus('initializing');
      setError(null);

      // Load Simli SDK dynamically
      if (!SimliClient) {
        try {
          const simliModule = await import('simli-client');
          SimliClient = simliModule.SimliClient;
        } catch (e) {
          console.warn('Simli SDK not installed, using fallback mode');
          setError('Simli SDK not installed. Please run: npm install simli-client');
          setStatus('error');
          return;
        }
      }

      // Get Simli configuration from backend
      const config = await api.getSimliSession();
      setSimliConfig(config);

      if (!config.simliApiKey) {
        throw new Error('Simli API not configured');
      }

      // Create Simli client
      const client = new SimliClient();
      simliClientRef.current = client;

      // Initialize with config - Use selected face ID from user's choice
      const faceIdToUse = selectedConfig?.face?.id || config.defaultFaceId;
      console.log('Using Face ID:', faceIdToUse, 'Selected Face:', selectedConfig?.face);

      const initConfig = {
        apiKey: config.simliApiKey,
        faceID: faceIdToUse,
        handleSilence: true,
        syncAudio: true,          // Enable audio synchronization for better lip-sync
        maxSessionLength: 3600,
        maxIdleTime: 600,
        videoRef: videoRef.current,
        audioRef: audioRef.current,
        enableConsoleLogs: true
      };

      client.Initialize(initConfig);

      // Set up event listeners
      client.on('connected', async () => {
        console.log('Simli connected');
        setStatus('connected');

        // Send automatic greeting
        const userName = user?.firstName || 'there';
        const greetingText = `Hallo ${userName}! Ich freue mich dich zu sehen, wie geht es dir?`;

        addMessage('assistant', greetingText);

        // Send TTS for greeting
        setTimeout(async () => {
          await sendTTSToSimli(greetingText);
        }, 500); // Small delay to ensure connection is stable
      });

      client.on('disconnected', () => {
        console.log('Simli disconnected');
        setStatus('ended');
      });

      client.on('failed', () => {
        console.error('Simli connection failed');
        setStatus('error');
        setError('Connection failed. Please try again.');
      });

      client.on('speaking', () => {
        setStatus('speaking');
      });

      client.on('silent', () => {
        if (status !== 'error' && status !== 'ended') {
          setStatus('connected');
        }
      });

      // Start the connection
      setStatus('connecting');
      await client.start();

    } catch (err) {
      console.error('Simli initialization error:', err);
      setError(err.message || 'Failed to initialize Simli');
      setStatus('error');
    }
  };

  const cleanup = () => {
    if (simliClientRef.current) {
      try {
        simliClientRef.current.close();
      } catch (e) {
        console.error('Error closing Simli client:', e);
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  // Helper function to send TTS audio to Simli
  const sendTTSToSimli = async (text) => {
    if (!simliClientRef.current || !simliConfig) return;

    try {
      const voiceIdToUse = selectedConfig?.voice?.id;
      console.log('Sending TTS:', text, 'with voice:', voiceIdToUse);

      const ttsResponse = await api.getSimliTTS(text, voiceIdToUse, voiceSettings);

      if (ttsResponse.audio) {
        // Convert base64 to Uint8Array (raw bytes)
        const binaryString = atob(ttsResponse.audio);

        // Ensure length is even for Int16Array (2 bytes per sample)
        const evenLength = binaryString.length % 2 === 0 ? binaryString.length : binaryString.length - 1;

        if (binaryString.length !== evenLength) {
          console.warn('Audio buffer has odd length, truncating:', binaryString.length, '->', evenLength);
        }

        // Create Uint8Array with even length
        const uint8Array = new Uint8Array(evenLength);
        for (let i = 0; i < evenLength; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }

        // Convert Uint8Array to Int16Array (PCM16 format - little endian)
        const int16Array = new Int16Array(uint8Array.buffer);

        console.log('Sending audio to Simli:', {
          uint8Bytes: uint8Array.length,
          int16Samples: int16Array.length,
          sampleRate: ttsResponse.sampleRate,
          format: ttsResponse.format
        });

        // Send audio in chunks with proper timing for better lip-sync
        const CHUNK_SIZE = 6000;
        const samplesPerChunk = CHUNK_SIZE / 2; // 3000 samples per chunk
        const sampleRate = 16000; // 16kHz
        const chunkDurationMs = (samplesPerChunk / sampleRate) * 1000;

        // Send chunks with timing to match audio playback
        let chunkIndex = 0;
        const totalChunks = Math.ceil(int16Array.length / samplesPerChunk);

        const sendNextChunk = () => {
          if (chunkIndex >= totalChunks) {
            console.log(`All ${totalChunks} chunks sent to Simli`);
            return;
          }

          const start = chunkIndex * samplesPerChunk;
          const end = Math.min(start + samplesPerChunk, int16Array.length);
          const chunk = int16Array.slice(start, end);

          simliClientRef.current.sendAudioData(chunk);
          chunkIndex++;

          if (chunkIndex < totalChunks) {
            setTimeout(sendNextChunk, chunkDurationMs);
          }
        };

        // Start sending chunks
        sendNextChunk();
      }
    } catch (err) {
      console.error('Error sending TTS to Simli:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage = inputText.trim();
    setInputText('');
    addMessage('user', userMessage);
    setIsProcessing(true);

    try {
      // Generate AI response
      const aiResponse = await api.generateEchoResponse(userMessage);
      const responseText = aiResponse.response || aiResponse.text;

      addMessage('assistant', responseText);

      // Send TTS to Simli
      await sendTTSToSimli(responseText);
    } catch (err) {
      console.error('Error sending message:', err);
      addMessage('system', `Error: ${err.message}`);
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

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  const handleEndCall = () => {
    cleanup();
    setStatus('ended');
    if (onClose) onClose();
  };

  const getStatusText = () => {
    switch (status) {
      case 'initializing': return 'Initializing...';
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'speaking': return 'Speaking...';
      case 'error': return 'Error';
      case 'ended': return 'Call Ended';
      default: return status;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
      case 'speaking':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'ended':
        return 'text-cream/50';
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-navy-dark/95 backdrop-blur-lg flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gold/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-serif text-cream">Live Conversation</h2>
            <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
              {status === 'connecting' || status === 'initializing' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : status === 'error' ? (
                <AlertCircle className="w-3 h-3" />
              ) : status === 'connected' || status === 'speaking' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : null}
              {getStatusText()}
              {selectedConfig?.voice && (
                <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                  {selectedConfig.voice.type === 'clone' ? 'Voice Clone' : selectedConfig.voice.name}
                </span>
              )}
              {selectedConfig?.face && (
                <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                  {selectedConfig.face.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleEndCall}
          className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Section */}
        <div className="lg:w-1/2 p-4 flex items-center justify-center bg-black/30">
          <div className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden bg-navy-dark border border-gold/20">
            {/* Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-contain ${isVideoOff ? 'hidden' : ''}`}
            />

            {/* Audio Element (hidden) */}
            <audio ref={audioRef} autoPlay />

            {/* Video Off Placeholder */}
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-navy-dark">
                <VideoOff className="w-16 h-16 text-cream/30" />
              </div>
            )}

            {/* Loading Overlay */}
            {(status === 'initializing' || status === 'connecting') && (
              <div className="absolute inset-0 flex items-center justify-center bg-navy-dark/80">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
                  <p className="text-cream/70">{getStatusText()}</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {status === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-navy-dark/80">
                <div className="text-center p-4">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 mb-2">Connection Error</p>
                  <p className="text-cream/50 text-sm mb-4">{error}</p>
                  <button
                    onClick={initializeSimli}
                    className="px-4 py-2 bg-gold text-navy rounded-lg hover:bg-gold-light transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Speaking Indicator */}
            {status === 'speaking' && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Speaking</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="lg:w-1/2 flex flex-col border-t lg:border-t-0 lg:border-l border-gold/20">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-cream/50 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with your Echo</p>
                <p className="text-sm mt-2">Type a message below to begin</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-gold text-navy'
                        : msg.role === 'system'
                        ? 'bg-cream/10 text-cream/60 text-sm'
                        : 'bg-navy-light text-cream'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))
            )}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-navy-light rounded-2xl px-4 py-2">
                  <Loader2 className="w-5 h-5 text-gold animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gold/20">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={status !== 'connected' && status !== 'speaking'}
                className="flex-1 px-4 py-3 bg-navy-light border border-gold/20 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold disabled:opacity-50"
              />
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 bg-navy-light border border-gold/20 rounded-xl text-cream hover:bg-gold/10 transition-colors"
                title="Voice Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isProcessing || (status !== 'connected' && status !== 'speaking')}
                className="p-3 bg-gold text-navy rounded-xl hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gold/20">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-cream/10 text-cream hover:bg-cream/20'
            }`}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-cream/10 text-cream hover:bg-cream/20'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Voice Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-navy-dark border-l border-gold/20 shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif text-cream flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gold" />
                  Voice Settings
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-cream/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-cream/60 text-sm mb-6">
                Adjust voice parameters in real-time. Changes apply to the next message.
              </p>

              {/* Stability */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-cream font-medium">Speech Speed</label>
                  <span className="text-cream/60 text-sm">{voiceSettings.stability.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voiceSettings.stability}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, stability: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-navy-light rounded-lg appearance-none cursor-pointer accent-gold"
                />
                <div className="flex justify-between text-xs text-cream/40 mt-1">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
                <p className="text-cream/50 text-xs mt-2">Higher = slower, more measured speech</p>
              </div>

              {/* Similarity Boost */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-cream font-medium">Voice Similarity</label>
                  <span className="text-cream/60 text-sm">{voiceSettings.similarity_boost.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voiceSettings.similarity_boost}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, similarity_boost: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-navy-light rounded-lg appearance-none cursor-pointer accent-gold"
                />
                <div className="flex justify-between text-xs text-cream/40 mt-1">
                  <span>Generic</span>
                  <span>Exact</span>
                </div>
                <p className="text-cream/50 text-xs mt-2">How closely to match original voice</p>
              </div>

              {/* Style */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-cream font-medium">Expressiveness</label>
                  <span className="text-cream/60 text-sm">{voiceSettings.style.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voiceSettings.style}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, style: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-navy-light rounded-lg appearance-none cursor-pointer accent-gold"
                />
                <div className="flex justify-between text-xs text-cream/40 mt-1">
                  <span>Neutral</span>
                  <span>Expressive</span>
                </div>
                <p className="text-cream/50 text-xs mt-2">Emotional delivery style</p>
              </div>

              {/* Speaker Boost */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-cream font-medium">Speaker Boost</label>
                  <button
                    onClick={() => setVoiceSettings({ ...voiceSettings, use_speaker_boost: !voiceSettings.use_speaker_boost })}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      voiceSettings.use_speaker_boost
                        ? 'bg-gold text-navy'
                        : 'bg-navy-light text-cream border border-gold/20'
                    }`}
                  >
                    {voiceSettings.use_speaker_boost ? 'On' : 'Off'}
                  </button>
                </div>
                <p className="text-cream/50 text-xs mt-2">Enhanced audio clarity</p>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => setVoiceSettings({
                  stability: 0.65,
                  similarity_boost: 0.75,
                  style: 0.0,
                  use_speaker_boost: true
                })}
                className="w-full px-4 py-3 bg-navy-light border border-gold/20 text-cream rounded-xl hover:bg-gold/10 transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SimliAvatar;
