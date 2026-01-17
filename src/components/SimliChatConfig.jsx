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

      // Load ALL avatar images from persona
      const customFacesList = [];
      if (persona?.avatarImages && persona.avatarImages.length > 0) {
        for (const avatarImage of persona.avatarImages) {
          customFacesList.push({
            id: avatarImage.simliFaceId || `avatar-${avatarImage.id}`,
            name: avatarImage.label || 'Custom Avatar',
            imageUrl: avatarImage.imageUrl,
            type: 'custom',
            avatarImageId: avatarImage.id,
            hasSimliFace: !!avatarImage.simliFaceId
          });
        }
      }

      // Also check if persona itself has a Simli face ID
      if (persona?.simliFaceId && !customFacesList.some(f => f.id === persona.simliFaceId)) {
        customFacesList.push({
          id: persona.simliFaceId,
          name: persona.simliFaceName || 'My Custom Face',
          type: 'custom',
          hasSimliFace: true
        });
      }

      setCustomFaces(customFacesList);

      // Auto-select first custom face if available
      if (customFacesList.length > 0) {
        setSelectedFace(customFacesList[0]);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Custom Faces - Show ALL uploaded avatar images */}
            {customFaces.map((face) => (
              <button
                key={face.id}
                onClick={() => setSelectedFace(face)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedFace?.id === face.id
                    ? 'border-gold bg-gold/10'
                    : 'border-cream/20 bg-navy-light/30 hover:border-cream/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="font-medium text-cream">{face.name}</span>
                  </div>
                  {selectedFace?.id === face.id && (
                    <CheckCircle2 className="w-5 h-5 text-gold" />
                  )}
                </div>
                <p className="text-cream/50 text-xs">
                  {face.hasSimliFace ? 'Your custom face' : 'Upload pending'}
                </p>
              </button>
            ))}

            {/* Standard Faces */}
            {standardFaces.map((face) => (
              <button
                key={face.id}
                onClick={() => setSelectedFace({ id: face.id, name: face.name, type: 'standard' })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedFace?.id === face.id
                    ? 'border-gold bg-gold/10'
                    : 'border-cream/20 bg-navy-light/30 hover:border-cream/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-cream">{face.name}</span>
                  {selectedFace?.id === face.id && (
                    <CheckCircle2 className="w-5 h-5 text-gold" />
                  )}
                </div>
                <p className="text-cream/50 text-xs">Standard avatar</p>
              </button>
            ))}
          </div>

          {customFaces.length === 0 && (
            <button
              onClick={() => {
                onClose();
                setTimeout(() => {
                  onNavigate('persona', 'avatar');
                }, 100);
              }}
              className="mt-3 text-cream/50 text-sm hover:text-gold transition-colors text-left"
            >
              💡 Upload your own face in <span className="text-gold underline">My Persona → Avatar</span>
            </button>
          )}
        </div>

        {/* Voice Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-medium text-cream">Select Voice</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Voice Clone */}
            {voiceClone && (
              <button
                onClick={() => setSelectedVoice(voiceClone)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedVoice?.id === voiceClone.id
                    ? 'border-gold bg-gold/10'
                    : 'border-cream/20 bg-navy-light/30 hover:border-cream/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="font-medium text-cream">{voiceClone.name}</span>
                  </div>
                  {selectedVoice?.id === voiceClone.id && (
                    <CheckCircle2 className="w-5 h-5 text-gold" />
                  )}
                </div>
                <p className="text-cream/50 text-xs">Your cloned voice</p>
              </button>
            )}

            {/* Standard Voices */}
            {standardVoices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice({ id: voice.id, name: voice.name, type: 'standard' })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedVoice?.id === voice.id
                    ? 'border-gold bg-gold/10'
                    : 'border-cream/20 bg-navy-light/30 hover:border-cream/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-cream text-sm">{voice.name}</span>
                  {selectedVoice?.id === voice.id && (
                    <CheckCircle2 className="w-5 h-5 text-gold" />
                  )}
                </div>
                <p className="text-cream/50 text-xs">Standard voice</p>
              </button>
            ))}
          </div>

          {!voiceClone && (
            <button
              onClick={() => {
                onClose();
                setTimeout(() => {
                  onNavigate('persona', 'voice');
                }, 100);
              }}
              className="mt-3 text-cream/50 text-sm hover:text-gold transition-colors text-left"
            >
              💡 Create your voice clone in <span className="text-gold underline">My Persona → Voice</span>
            </button>
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
