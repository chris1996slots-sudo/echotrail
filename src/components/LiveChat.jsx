import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Video, VideoOff, Loader2, X, AlertCircle, Volume2, VolumeX, Mic, MicOff, Sparkles, Image, Radio, RefreshCw } from 'lucide-react';
import { Room, RoomEvent, Track, ConnectionState } from 'livekit-client';
import api from '../services/api';

// Mode types
const MODES = {
  AVATAR_IV: 'avatar_iv', // Photo -> Video with voice clone (user's own face)
  LIVE_AVATAR: 'live_avatar', // Real-time streaming (requires video training)
};

export default function LiveChat({ onClose, userName }) {
  const [mode, setMode] = useState(null); // null = selection screen
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);

  // Avatar IV specific state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);

  // LiveAvatar specific state
  const [liveAvatarStatus, setLiveAvatarStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [wsUrl, setWsUrl] = useState(null);

  // LiveKit refs
  const roomRef = useRef(null);
  const avatarVideoRef = useRef(null);
  const avatarAudioRef = useRef(null);
  const wsRef = useRef(null);

  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Initialize - check what's available
  useEffect(() => {
    checkStatus();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      // Cleanup LiveKit room on unmount
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

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check photo avatar status and LiveAvatar status in parallel
      const [photoStatus, liveStatus] = await Promise.all([
        api.getPhotoAvatarStatus().catch(() => ({ hasPhotoAvatar: false })),
        api.getLiveAvatarStatus().catch(() => ({ apiConfigured: false })),
      ]);

      setStatusInfo({
        hasPhoto: photoStatus.hasPhotoAvatar,
        hasVoiceClone: photoStatus.hasVoiceClone || liveStatus.hasVoiceClone,
        liveAvatarConfigured: liveStatus.apiConfigured,
        hasCustomLiveAvatar: liveStatus.hasCustomAvatar,
        customAvatarStatus: liveStatus.customAvatarStatus,
      });

      setLiveAvatarStatus(liveStatus);
      setIsLoading(false);
    } catch (err) {
      console.error('Status check error:', err);
      setError('Failed to load configuration');
      setIsLoading(false);
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

  // =====================
  // Avatar IV Mode Functions
  // =====================

  const sendAvatarIVMessage = async () => {
    if (!message.trim() || isGenerating) return;

    const userMessage = message.trim();
    setMessage('');
    addChatMessage('user', userMessage);

    try {
      setIsGenerating(true);
      addChatMessage('system', 'Generating personalized AI response...');

      // First, get AI response
      const aiResponse = await api.generateText(
        userMessage,
        'Personal conversation - respond as yourself would'
      );

      const responseText = aiResponse.response;
      addChatMessage('assistant', responseText);
      addChatMessage('system', 'Creating your avatar video with lip-sync...');

      // Generate Avatar IV video with the response
      const videoResponse = await api.generateAvatarIV(responseText);

      if (videoResponse.videoId) {
        setCurrentVideoId(videoResponse.videoId);
        setVideoStatus('processing');
        addChatMessage('system', videoResponse.usedVoiceClone
          ? 'Video generating with your cloned voice...'
          : 'Video generating...');

        // Start polling for video status
        startVideoPolling(videoResponse.videoId);
      } else {
        throw new Error('No video ID received');
      }

    } catch (err) {
      console.error('Avatar IV error:', err);
      addChatMessage('system', `Error: ${err.message || 'Failed to generate video'}`);
      setIsGenerating(false);
    }
  };

  const startVideoPolling = (videoId) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await api.getAvatarIVStatus(videoId);
        console.log('Video status:', status);

        if (status.status === 'completed' && status.videoUrl) {
          clearInterval(pollIntervalRef.current);
          setCurrentVideoUrl(status.videoUrl);
          setVideoStatus('ready');
          setIsGenerating(false);
          addChatMessage('system', 'Video ready! Playing now...');

          // Auto-play the video
          if (videoRef.current) {
            videoRef.current.src = status.videoUrl;
            videoRef.current.play().catch(console.error);
          }
        } else if (status.status === 'failed' || status.error) {
          clearInterval(pollIntervalRef.current);
          setVideoStatus('failed');
          setIsGenerating(false);
          addChatMessage('system', `Video generation failed: ${status.error || 'Unknown error'}`);
        }
        // If still processing, continue polling
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 3000); // Poll every 3 seconds
  };

  // =====================
  // LiveAvatar Mode Functions with LiveKit
  // =====================

  const setupLiveKitRoom = async (livekitUrl, livekitToken, websocketUrl) => {
    try {
      console.log('LiveKit: Setting up room connection...');
      addChatMessage('system', 'Connecting to LiveKit room...');

      // Create a new Room instance
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 640, height: 480 },
        },
      });

      roomRef.current = room;

      // Set up event handlers
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('LiveKit: Connection state changed:', state);
        setConnectionState(state);

        if (state === ConnectionState.Connected) {
          addChatMessage('system', '✓ Connected to LiveKit room!');
        } else if (state === ConnectionState.Disconnected) {
          addChatMessage('system', 'Disconnected from LiveKit room');
        } else if (state === ConnectionState.Reconnecting) {
          addChatMessage('system', 'Reconnecting to LiveKit...');
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('LiveKit: Track subscribed:', track.kind, 'from', participant.identity);

        if (track.kind === Track.Kind.Video) {
          // Attach video track to video element
          if (avatarVideoRef.current) {
            track.attach(avatarVideoRef.current);
            addChatMessage('system', '✓ Avatar video stream connected!');
          }
        } else if (track.kind === Track.Kind.Audio) {
          // Attach audio track to audio element
          if (avatarAudioRef.current) {
            track.attach(avatarAudioRef.current);
            addChatMessage('system', '✓ Avatar audio stream connected!');
          }
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('LiveKit: Track unsubscribed:', track.kind);
        track.detach();
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('LiveKit: Participant connected:', participant.identity);
        addChatMessage('system', `Participant joined: ${participant.identity}`);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('LiveKit: Participant disconnected:', participant.identity);
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log('LiveKit: Disconnected, reason:', reason);
        addChatMessage('system', `Disconnected: ${reason || 'Session ended'}`);
      });

      room.on(RoomEvent.DataReceived, (payload, participant, kind) => {
        // Handle data channel messages (for chat or commands)
        try {
          const decoder = new TextDecoder();
          const message = JSON.parse(decoder.decode(payload));
          console.log('LiveKit: Data received:', message);

          if (message.type === 'chat' && message.content) {
            addChatMessage('assistant', message.content);
          }
        } catch (e) {
          console.log('LiveKit: Raw data received:', payload);
        }
      });

      // Connect to the room
      console.log('LiveKit: Connecting to', livekitUrl);
      await room.connect(livekitUrl, livekitToken);

      console.log('LiveKit: Connected successfully!');
      setIsConnected(true);

      // Store WebSocket URL for CUSTOM mode communication
      if (websocketUrl) {
        setWsUrl(websocketUrl);
        setupWebSocket(websocketUrl);
      }

      return room;
    } catch (err) {
      console.error('LiveKit: Connection error:', err);
      addChatMessage('system', `LiveKit connection failed: ${err.message}`);
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
        addChatMessage('system', '✓ WebSocket connected for commands');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket: Message received:', data);

          // Handle different message types from LiveAvatar
          if (data.type === 'response' && data.text) {
            addChatMessage('assistant', data.text);
          } else if (data.type === 'audio_response') {
            // Audio is handled via LiveKit
          } else if (data.type === 'error') {
            addChatMessage('system', `Error: ${data.message || 'Unknown error'}`);
          }
        } catch (e) {
          console.log('WebSocket: Raw message:', event.data);
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

    // Send message via WebSocket if available
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text: userMessage
      }));
    } else {
      // Fallback: Use data channel if WebSocket not available
      if (roomRef.current) {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({
          type: 'message',
          content: userMessage
        }));
        await roomRef.current.localParticipant.publishData(data, { reliable: true });
      }
    }
  };

  const startLiveAvatarSession = async () => {
    try {
      setIsLoading(true);
      addChatMessage('system', 'Starting LiveAvatar session...');

      console.log('LiveAvatar: Getting session token...');
      const sessionResponse = await api.getLiveAvatarSession();
      console.log('LiveAvatar session response:', sessionResponse);

      if (!sessionResponse.sessionToken) {
        throw new Error('No session token received from server');
      }

      // Save the token for stopping later
      setSessionToken(sessionResponse.sessionToken);
      if (sessionResponse.sessionId) {
        setSessionId(sessionResponse.sessionId);
      }

      addChatMessage('system', 'Session token received, starting LiveKit connection...');
      console.log('LiveAvatar: Starting session with token...');

      const startResponse = await api.startLiveAvatarSession(sessionResponse.sessionToken);
      console.log('LiveAvatar start response:', startResponse);

      if (startResponse.livekitUrl && startResponse.livekitToken) {
        // We have LiveKit connection details - connect!
        if (startResponse.sessionId) {
          setSessionId(startResponse.sessionId);
        }

        addChatMessage('system', `Session started: ${startResponse.sessionId || 'active'}`);
        if (startResponse.maxDuration) {
          addChatMessage('system', `Max duration: ${Math.floor(startResponse.maxDuration / 60)} minutes`);
        }

        // Connect to LiveKit room
        await setupLiveKitRoom(
          startResponse.livekitUrl,
          startResponse.livekitToken,
          startResponse.wsUrl
        );
      } else {
        // Show debug info
        console.log('LiveAvatar: Missing LiveKit details, full response:', startResponse);
        if (startResponse.debug) {
          addChatMessage('system', `Session started but missing connection details`);
          console.error('Debug:', startResponse.debug);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('LiveAvatar session error:', err);
      const errorMessage = err.message || 'Failed to start session';
      addChatMessage('system', `Error: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const stopLiveAvatarSession = async () => {
    try {
      setIsLoading(true);
      addChatMessage('system', 'Stopping LiveAvatar session...');

      // Cleanup LiveKit first
      await cleanupLiveKit();

      // Then notify the server
      if (sessionToken) {
        const stopResponse = await api.stopLiveAvatarSession(sessionToken, sessionId);
        console.log('LiveAvatar stop response:', stopResponse);

        if (stopResponse.stopped) {
          addChatMessage('system', 'Session stopped successfully.');
        } else {
          addChatMessage('system', stopResponse.message || 'Session ended.');
        }
      }

      // Reset state
      setSessionToken(null);
      setSessionId(null);
      setIsConnected(false);
      setConnectionState('disconnected');
      setWsUrl(null);
      setIsLoading(false);
    } catch (err) {
      console.error('LiveAvatar stop error:', err);
      addChatMessage('system', `Error stopping session: ${err.message}`);
      // Reset anyway
      setSessionToken(null);
      setSessionId(null);
      setIsConnected(false);
      setConnectionState('disconnected');
      setIsLoading(false);
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
      if (mode === MODES.AVATAR_IV) {
        sendAvatarIVMessage();
      } else if (mode === MODES.LIVE_AVATAR && isConnected) {
        sendLiveMessage();
      }
    }
  };

  const handleClose = async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    // Stop LiveAvatar session if active
    if (sessionToken || roomRef.current) {
      try {
        await cleanupLiveKit();
        if (sessionToken) {
          await api.stopLiveAvatarSession(sessionToken, sessionId);
        }
        console.log('LiveAvatar session stopped on close');
      } catch (err) {
        console.error('Error stopping session on close:', err);
      }
    }
    onClose();
  };

  // Loading state
  if (isLoading && !mode) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Loading Live Chat</h3>
          <p className="text-gray-400">Checking your avatar and voice setup...</p>
        </div>
      </div>
    );
  }

  // Mode selection screen
  if (!mode) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-white">Choose Your Experience</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Avatar IV Option */}
            <button
              onClick={() => setMode(MODES.AVATAR_IV)}
              disabled={!statusInfo?.hasPhoto}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                statusInfo?.hasPhoto
                  ? 'border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500'
                  : 'border-slate-700 bg-slate-700/50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Image className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Your Photo Avatar</h3>
                  <span className="text-xs text-purple-400">Recommended</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Create stunning lip-synced videos using YOUR photo and YOUR cloned voice.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  statusInfo?.hasPhoto ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {statusInfo?.hasPhoto ? '✓ Photo Ready' : '✗ Need Photo'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  statusInfo?.hasVoiceClone ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {statusInfo?.hasVoiceClone ? '✓ Voice Clone' : '○ Voice Clone (optional)'}
                </span>
              </div>
            </button>

            {/* LiveAvatar Option */}
            <button
              onClick={() => setMode(MODES.LIVE_AVATAR)}
              disabled={!statusInfo?.liveAvatarConfigured}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                statusInfo?.liveAvatarConfigured
                  ? 'border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20 hover:border-pink-500'
                  : 'border-slate-700 bg-slate-700/50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">LiveAvatar Streaming</h3>
                  <span className="text-xs text-pink-400">Real-Time</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Real-time video conversation with instant responses.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  statusInfo?.liveAvatarConfigured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {statusInfo?.liveAvatarConfigured ? '✓ API Ready' : '✗ Not Configured'}
                </span>
              </div>
            </button>
          </div>

          <div className="mt-6 p-4 bg-slate-700/50 rounded-xl">
            <h4 className="text-white font-medium mb-2">What's the difference?</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li><strong className="text-purple-400">Photo Avatar:</strong> Uses your uploaded photo. Video takes ~1-2 min to generate, but shows YOUR face.</li>
              <li><strong className="text-pink-400">LiveAvatar:</strong> Real-time streaming with instant responses.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Avatar IV Mode UI
  if (mode === MODES.AVATAR_IV) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode(null)}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Image className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Your Photo Avatar</h2>
              <p className="text-xs text-gray-400">AI-powered lip-sync video generation</p>
            </div>
            {statusInfo?.hasVoiceClone && (
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
            <div className="relative flex-1 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
              {!currentVideoUrl && !isGenerating && (
                <div className="text-center p-6">
                  <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-white text-lg mb-2">Ready to Chat</h3>
                  <p className="text-gray-400 text-sm">
                    Type a message and your avatar will respond with a lip-synced video!
                  </p>
                </div>
              )}

              {isGenerating && !currentVideoUrl && (
                <div className="text-center p-6">
                  <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-white text-lg mb-2">Creating Your Video</h3>
                  <p className="text-gray-400 text-sm">
                    {videoStatus === 'processing'
                      ? 'HeyGen is generating your lip-synced video...'
                      : 'Getting AI response...'}
                  </p>
                  <p className="text-purple-400 text-xs mt-2">This usually takes 1-2 minutes</p>
                </div>
              )}

              {currentVideoUrl && (
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  src={currentVideoUrl}
                />
              )}
            </div>
          </div>

          {/* Chat section */}
          <div className="w-1/2 p-4 flex flex-col border-l border-slate-700">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatHistory.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  Type a message to start the conversation.
                </p>
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

            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isGenerating ? "Generating video..." : "Type your message..."}
                disabled={isGenerating}
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                onClick={sendAvatarIVMessage}
                disabled={!message.trim() || isGenerating}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LiveAvatar Mode UI with actual video
  if (mode === MODES.LIVE_AVATAR) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode(null)}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">LiveAvatar Streaming</h2>
              <p className="text-xs text-gray-400">
                {connectionState === 'connected' ? (
                  <span className="text-green-400">● Connected</span>
                ) : connectionState === 'connecting' ? (
                  <span className="text-yellow-400">● Connecting...</span>
                ) : (
                  <span className="text-gray-400">● Disconnected</span>
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
              {!isConnected ? (
                <div className="text-center p-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mx-auto mb-6">
                    <Radio className="w-12 h-12 text-white" />
                  </div>

                  {!sessionToken ? (
                    <>
                      <h3 className="text-white text-xl mb-4">Start Live Session</h3>
                      <p className="text-gray-400 text-sm mb-6">
                        Connect to start a real-time conversation with your avatar.
                      </p>
                      <button
                        onClick={startLiveAvatarSession}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white rounded-xl font-medium transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Video className="w-5 h-5" />
                        )}
                        Start Session
                      </button>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
                      <h3 className="text-white text-lg mb-2">Connecting...</h3>
                      <button
                        onClick={stopLiveAvatarSession}
                        className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Avatar video element */}
                  <video
                    ref={avatarVideoRef}
                    className="w-full h-full object-contain"
                    autoPlay
                    playsInline
                  />
                  {/* Hidden audio element */}
                  <audio ref={avatarAudioRef} autoPlay />

                  {/* Connection status overlay */}
                  {connectionState !== 'connected' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Controls */}
            {isConnected && (
              <div className="flex justify-center gap-4 mt-4">
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
          <div className="w-1/2 p-4 flex flex-col border-l border-slate-700">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatHistory.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  {isConnected
                    ? 'Start typing to chat with your avatar!'
                    : 'Connect to start the conversation.'}
                </p>
              )}
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-pink-600 text-white'
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

            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "Type your message..." : "Connect to start chatting"}
                disabled={!isConnected}
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
              />
              <button
                onClick={sendLiveMessage}
                disabled={!message.trim() || !isConnected}
                className="px-4 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
