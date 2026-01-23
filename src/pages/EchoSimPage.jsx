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
  Users,
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
  Send,
  ArrowLeft,
  Mic,
  Check
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
function VideoGenerationModal({ template, onClose, user, persona, customMessage, useVoiceClone = true, selectedFamilyMember = null }) {
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

  // Get active avatar image (or use family member's image)
  useEffect(() => {
    if (selectedFamilyMember?.imageData) {
      // Use family member's image
      setSelectedAvatarImage({ imageData: selectedFamilyMember.imageData, name: selectedFamilyMember.name });
    } else if (persona?.avatarImages?.length > 0) {
      const active = persona.avatarImages.find(a => a.isActive) || persona.avatarImages[0];
      setSelectedAvatarImage(active);
    }
  }, [persona, selectedFamilyMember]);

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

  // Generate HeyGen video with Avatar IV (Photo + Voice Clone)
  const generateVideoAvatar = async () => {
    if (!generatedMessage) return;

    setVideoGenerating(true);
    setVideoProgress('Starting video generation...');
    setError(null);

    const videoTitle = selectedFamilyMember
      ? `${selectedFamilyMember.name}: ${template?.name || 'Message'}`
      : (template?.name || 'Custom Message');

    try {
      // Use Avatar IV API (photo + voice clone)
      // If family member is selected, pass their photo and name
      const options = {
        useVoiceClone: useVoiceClone, // User can choose to use their voice clone for any avatar
        photoData: selectedFamilyMember?.imageData || null,
        familyMemberName: selectedFamilyMember?.name || null,
      };
      const result = await api.generateAvatarIV(generatedMessage, videoTitle, options);
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
                            maxLength={300}
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <span className={`text-xs ${editedMessage.length > 250 ? 'text-orange-400' : 'text-cream/40'}`}>
                              {editedMessage.length}/300 chars (~{Math.ceil(editedMessage.split(/\s+/).filter(w => w).length * 0.5)}s video)
                            </span>
                            <div className="flex gap-2">
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
                        </div>
                      ) : (
                        <div>
                          <p className="text-cream text-base leading-relaxed whitespace-pre-wrap">
                            {generatedMessage || 'No message generated yet.'}
                          </p>
                          {generatedMessage && (
                            <p className="text-cream/40 text-xs mt-2">
                              {generatedMessage.length} chars • ~{Math.ceil(generatedMessage.split(/\s+/).filter(w => w).length * 0.5)}s video
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Video length info */}
                    <div className="mt-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Videos are limited to 30 seconds. Keep messages short (2-3 sentences, ~50 words).</span>
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
                        disabled={videoGenerating || !generatedMessage || !selectedAvatarImage}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                          selectedAvatarImage && generatedMessage
                            ? 'bg-gradient-to-r from-gold to-gold-light text-navy hover:opacity-90'
                            : 'bg-navy/40 text-cream/40 cursor-not-allowed'
                        }`}
                        whileHover={selectedAvatarImage && generatedMessage ? { scale: 1.02 } : {}}
                        whileTap={selectedAvatarImage && generatedMessage ? { scale: 0.98 } : {}}
                        title={!selectedAvatarImage ? 'Upload a photo first on My Persona page' : ''}
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

                    {!selectedAvatarImage && (
                      <p className="mt-4 text-cream/40 text-xs text-center">
                        To generate talking videos, upload a photo on the My Persona page first.
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
  const [showTextChat, setShowTextChat] = useState(false);
  const [textChatMessages, setTextChatMessages] = useState([]);
  const [textChatInput, setTextChatInput] = useState('');
  const [isLoadingTextChat, setIsLoadingTextChat] = useState(false);
  const [expandedOption, setExpandedOption] = useState(null); // 'chat', 'video', or 'live'

  // Video generation options
  const [useVoiceClone, setUseVoiceClone] = useState(true); // Use voice clone by default if available
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
  const [videoSource, setVideoSource] = useState('self'); // 'self' or 'family'

  // Refs for auto-scrolling
  const expandedSectionRef = useRef(null);

  // Check status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [voiceStatus, photoStatus] = await Promise.all([
          api.getVoiceCloneStatus(),
          api.getPhotoAvatarStatus()
        ]);
        setHasVoiceClone(voiceStatus.hasClonedVoice);
        // Photo avatar is available if HeyGen avatar exists OR if any avatar image is uploaded
        // (Avatar IV API uploads photos directly without needing a permanent HeyGen avatar)
        setHasPhotoAvatar(photoStatus.hasPhotoAvatar || (persona?.avatarImages?.length > 0));
      } catch (err) {
        console.error('Failed to check status:', err);
        // Fallback: check if persona has avatar images
        setHasPhotoAvatar(persona?.avatarImages?.length > 0);
      }
    };
    checkStatus();
  }, [persona]);

  // Load family members for video generation
  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        const members = await api.getFamilyMembers();
        // Only include family members that have a photo
        const membersWithPhoto = members.filter(m => m.imageData);
        setFamilyMembers(membersWithPhoto);
      } catch (err) {
        console.error('Failed to load family members:', err);
      }
    };
    loadFamilyMembers();
  }, []);

  // Auto-scroll to expanded section when option is selected
  useEffect(() => {
    if (expandedOption && expandedSectionRef.current) {
      // Small delay to allow animation to start
      setTimeout(() => {
        expandedSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [expandedOption]);

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

  // Handle text chat send
  const handleSendTextMessage = async () => {
    if (!textChatInput.trim() || isLoadingTextChat) return;

    const userMessage = textChatInput.trim();
    setTextChatInput('');

    // Add user message to chat
    setTextChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoadingTextChat(true);

    try {
      // Use wisdom chat API
      const response = await api.sendWisdomMessage(userMessage);
      setTextChatMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setTextChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoadingTextChat(false);
    }
  };

  // Load text chat history when opening
  const handleOpenTextChat = async () => {
    setShowTextChat(true);
    try {
      const history = await api.getWisdomChats();
      if (history?.messages) {
        setTextChatMessages(history.messages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-cream mb-3">
              Live Avatar
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
                {hasPhotoAvatar ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs bg-green-500/20 text-green-400">
                    ✓ Photo Ready
                  </span>
                ) : (
                  <motion.button
                    onClick={() => onNavigate('persona', 'avatar')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✗ Photo · Click to upload
                    <ChevronRight className="w-3 h-3" />
                  </motion.button>
                )}
                {hasVoiceClone ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs bg-green-500/20 text-green-400">
                    ✓ Voice Clone
                  </span>
                ) : (
                  <motion.button
                    onClick={() => onNavigate('persona', 'avatar')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✗ Voice Clone · Click to setup
                    <ChevronRight className="w-3 h-3" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Three Main Options - Side by Side */}
        <div className="mb-12">
          {(() => {
            // Calculate requirements
            const storyCount = persona?.lifeStories?.length || 0;
            const hasEnoughStories = storyCount >= 3;
            const canUseTextChat = hasEnoughStories;
            const canUseVideo = hasPhotoAvatar;
            const canUseLive = hasPhotoAvatar && hasVoiceClone;

            return (
              <div className="grid md:grid-cols-3 gap-6">
                {/* Option 1: Text Chat */}
                <FadeIn delay={0.15}>
                  <motion.div
                    onClick={() => {
                      if (!canUseTextChat) return;
                      setExpandedOption(expandedOption === 'chat' ? null : 'chat');
                    }}
                    className={`relative overflow-hidden rounded-2xl group ${
                      canUseTextChat ? 'cursor-pointer' : 'cursor-not-allowed'
                    } ${expandedOption === 'chat' ? 'ring-2 ring-blue-400' : ''}`}
                    whileHover={canUseTextChat ? { y: -8, scale: 1.02 } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent" />

                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/30 group-hover:border-cyan-400/60 transition-colors" />

                    {/* Message bubbles animation */}
                    <motion.div
                      className="absolute top-16 right-12 w-8 h-6 rounded-lg bg-blue-400/20 border border-blue-400/30"
                      animate={{ x: [0, 5, 0], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute top-28 right-16 w-10 h-6 rounded-lg bg-cyan-400/20 border border-cyan-400/30"
                      animate={{ x: [0, -5, 0], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
                    />

                    {/* Content */}
                    <div className="relative p-8 flex flex-col items-center text-center min-h-[400px]">
                      {/* Icon */}
                      <motion.div
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <MessageCircle className="w-10 h-10 text-blue-400" />
                      </motion.div>

                      {/* Title */}
                      <h3 className="text-2xl font-serif text-cream mb-3">Text Chat</h3>
                      <p className="text-cream/60 text-sm mb-6">Simple text-only conversation</p>

                      {/* Features */}
                      <div className="space-y-3 mb-auto">
                        <div className="flex items-center gap-2 text-cream/70 text-sm">
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-400 text-xs">✓</span>
                          </div>
                          <span>Instant responses</span>
                        </div>
                        <div className="flex items-center gap-2 text-cream/70 text-sm">
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-400 text-xs">✓</span>
                          </div>
                          <span>Personal wisdom</span>
                        </div>
                        <div className="flex items-center gap-2 text-cream/70 text-sm">
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-400 text-xs">✓</span>
                          </div>
                          <span>Chat history</span>
                        </div>
                      </div>

                      {/* Requirement Badge - Fixed height container */}
                      <div className="mt-4 h-14 flex items-center justify-center">
                        {canUseTextChat ? (
                          <div className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs">
                            ✓ Ready to Chat
                          </div>
                        ) : (
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('persona', 'stories');
                            }}
                            className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition-colors flex flex-col items-center gap-1"
                            whileHover={{ scale: 1.02 }}
                          >
                            <span className="flex items-center gap-1">
                              ⚠ {storyCount}/3 Profile Stories needed
                            </span>
                            <span className="text-cream/50 text-[10px] flex items-center gap-1">
                              Click to add stories <ChevronRight className="w-3 h-3" />
                            </span>
                          </motion.button>
                        )}
                      </div>

                      {/* CTA */}
                      <motion.div
                        className={`mt-4 px-6 py-3 rounded-xl font-medium ${
                          canUseTextChat
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                            : 'bg-navy/40 text-cream/40'
                        }`}
                        whileHover={canUseTextChat ? { scale: 1.05 } : {}}
                      >
                        {expandedOption === 'chat' ? 'Selected' : 'Select'}
                      </motion.div>
                    </div>

                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-bl-full" />
                  </motion.div>
                </FadeIn>

                {/* Option 2: Talking Video */}
                <FadeIn delay={0.2}>
                  <motion.div
                    onClick={() => {
                      if (!canUseVideo) return;
                      setExpandedOption(expandedOption === 'video' ? null : 'video');
                    }}
                    className={`relative overflow-hidden rounded-2xl group ${
                      canUseVideo ? 'cursor-pointer' : 'cursor-not-allowed'
                    } ${expandedOption === 'video' ? 'ring-2 ring-gold' : ''}`}
                    whileHover={canUseVideo ? { y: -8, scale: 1.02 } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-gold/10 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent" />

                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-gold/30 group-hover:border-gold/60 transition-colors" />

                    {/* Content */}
                    <div className="relative p-8 flex flex-col items-center text-center min-h-[400px]">
                      {/* Icon */}
                      <motion.div
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Film className="w-10 h-10 text-gold" />
                      </motion.div>

                      {/* Title */}
                      <h3 className="text-2xl font-serif text-cream mb-3">Talking Video</h3>
                      <p className="text-cream/60 text-sm mb-6">Create videos with perfect lip-sync</p>

                      {/* Features */}
                      <div className="space-y-3 mb-auto">
                        <div className="flex items-center gap-2 text-cream/70 text-sm">
                          <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
                            <span className="text-gold text-xs">✓</span>
                          </div>
                          <span>Custom messages</span>
                        </div>
                        <div className="flex items-center gap-2 text-cream/70 text-sm">
                          <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
                            <span className="text-gold text-xs">✓</span>
                          </div>
                          <span>Event templates</span>
                        </div>
                        <div className="flex items-center gap-2 text-cream/70 text-sm">
                          <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
                            <span className="text-gold text-xs">✓</span>
                          </div>
                          <span>Download & share</span>
                        </div>
                      </div>

                      {/* Requirement Badge - Fixed height container */}
                      <div className="mt-4 h-14 flex items-center justify-center">
                        {canUseVideo ? (
                          <div className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs">
                            ✓ Photo Ready
                          </div>
                        ) : (
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('persona', 'avatar');
                            }}
                            className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition-colors flex flex-col items-center gap-1"
                            whileHover={{ scale: 1.02 }}
                          >
                            <span className="flex items-center gap-1">
                              ⚠ Photo Required
                            </span>
                            <span className="text-cream/50 text-[10px] flex items-center gap-1">
                              Click to upload photo <ChevronRight className="w-3 h-3" />
                            </span>
                          </motion.button>
                        )}
                      </div>

                      {/* CTA */}
                      <motion.div
                        className={`mt-4 px-6 py-3 rounded-xl font-medium ${
                          canUseVideo
                            ? 'bg-gradient-to-r from-gold to-gold-light text-navy'
                            : 'bg-navy/40 text-cream/40'
                        }`}
                        whileHover={canUseVideo ? { scale: 1.05 } : {}}
                      >
                        {expandedOption === 'video' ? 'Selected' : 'Select'}
                      </motion.div>
                    </div>

                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/10 to-transparent rounded-bl-full" />
                  </motion.div>
                </FadeIn>

                {/* Option 3: Live Avatar */}
                <FadeIn delay={0.25}>
                  <motion.div
                    onClick={() => {
                      if (!canUseLive) return;
                      setExpandedOption(expandedOption === 'live' ? null : 'live');
                    }}
                    className={`relative overflow-hidden rounded-2xl group ${
                      canUseLive ? 'cursor-pointer' : 'cursor-not-allowed'
                    } ${expandedOption === 'live' ? 'ring-2 ring-purple-400' : ''}`}
                    whileHover={canUseLive ? { y: -8, scale: 1.02 } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent" />

                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/30 group-hover:border-purple-400/60 transition-colors" />

                    {/* Floating particles */}
                    <motion.div
                      className="absolute top-10 right-10 w-2 h-2 rounded-full bg-purple-400/40"
                      animate={{ y: [0, -20, 0], opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute bottom-20 left-10 w-3 h-3 rounded-full bg-pink-400/30"
                      animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    />

                    {/* Content */}
                    <div className="relative p-8 flex flex-col items-center text-center min-h-[400px]">
                      {/* Icon */}
                      <motion.div
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Radio className="w-10 h-10 text-purple-400" />
                      </motion.div>

                      {/* Title */}
                      <h3 className="text-2xl font-serif text-cream mb-3">Live Avatar</h3>
                      <p className="text-cream/60 text-sm mb-6">Real-time interactive conversation</p>

                      {/* Features */}
                      <div className="space-y-3 mb-auto">
                        <div className="flex items-center gap-2 text-cream/70 text-sm">
                          <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 text-xs">✓</span>
                          </div>
                          <span>Voice responses</span>
                        </div>
                        <div className="flex items-center gap-2 text-cream/70 text-sm">
                          <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 text-xs">✓</span>
                          </div>
                          <span>Lip-sync video</span>
                        </div>
                        <div className="flex items-center gap-2 text-cream/70 text-sm">
                          <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 text-xs">✓</span>
                          </div>
                          <span>Natural chat flow</span>
                        </div>
                      </div>

                      {/* Requirement Badges - Fixed height container */}
                      <div className="mt-4 h-14 flex items-center justify-center">
                        {canUseLive ? (
                          <div className="px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                            Live Streaming Ready
                          </div>
                        ) : (
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to the appropriate tab based on what's missing
                              if (!hasPhotoAvatar) {
                                onNavigate('persona', 'avatar');
                              } else {
                                onNavigate('persona', 'avatar'); // Voice is in avatar tab
                              }
                            }}
                            className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors flex flex-col items-center gap-1.5"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex gap-3 text-xs">
                              <span className={hasPhotoAvatar ? 'text-green-400' : 'text-red-400'}>
                                {hasPhotoAvatar ? '✓' : '⚠'} Photo
                              </span>
                              <span className={hasVoiceClone ? 'text-green-400' : 'text-red-400'}>
                                {hasVoiceClone ? '✓' : '⚠'} Voice
                              </span>
                            </div>
                            <span className="text-cream/50 text-[10px] flex items-center gap-1">
                              Click to set up <ChevronRight className="w-3 h-3" />
                            </span>
                          </motion.button>
                        )}
                      </div>

                      {/* CTA */}
                      <motion.div
                        className={`mt-4 px-6 py-3 rounded-xl font-medium ${
                          canUseLive
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-navy/40 text-cream/40'
                        }`}
                        whileHover={canUseLive ? { scale: 1.05, boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)' } : {}}
                      >
                        {expandedOption === 'live' ? 'Selected' : 'Select'}
                      </motion.div>
                    </div>

                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-bl-full" />
                  </motion.div>
                </FadeIn>

              </div>
            );
          })()}
        </div>

        {/* Expandable Sections */}
        <div ref={expandedSectionRef}>
        <AnimatePresence mode="wait">
          {expandedOption === 'chat' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <FadeIn delay={0.1}>
                <div className="glass-card p-6 border-2 border-blue-400/30">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-6 h-6 text-blue-400" />
                      <h3 className="text-xl font-serif text-cream">Text Chat Options</h3>
                    </div>
                    <motion.button
                      onClick={handleOpenTextChat}
                      className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open Chat
                    </motion.button>
                  </div>
                  <p className="text-cream/60">
                    Start a text-only conversation with your Echo. Get instant, personalized responses based on your personality and life stories.
                  </p>
                </div>
              </FadeIn>
            </motion.div>
          )}

          {expandedOption === 'video' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <FadeIn delay={0.1}>
                <div className="glass-card p-6 border-2 border-gold/30">
                  <div className="flex items-center gap-4 mb-6">
                    <Film className="w-6 h-6 text-gold" />
                    <h3 className="text-xl font-serif text-cream">Video Generation Options</h3>
                  </div>

                  {/* Source Selection: Self or Family Member */}
                  <div className="mb-6">
                    <label className="block text-cream/70 text-sm mb-3">Who should speak?</label>
                    <div className="flex flex-wrap gap-3">
                      {/* Self option */}
                      <motion.button
                        onClick={() => {
                          setVideoSource('self');
                          setSelectedFamilyMember(null);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          videoSource === 'self'
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-cream/20 bg-navy/40 text-cream/70 hover:border-cream/40'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          videoSource === 'self' ? 'bg-gold/20' : 'bg-cream/10'
                        }`}>
                          {persona?.avatarImages?.[0]?.imageData ? (
                            <img
                              src={persona.avatarImages[0].imageData}
                              alt="You"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm">Yourself</p>
                          <p className="text-xs opacity-60">Your avatar speaks</p>
                        </div>
                        {videoSource === 'self' && (
                          <Check className="w-5 h-5 text-gold ml-2" />
                        )}
                      </motion.button>

                      {/* Family Member options */}
                      {familyMembers.length > 0 && familyMembers.map((member) => (
                        <motion.button
                          key={member.id}
                          onClick={() => {
                            setVideoSource('family');
                            setSelectedFamilyMember(member);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                            selectedFamilyMember?.id === member.id
                              ? 'border-purple-400 bg-purple-500/10 text-purple-300'
                              : 'border-cream/20 bg-navy/40 text-cream/70 hover:border-cream/40'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-500/20 flex items-center justify-center">
                            {member.imageData ? (
                              <img
                                src={member.imageData}
                                alt={member.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="w-5 h-5 text-purple-400" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs opacity-60">{member.relationship}</p>
                          </div>
                          {selectedFamilyMember?.id === member.id && (
                            <Check className="w-5 h-5 text-purple-400 ml-2" />
                          )}
                        </motion.button>
                      ))}

                      {/* Add Family Member hint */}
                      {familyMembers.length === 0 && (
                        <motion.button
                          onClick={() => onNavigate('family-tree')}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-cream/20 text-cream/50 hover:border-cream/40 hover:text-cream/70 transition-all"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="w-10 h-10 rounded-full bg-cream/5 flex items-center justify-center">
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">Add Family Member</p>
                            <p className="text-xs">With photo to use here</p>
                          </div>
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Voice Clone Option - Show toggle if has voice clone */}
                  {hasVoiceClone ? (
                    <div className="mb-6 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Mic className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-cream font-medium text-sm">Use Your Cloned Voice</p>
                            <p className="text-cream/50 text-xs">
                              {selectedFamilyMember
                                ? `${selectedFamilyMember.name} will speak with your voice`
                                : 'The avatar will speak with your voice'}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => setUseVoiceClone(!useVoiceClone)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            useVoiceClone ? 'bg-green-500' : 'bg-cream/20'
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-5 h-5 rounded-full bg-white shadow-md"
                            animate={{ x: useVoiceClone ? 26 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>
                    </div>
                  ) : selectedFamilyMember ? (
                    /* No voice clone but family member selected - show setup prompt */
                    <div className="mb-6 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Mic className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-cream font-medium text-sm">Want {selectedFamilyMember.name} to speak with your voice?</p>
                            <p className="text-cream/50 text-xs">
                              Record your voice samples to make {selectedFamilyMember.name} sound like you
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => onNavigate('persona', 'voice')}
                          className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/30 transition-colors flex items-center gap-2 whitespace-nowrap"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Mic className="w-4 h-4" />
                          Setup Voice
                        </motion.button>
                      </div>
                    </div>
                  ) : null}

                  {/* Family Member Info */}
                  {selectedFamilyMember && (
                    <div className="mb-6 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          <img
                            src={selectedFamilyMember.imageData}
                            alt={selectedFamilyMember.name}
                            className="w-12 h-12 object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-cream font-medium">{selectedFamilyMember.name}</p>
                          <p className="text-purple-300 text-sm">{selectedFamilyMember.relationship}</p>
                          {selectedFamilyMember.bio && (
                            <p className="text-cream/50 text-xs mt-1 line-clamp-2">{selectedFamilyMember.bio}</p>
                          )}
                        </div>
                      </div>
                      {!selectedFamilyMember.voiceData && (
                        <p className="text-orange-400/80 text-xs mt-3 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          No voice sample - will use default voice
                        </p>
                      )}
                    </div>
                  )}

                  {/* Custom Message */}
                  <div className="mb-6">
                    <label className="block text-cream/70 text-sm mb-2">Custom Message</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCustomMessage()}
                        placeholder={selectedFamilyMember
                          ? `What should ${selectedFamilyMember.name} say...`
                          : "Type what your avatar should say..."}
                        disabled={videoSource === 'self' ? !hasPhotoAvatar : !selectedFamilyMember?.imageData}
                        className="flex-1 px-4 py-3 rounded-lg bg-navy/60 border border-cream/10 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50 disabled:opacity-50"
                      />
                      <motion.button
                        onClick={handleCustomMessage}
                        disabled={!customMessage.trim() || (videoSource === 'self' ? !hasPhotoAvatar : !selectedFamilyMember?.imageData)}
                        className="px-5 py-3 rounded-lg bg-gold text-navy font-medium disabled:opacity-50 flex items-center gap-2"
                        whileHover={customMessage.trim() ? { scale: 1.02 } : {}}
                        whileTap={customMessage.trim() ? { scale: 0.98 } : {}}
                      >
                        <Wand2 className="w-4 h-4" />
                        Create
                      </motion.button>
                    </div>
                  </div>

                  {/* Event Templates */}
                  <div>
                    <label className="block text-cream/70 text-sm mb-3">Event Templates</label>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {eventTemplates.map((template) => {
                        const Icon = template.icon;
                        const isDisabled = videoSource === 'self' ? !hasPhotoAvatar : !selectedFamilyMember?.imageData;
                        return (
                          <motion.button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            disabled={isDisabled}
                            className={`p-4 rounded-lg border text-left transition-all ${
                              !isDisabled
                                ? 'border-cream/20 bg-navy/40 hover:border-gold/40 hover:bg-gold/5'
                                : 'border-cream/10 bg-navy/20 opacity-50 cursor-not-allowed'
                            }`}
                            whileHover={!isDisabled ? { y: -2 } : {}}
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
            </motion.div>
          )}

          {expandedOption === 'live' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <FadeIn delay={0.1}>
                <div className="glass-card p-6 border-2 border-purple-400/30">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Radio className="w-6 h-6 text-purple-400" />
                      <h3 className="text-xl font-serif text-cream">Live Avatar Options</h3>
                    </div>
                    <motion.button
                      onClick={() => setShowChatConfig(true)}
                      className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Configure & Start
                    </motion.button>
                  </div>
                  <p className="text-cream/60 mb-4">
                    Start a real-time video conversation with your Echo. Features voice responses with perfect lip-sync and natural chat flow.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-cream text-sm font-medium mb-1">Low Latency</p>
                      <p className="text-cream/50 text-xs">~300ms response time</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-cream text-sm font-medium mb-1">WebRTC</p>
                      <p className="text-cream/50 text-xs">Real-time streaming</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-cream text-sm font-medium mb-1">Up to 20min</p>
                      <p className="text-cream/50 text-xs">Session duration</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Video Archive - Compact Design */}
        <FadeIn delay={0.35}>
          <div className="flex items-center justify-between p-4 glass-card border-l-4 border-gold hover:border-gold-light transition-colors group">
            <div className="flex items-center gap-3">
              <Film className="w-5 h-5 text-gold" />
              <div>
                <h4 className="text-cream font-medium">Video Archive</h4>
                <p className="text-cream/50 text-xs">View & manage your generated videos</p>
              </div>
            </div>
            <Link to="/video-archive">
              <motion.button
                className="px-4 py-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Open Archive
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
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
            useVoiceClone={useVoiceClone}
            selectedFamilyMember={selectedFamilyMember}
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

      {/* Text Chat Modal */}
      <AnimatePresence>
        {showTextChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTextChat(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl h-[600px] glass-card flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-cream/10">
                <div className="flex items-center gap-3">
                  {/* Avatar Image */}
                  {persona?.avatarImages?.[0] && (
                    <img
                      src={persona.avatarImages.find(a => a.isActive)?.imageData || persona.avatarImages[0].imageData}
                      alt="Echo Avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-400"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-cream">Chat with Your Echo</h3>
                    <p className="text-cream/50 text-xs">Text conversation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTextChat(false)}
                  className="text-cream/50 hover:text-cream transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {textChatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-cream/20 mx-auto mb-3" />
                      <p className="text-cream/50">Start a conversation with your Echo</p>
                    </div>
                  </div>
                ) : (
                  textChatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-navy-light text-cream'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isLoadingTextChat && (
                  <div className="flex justify-start">
                    <div className="bg-navy-light text-cream p-3 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-cream/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textChatInput}
                    onChange={(e) => setTextChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendTextMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 rounded-lg bg-navy/60 border border-cream/10 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                  <motion.button
                    onClick={handleSendTextMessage}
                    disabled={!textChatInput.trim() || isLoadingTextChat}
                    className="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
