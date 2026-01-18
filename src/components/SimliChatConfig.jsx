import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Mic,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowRight,
  X
} from 'lucide-react';
import api from '../services/api';

export function SimliChatConfig({ onStart, onClose, persona, onNavigate }) {
  const [selectedFace, setSelectedFace] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available faces and voices
  const [customFaces, setCustomFaces] = useState([]); // Changed to array for multiple faces
  const [standardFaces, setStandardFaces] = useState([]);
  const [voiceClone, setVoiceClone] = useState(null);
  const [standardVoices, setStandardVoices] = useState([]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const customFacesList = [];

      // Load all avatar images - they are the source of truth
      if (persona?.avatarImages && persona.avatarImages.length > 0) {
        for (const avatarImage of persona.avatarImages) {
          // If this avatar has a Simli face ID, use it
          // Otherwise, use the avatar itself (will show as needing upload)
          customFacesList.push({
            id: avatarImage.simliFaceId || `avatar_${avatarImage.id}`,
            name: avatarImage.label || 'Custom Avatar',
            imageUrl: avatarImage.imageData,
            type: 'custom',
            avatarImageId: avatarImage.id,
            hasSimliFace: !!avatarImage.simliFaceId,
            status: avatarImage.simliFaceId ? 'ready' : 'no_face'
          });
        }
      }

      // If persona has simliFaceId but it's not in any avatar image, add it separately
      // (This handles the case where face was uploaded via Real-Time Chat)
      if (persona?.simliFaceId) {
        const existsInAvatars = customFacesList.some(f => f.id === persona.simliFaceId);

        if (!existsInAvatars) {
          try {
            const faceStatus = await api.getSimliFaceStatus();
            if (faceStatus.isReady) {
              customFacesList.push({
                id: persona.simliFaceId,
                name: persona.simliFaceName || 'My Custom Face',
                type: 'custom',
                hasSimliFace: true,
                isPrimary: true,
                status: 'ready'
              });
            }
          } catch (err) {
            console.error('Failed to check face status:', err);
          }
        }
      }

      setCustomFaces(customFacesList);

      // Auto-select first custom face if available (prioritize persona.simliFaceId)
      if (customFacesList.length > 0) {
        // Find the primary face (from persona) or use first
        const primaryFace = customFacesList.find(f => f.isPrimary) || customFacesList[0];
        setSelectedFace(primaryFace);
      }

      // Load standard Simli faces
      const faces = await api.getSimliFaces();
      setStandardFaces(faces.faces || []);

      // If no custom faces, auto-select first standard face
      if (customFacesList.length === 0 && faces.faces?.length > 0) {
        setSelectedFace({
          id: faces.faces[0].id,
          name: faces.faces[0].name,
          type: 'standard'
        });
      }

      // Check for voice clone
      if (persona?.elevenlabsVoiceId) {
        setVoiceClone({
          id: persona.elevenlabsVoiceId,
          name: persona.elevenlabsVoiceName || 'My Voice Clone',
          type: 'clone'
        });
        // Auto-select voice clone if available
        setSelectedVoice({
          id: persona.elevenlabsVoiceId,
          name: persona.elevenlabsVoiceName || 'My Voice Clone',
          type: 'clone'
        });
      }

      // Standard voices (ElevenLabs pre-made voices)
      setStandardVoices([
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Female, Soft)', type: 'standard' },
        { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Male, Deep)', type: 'standard' },
        { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Male, Well-rounded)', type: 'standard' },
        { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Male, Crisp)', type: 'standard' },
      ]);

      // If no voice clone, auto-select first standard voice
      if (!persona?.elevenlabsVoiceId) {
        setSelectedVoice({
          id: 'EXAVITQu4vr4xnSDxMaL',
          name: 'Sarah (Female, Soft)',
          type: 'standard'
        });
      }

    } catch (err) {
      console.error('Failed to load config:', err);
      setError('Failed to load configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!selectedFace || !selectedVoice) {
      setError('Please select both a face and a voice');
      return;
    }

    onStart({
      face: selectedFace,
      voice: selectedVoice
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-navy-dark/95 backdrop-blur-lg flex items-center justify-center"
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-cream/70">Loading configuration...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-navy-dark/95 backdrop-blur-lg flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-navy-dark border border-gold/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-serif text-cream mb-1">Configure Live Chat</h2>
            <p className="text-cream/60 text-sm">Choose your avatar face and voice</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-cream/10 text-cream hover:bg-cream/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        {/* Face Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-medium text-cream">Select Face</h3>
          </div>

          {/* Custom Faces Section */}
          {customFaces.length > 0 ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-400" />
                <p className="text-green-400 text-sm font-medium">Your Custom Faces</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customFaces.map((face) => (
                  <button
                    key={face.id}
                    onClick={() => setSelectedFace(face)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedFace?.id === face.id
                        ? 'border-green-400 bg-green-400/10 shadow-lg shadow-green-400/20'
                        : 'border-green-400/40 bg-green-500/5 hover:border-green-400/60'
                    }`}
                  >
                    {/* Image Preview */}
                    {face.imageUrl && (
                      <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-navy-dark border border-green-400/20">
                        <img
                          src={face.imageUrl}
                          alt={face.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-400" />
                        <span className="font-medium text-cream text-base">{face.name}</span>
                      </div>
                      {selectedFace?.id === face.id && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <div className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-400/30">
                      ✓ Your Face
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-6 rounded-xl border-2 border-dashed border-green-400/30 bg-green-500/5 text-center">
              <Sparkles className="w-8 h-8 text-green-400/50 mx-auto mb-3" />
              <p className="text-cream/70 text-sm mb-3">No custom face uploaded yet</p>
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    onNavigate('persona', 'avatar');
                  }, 100);
                }}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors border border-green-400/30"
              >
                Upload Your Face in My Persona
              </button>
            </div>
          )}

          {/* Standard Faces Section - Less Prominent */}
          {standardFaces.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-cream/40" />
                <p className="text-cream/40 text-xs">Standard Avatars (Generic)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {standardFaces.map((face) => (
                  <button
                    key={face.id}
                    onClick={() => setSelectedFace({ id: face.id, name: face.name, type: 'standard' })}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedFace?.id === face.id
                        ? 'border-cream/40 bg-cream/5'
                        : 'border-cream/10 bg-navy-light/20 hover:border-cream/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-cream/60 text-xs">{face.name}</span>
                      {selectedFace?.id === face.id && (
                        <CheckCircle2 className="w-4 h-4 text-cream/60" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Voice Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-medium text-cream">Select Voice</h3>
          </div>

          {/* Voice Clone Section */}
          {voiceClone ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-400" />
                <p className="text-green-400 text-sm font-medium">Your Cloned Voice</p>
              </div>
              <button
                onClick={() => setSelectedVoice(voiceClone)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedVoice?.id === voiceClone.id
                    ? 'border-green-400 bg-green-400/10 shadow-lg shadow-green-400/20'
                    : 'border-green-400/40 bg-green-500/5 hover:border-green-400/60'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-400" />
                    <span className="font-medium text-cream text-base">{voiceClone.name}</span>
                  </div>
                  {selectedVoice?.id === voiceClone.id && (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <div className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-400/30">
                  ✓ Your Voice
                </div>
              </button>
            </div>
          ) : (
            <div className="mb-4 p-6 rounded-xl border-2 border-dashed border-green-400/30 bg-green-500/5 text-center">
              <Mic className="w-8 h-8 text-green-400/50 mx-auto mb-3" />
              <p className="text-cream/70 text-sm mb-3">No voice clone created yet</p>
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    onNavigate('persona', 'voice');
                  }, 100);
                }}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors border border-green-400/30"
              >
                Create Voice Clone in My Persona
              </button>
            </div>
          )}

          {/* Standard Voices Section - Less Prominent */}
          {standardVoices.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mic className="w-4 h-4 text-cream/40" />
                <p className="text-cream/40 text-xs">Standard Voices (Generic)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {standardVoices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice({ id: voice.id, name: voice.name, type: 'standard' })}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedVoice?.id === voice.id
                        ? 'border-cream/40 bg-cream/5'
                        : 'border-cream/10 bg-navy-light/20 hover:border-cream/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-cream/60 text-xs">{voice.name}</span>
                      {selectedVoice?.id === voice.id && (
                        <CheckCircle2 className="w-4 h-4 text-cream/60" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        <motion.button
          onClick={handleStart}
          disabled={!selectedFace || !selectedVoice}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: selectedFace && selectedVoice ? 1.02 : 1 }}
          whileTap={{ scale: selectedFace && selectedVoice ? 0.98 : 1 }}
        >
          <Sparkles className="w-5 h-5" />
          Start Live Chat
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default SimliChatConfig;
