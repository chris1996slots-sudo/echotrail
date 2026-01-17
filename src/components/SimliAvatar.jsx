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
  Send
} from 'lucide-react';
import api from '../services/api';

// Simli SDK will be loaded dynamically
let SimliClient = null;

export function SimliAvatar({ onClose, persona, config }) {
  const [status, setStatus] = useState('initializing'); // initializing, connecting, connected, speaking, error, ended
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [simliConfig, setSimliConfig] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(config); // User's face and voice selection

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
        maxSessionLength: 3600,
        maxIdleTime: 600,
        videoRef: videoRef.current,
        audioRef: audioRef.current,
        enableConsoleLogs: true
      };

      client.Initialize(initConfig);

      // Set up event listeners
      client.on('connected', () => {
        console.log('Simli connected');
        setStatus('connected');
        addMessage('system', 'Connected! You can now have a conversation.');
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

      // Generate TTS and send to Simli
      if (simliClientRef.current && simliConfig) {
        // Use selected voice ID from config
        const voiceIdToUse = selectedConfig?.voice?.id;
        console.log('Using Voice ID for TTS:', voiceIdToUse, 'Selected Voice:', selectedConfig?.voice);

        const ttsResponse = await api.getSimliTTS(responseText, voiceIdToUse);

        if (ttsResponse.audio) {
          // Convert base64 to Uint8Array (raw bytes)
          const binaryString = atob(ttsResponse.audio);
          const uint8Array = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
          }

          // Convert Uint8Array to Int16Array (PCM16 format)
          // PCM16 uses 16-bit signed integers, not 8-bit unsigned
          const int16Array = new Int16Array(uint8Array.buffer);

          console.log('Sending audio to Simli:', {
            uint8Bytes: uint8Array.length,
            int16Samples: int16Array.length,
            sampleRate: ttsResponse.sampleRate,
            format: ttsResponse.format
          });

          // Send all audio at once - Simli handles internal buffering
          // Simli's WebRTC implementation manages the streaming internally
          simliClientRef.current.sendAudioData(int16Array);

          console.log('Audio sent to Simli as Int16Array');
        }
      }
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
    </motion.div>
  );
}

export default SimliAvatar;
