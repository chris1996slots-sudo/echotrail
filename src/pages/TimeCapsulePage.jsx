import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Clock,
  Calendar,
  Gift,
  Heart,
  GraduationCap,
  Cake,
  Star,
  Trash2,
  Edit3,
  Save,
  Lock,
  Unlock,
  Loader2,
  Image as ImageIcon,
  Video,
  Upload,
  Play,
  FileImage,
  FileVideo
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
import { useApp } from '../context/AppContext';

const occasions = [
  { id: 'birthday', label: 'Birthday', icon: Cake },
  { id: 'graduation', label: 'Graduation', icon: GraduationCap },
  { id: 'wedding', label: 'Wedding', icon: Heart },
  { id: 'holiday', label: 'Holiday', icon: Gift },
  { id: 'milestone', label: 'Life Milestone', icon: Star },
  { id: 'custom', label: 'Custom Date', icon: Calendar },
];

export function TimeCapsulePage() {
  const { timeCapsules, addTimeCapsule, deleteTimeCapsule, isLoading } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentCapsule, setCurrentCapsule] = useState({
    title: '',
    occasion: '',
    recipient: '',
    message: '',
    deliveryDate: '',
    attachments: [], // Array of { type: 'image' | 'video', data: base64, name: string }
  });
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);

    for (const file of files) {
      // Check file size (max 50MB for videos, 10MB for images)
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Max size: ${file.type.startsWith('video/') ? '50MB' : '10MB'}`);
        continue;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        setCurrentCapsule(prev => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              id: Date.now() + Math.random(),
              type,
              data: event.target.result,
              name: file.name,
              size: file.size,
            }
          ]
        }));
      };
      reader.readAsDataURL(file);
    }

    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setCurrentCapsule(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== attachmentId)
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSaveCapsule = async () => {
    if (!currentCapsule.title || !currentCapsule.message || !currentCapsule.deliveryDate) return;

    setSaving(true);

    const capsuleData = {
      title: currentCapsule.title,
      occasion: currentCapsule.occasion,
      recipient: currentCapsule.recipient,
      message: currentCapsule.message,
      deliveryDate: new Date(currentCapsule.deliveryDate).toISOString(),
      attachments: currentCapsule.attachments,
    };

    await addTimeCapsule(capsuleData);

    setSaving(false);
    resetForm();
  };

  const handleDeleteCapsule = async (id) => {
    setSaving(true);
    await deleteTimeCapsule(id);
    setSaving(false);
  };

  const handleEditCapsule = (capsule) => {
    setCurrentCapsule({
      title: capsule.title,
      occasion: capsule.occasion,
      recipient: capsule.recipient,
      message: capsule.message,
      deliveryDate: capsule.deliveryDate ? new Date(capsule.deliveryDate).toISOString().split('T')[0] : '',
      attachments: capsule.attachments || [],
    });
    setEditingId(capsule.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setCurrentCapsule({
      title: '',
      occasion: '',
      recipient: '',
      message: '',
      deliveryDate: '',
      attachments: [],
    });
    setEditingId(null);
    setShowModal(false);
  };

  const getTimeUntil = (date) => {
    const now = new Date();
    const target = new Date(date);
    const diff = target - now;

    if (diff < 0) return 'Delivered';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} away`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} away`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} away`;
    return 'Today';
  };

  const sortedCapsules = [...timeCapsules].sort((a, b) =>
    new Date(a.deliveryDate) - new Date(b.deliveryDate)
  );

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
                Time Capsules
              </h1>
              <p className="text-cream/60">
                Schedule messages to be delivered at special moments in the future.
              </p>
            </div>
            <motion.button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center mt-4 md:mt-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Capsule
            </motion.button>
          </div>
        </FadeIn>

        {timeCapsules.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <Clock className="w-10 h-10 text-gold/50" />
              </div>
              <h3 className="text-xl font-serif text-cream mb-3">No Time Capsules Yet</h3>
              <p className="text-cream/50 max-w-md mx-auto mb-6">
                Create messages that will be delivered at meaningful moments in the future.
                Birthday wishes, graduation advice, or words of comfort for difficult times.
              </p>
              <motion.button
                onClick={() => setShowModal(true)}
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5 mr-2 inline" />
                Create Your First Capsule
              </motion.button>
            </div>
          </FadeIn>
        ) : (
          <>
            <FadeIn delay={0.1}>
              <div className="glass-card p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-serif text-cream mb-1">Your Timeline</h3>
                    <p className="text-cream/50 text-sm">
                      {timeCapsules.filter(c => c.status === 'sealed').length} capsules waiting to be delivered
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gold" />
                      <span className="text-cream/60">Sealed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Unlock className="w-4 h-4 text-green-400" />
                      <span className="text-cream/60">Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            <StaggerContainer className="space-y-4">
              {sortedCapsules.map((capsule) => {
                const occasion = occasions.find(o => o.id === capsule.occasion);
                const Icon = occasion?.icon || Calendar;
                const isSealed = capsule.status === 'sealed';

                return (
                  <StaggerItem key={capsule.id}>
                    <motion.div
                      className={`glass-card p-6 border-l-4 ${
                        isSealed ? 'border-l-gold' : 'border-l-green-400'
                      }`}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isSealed ? 'bg-gold/10' : 'bg-green-400/10'
                          }`}>
                            <Icon className={`w-6 h-6 ${isSealed ? 'text-gold' : 'text-green-400'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-serif text-cream">{capsule.title}</h3>
                              {isSealed ? (
                                <Lock className="w-4 h-4 text-gold" />
                              ) : (
                                <Unlock className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                            <p className="text-cream/50 text-sm mb-2">
                              To: {capsule.recipient} • {occasion?.label || 'Custom'}
                            </p>
                            <p className="text-cream/70 text-sm line-clamp-2">{capsule.message}</p>
                            {/* Attachments indicator */}
                            {capsule.attachments && capsule.attachments.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                {capsule.attachments.filter(a => a.type === 'image').length > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-cream/40 bg-navy-dark/50 px-2 py-1 rounded-full">
                                    <FileImage className="w-3 h-3" />
                                    {capsule.attachments.filter(a => a.type === 'image').length} photo{capsule.attachments.filter(a => a.type === 'image').length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {capsule.attachments.filter(a => a.type === 'video').length > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-cream/40 bg-navy-dark/50 px-2 py-1 rounded-full">
                                    <FileVideo className="w-3 h-3" />
                                    {capsule.attachments.filter(a => a.type === 'video').length} video{capsule.attachments.filter(a => a.type === 'video').length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`font-medium ${isSealed ? 'text-gold' : 'text-green-400'}`}>
                              {getTimeUntil(capsule.deliveryDate)}
                            </p>
                            <p className="text-cream/40 text-xs">
                              {new Date(capsule.deliveryDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>

                          <div className="flex gap-1">
                            <motion.button
                              onClick={() => handleEditCapsule(capsule)}
                              className="p-2 text-cream/30 hover:text-cream/70"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteCapsule(capsule.id)}
                              className="p-2 text-cream/30 hover:text-red-400"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={saving}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </>
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
                  {editingId ? 'Edit Time Capsule' : 'Create Time Capsule'}
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
                  <label className="block text-cream/70 text-sm mb-2">Capsule Title</label>
                  <input
                    type="text"
                    value={currentCapsule.title}
                    onChange={(e) => setCurrentCapsule(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., 18th Birthday Message"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-cream/70 text-sm mb-3">Occasion</label>
                  <div className="grid grid-cols-3 gap-3">
                    {occasions.map((occasion) => {
                      const Icon = occasion.icon;
                      return (
                        <motion.button
                          key={occasion.id}
                          onClick={() => setCurrentCapsule(prev => ({ ...prev, occasion: occasion.id }))}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            currentCapsule.occasion === occasion.id
                              ? 'border-gold bg-gold/10'
                              : 'border-gold/20 hover:border-gold/40 bg-navy-light/30'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1 ${
                            currentCapsule.occasion === occasion.id ? 'text-gold' : 'text-gold/50'
                          }`} />
                          <span className="text-cream text-xs">{occasion.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-cream/70 text-sm mb-2">Recipient</label>
                  <input
                    type="text"
                    value={currentCapsule.recipient}
                    onChange={(e) => setCurrentCapsule(prev => ({ ...prev, recipient: e.target.value }))}
                    placeholder="Who is this message for?"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-cream/70 text-sm mb-2">Delivery Date</label>
                  <input
                    type="date"
                    value={currentCapsule.deliveryDate}
                    onChange={(e) => setCurrentCapsule(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-cream/70 text-sm mb-2">Your Message</label>
                  <textarea
                    value={currentCapsule.message}
                    onChange={(e) => setCurrentCapsule(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Write your heartfelt message..."
                    className="input-field min-h-[150px] resize-none"
                  />
                </div>

                {/* Attachments Section */}
                <div>
                  <label className="block text-cream/70 text-sm mb-3">Photos & Videos</label>

                  {/* Existing Attachments */}
                  {currentCapsule.attachments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {currentCapsule.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="relative group aspect-video rounded-xl overflow-hidden border-2 border-gold/20 bg-navy-dark"
                        >
                          {attachment.type === 'image' ? (
                            <img
                              src={attachment.data}
                              alt={attachment.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-navy-dark">
                              <Play className="w-8 h-8 text-gold/50 mb-1" />
                              <span className="text-cream/50 text-xs truncate px-2 max-w-full">{attachment.name}</span>
                            </div>
                          )}
                          {/* Size badge */}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-cream/70">
                            {formatFileSize(attachment.size)}
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                          {/* Type indicator */}
                          <div className="absolute top-1 left-1 w-6 h-6 bg-navy/80 rounded-full flex items-center justify-center">
                            {attachment.type === 'image' ? (
                              <ImageIcon className="w-3 h-3 text-gold" />
                            ) : (
                              <Video className="w-3 h-3 text-gold" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <label className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-gold/30 hover:border-gold/50 bg-navy-light/20 cursor-pointer transition-all hover:bg-navy-light/30">
                    {uploadingFile ? (
                      <Loader2 className="w-5 h-5 text-gold animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-gold/50" />
                    )}
                    <span className="text-cream/60 text-sm">
                      {uploadingFile ? 'Uploading...' : 'Add photos or videos'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                  </label>
                  <p className="text-cream/40 text-xs mt-2 text-center">
                    Max 10MB for images, 50MB for videos • JPG, PNG, MP4, MOV supported
                  </p>
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
                    onClick={handleSaveCapsule}
                    disabled={!currentCapsule.title || !currentCapsule.message || !currentCapsule.deliveryDate || saving}
                    className="btn-primary flex items-center disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingId ? 'Save Changes' : 'Seal Capsule'}
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
