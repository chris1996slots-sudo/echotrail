import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Image as ImageIcon,
  Video,
  X,
  Plus,
  Trash2,
  Edit3,
  Save,
  Camera,
  Loader2,
  Play
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
import { useApp } from '../context/AppContext';

export function MemoryAnchorPage() {
  const { memories, addMemory, updateMemory, deleteMemory, isLoading } = useApp();
  const [saving, setSaving] = useState(false);
  const [currentMemory, setCurrentMemory] = useState({
    title: '',
    description: '',
    imageUrl: null,
    videoUrl: null,
    mediaType: null, // 'image' or 'video'
    history: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB for images)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB');
        return;
      }
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      reader.onloadend = () => {
        setCurrentMemory(prev => ({
          ...prev,
          imageUrl: reader.result,
          videoUrl: null,
          mediaType: 'image'
        }));
        setUploadProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB for videos)
      if (file.size > 50 * 1024 * 1024) {
        alert('Video must be smaller than 50MB');
        return;
      }
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      reader.onloadend = () => {
        setCurrentMemory(prev => ({
          ...prev,
          videoUrl: reader.result,
          imageUrl: null,
          mediaType: 'video'
        }));
        setUploadProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearMedia = () => {
    setCurrentMemory(prev => ({
      ...prev,
      imageUrl: null,
      videoUrl: null,
      mediaType: null
    }));
  };

  const handleSaveMemory = async () => {
    if (!currentMemory.title || !currentMemory.description) return;

    setSaving(true);

    const memoryData = {
      title: currentMemory.title,
      description: currentMemory.description,
      imageUrl: currentMemory.imageUrl,
      videoUrl: currentMemory.videoUrl,
      mediaType: currentMemory.mediaType,
      history: currentMemory.history,
    };

    if (editingId) {
      await updateMemory(editingId, memoryData);
    } else {
      await addMemory(memoryData);
    }

    setSaving(false);
    resetForm();
  };

  const handleDeleteMemory = async (id) => {
    setSaving(true);
    await deleteMemory(id);
    setSaving(false);
  };

  const handleEditMemory = (memory) => {
    setCurrentMemory({
      title: memory.title,
      description: memory.description,
      imageUrl: memory.imageUrl,
      videoUrl: memory.videoUrl,
      mediaType: memory.mediaType || (memory.imageUrl ? 'image' : memory.videoUrl ? 'video' : null),
      history: memory.history || '',
    });
    setEditingId(memory.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setCurrentMemory({ title: '', description: '', imageUrl: null, videoUrl: null, mediaType: null, history: '' });
    setEditingId(null);
    setShowModal(false);
    setUploadProgress(0);
  };

  if (isLoading) {
    return (
      <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark py-8">
      <div className="max-w-6xl mx-auto px-4">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-cream mb-2">
                Memory Anchors
              </h1>
              <p className="text-cream/60">
                Attach stories and significance to cherished objects. Your AI will learn their history.
              </p>
            </div>
            <motion.button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center mt-4 md:mt-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Memory
            </motion.button>
          </div>
        </FadeIn>

        {memories.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gold/50" />
              </div>
              <h3 className="text-xl font-serif text-cream mb-3">No Memory Anchors Yet</h3>
              <p className="text-cream/50 max-w-md mx-auto mb-6">
                Upload photos of meaningful objects and share their stories. Your grandparents' ring,
                a childhood toy, a family heirloom – each has a story worth preserving.
              </p>
              <motion.button
                onClick={() => setShowModal(true)}
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5 mr-2 inline" />
                Add Your First Memory
              </motion.button>
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <StaggerItem key={memory.id}>
                <motion.div
                  className="glass-card overflow-hidden group"
                  whileHover={{ y: -5 }}
                >
                  <div className="relative aspect-square bg-navy-dark">
                    {memory.videoUrl ? (
                      <div className="relative w-full h-full">
                        <video
                          src={memory.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-14 h-14 rounded-full bg-gold/90 flex items-center justify-center">
                            <Play className="w-6 h-6 text-navy ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : memory.imageUrl ? (
                      <img
                        src={memory.imageUrl}
                        alt={memory.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gold/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        onClick={() => handleEditMemory(memory)}
                        className="p-2 rounded-full bg-navy/80 text-cream/70 hover:text-cream"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteMemory(memory.id)}
                        className="p-2 rounded-full bg-navy/80 text-cream/70 hover:text-red-400"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={saving}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-serif text-cream mb-2">{memory.title}</h3>
                    <p className="text-cream/60 text-sm line-clamp-2 mb-3">{memory.description}</p>
                    {memory.history && (
                      <p className="text-cream/40 text-xs italic line-clamp-2">"{memory.history}"</p>
                    )}
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl glass-card p-6 md:p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-cream">
                  {editingId ? 'Edit Memory Anchor' : 'Add Memory Anchor'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-cream/50 hover:text-cream"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-cream/70 text-sm mb-3">Photo or Video</label>

                  {/* Media Preview */}
                  {(currentMemory.imageUrl || currentMemory.videoUrl) ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gold/50 mb-3">
                      {currentMemory.mediaType === 'video' ? (
                        <video
                          src={currentMemory.videoUrl}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                        />
                      ) : (
                        <img
                          src={currentMemory.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={clearMedia}
                        className="absolute top-3 right-3 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Upload Progress */}
                      {uploadProgress > 0 && (
                        <div className="mb-3">
                          <div className="h-2 bg-navy-dark rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gold transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-cream/50 text-xs mt-1 text-center">Uploading... {uploadProgress}%</p>
                        </div>
                      )}

                      {/* Upload Buttons */}
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative aspect-video rounded-xl border-2 border-dashed border-gold/20 hover:border-gold/40 cursor-pointer transition-all overflow-hidden"
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-dark/50">
                            <ImageIcon className="w-8 h-8 text-gold/40 mb-2" />
                            <p className="text-cream/50 text-sm">Upload Photo</p>
                            <p className="text-cream/30 text-xs mt-1">JPG, PNG up to 5MB</p>
                          </div>
                        </div>

                        <div
                          onClick={() => videoInputRef.current?.click()}
                          className="relative aspect-video rounded-xl border-2 border-dashed border-gold/20 hover:border-gold/40 cursor-pointer transition-all overflow-hidden"
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-dark/50">
                            <Video className="w-8 h-8 text-gold/40 mb-2" />
                            <p className="text-cream/50 text-sm">Upload Video</p>
                            <p className="text-cream/30 text-xs mt-1">MP4, MOV up to 50MB</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="block text-cream/70 text-sm mb-2">Object Name</label>
                  <input
                    type="text"
                    value={currentMemory.title}
                    onChange={(e) => setCurrentMemory(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Grandmother's Ring"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-cream/70 text-sm mb-2">Description</label>
                  <textarea
                    value={currentMemory.description}
                    onChange={(e) => setCurrentMemory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What is this object? Why is it meaningful?"
                    className="input-field min-h-[100px] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-cream/70 text-sm mb-2">The Story Behind It</label>
                  <textarea
                    value={currentMemory.history}
                    onChange={(e) => setCurrentMemory(prev => ({ ...prev, history: e.target.value }))}
                    placeholder="Share the complete history and memories associated with this object..."
                    className="input-field min-h-[150px] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <motion.button
                    onClick={resetForm}
                    className="btn-secondary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={saving}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSaveMemory}
                    disabled={!currentMemory.title || !currentMemory.description || saving}
                    className="btn-primary flex items-center disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingId ? 'Save Changes' : 'Add Memory'}
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
