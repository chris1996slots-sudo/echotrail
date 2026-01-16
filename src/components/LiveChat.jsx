import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Video, VideoOff, Loader2, X, AlertCircle, Volume2, VolumeX, Mic, MicOff, Sparkles, Radio, RefreshCw } from 'lucide-react';
import { Room, RoomEvent, Track, ConnectionState } from 'livekit-client';
import api from '../services/api';

export default function LiveChat({ onClose, userName }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // LiveAvatar state
  const [isConnected, setIsConnected] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [wsUrl, setWsUrl] = useState(null);
  const [maxDuration, setMaxDuration] = useState(null);

  // LiveKit refs
  const roomRef = useRef(null);
  const avatarVideoRef = useRef(null);
  const avatarAudioRef = useRef(null);
  const wsRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Auto-start session on mount
  useEffect(() => {
    startLiveAvatarSession();

    return () => {
      cleanupLiveKit();
    };
  }, []);

  const cleanupLiveKit = async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
      } catch (e) {
        console.error('Error disconnecting room:', e);
      }
      roomRef.current = null;
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

  // LiveKit Room Setup
  const setupLiveKitRoom = async (livekitUrl, livekitToken, websocketUrl) => {
    try {
      console.log('LiveKit: Setting up room connection...');
      addChatMessage('system', 'Connecting to video stream...');

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 640, height: 480 },
        },
      });

      roomRef.current = room;

      // Event handlers
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('LiveKit: Connection state:', state);
        setConnectionState(state);

        if (state === ConnectionState.Connected) {
          addChatMessage('system', '✓ Connected! You can now chat with your Echo.');
        } else if (state === ConnectionState.Disconnected) {
          addChatMessage('system', 'Session ended.');
        } else if (state === ConnectionState.Reconnecting) {
          addChatMessage('system', 'Reconnecting...');
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('LiveKit: Track subscribed:', track.kind);

        if (track.kind === Track.Kind.Video && avatarVideoRef.current) {
          track.attach(avatarVideoRef.current);
          addChatMessage('system', '✓ Video stream active');
        } else if (track.kind === Track.Kind.Audio && avatarAudioRef.current) {
          track.attach(avatarAudioRef.current);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        console.log('LiveKit: Track unsubscribed:', track.kind);
        track.detach();
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log('LiveKit: Disconnected:', reason);
        addChatMessage('system', 'Disconnected from session.');
      });

      room.on(RoomEvent.DataReceived, (payload, participant, kind) => {
        try {
          const decoder = new TextDecoder();
          const message = JSON.parse(decoder.decode(payload));
          console.log('LiveKit: Data received:', message);

          if (message.type === 'chat' && message.content) {
            addChatMessage('assistant', message.content);
          }
        } catch (e) {
          console.log('LiveKit: Raw data:', payload);
        }
      });

      // Connect
      console.log('LiveKit: Connecting to', livekitUrl);
      await room.connect(livekitUrl, livekitToken);

      console.log('LiveKit: Connected!');
      setIsConnected(true);

      // Setup WebSocket for CUSTOM mode
      if (websocketUrl) {
        setWsUrl(websocketUrl);
        setupWebSocket(websocketUrl);
      }

      return room;
    } catch (err) {
      console.error('LiveKit: Connection error:', err);
      addChatMessage('system', `Connection failed: ${err.message}`);
      throw err;
    }
  };

  const setupWebSocket = (url) => {
    try {
      console.log('WebSocket: Connecting to', url);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket: Connected');
        addChatMessage('system', '✓ Ready for conversation');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket: Message:', data);

          if (data.type === 'response' && data.text) {
            addChatMessage('assistant', data.text);
          } else if (data.type === 'error') {
            addChatMessage('system', `Error: ${data.message || 'Unknown error'}`);
          }
        } catch (e) {
          console.log('WebSocket: Raw:', event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket: Error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket: Closed');
      };

      return ws;
    } catch (err) {
      console.error('WebSocket: Setup error:', err);
    }
  };

  const sendLiveMessage = async () => {
    if (!message.trim() || !isConnected) return;

    const userMessage = message.trim();
    setMessage('');
    addChatMessage('user', userMessage);

    // Send via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text: userMessage
      }));
    } else if (roomRef.current) {
      // Fallback: data channel
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({
        type: 'message',
        content: userMessage
      }));
      await roomRef.current.localParticipant.publishData(data, { reliable: true });
    }
  };

  const startLiveAvatarSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      addChatMessage('system', 'Starting LiveAvatar session...');

      console.log('LiveAvatar: Getting session token...');
      const sessionResponse = await api.getLiveAvatarSession();
      console.log('LiveAvatar session response:', sessionResponse);

      if (!sessionResponse.sessionToken) {
        throw new Error('No session token received');
      }

      setSessionToken(sessionResponse.sessionToken);
      if (sessionResponse.sessionId) {
        setSessionId(sessionResponse.sessionId);
      }

      addChatMessage('system', 'Connecting to video stream...');

      const startResponse = await api.startLiveAvatarSession(sessionResponse.sessionToken);
      console.log('LiveAvatar start response:', startResponse);

      if (startResponse.livekitUrl && startResponse.livekitToken) {
        if (startResponse.sessionId) {
          setSessionId(startResponse.sessionId);
        }
        if (startResponse.maxDuration) {
          setMaxDuration(startResponse.maxDuration);
          const minutes = Math.floor(startResponse.maxDuration / 60);
          addChatMessage('system', `Session limit: ${minutes} minutes`);
        }

        await setupLiveKitRoom(
          startResponse.livekitUrl,
          startResponse.livekitToken,
          startResponse.wsUrl
        );
      } else {
        console.log('LiveAvatar: Missing connection details:', startResponse);
        throw new Error('Missing LiveKit connection details');
      }

      setIsLoading(false);
    } catch (err) {
      console.error('LiveAvatar session error:', err);
      setError(err.message || 'Failed to start session');
      addChatMessage('system', `Error: ${err.message || 'Connection failed'}`);
      setIsLoading(false);
    }
  };

  const stopLiveAvatarSession = async () => {
    try {
      setIsLoading(true);
      addChatMessage('system', 'Ending session...');

      await cleanupLiveKit();

      if (sessionToken) {
        const stopResponse = await api.stopLiveAvatarSession(sessionToken, sessionId);
        console.log('LiveAvatar stop response:', stopResponse);
      }

      setSessionToken(null);
      setSessionId(null);
      setIsConnected(false);
      setConnectionState('disconnected');
      setWsUrl(null);
      setIsLoading(false);

      // Close the modal
      onClose();
    } catch (err) {
      console.error('LiveAvatar stop error:', err);
      onClose();
    }
  };

  const toggleMute = () => {
    if (roomRef.current) {
      const audioTracks = roomRef.current.localParticipant.audioTrackPublications;
      audioTracks.forEach((publication) => {
        if (publication.track) {
          if (isMuted) {
            publication.track.unmute();
          } else {
            publication.track.mute();
          }
        }
      });
      setIsMuted(!isMuted);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isConnected) {
        sendLiveMessage();
      }
    }
  };

  const handleClose = async () => {
    if (sessionToken || roomRef.current) {
      try {
        await cleanupLiveKit();
        if (sessionToken) {
          await api.stopLiveAvatarSession(sessionToken, sessionId);
        }
      } catch (err) {
        console.error('Error on close:', err);
      }
    }
    onClose();
  };

  const retryConnection = () => {
    setError(null);
    setChatHistory([]);
    startLiveAvatarSession();
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-serif text-white">Live Conversation</h2>
            <p className="text-xs">
              {connectionState === 'connected' ? (
                <span className="text-green-400">● Connected</span>
              ) : connectionState === 'connecting' ? (
                <span className="text-yellow-400">● Connecting...</span>
              ) : isLoading ? (
                <span className="text-purple-400">● Starting session...</span>
              ) : error ? (
                <span className="text-red-400">● Connection failed</span>
              ) : (
                <span className="text-gray-400">● Ready</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-colors ${
                isMuted ? 'bg-red-600 text-white' : 'bg-slate-700 text-gray-400 hover:text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video section */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="relative flex-1 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
            {/* Loading / Error / Connecting states */}
            {(isLoading || error || !isConnected) && (
              <div className="text-center p-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                  {isLoading ? (
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  ) : error ? (
                    <AlertCircle className="w-12 h-12 text-white" />
                  ) : (
                    <Radio className="w-12 h-12 text-white" />
                  )}
                </div>

                {isLoading && (
                  <>
                    <h3 className="text-white text-xl mb-2">Connecting...</h3>
                    <p className="text-gray-400 text-sm">
                      Setting up your live avatar session
                    </p>
                  </>
                )}

                {error && (
                  <>
                    <h3 className="text-white text-xl mb-2">Connection Failed</h3>
                    <p className="text-red-400 text-sm mb-4">{error}</p>
                    <button
                      onClick={retryConnection}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Video stream when connected */}
            {isConnected && (
              <>
                <video
                  ref={avatarVideoRef}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                />
                <audio ref={avatarAudioRef} autoPlay />

                {connectionState !== 'connected' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* End session button */}
          {isConnected && (
            <div className="flex justify-center mt-4">
              <button
                onClick={stopLiveAvatarSession}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <VideoOff className="w-5 h-5" />
                End Session
              </button>
            </div>
          )}
        </div>

        {/* Chat section */}
        <div className="w-1/2 p-4 flex flex-col border-l border-purple-500/20">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatHistory.length === 0 && !isLoading && (
              <p className="text-gray-500 text-center py-8">
                {isConnected
                  ? 'Type a message to start chatting with your Echo!'
                  : 'Waiting for connection...'}
              </p>
            )}
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : msg.role === 'assistant'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800/50 text-gray-400 text-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1 px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              onClick={sendLiveMessage}
              disabled={!message.trim() || !isConnected}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
