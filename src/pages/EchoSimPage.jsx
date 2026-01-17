import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Gift,
  Heart,
  Sun,
  Moon,
  Star,
  User,
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Radio,
  Film,
  Wand2,
  Edit3,
  Volume2,
  VolumeX,
  ChevronRight,
  MessageCircle,
  Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageTransition, FadeIn } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import SimliAvatar from '../components/SimliAvatar';
import SimliChatConfig from '../components/SimliChatConfig';

// Event templates for Option 1 (Video Generation)
const eventTemplates = [
  {
    id: 'christmas',
    name: 'Christmas Message',
    icon: Gift,
    description: 'A warm holiday message for your loved ones',
    prompt: "Give a warm Christmas message to your family. Share what the holidays mean to you, recall cherished memories, and wish them joy and peace.",
  },
  {
    id: 'birthday',
    name: 'Birthday Wishes',
    icon: Calendar,
    description: 'Heartfelt birthday greetings',
    prompt: "Wish someone a heartfelt happy birthday. Share your hopes for their year ahead and remind them how special they are to you.",
  },
  {
    id: 'morning',
    name: 'Good Morning',
    icon: Sun,
    description: 'Start the day with encouragement',
    prompt: "Give an encouraging good morning message. Share your thoughts on starting the day with purpose and gratitude.",
  },
  {
    id: 'evening',
    name: 'Evening Reflection',
    icon: Moon,
    description: 'End the day with wisdom',
    prompt: "Share an evening reflection. Help them wind down the day with thoughts on what went well and finding peace.",
  },
  {
    id: 'encouragement',
    name: 'Support & Comfort',
    icon: Heart,
    description: 'Words for difficult times',
    prompt: "Offer words of comfort and encouragement for someone going through a difficult time. Remind them of their strength and that they're not alone.",
  },
  {
    id: 'celebration',
    name: 'Celebration',
    icon: Star,
    description: 'Celebrate achievements',
    prompt: "Celebrate someone's success and achievement. Express genuine pride and joy for what they've accomplished.",
  },
];

// Video Generation Modal (Option 1)
function VideoGenerationModal({ template, onClose, user, persona, customMessage }) {
  const [callState, setCallState] = useState('generating');
  const [generatedMessage, setGeneratedMessage] = useState(customMessage || '');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAvatarImage, setSelectedAvatarImage] = useState(null);
  const [showAvatarSelect, setShowAvatarSelect] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');

  const audioRef = useRef(null);
  const videoRef = useRef(null);

  // Get active avatar image
  useEffect(() => {
    if (persona?.avatarImages?.length > 0) {
      const active = persona.avatarImages.find(a => a.isActive) || persona.avatarImages[0];
      setSelectedAvatarImage(active);
    }
  }, [persona]);

  // Generate AI response when modal opens (only for templates, not custom messages)
  useEffect(() => {
    const generateResponse = async () => {
      if (customMessage) {
        // Custom message provided - use it directly
        setGeneratedMessage(customMessage);
        setCallState('ready');
        return;
      }

      if (!template) {
        setCallState('ready');
        return;
      }

      try {
        setCallState('generating');
        const response = await api.generateText(template.prompt, `Event: ${template.name}`);
        setGeneratedMessage(response.response);
        setCallState('ready');
      } catch (err) {
        console.error('Failed to generate response:', err);
        setGeneratedMessage(template.prompt);
        setCallState('ready');
      }
    };

    const timer = setTimeout(generateResponse, 500);
    return () => clearTimeout(timer);
  }, [template, customMessage]);

  // Speak message using ElevenLabs
  const speakMessage = async (text) => {
    if (!speechEnabled) return;
    setIsSpeaking(true);

    try {
      const audioBlob = await api.textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audioRef.current.onerror = () => {
          fallbackToSpeechSynthesis(text);
        };
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('ElevenLabs TTS failed:', err);
      fallbackToSpeechSynthesis(text);
    }
  };

  // Browser TTS fallback
  const fallbackToSpeechSynthesis = (text) => {
    if (!window.speechSynthesis) {
      setIsSpeaking(false);
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

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

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
  };

  // Refresh avatar ID
  const refreshAvatarId = async () => {
    try {
      setError(null);
      setVideoProgress('Refreshing avatar...');
      const result = await api.refreshPhotoAvatar();

      if (result.updated) {
        setVideoProgress('Avatar updated! Try generating video again.');
        setTimeout(() => setVideoProgress(''), 3000);
      } else if (result.success) {
        setVideoProgress('Avatar is ready.');
        setTimeout(() => setVideoProgress(''), 2000);
      } else {
        setError('Could not find a valid avatar. Please re-create your Photo Avatar on the Persona page.');
      }
    } catch (err) {
      setError('Failed to refresh avatar: ' + (err.message || 'Unknown error'));
    }
  };

  // Generate HeyGen video with Avatar IV (Photo + Voice Clone)
  const generateVideoAvatar = async () => {
    if (!generatedMessage) return;

    setVideoGenerating(true);
    setVideoProgress('Starting video generation...');
    setError(null);

    const videoTitle = template?.name || 'Custom Message';

    try {
      // Use Avatar IV API (photo + voice clone)
      const result = await api.generateAvatarIV(generatedMessage, videoTitle);
      console.log('Avatar IV generate result:', result);

      if (result.videoId) {
        // Save to video archive immediately
        try {
          await api.createVideoEntry(videoTitle, generatedMessage, result.videoId, 'heygen');
          console.log('Video saved to archive');
        } catch (archiveErr) {
          console.warn('Failed to save to archive:', archiveErr);
        }

        setVideoProgress('Video is being rendered...');

        let pollCount = 0;
        const maxPolls = 40; // ~2 minutes of polling, then inform user about queue

        const pollStatus = async () => {
          try {
            pollCount++;
            const status = await api.getAvatarIVStatus(result.videoId);
            console.log('Video status:', status);

            if (status.status === 'completed' && status.videoUrl) {
              // Update archive with completed status
              try {
                await api.updateVideoStatus(result.videoId, {
                  status: 'completed',
                  videoUrl: status.videoUrl
                });
              } catch (updateErr) {
                console.warn('Failed to update archive:', updateErr);
              }
              setVideoUrl(status.videoUrl);
              setVideoGenerating(false);
              setVideoProgress('');
            } else if (status.status === 'failed') {
              // Handle error object from HeyGen API
              const errorMsg = status.error
                ? (typeof status.error === 'object'
                    ? status.error.message || status.error.detail || JSON.stringify(status.error)
                    : status.error)
                : 'Unknown error';
              // Update archive with failed status
              try {
                await api.updateVideoStatus(result.videoId, {
                  status: 'failed',
                  error: errorMsg
                });
              } catch (updateErr) {
                console.warn('Failed to update archive:', updateErr);
              }
              setError('Video generation failed: ' + errorMsg);
              setVideoGenerating(false);
              setVideoProgress('');
            } else if (pollCount >= maxPolls) {
              // Video is still in queue - inform user but don't show as error
              // Keep the archive entry as pending for later checking
              setVideoGenerating(false);
              setVideoProgress('');
              setError(
                'Your video is queued with HeyGen and may take longer to process. ' +
                'This is normal during high-traffic periods. ' +
                'Check your Video Archive to track its progress.'
              );
            } else {
              // Update archive with processing status if changed
              if (status.status === 'processing' && pollCount === 1) {
                try {
                  await api.updateVideoStatus(result.videoId, { status: 'processing' });
                } catch (updateErr) {
                  console.warn('Failed to update archive:', updateErr);
                }
              }
              // Show different messages based on status
              const isPending = status.status === 'pending';
              const progressMessages = isPending
                ? [
                    'Video queued with HeyGen...',
                    'Waiting in render queue...',
                    'Still waiting in queue...',
                    'Queue processing may take a few minutes...',
                    'HeyGen is processing your request...'
                  ]
                : [
                    'Processing your avatar...',
                    'Syncing lip movements...',
                    'Adding voice synthesis...',
                    'Finalizing video...',
                    'Almost ready...'
                  ];
              setVideoProgress(progressMessages[Math.min(Math.floor(pollCount / 8), progressMessages.length - 1)]);
              setTimeout(pollStatus, 3000);
            }
          } catch (pollErr) {
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
      console.error('Avatar IV error:', err);
      const errorMsg = err.message || 'Failed to generate video avatar';
      if (errorMsg.includes('wrong') || errorMsg.includes('contact') || errorMsg.includes('500')) {
        setError(errorMsg + ' - Try clicking "Refresh Avatar ID" below.');
      } else {
        setError(errorMsg);
      }
      setVideoGenerating(false);
      setVideoProgress('');
    }
  };

  // Save edited message
  const saveEditedMessage = () => {
    if (editedMessage.trim()) {
      setGeneratedMessage(editedMessage.trim());
    }
    setIsEditing(false);
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
        className="relative w-full max-w-4xl min-h-[70vh] max-h-[95vh] bg-navy-dark rounded-2xl overflow-hidden flex flex-col"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-light via-navy-dark to-black" />

        {/* Header */}
        <div className="relative z-20 flex items-center justify-between p-4 border-b border-gold/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gold/10">
              <Film className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-serif text-cream">
                {template ? template.name : 'Custom Video'}
              </h2>
              <p className="text-cream/50 text-xs">
                {vibeStyles[selectedAvatarImage?.echoVibe || persona?.echoVibe || 'compassionate']} Mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-navy/80 text-cream/70 hover:text-cream hover:bg-red-500/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Video display */}
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
                />
              </div>

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
                  Replay
                </motion.button>
                <motion.button
                  onClick={() => setVideoUrl(null)}
                  className="px-4 py-2 rounded-lg bg-navy/60 text-cream/70 text-sm flex items-center gap-2 hover:bg-navy/80"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Editor
                </motion.button>
              </div>

              {generatedMessage && (
                <div className="mt-6 bg-navy/40 rounded-xl p-4 border border-gold/20">
                  <p className="text-cream/80 text-sm leading-relaxed">{generatedMessage}</p>
                </div>
              )}
            </motion.div>
          ) : (
            /* Editor View */
            <div className="w-full max-w-2xl mx-auto">
              {/* Avatar preview */}
              <div className="flex justify-center mb-6">
                <motion.div
                  className={`w-24 h-24 rounded-full overflow-hidden border-4 ${
                    isSpeaking ? 'border-gold shadow-lg shadow-gold/30' : 'border-gold/30'
                  }`}
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
                      <User className="w-12 h-12 text-navy" />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Avatar selector */}
              <AnimatePresence>
                {showAvatarSelect && persona?.avatarImages?.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-center gap-2 mb-4"
                  >
                    {persona.avatarImages.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => {
                          setSelectedAvatarImage(avatar);
                          setShowAvatarSelect(false);
                        }}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
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

              {/* Message Editor */}
              <AnimatePresence mode="wait">
                {callState === 'generating' ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-8"
                  >
                    <Loader2 className="w-10 h-10 text-gold animate-spin" />
                    <p className="text-cream/60">Generating personalized message...</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Message box */}
                    <div className="bg-navy/50 rounded-2xl p-5 border-2 border-gold/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-cream/70 text-sm font-medium">Message Content</h4>
                        <button
                          onClick={() => {
                            setIsEditing(!isEditing);
                            setEditedMessage(generatedMessage);
                          }}
                          className="text-gold/70 hover:text-gold text-xs flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>

                      {isEditing ? (
                        <div>
                          <textarea
                            value={editedMessage}
                            onChange={(e) => setEditedMessage(e.target.value)}
                            className="w-full h-40 p-3 rounded-xl bg-navy/80 border border-gold/20 text-cream text-sm focus:outline-none focus:border-gold/50 resize-none"
                            placeholder="Enter your message..."
                          />
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-3 py-1.5 rounded-lg text-cream/60 text-sm hover:text-cream"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEditedMessage}
                              className="px-3 py-1.5 rounded-lg bg-gold text-navy text-sm font-medium"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-cream text-base leading-relaxed whitespace-pre-wrap">
                          {generatedMessage || 'No message generated yet.'}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex flex-wrap gap-3 justify-center">
                      <motion.button
                        onClick={() => speakMessage(generatedMessage)}
                        disabled={isSpeaking || !generatedMessage}
                        className="px-4 py-2.5 rounded-xl bg-navy/60 text-cream text-sm font-medium flex items-center gap-2 hover:bg-navy/80 disabled:opacity-50"
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
                            Preview Audio
                          </>
                        )}
                      </motion.button>

                      {isSpeaking && (
                        <motion.button
                          onClick={stopSpeech}
                          className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <VolumeX className="w-4 h-4" />
                          Stop
                        </motion.button>
                      )}

                      <motion.button
                        onClick={generateVideoAvatar}
                        disabled={videoGenerating || !generatedMessage || !persona?.heygenAvatarId}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                          persona?.heygenAvatarId && generatedMessage
                            ? 'bg-gradient-to-r from-gold to-gold-light text-navy hover:opacity-90'
                            : 'bg-navy/40 text-cream/40 cursor-not-allowed'
                        }`}
                        whileHover={persona?.heygenAvatarId && generatedMessage ? { scale: 1.02 } : {}}
                        whileTap={persona?.heygenAvatarId && generatedMessage ? { scale: 0.98 } : {}}
                        title={!persona?.heygenAvatarId ? 'Create a Photo Avatar first on My Persona page' : ''}
                      >
                        {videoGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {videoProgress || 'Generating...'}
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            Generate Talking Video
                          </>
                        )}
                      </motion.button>
                    </div>

                    {!persona?.heygenAvatarId && (
                      <p className="mt-4 text-cream/40 text-xs text-center">
                        To generate talking videos, create a Photo Avatar on the My Persona page first.
                      </p>
                    )}

                    {/* Error display */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                        {(error.includes('Refresh') || error.includes('avatar')) && persona?.heygenAvatarId && (
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
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function EchoSimPage({ onNavigate }) {
  const { user, persona } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [hasVoiceClone, setHasVoiceClone] = useState(false);
  const [hasPhotoAvatar, setHasPhotoAvatar] = useState(false);
  const [showChatConfig, setShowChatConfig] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [chatConfig, setChatConfig] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Check status on mount
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

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setCustomMessage('');
    setShowVideoModal(true);
  };

  // Handle custom message submission
  const handleCustomMessage = () => {
    if (!customMessage.trim()) return;
    setSelectedTemplate(null);
    setShowVideoModal(true);
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-cream mb-3">
              Echo Simulator
            </h1>
            <p className="text-cream/60 max-w-2xl mx-auto text-sm sm:text-base">
              Interact with your digital echo - create videos or chat in real-time
            </p>
          </div>
        </FadeIn>

        {/* Status Overview */}
        <FadeIn delay={0.1}>
          <div className="glass-card p-4 sm:p-5 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  {persona?.avatarImages?.find(a => a.isActive)?.imageData ? (
                    <img
                      src={persona.avatarImages.find(a => a.isActive).imageData}
                      alt="Your Echo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                      <User className="w-6 h-6 text-navy" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-medium text-cream">{user?.firstName}'s Echo</h3>
                  <p className="text-cream/50 text-xs">
                    {persona?.lifeStories?.length || 0} stories • {persona?.echoVibe || 'Compassionate'} vibe
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <span className={`px-2.5 py-1 rounded-lg text-xs ${
                  hasPhotoAvatar ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {hasPhotoAvatar ? '✓' : '✗'} Photo Avatar
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs ${
                  hasVoiceClone ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {hasVoiceClone ? '✓' : '○'} Voice Clone
                </span>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Two Main Sections - Always Visible */}
        <div className="space-y-6">
          {/* Section 1: Video Generation */}
          <FadeIn delay={0.15}>
            <div className="glass-card p-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-cream/10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <Film className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-cream">Create Talking Video</h3>
                  <p className="text-cream/50 text-sm">Generate videos with lip-sync</p>
                </div>
                {!hasPhotoAvatar && (
                  <span className="text-red-400 text-xs">⚠ Photo Avatar needed</span>
                )}
              </div>

              {/* Custom Message */}
              <div className="mb-6">
                <label className="block text-cream/70 text-sm mb-2">Your Message</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomMessage()}
                    placeholder="Type what your avatar should say..."
                    disabled={!hasPhotoAvatar}
                    className="flex-1 px-4 py-3 rounded-lg bg-navy/60 border border-cream/10 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50 disabled:opacity-50"
                  />
                  <motion.button
                    onClick={handleCustomMessage}
                    disabled={!customMessage.trim() || !hasPhotoAvatar}
                    className="px-5 py-3 rounded-lg bg-gold text-navy font-medium disabled:opacity-50 flex items-center gap-2"
                    whileHover={customMessage.trim() && hasPhotoAvatar ? { scale: 1.02 } : {}}
                    whileTap={customMessage.trim() && hasPhotoAvatar ? { scale: 0.98 } : {}}
                  >
                    <Wand2 className="w-4 h-4" />
                    Create
                  </motion.button>
                </div>
              </div>

              {/* Event Templates */}
              <div>
                <label className="block text-cream/70 text-sm mb-3">Or Choose a Template</label>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {eventTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <motion.button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        disabled={!hasPhotoAvatar}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          hasPhotoAvatar
                            ? 'border-cream/20 bg-navy/40 hover:border-gold/40 hover:bg-gold/5'
                            : 'border-cream/10 bg-navy/20 opacity-50 cursor-not-allowed'
                        }`}
                        whileHover={hasPhotoAvatar ? { y: -2 } : {}}
                      >
                        <Icon className="w-5 h-5 text-gold mb-2" />
                        <h4 className="text-cream font-medium text-sm mb-1">{template.name}</h4>
                        <p className="text-cream/50 text-xs">{template.description}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Section 2: Live Conversation */}
          <FadeIn delay={0.2}>
            <div className="glass-card p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-cream/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-cream">Live Conversation</h3>
                    <p className="text-cream/50 text-sm">Real-time chat with voice & video</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowChatConfig(true)}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium flex items-center gap-2 hover:from-purple-500 hover:to-pink-500"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="w-4 h-4" />
                  Start Chat
                </motion.button>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-navy/40">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                    <span className="text-purple-400 font-medium text-sm">1</span>
                  </div>
                  <p className="text-cream text-xs font-medium mb-1">Connect</p>
                  <p className="text-cream/50 text-xs">Instant WebRTC session</p>
                </div>
                <div className="p-3 rounded-lg bg-navy/40">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                    <span className="text-purple-400 font-medium text-sm">2</span>
                  </div>
                  <p className="text-cream text-xs font-medium mb-1">Chat</p>
                  <p className="text-cream/50 text-xs">Type your messages</p>
                </div>
                <div className="p-3 rounded-lg bg-navy/40">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                    <span className="text-purple-400 font-medium text-sm">3</span>
                  </div>
                  <p className="text-cream text-xs font-medium mb-1">Watch</p>
                  <p className="text-cream/50 text-xs">Avatar responds live</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Video Archive Card - moves down when options expanded */}
        <FadeIn delay={0.25}>
          <Link to="/video-archive" className="block mb-10">
            <motion.div
              className="glass-card p-6 border-2 border-transparent hover:border-blue-500/30 transition-all cursor-pointer"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Film className="w-7 h-7 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-serif text-cream">Video Archive</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                      Your Videos
                    </span>
                  </div>
                  <p className="text-cream/60 text-sm">
                    View all your generated videos, check status of pending videos, and download completed ones.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-cream/50" />
              </div>
            </motion.div>
          </Link>
        </FadeIn>

      </div>

      {/* Video Generation Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <VideoGenerationModal
            template={selectedTemplate}
            customMessage={customMessage}
            onClose={() => {
              setShowVideoModal(false);
              setSelectedTemplate(null);
            }}
            user={user}
            persona={persona}
          />
        )}
      </AnimatePresence>

      {/* Live Chat Config Modal */}
      <AnimatePresence>
        {showChatConfig && (
          <SimliChatConfig
            onStart={(config) => {
              setChatConfig(config);
              setShowChatConfig(false);
              setShowLiveChat(true);
            }}
            onClose={() => setShowChatConfig(false)}
            persona={persona}
            onNavigate={onNavigate}
          />
        )}
      </AnimatePresence>

      {/* Live Chat Modal - Simli Avatar */}
      {showLiveChat && chatConfig && (
        <SimliAvatar
          onClose={() => {
            setShowLiveChat(false);
            setChatConfig(null);
          }}
          persona={persona}
          user={user}
          config={chatConfig}
        />
      )}
    </PageTransition>
  );
}
