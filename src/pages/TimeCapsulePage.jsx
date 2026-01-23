import { useState, useRef, useEffect } from 'react';
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
  FileVideo,
  AlertCircle,
  Bell,
  MessageCircle,
  Send,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
import { useApp } from '../context/AppContext';

// Custom Wheel Picker Component
function WheelPicker({ values, selectedValue, onChange, label }) {
  const containerRef = useRef(null);
  const itemHeight = 40;
  const visibleItems = 5;
  const selectedIndex = values.indexOf(selectedValue);

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex >= 0 && newIndex < values.length && values[newIndex] !== selectedValue) {
      onChange(values[newIndex]);
    }
  };

  useEffect(() => {
    if (containerRef.current && selectedIndex >= 0) {
      containerRef.current.scrollTop = selectedIndex * itemHeight;
    }
  }, [selectedIndex]);

  const scrollUp = () => {
    if (selectedIndex > 0) {
      onChange(values[selectedIndex - 1]);
    }
  };

  const scrollDown = () => {
    if (selectedIndex < values.length - 1) {
      onChange(values[selectedIndex + 1]);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <span className="text-cream/50 text-xs mb-1">{label}</span>
      <div className="relative">
        <button
          onClick={scrollUp}
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 text-gold/50 hover:text-gold"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-[200px] w-20 overflow-y-auto scrollbar-hide relative"
          style={{
            scrollSnapType: 'y mandatory',
            scrollBehavior: 'smooth',
          }}
        >
          {/* Spacer for top padding */}
          <div style={{ height: itemHeight * 2 }} />
          {values.map((value, index) => (
            <div
              key={value}
              className={`h-10 flex items-center justify-center transition-all cursor-pointer ${
                value === selectedValue
                  ? 'text-gold text-xl font-bold scale-110'
                  : 'text-cream/40 text-base'
              }`}
              style={{ scrollSnapAlign: 'center' }}
              onClick={() => onChange(value)}
            >
              {value}
            </div>
          ))}
          {/* Spacer for bottom padding */}
          <div style={{ height: itemHeight * 2 }} />
        </div>
        {/* Selection highlight */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-10 border-y-2 border-gold/30 pointer-events-none bg-gold/5 rounded" />
        <button
          onClick={scrollDown}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 text-gold/50 hover:text-gold"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Date Wheel Picker Component
function DateWheelPicker({ value, onChange, minDate }) {
  const currentDate = value ? new Date(value) : new Date();
  const minDateObj = minDate ? new Date(minDate) : new Date();

  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Generate years (current year to +20 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear + i);

  // Generate months
  const months = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' },
  ];

  // Generate days based on selected month/year
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Update parent when selection changes
  useEffect(() => {
    const newDate = new Date(selectedYear, selectedMonth - 1, Math.min(selectedDay, daysInMonth));
    // Check if date is valid and not in the past
    if (newDate >= minDateObj) {
      onChange(newDate.toISOString().split('T')[0]);
    }
  }, [selectedDay, selectedMonth, selectedYear, daysInMonth]);

  // Adjust day if it exceeds days in month
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, daysInMonth]);

  return (
    <div className="bg-navy-dark/50 rounded-xl p-4 border border-gold/20">
      <div className="flex justify-center gap-4">
        <WheelPicker
          values={days}
          selectedValue={selectedDay}
          onChange={setSelectedDay}
          label="Day"
        />
        <WheelPicker
          values={months.map(m => m.value)}
          selectedValue={selectedMonth}
          onChange={setSelectedMonth}
          label="Month"
        />
        <WheelPicker
          values={years}
          selectedValue={selectedYear}
          onChange={setSelectedYear}
          label="Year"
        />
      </div>
      <div className="text-center mt-4 text-gold text-sm">
        {new Date(selectedYear, selectedMonth - 1, selectedDay).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
    </div>
  );
}

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
  const [toast, setToast] = useState(null);
  const [currentCapsule, setCurrentCapsule] = useState({
    title: '',
    occasion: '',
    recipient: '',
    message: '',
    deliveryDate: '',
    attachments: [], // Array of { type: 'image' | 'video', data: base64, name: string }
    notifyTelegram: false,
    notifyWhatsApp: false,
    telegramUsername: '',
    whatsAppNumber: '',
  });

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
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
        showToast(`File "${file.name}" is too large. Max size: ${file.type.startsWith('video/') ? '50MB' : '10MB'}`);
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
      notifyTelegram: currentCapsule.notifyTelegram,
      notifyWhatsApp: currentCapsule.notifyWhatsApp,
      telegramUsername: currentCapsule.telegramUsername,
      whatsAppNumber: currentCapsule.whatsAppNumber,
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
      notifyTelegram: capsule.notifyTelegram || false,
      notifyWhatsApp: capsule.notifyWhatsApp || false,
      telegramUsername: capsule.telegramUsername || '',
      whatsAppNumber: capsule.whatsAppNumber || '',
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
      notifyTelegram: false,
      notifyWhatsApp: false,
      telegramUsername: '',
      whatsAppNumber: '',
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
                            {/* Attachments & Notifications indicator */}
                            {(capsule.attachments?.length > 0 || capsule.notifyTelegram || capsule.notifyWhatsApp) && (
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {capsule.attachments?.filter(a => a.type === 'image').length > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-cream/40 bg-navy-dark/50 px-2 py-1 rounded-full">
                                    <FileImage className="w-3 h-3" />
                                    {capsule.attachments.filter(a => a.type === 'image').length} photo{capsule.attachments.filter(a => a.type === 'image').length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {capsule.attachments?.filter(a => a.type === 'video').length > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-cream/40 bg-navy-dark/50 px-2 py-1 rounded-full">
                                    <FileVideo className="w-3 h-3" />
                                    {capsule.attachments.filter(a => a.type === 'video').length} video{capsule.attachments.filter(a => a.type === 'video').length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {capsule.notifyTelegram && (
                                  <span className="flex items-center gap-1 text-xs text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded-full">
                                    <Send className="w-3 h-3" />
                                    Telegram
                                  </span>
                                )}
                                {capsule.notifyWhatsApp && (
                                  <span className="flex items-center gap-1 text-xs text-[#25D366] bg-[#25D366]/10 px-2 py-1 rounded-full">
                                    <MessageCircle className="w-3 h-3" />
                                    WhatsApp
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
                  <label className="block text-cream/70 text-sm mb-3">Delivery Date</label>
                  <DateWheelPicker
                    value={currentCapsule.deliveryDate}
                    onChange={(date) => setCurrentCapsule(prev => ({ ...prev, deliveryDate: date }))}
                    minDate={new Date().toISOString().split('T')[0]}
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

                {/* Notification Options */}
                <div>
                  <label className="flex items-center gap-2 text-cream/70 text-sm mb-3">
                    <Bell className="w-4 h-4 text-gold" />
                    Delivery Notifications
                  </label>
                  <p className="text-cream/40 text-xs mb-4">
                    Get notified when your time capsule is delivered (coming soon)
                  </p>

                  {/* Telegram Option */}
                  <div className="mb-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => setCurrentCapsule(prev => ({ ...prev, notifyTelegram: !prev.notifyTelegram }))}
                        className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${
                          currentCapsule.notifyTelegram ? 'bg-[#0088cc]' : 'bg-navy-dark border border-gold/20'
                        }`}
                      >
                        <motion.div
                          className="w-4 h-4 rounded-full bg-white shadow"
                          animate={{ x: currentCapsule.notifyTelegram ? 24 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </div>
                      <Send className="w-4 h-4 text-[#0088cc]" />
                      <span className="text-cream/70 text-sm group-hover:text-cream">Telegram</span>
                    </label>
                    <AnimatePresence>
                      {currentCapsule.notifyTelegram && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <input
                            type="text"
                            value={currentCapsule.telegramUsername}
                            onChange={(e) => setCurrentCapsule(prev => ({ ...prev, telegramUsername: e.target.value }))}
                            placeholder="@username"
                            className="input-field mt-2 text-sm"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* WhatsApp Option */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => setCurrentCapsule(prev => ({ ...prev, notifyWhatsApp: !prev.notifyWhatsApp }))}
                        className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${
                          currentCapsule.notifyWhatsApp ? 'bg-[#25D366]' : 'bg-navy-dark border border-gold/20'
                        }`}
                      >
                        <motion.div
                          className="w-4 h-4 rounded-full bg-white shadow"
                          animate={{ x: currentCapsule.notifyWhatsApp ? 24 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </div>
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      <span className="text-cream/70 text-sm group-hover:text-cream">WhatsApp</span>
                    </label>
                    <AnimatePresence>
                      {currentCapsule.notifyWhatsApp && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <input
                            type="tel"
                            value={currentCapsule.whatsAppNumber}
                            onChange={(e) => setCurrentCapsule(prev => ({ ...prev, whatsAppNumber: e.target.value }))}
                            placeholder="+1 234 567 8900"
                            className="input-field mt-2 text-sm"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50 px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 bg-red-500/90 text-white"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
