import { useState, useEffect, useRef, useCallback } from 'react';
import StreamingAvatar, { AvatarQuality, StreamingEvents } from '@heygen/streaming-avatar';
import { Send, Mic, MicOff, Video, VideoOff, Loader2, X, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import api from '../services/api';

export default function LiveChat({ onClose, userName }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [streamingConfig, setStreamingConfig] = useState(null);

  const avatarRef = useRef(null);
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Initialize streaming avatar
  useEffect(() => {
    initializeStreaming();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(async () => {
    if (avatarRef.current) {
      try {
        await avatarRef.current.stopAvatar();
      } catch (e) {
        console.log('Cleanup error:', e);
      }
      avatarRef.current = null;
    }
  }, []);

  const initializeStreaming = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get streaming config (avatar ID, voice clone info)
      const config = await api.getStreamingConfig();

      if (!config.hasAvatar) {
        throw new Error('No photo avatar found. Please create one on the Persona page first.');
      }

      setStreamingConfig(config);
      console.log('Streaming config:', config);

      setIsLoading(false);
    } catch (err) {
      console.error('Init error:', err);
      setError(err.message || 'Failed to initialize streaming');
      setIsLoading(false);
    }
  };

  const startSession = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get session token from backend
      const tokenResponse = await api.getStreamingToken();
      const { token } = tokenResponse;

      if (!token) {
        throw new Error('Failed to get streaming session token');
      }

      console.log('Got streaming token, initializing avatar...');

      // Initialize StreamingAvatar SDK
      const avatar = new StreamingAvatar({ token });
      avatarRef.current = avatar;

      // Set up event listeners
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('Stream ready:', event);
        if (videoRef.current && event.detail) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.play().catch(console.error);
        }
        setIsConnected(true);
        setIsConnecting(false);
      });

      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('Avatar started talking');
        setIsSpeaking(true);
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('Avatar stopped talking');
        setIsSpeaking(false);
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('Stream disconnected');
        setIsConnected(false);
        setIsConnecting(false);
      });

      // Build session configuration
      const sessionConfig = {
        quality: AvatarQuality.Medium,
      };

      // If user has ElevenLabs voice clone, configure it
      if (streamingConfig?.voiceClone?.voiceId && streamingConfig?.voiceClone?.apiKey) {
        sessionConfig.voice = {
          voiceId: streamingConfig.voiceClone.voiceId,
          rate: 1.0,
          emotion: 'friendly',
        };
        // Use ElevenLabs settings for custom voice
        sessionConfig.voice.elevenlabsSettings = {
          apiKey: streamingConfig.voiceClone.apiKey,
          voiceId: streamingConfig.voiceClone.voiceId,
          model: 'eleven_turbo_v2_5',
          stability: 0.5,
          similarityBoost: 0.85,
        };
        console.log('Using ElevenLabs voice clone:', streamingConfig.voiceClone.voiceName);
      }

      // For talking photos, we use the avatarId (talking_photo_id)
      // HeyGen streaming uses different avatar types
      // We'll try using the knowledgeId approach with custom prompt
      sessionConfig.avatarName = streamingConfig.avatarId;

      console.log('Starting session with config:', sessionConfig);

      // Start new session
      await avatar.createStartAvatar(sessionConfig);

      // Send initial greeting
      addChatMessage('system', `Connected! ${userName ? `Hello ${userName}!` : 'Hello!'} I'm ready to chat.`);

    } catch (err) {
      console.error('Session start error:', err);
      setError(err.message || 'Failed to start streaming session');
      setIsConnecting(false);
    }
  };

  const addChatMessage = (role, content) => {
    setChatHistory(prev => [...prev, {
      id: Date.now(),
      role,
      content,
      timestamp: new Date()
    }]);
  };

  const sendMessage = async () => {
    if (!message.trim() || !avatarRef.current || !isConnected) return;

    const userMessage = message.trim();
    setMessage('');
    addChatMessage('user', userMessage);

    try {
      // First, get AI response from our backend
      const aiResponse = await api.generateText(
        userMessage,
        'Live conversation with streaming avatar'
      );

      const responseText = aiResponse.response;
      addChatMessage('assistant', responseText);

      // Make avatar speak the response
      await avatarRef.current.speak({
        text: responseText,
        taskType: 'repeat', // or 'talk' for more natural conversation
        taskMode: 'sync'
      });

    } catch (err) {
      console.error('Send message error:', err);
      addChatMessage('system', 'Failed to get response. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const interruptSpeaking = async () => {
    if (avatarRef.current) {
      try {
        await avatarRef.current.interrupt();
        setIsSpeaking(false);
      } catch (e) {
        console.error('Interrupt error:', e);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      videoRef.current.style.visibility = isVideoOn ? 'hidden' : 'visible';
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Initializing Live Chat</h3>
          <p className="text-gray-400">Loading your avatar configuration...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isConnected && !isConnecting) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h3 className="text-xl font-semibold text-white">Connection Error</h3>
          </div>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={initializeStreaming}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} ${isSpeaking ? 'animate-pulse' : ''}`} />
          <h2 className="text-lg font-semibold text-white">
            Live Chat {streamingConfig?.avatarName ? `with ${streamingConfig.avatarName}` : ''}
          </h2>
          {streamingConfig?.hasVoiceClone && (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
              Voice Clone Active
            </span>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video section */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="relative flex-1 bg-slate-900 rounded-xl overflow-hidden">
            {!isConnected && !isConnecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Video className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 mb-4">Ready to start live conversation</p>
                <button
                  onClick={startSession}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  Start Session
                </button>
              </div>
            )}

            {isConnecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-400">Connecting to streaming avatar...</p>
              </div>
            )}

            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />

            {/* Video controls overlay */}
            {isConnected && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    isVideoOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition-colors ${
                    !isMuted ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {!isMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                {isSpeaking && (
                  <button
                    onClick={interruptSpeaking}
                    className="p-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                    title="Interrupt"
                  >
                    <MicOff className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat section */}
        <div className="w-1/2 p-4 flex flex-col border-l border-slate-700">
          {/* Chat history */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {chatHistory.length === 0 && isConnected && (
              <p className="text-gray-500 text-center py-8">Start the conversation by typing a message below.</p>
            )}
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : msg.role === 'assistant'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-gray-400 text-sm italic'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Message input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type your message..." : "Connect to start chatting..."}
              disabled={!isConnected || isSpeaking}
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!isConnected || !message.trim() || isSpeaking}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {isSpeaking && (
            <p className="text-purple-400 text-sm mt-2 text-center animate-pulse">
              Avatar is speaking...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
