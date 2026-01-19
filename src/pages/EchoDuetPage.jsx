import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Upload,
  Sparkles,
  Play,
  Pause,
  Trash2,
  Heart,
  Eye,
  Clock,
  Plus,
  X,
  Film,
  Loader2
} from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import api from '../services/api';

export function EchoDuetPage() {
  const [duets, setDuets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDuet, setSelectedDuet] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDuets();
  }, []);

  const loadDuets = async () => {
    try {
      setLoading(true);
      const data = await api.getEchoDuets();
      setDuets(data);
    } catch (error) {
      console.error('Failed to load duets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Simulate upload for now - in production, would upload to cloud storage
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // TODO: Upload video to cloud storage (e.g., S3, Cloudinary)
      // For now, create a placeholder duet
      const duet = await api.createEchoDuet({
        userVideoUrl: 'placeholder_video_url',
        title: `Duet ${new Date().toLocaleDateString()}`,
        topic: 'conversation',
      });

      setUploadProgress(100);
      setTimeout(() => {
        setShowUploadModal(false);
        setUploading(false);
        setUploadProgress(0);
        loadDuets();
      }, 500);
    } catch (error) {
      console.error('Failed to create duet:', error);
      setUploading(false);
      setUploadProgress(0);
      clearInterval(progressInterval);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this duet?')) return;
    try {
      await api.deleteEchoDuet(id);
      loadDuets();
    } catch (error) {
      console.error('Failed to delete duet:', error);
    }
  };

  const handleViewDuet = (duet) => {
    setSelectedDuet(duet);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">✓ Ready</span>;
      case 'processing':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing
        </span>;
      case 'failed':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">✗ Failed</span>;
      default:
        return null;
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-navy-light py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <FadeIn>
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
              >
                <Video className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-5xl font-serif text-cream mb-4">Echo Duet</h1>
              <p className="text-cream/60 text-lg max-w-2xl mx-auto">
                Record a video message and get a personalized response from your avatar.
                Create meaningful conversations that last forever.
              </p>
            </div>
          </FadeIn>

          {/* Upload Button */}
          <div className="mb-12 text-center">
            <motion.button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary inline-flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              Create New Duet
            </motion.button>
          </div>

          {/* Duets Grid */}
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 text-purple-500/50 mx-auto mb-4 animate-spin" />
              <p className="text-cream/50">Loading your duets...</p>
            </div>
          ) : duets.length === 0 ? (
            <div className="text-center py-20">
              <Film className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
              <p className="text-cream/50 mb-2">No duets yet. Create your first video conversation!</p>
              <p className="text-cream/30 text-sm">Upload a video and your avatar will respond with wisdom and love.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {duets.map((duet) => (
                <motion.div
                  key={duet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card overflow-hidden border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                  onClick={() => handleViewDuet(duet)}
                  whileHover={{ y: -4 }}
                >
                  {/* Video Thumbnail Placeholder */}
                  <div className="relative aspect-video bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
                    <Play className="w-12 h-12 text-purple-400/50" />
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(duet.status)}
                    </div>
                  </div>

                  {/* Duet Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-serif text-cream mb-2">
                      {duet.title || 'Untitled Duet'}
                    </h3>
                    <p className="text-cream/50 text-sm mb-3">
                      {new Date(duet.createdAt).toLocaleDateString()}
                    </p>

                    {duet.topic && (
                      <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full mb-3">
                        {duet.topic}
                      </span>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-cream/40">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {duet.viewCount || 0}
                      </div>
                      {duet.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {Math.floor(duet.duration / 60)}:{(duet.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-purple-500/10 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(duet.id);
                        }}
                        className="p-2 rounded-lg text-cream/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Upload Modal */}
          <AnimatePresence>
            {showUploadModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={() => !uploading && setShowUploadModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-navy-dark border-2 border-purple-500/30 rounded-2xl p-8 max-w-md w-full"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-serif text-cream">Upload Video</h2>
                    <button
                      onClick={() => !uploading && setShowUploadModal(false)}
                      disabled={uploading}
                      className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50 disabled:opacity-30"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {!uploading ? (
                    <div>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 rounded-xl p-12 text-center cursor-pointer transition-all bg-purple-500/5 hover:bg-purple-500/10"
                      >
                        <Upload className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                        <p className="text-cream/70 mb-2">Click to upload your video</p>
                        <p className="text-cream/40 text-sm">MP4, MOV, WebM (max 100MB)</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>

                      <div className="mt-6 bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                        <p className="text-cream/60 text-sm">
                          💡 <strong>Tip:</strong> Record a heartfelt message, ask a question, or share an update.
                          Your avatar will respond with personalized wisdom.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
                      <p className="text-cream mb-2">Uploading your video...</p>
                      <div className="w-full bg-navy-light/50 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-cream/40 text-sm">{uploadProgress}%</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* View Duet Modal */}
          <AnimatePresence>
            {selectedDuet && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                onClick={() => setSelectedDuet(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-navy-dark border-2 border-purple-500/30 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-serif text-cream">{selectedDuet.title}</h2>
                      <p className="text-cream/50 text-sm">{new Date(selectedDuet.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => setSelectedDuet(null)}
                      className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Your Video */}
                    <div>
                      <h3 className="text-lg font-medium text-cream mb-3 flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-400" />
                        Your Video
                      </h3>
                      <div className="aspect-video bg-navy-light/30 rounded-xl flex items-center justify-center">
                        <p className="text-cream/40">Video player coming soon</p>
                      </div>
                    </div>

                    {/* Avatar Response */}
                    <div>
                      <h3 className="text-lg font-medium text-cream mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-gold" />
                        Avatar's Response
                      </h3>
                      {selectedDuet.status === 'completed' ? (
                        <div className="aspect-video bg-navy-light/30 rounded-xl flex items-center justify-center">
                          <p className="text-cream/40">Avatar video coming soon</p>
                        </div>
                      ) : (
                        <div className="aspect-video bg-navy-light/30 rounded-xl flex flex-col items-center justify-center">
                          {selectedDuet.status === 'processing' ? (
                            <>
                              <Loader2 className="w-8 h-8 text-gold/50 mb-3 animate-spin" />
                              <p className="text-cream/50 text-sm">Generating avatar response...</p>
                            </>
                          ) : (
                            <p className="text-red-400/50 text-sm">Response generation failed</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transcript */}
                  {selectedDuet.avatarResponse && (
                    <div className="mt-6 bg-gold/10 border border-gold/20 rounded-xl p-6">
                      <h4 className="text-sm font-medium text-gold mb-3">Avatar's Message</h4>
                      <p className="text-cream/80 italic">"{selectedDuet.avatarResponse}"</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Box */}
          {duets.length > 0 && (
            <div className="mt-12 bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 text-center">
              <Video className="w-8 h-8 text-purple-400/60 mx-auto mb-3" />
              <p className="text-cream/70 text-sm">
                Your avatar learns from every conversation.
                <br />
                Each duet becomes part of your eternal digital legacy.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
